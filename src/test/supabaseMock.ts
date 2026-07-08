/**
 * In-memory Supabase fake for jsdom tests. Covers the query surface the app's
 * hooks actually use: chained filters, count/head selects, insert/update/
 * upsert/delete, maybeSingle/single, the `or(...)` forms in useBrotherhood /
 * useChat / useForgeGroup, one embedded join (group_members → groups), auth,
 * rpc, functions.invoke, and no-op realtime channels.
 *
 * Use: vi.mock("@/integrations/supabase/client", ...) returning
 * createSupabaseMock(seed) — see navigation.test.tsx.
 */

type Row = Record<string, any>;
export type Tables = Record<string, Row[]>;

let uid = 0;
const genId = () => `fake-${++uid}`;

interface Filter {
  apply(row: Row): boolean;
}

const cmp = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);

/** Parses supabase-js `or()` strings of eq conditions, incl. and(...) groups. */
const parseOr = (expr: string): ((row: Row) => boolean) => {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of expr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) parts.push(cur);

  const condFn = (cond: string): ((row: Row) => boolean) => {
    const andMatch = cond.match(/^and\((.*)\)$/);
    if (andMatch) {
      const subs = andMatch[1].split(",").map(condFn);
      return (row) => subs.every((f) => f(row));
    }
    const [col, op, ...rest] = cond.split(".");
    const value = rest.join(".");
    if (op === "eq") return (row) => String(row[col]) === value;
    if (op === "is" && value === "null") return (row) => row[col] == null;
    return () => false;
  };
  const fns = parts.map(condFn);
  return (row) => fns.some((f) => f(row));
};

class QueryBuilder implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private filters: Filter[] = [];
  private orderBy: { col: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private onConflictKeys: string[] = [];
  private selectCols = "*";
  private wantCount = false;
  private headOnly = false;
  private single_: "maybe" | "strict" | null = null;
  private returnRows = false;

  constructor(
    private store: Tables,
    private table: string
  ) {}

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    this.selectCols = cols;
    if (this.op !== "select") this.returnRows = true;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  upsert(payload: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = "upsert";
    this.payload = payload;
    this.onConflictKeys = opts?.onConflict?.split(",").map((s) => s.trim()) ?? [];
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ apply: (r) => String(r[col]) === String(val) });
    return this;
  }
  neq(col: string, val: any) {
    this.filters.push({ apply: (r) => String(r[col]) !== String(val) });
    return this;
  }
  gt(col: string, val: any) {
    this.filters.push({ apply: (r) => r[col] != null && cmp(r[col], val) > 0 });
    return this;
  }
  gte(col: string, val: any) {
    this.filters.push({ apply: (r) => r[col] != null && cmp(r[col], val) >= 0 });
    return this;
  }
  lt(col: string, val: any) {
    this.filters.push({ apply: (r) => r[col] != null && cmp(r[col], val) < 0 });
    return this;
  }
  lte(col: string, val: any) {
    this.filters.push({ apply: (r) => r[col] != null && cmp(r[col], val) <= 0 });
    return this;
  }
  in(col: string, vals: any[]) {
    const set = new Set(vals.map(String));
    this.filters.push({ apply: (r) => set.has(String(r[col])) });
    return this;
  }
  is(col: string, val: any) {
    this.filters.push({ apply: (r) => (val === null ? r[col] == null : r[col] === val) });
    return this;
  }
  not(col: string, op: string, val: any) {
    if (op === "is" && val === null) {
      this.filters.push({ apply: (r) => r[col] != null });
    } else {
      this.filters.push({ apply: (r) => String(r[col]) !== String(val) });
    }
    return this;
  }
  or(expr: string) {
    const fn = parseOr(expr);
    this.filters.push({ apply: fn });
    return this;
  }
  match(obj: Row) {
    for (const [col, val] of Object.entries(obj)) this.eq(col, val);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  maybeSingle() {
    this.single_ = "maybe";
    return this;
  }
  single() {
    this.single_ = "strict";
    return this;
  }

  private matching(rows: Row[]) {
    return rows.filter((r) => this.filters.every((f) => f.apply(r)));
  }

  private embed(rows: Row[]): Row[] {
    // Only embed used in the app: group_members → groups(...)
    if (this.table === "group_members" && /groups\(/.test(this.selectCols)) {
      const groups = this.store["groups"] ?? [];
      return rows.map((r) => ({ ...r, groups: groups.find((g) => g.id === r.group_id) ?? null }));
    }
    return rows;
  }

  private run(): { data: any; error: any; count: number | null } {
    const rows = (this.store[this.table] = this.store[this.table] ?? []);

    if (this.op === "insert" || this.op === "upsert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload!]).map((p) => ({
        id: genId(),
        created_at: new Date().toISOString(),
        ...p,
      }));
      const inserted: Row[] = [];
      for (const item of items) {
        const existing =
          this.op === "upsert" && this.onConflictKeys.length
            ? rows.find((r) => this.onConflictKeys.every((k) => String(r[k]) === String(item[k])))
            : undefined;
        if (existing) {
          Object.assign(existing, item, { id: existing.id, created_at: existing.created_at });
          inserted.push(existing);
        } else {
          rows.push(item);
          inserted.push(item);
        }
      }
      const data = this.single_ ? (inserted[0] ?? null) : this.returnRows ? inserted : null;
      return { data, error: null, count: null };
    }

    if (this.op === "update") {
      const targets = this.matching(rows);
      targets.forEach((r) => Object.assign(r, this.payload));
      return { data: this.returnRows ? targets : null, error: null, count: null };
    }

    if (this.op === "delete") {
      const targets = new Set(this.matching(rows));
      this.store[this.table] = rows.filter((r) => !targets.has(r));
      return { data: null, error: null, count: null };
    }

    let result = this.matching(rows).slice();
    if (this.orderBy) {
      const { col, ascending } = this.orderBy;
      result.sort((a, b) => (ascending ? cmp(a[col], b[col]) : cmp(b[col], a[col])));
    }
    if (this.limitN != null) result = result.slice(0, this.limitN);
    result = this.embed(result);

    const count = this.wantCount ? result.length : null;
    if (this.headOnly) return { data: null, error: null, count };
    if (this.single_) {
      const row = result[0] ?? null;
      if (this.single_ === "strict" && !row) {
        return { data: null, error: { message: "No rows found", code: "PGRST116" }, count };
      }
      return { data: row, error: null, count };
    }
    return { data: result, error: null, count };
  }

  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count: number | null }) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

export interface SupabaseMockSeed {
  tables?: Tables;
  /** Signed-in user id + email; null = signed out. */
  session?: { userId: string; email: string } | null;
  rpc?: Record<string, (args: any) => any>;
  functions?: Record<string, (body: any) => any>;
}

export const createSupabaseMock = (seed: SupabaseMockSeed) => {
  const tables: Tables = seed.tables ?? {};
  const listeners: Array<(event: string, session: any) => void> = [];

  const makeSession = (userId: string, email: string) => ({
    access_token: "fake-token",
    refresh_token: "fake-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email, user_metadata: {} },
  });

  let session = seed.session ? makeSession(seed.session.userId, seed.session.email) : null;

  const setSession = (next: typeof session, event: string) => {
    session = next;
    listeners.forEach((cb) => cb(event, session));
  };

  const supabase = {
    __tables: tables,
    __setSession: (s: { userId: string; email: string } | null) =>
      setSession(s ? makeSession(s.userId, s.email) : null, s ? "SIGNED_IN" : "SIGNED_OUT"),

    from: (table: string) => new QueryBuilder(tables, table),

    rpc: async (name: string, args?: any) => {
      if (seed.rpc?.[name]) return { data: seed.rpc[name](args), error: null };
      if (name === "get_profiles_directory") {
        const ids: string[] = args?._user_ids ?? [];
        const data = (tables["profiles"] ?? [])
          .filter((p) => ids.includes(p.user_id))
          .map((p) => ({
            user_id: p.user_id,
            display_name: p.display_name ?? null,
            first_name: p.first_name ?? null,
            avatar_url: p.avatar_url ?? null,
          }));
        return { data, error: null };
      }
      if (name === "search_profiles_directory") return { data: [], error: null };
      if (name === "get_community_armor_stats") {
        return {
          data: { this_week_count: 0, last_week_count: 0, engaged_users: 0, total_users: 0, all_time_count: 0 },
          error: null,
        };
      }
      return { data: null, error: null };
    },

    functions: {
      invoke: async (name: string, opts?: { body?: any }) => {
        if (seed.functions?.[name]) return { data: seed.functions[name](opts?.body), error: null };
        if (name === "get-lesson-asset-url") return { data: { url: "https://fake.assets/signed" }, error: null };
        return { data: null, error: null };
      },
    },

    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      refreshSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        listeners.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: async ({ email }: { email: string; password: string }) => {
        const profile = (tables["profiles"] ?? []).find((p) => p.email === email);
        const userId = profile?.user_id ?? "user-signin";
        const next = makeSession(userId, email);
        setSession(next, "SIGNED_IN");
        return { data: { session: next, user: next.user }, error: null };
      },
      signUp: async ({ email, options }: { email: string; password: string; options?: any }) => {
        const userId = genId();
        (tables["profiles"] = tables["profiles"] ?? []).push({
          user_id: userId,
          email,
          name: options?.data?.name ?? "",
          first_name: (options?.data?.name ?? "").split(/\s+/)[0] || null,
          last_name: null,
          display_name: options?.data?.name ?? null,
          onboarding_completed: false,
          must_change_password: false,
          password_set: true,
          created_at: new Date().toISOString(),
        });
        const next = makeSession(userId, email);
        setSession(next, "SIGNED_IN");
        return { data: { session: next, user: next.user }, error: null };
      },
      signOut: async () => {
        setSession(null, "SIGNED_OUT");
        return { error: null };
      },
      updateUser: async () => ({ data: {}, error: null }),
      setSession: async () => ({ data: { session }, error: null }),
    },

    channel: (_name: string) => {
      const ch: any = {
        on: () => ch,
        subscribe: () => ch,
        unsubscribe: () => {},
      };
      return ch;
    },
    removeChannel: (_ch: any) => {},
  };

  return supabase;
};
