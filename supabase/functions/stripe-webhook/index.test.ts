import {
  assert,
  assertEquals,
  assertAlmostEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ANNUAL_PRICE_ID,
  MONTHLY_PRICE_ID,
  deriveEntitlementWindow,
} from "./index.ts";

const DAY = 24 * 60 * 60 * 1000;

// ---------- Pure derivation: monthly = +30d, annual = +365d ----------

Deno.test("monthly subscription -> active, source-ready, +30 days", () => {
  const now = Date.UTC(2026, 0, 1);
  const sub = {
    id: "sub_monthly_1",
    status: "active",
    cancel_at_period_end: false,
    current_period_end: Math.floor((now + 30 * DAY) / 1000),
    items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] },
  };
  const { entitlementExpiresAt, isActive } = deriveEntitlementWindow(sub, now);
  assertEquals(isActive, true);
  const delta = new Date(entitlementExpiresAt).getTime() - now;
  assertAlmostEquals(delta, 30 * DAY, 1000);
});

Deno.test("annual subscription -> active, +365 days", () => {
  const now = Date.UTC(2026, 0, 1);
  const sub = {
    id: "sub_annual_1",
    status: "active",
    current_period_end: Math.floor((now + 365 * DAY) / 1000),
    items: { data: [{ price: { id: ANNUAL_PRICE_ID } }] },
  };
  const { entitlementExpiresAt, isActive } = deriveEntitlementWindow(sub, now);
  assertEquals(isActive, true);
  const delta = new Date(entitlementExpiresAt).getTime() - now;
  assertAlmostEquals(delta, 365 * DAY, 1000);
});

Deno.test("trialing status counts as active", () => {
  const now = Date.UTC(2026, 0, 1);
  const { isActive } = deriveEntitlementWindow(
    { status: "trialing", items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] } },
    now,
  );
  assertEquals(isActive, true);
});

Deno.test("canceled status -> not active", () => {
  const now = Date.UTC(2026, 0, 1);
  const { isActive } = deriveEntitlementWindow(
    { status: "canceled", items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] } },
    now,
  );
  assertEquals(isActive, false);
});

Deno.test("missing current_period_end falls back gracefully (no Invalid time value)", () => {
  const now = Date.UTC(2026, 0, 1);
  const { entitlementExpiresAt, periodEndIso } = deriveEntitlementWindow(
    { status: "active", items: { data: [{ price: { id: "price_unknown" } }] } },
    now,
  );
  // Both must be valid ISO strings, not "Invalid Date"
  assert(!Number.isNaN(new Date(entitlementExpiresAt).getTime()));
  assert(!Number.isNaN(new Date(periodEndIso).getTime()));
});

Deno.test("paywall bypass: active entitlement with future expires_at would pass has_active_entitlement", () => {
  // Mirrors the SQL: active = true AND (expires_at IS NULL OR expires_at > now())
  const now = Date.UTC(2026, 0, 1);
  const { entitlementExpiresAt, isActive } = deriveEntitlementWindow(
    {
      status: "active",
      current_period_end: Math.floor((now + 30 * DAY) / 1000),
      items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] },
    },
    now,
  );
  const wouldBypassPaywall =
    isActive && new Date(entitlementExpiresAt).getTime() > now;
  assertEquals(wouldBypassPaywall, true);
});

// ---------- Integration-style: end-to-end webhook with mocked Supabase ----------

type Row = Record<string, any>;

function makeMockSupabase() {
  const tables: Record<string, Row[]> = {
    webhook_events: [],
    profiles: [{ user_id: "user_test_1", email: "buyer@example.com" }],
    stripe_customers: [],
    payments: [],
    subscriptions: [],
    entitlements: [],
    verification_codes: [],
  };

  function from(table: string) {
    const rows = tables[table] ??= [];
    const filters: Array<(r: Row) => boolean> = [];
    const builder: any = {
      select() { return builder; },
      eq(col: string, val: any) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      maybeSingle: async () => {
        const r = rows.find((row) => filters.every((f) => f(row))) ?? null;
        return { data: r, error: null };
      },
      insert: async (record: Row | Row[]) => {
        const recs = Array.isArray(record) ? record : [record];
        rows.push(...recs);
        return { data: recs, error: null };
      },
      upsert: async (record: Row, opts?: { onConflict?: string }) => {
        const conflictCols = (opts?.onConflict ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        if (conflictCols.length) {
          const idx = rows.findIndex((r) => conflictCols.every((c) => r[c] === record[c]));
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...record };
            return { data: rows[idx], error: null };
          }
        }
        rows.push({ ...record });
        return { data: record, error: null };
      },
      update: (patch: Row) => ({
        eq: async (col: string, val: any) => {
          let updated = 0;
          for (const r of rows) {
            if (r[col] === val) { Object.assign(r, patch); updated++; }
          }
          return { data: null, error: null, count: updated };
        },
      }),
    };
    return builder;
  }

  return { from, _tables: tables };
}

// Re-implement the event dispatch path used by the deployed function so we can
// simulate idempotency without touching live Stripe / live DB.
async function simulateWebhookEvent(event: any, supabase: any) {
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) return { duplicate: true };

  await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: "processing",
  });

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object;
    const userId = "user_test_1";
    await supabase.from("stripe_customers").upsert(
      { user_id: userId, stripe_customer_id: sub.customer },
      { onConflict: "stripe_customer_id" },
    );
    const { entitlementExpiresAt, periodEndIso, isActive } = deriveEntitlementWindow(sub);
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_subscription_id: sub.id,
        status: sub.status,
        current_period_end: periodEndIso,
        cancel_at_period_end: sub.cancel_at_period_end || false,
      },
      { onConflict: "stripe_subscription_id" },
    );
    await supabase.from("entitlements").upsert(
      {
        user_id: userId,
        entitlement_type: "course_app_access",
        active: isActive,
        source: "stripe",
        expires_at: entitlementExpiresAt,
      },
      { onConflict: "user_id,entitlement_type" },
    );
  }

  await supabase.from("webhook_events").update({ status: "processed" }).eq("stripe_event_id", event.id);
  return { duplicate: false };
}

Deno.test("end-to-end: monthly checkout creates entitlement (source=stripe, active, +30d)", async () => {
  const supabase = makeMockSupabase();
  // Simulate a pre-existing manual entitlement (e.g., zapier free trial)
  supabase._tables.entitlements.push({
    user_id: "user_test_1",
    entitlement_type: "course_app_access",
    active: true,
    source: "zapier_eight-week-course",
    expires_at: new Date(Date.now() + 5 * DAY).toISOString(),
  });

  const now = Date.now();
  await simulateWebhookEvent({
    id: "evt_monthly_1",
    type: "customer.subscription.created",
    data: {
      object: {
        id: "sub_M1",
        customer: "cus_M1",
        status: "active",
        cancel_at_period_end: false,
        current_period_end: Math.floor((now + 30 * DAY) / 1000),
        items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] },
      },
    },
  }, supabase);

  const ents = supabase._tables.entitlements;
  assertEquals(ents.length, 1, "no duplicate entitlement row");
  const ent = ents[0];
  assertEquals(ent.active, true);
  assertEquals(ent.source, "stripe", "source flips from manual to stripe");
  const delta = new Date(ent.expires_at).getTime() - now;
  assertAlmostEquals(delta, 30 * DAY, 5_000);
});

Deno.test("end-to-end: annual checkout sets +365d, source=stripe", async () => {
  const supabase = makeMockSupabase();
  const now = Date.now();
  await simulateWebhookEvent({
    id: "evt_annual_1",
    type: "customer.subscription.created",
    data: {
      object: {
        id: "sub_A1",
        customer: "cus_A1",
        status: "active",
        current_period_end: Math.floor((now + 365 * DAY) / 1000),
        items: { data: [{ price: { id: ANNUAL_PRICE_ID } }] },
      },
    },
  }, supabase);

  const ent = supabase._tables.entitlements[0];
  assertEquals(ent.source, "stripe");
  assertEquals(ent.active, true);
  const delta = new Date(ent.expires_at).getTime() - now;
  assertAlmostEquals(delta, 365 * DAY, 5_000);
});

Deno.test("end-to-end: webhook idempotency — duplicate event_id is skipped", async () => {
  const supabase = makeMockSupabase();
  const event = {
    id: "evt_dup_1",
    type: "customer.subscription.created",
    data: {
      object: {
        id: "sub_DUP",
        customer: "cus_DUP",
        status: "active",
        current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000),
        items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] },
      },
    },
  };

  const first = await simulateWebhookEvent(event, supabase);
  const second = await simulateWebhookEvent(event, supabase);

  assertEquals(first.duplicate, false);
  assertEquals(second.duplicate, true);
  assertEquals(supabase._tables.entitlements.length, 1, "no duplicate entitlement created");
  assertEquals(supabase._tables.subscriptions.length, 1, "no duplicate subscription created");
  assertEquals(supabase._tables.webhook_events.length, 1, "no duplicate webhook_events row");
});

Deno.test("end-to-end: cancel_at_period_end is preserved on subscription row", async () => {
  const supabase = makeMockSupabase();
  await simulateWebhookEvent({
    id: "evt_cancel_1",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_CANCEL",
        customer: "cus_CANCEL",
        status: "active",
        cancel_at_period_end: true,
        current_period_end: Math.floor((Date.now() + 15 * DAY) / 1000),
        items: { data: [{ price: { id: MONTHLY_PRICE_ID } }] },
      },
    },
  }, supabase);

  const sub = supabase._tables.subscriptions[0];
  assertEquals(sub.cancel_at_period_end, true);
  // Access stays active until period end (admin dashboard shows "Cancelling")
  assertEquals(supabase._tables.entitlements[0].active, true);
});
