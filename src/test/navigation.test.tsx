/**
 * Navigation regression harness. Renders the real App (real router, real
 * guards/providers) in jsdom over an in-memory Supabase fake (supabaseMock.ts)
 * and clicks through every main destination. Any render crash, dead link, or
 * guard misroute fails here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Tables } from "./supabaseMock";

const mockRef = vi.hoisted(() => ({ current: null as any }));

vi.mock("@/integrations/supabase/client", async () => {
  const { createSupabaseMock } = await import("./supabaseMock");
  const supabase = createSupabaseMock({ tables: {}, session: null });
  mockRef.current = supabase;
  return { supabase };
});

import App from "@/App";

const USER_ID = "user-1";
const BROTHER_ID = "brother-1";
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const seedTables = (): Tables => ({
  profiles: [
    {
      user_id: USER_ID,
      email: "ethan@example.com",
      name: "Ethan Cole",
      first_name: "Ethan",
      last_name: "Cole",
      display_name: "Ethan Cole",
      onboarding_completed: true,
      must_change_password: false,
      password_set: true,
      created_at: daysAgo(30),
    },
    {
      user_id: BROTHER_ID,
      email: "levi@example.com",
      name: "Levi Hart",
      first_name: "Levi",
      last_name: "Hart",
      display_name: "Levi Hart",
      onboarding_completed: true,
      must_change_password: false,
      password_set: true,
      created_at: daysAgo(60),
    },
  ],
  entitlements: [
    {
      user_id: USER_ID,
      entitlement_type: "course_app_access",
      active: true,
      expires_at: null,
    },
  ],
  subscriptions: [
    { user_id: USER_ID, status: "active", current_period_end: daysAgo(-30), created_at: daysAgo(30) },
  ],
  user_roles: [],
  user_enrollments: [{ user_id: USER_ID, enrolled_at: daysAgo(10) }],
  curriculum_settings: [{ id: "cs-1", drip_mode: "weekly" }],
  weeks: [
    {
      id: "w1",
      week_number: 1,
      title: "Grace",
      summary: "Start with grace",
      status: "published",
      order_index: 1,
      unlock_day_offset: 0,
    },
    {
      id: "w2",
      week_number: 2,
      title: "Identity",
      summary: "Who you are",
      status: "published",
      order_index: 2,
      unlock_day_offset: 100,
    },
  ],
  curriculum_lessons: [
    {
      id: "l1",
      week_id: "w1",
      title: "The Lie Beneath the Urge",
      summary: "Naming the lie",
      status: "published",
      order_index: 1,
      duration_minutes: 12,
      content_json: [{ id: "b1", type: "paragraph", data: { text: "The urge promises relief." } }],
      video_url: null,
    },
  ],
  curriculum_lesson_progress: [],
  daily_check_ins: [],
  daily_completions: [],
  evidence_events: [],
  relapse_events: [],
  freedom_streaks: [],
  gratitude_entries: [],
  user_declarations: [],
  user_covenants: [
    { user_id: USER_ID, why: "To be present.", signed_name: "Ethan Cole", signed_at: daysAgo(9) },
  ],
  chat_channels: [
    {
      id: "ch1",
      name: "General",
      description: "General discussion",
      type: "channel",
      is_locked: false,
      is_pinned: false,
      is_default: true,
      sort_order: 1,
    },
  ],
  chat_channel_members: [],
  chat_messages: [
    {
      id: "m1",
      channel_id: "ch1",
      dm_id: null,
      user_id: BROTHER_ID,
      content: "Week 3 reading hit hard this morning.",
      image_url: null,
      created_at: daysAgo(0.1),
    },
  ],
  chat_dms: [],
  chat_read_cursors: [],
  chat_reactions: [],
  brotherhood_connections: [
    { id: "bc1", requester_id: USER_ID, recipient_id: BROTHER_ID, status: "accepted" },
  ],
  app_settings: [{ key: "max_brothers", value: "5" }],
  groups: [],
  group_members: [],
  prayer_requests: [],
  prayer_request_strength: [],
  crisis_button_events: [],
});

const startAt = (path: string) => window.history.pushState({}, "", path);

const resetMock = (signedIn: boolean) => {
  const sb = mockRef.current;
  for (const key of Object.keys(sb.__tables)) delete sb.__tables[key];
  Object.assign(sb.__tables, seedTables());
  sb.__setSession(signedIn ? { userId: USER_ID, email: "ethan@example.com" } : null);
};

describe("app navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMock(true);
  });

  it("walks every main nav destination without a reload", async () => {
    startAt("/app");
    render(<App />);

    await screen.findByText(/good (morning|afternoon|evening), ethan/i, undefined, {
      timeout: 4000,
    });

    fireEvent.click(screen.getAllByRole("link", { name: /brotherhood/i })[0]);
    await screen.findByRole("heading", { name: /brotherhood/i });

    fireEvent.click(screen.getAllByRole("link", { name: /grow/i })[0]);
    await screen.findByRole("heading", { name: /eight weeks of ground taken/i });

    fireEvent.click(screen.getAllByRole("link", { name: /profile/i })[0]);
    await screen.findByRole("heading", { name: /the man in the fight/i });

    fireEvent.click(screen.getAllByRole("link", { name: /stand firm/i })[0]);
    await screen.findByRole("heading", { name: /put on the full armor/i });

    // Open a tool from the "Your Armor" menu, then leave back to Today.
    fireEvent.click(screen.getByRole("button", { name: /i am being tempted/i }));
    await screen.findByRole("heading", { name: /^notice$/i });

    fireEvent.click(screen.getByRole("link", { name: /leave, back to today/i }));
    await screen.findByText(/good (morning|afternoon|evening), ethan/i);
  });

  it("rhythms has a back control that returns to Today", async () => {
    startAt("/app/rhythms");
    render(<App />);

    // Scope to the page header — "Today" nav links also exist in the shell rail
    // and tab bar, so the accessible name alone is ambiguous.
    const heading = await screen.findByRole("heading", { name: /the ordinary days/i }, { timeout: 4000 });
    const back = within(heading.closest("header")!).getByRole("link", { name: /today/i });
    expect(back).toHaveAttribute("href", "/app");
    fireEvent.click(back);

    await screen.findByText(/good (morning|afternoon|evening), ethan/i, undefined, {
      timeout: 4000,
    });
    expect(window.location.pathname).toBe("/app");
  });

  it("the return flow (I already fell) persists the fall", async () => {
    startAt("/stand-firm");
    render(<App />);

    // "Your Armor" menu → I Need to Return → the R.E.T.U.R.N. 6-step flow.
    fireEvent.click(await screen.findByRole("button", { name: /i need to return/i }));

    await screen.findByRole("heading", { name: /recognize the truth/i });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByRole("heading", { name: /engage the father/i });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByRole("heading", { name: /trace what happened/i });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Uproot: mandatory commitment checkbox gates Continue.
    await screen.findByRole("heading", { name: /uproot isolation/i });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    // Resume: second mandatory commitment checkbox.
    await screen.findByRole("heading", { name: /resume normal rhythms/i });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByRole("heading", { name: /navigate forward/i });
    // Keyboard users activate the hold button directly with Enter
    const hold = screen.getByRole("button", { name: /hold to return/i });
    await waitFor(() => expect(hold).toBeEnabled());
    fireEvent.keyDown(hold, { key: "Enter" });

    // R.E.T.U.R.N. resets the freedom streak — a destructive ConfirmDialog gates
    // the three writes. Confirm it so the fall/streak/evidence rows are written.
    fireEvent.click(await screen.findByRole("button", { name: /complete the return/i }));

    await screen.findByRole("heading", { name: /you returned/i });

    // The fall is on the record: a real relapse_events row was written.
    await waitFor(() =>
      expect(
        mockRef.current.__tables.relapse_events.filter((r: any) => r.user_id === USER_ID)
      ).toHaveLength(1)
    );
    // R.E.T.U.R.N. also resets the freedom streak and logs grace evidence.
    await waitFor(() => {
      expect(
        mockRef.current.__tables.freedom_streaks.filter((r: any) => r.user_id === USER_ID)
      ).toHaveLength(1);
      expect(
        mockRef.current.__tables.evidence_events.some(
          (e: any) => e.user_id === USER_ID && e.event_type === "grace_protocol_complete"
        )
      ).toBe(true);
    });
  });

  it("check-in persists and unlocks the reading, which opens the lesson", async () => {
    startAt("/app");
    render(<App />);
    await screen.findByText(/your path today/i, undefined, { timeout: 4000 });

    // Reading is locked until the morning check-in is done.
    // Pick one of the 16 feelings; its cited verse surfaces; then log it.
    fireEvent.click(await screen.findByRole("button", { name: /begin/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^anxious$/i }));
    await screen.findByText(/philippians 4:6-7/i); // the feeling surfaces its cited verse
    fireEvent.click(screen.getByRole("button", { name: /log check-in/i }));

    // Persisted to daily_check_ins with the production shape
    await waitFor(() => {
      const rows = mockRef.current.__tables.daily_check_ins;
      expect(rows).toHaveLength(1);
      expect(rows[0].feelings).toContain("anxious");
      expect(rows[0].needs_support).toBe(true);
    });

    const continueLink = await screen.findByRole("link", { name: /continue/i }, { timeout: 4000 });
    fireEvent.click(continueLink);
    await screen.findByRole("heading", { name: /the lie beneath the urge/i });
    await screen.findByText(/the urge promises relief/i);

    fireEvent.click(screen.getAllByRole("link", { name: /grow/i })[0]);
    await screen.findByRole("heading", { name: /eight weeks of ground taken/i });
  });

  it("brotherhood channels open a chat thread", async () => {
    // URL-driven tab state (Radix tab clicks need real pointer events jsdom lacks)
    startAt("/app/brotherhood?tab=channels");
    render(<App />);
    await screen.findByRole("heading", { name: /brotherhood/i });

    fireEvent.click(await screen.findByRole("button", { name: /general/i }));
    await screen.findByText(/week 3 reading hit hard/i);
  });

  it("login validates input and signs in for real", async () => {
    resetMock(false);
    startAt("/login");
    render(<App />);

    // Invalid input no longer sails through: validation blocks the submit.
    fireEvent.change(await screen.findByLabelText(/email/i), { target: { value: "asd" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "asd" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    // The error now shows in BOTH the FormErrorSummary and the inline FormMessage
    // (WCAG summary + at-field pattern), so allow more than one match.
    expect((await screen.findAllByText(/enter a valid email/i)).length).toBeGreaterThan(0);
    expect(window.location.pathname).toBe("/login");

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ethan@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText(/good (morning|afternoon|evening), ethan/i, undefined, {
      timeout: 4000,
    });
  });

  it("signup creates a real account and lands on the paywall (no entitlement yet)", async () => {
    resetMock(false);
    startAt("/signup");
    render(<App />);

    fireEvent.change(await screen.findByLabelText(/full name/i), {
      target: { value: "John Carter" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jc@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Fresh accounts have no entitlement: the guard routes to /upgrade.
    await waitFor(() => expect(window.location.pathname).toBe("/upgrade"), { timeout: 4000 });

    // And the profile row exists for real.
    expect(
      mockRef.current.__tables.profiles.some((p: any) => p.email === "jc@example.com")
    ).toBe(true);
  });

  it("landing CTA reaches the app when signed in", async () => {
    startAt("/");
    render(<App />);
    fireEvent.click((await screen.findAllByRole("link", { name: /take your place/i }))[0]);
    await waitFor(() => expect(window.location.pathname).toBe("/app"));
    await screen.findByText(/good (morning|afternoon|evening), ethan/i, undefined, {
      timeout: 4000,
    });
  });
});
