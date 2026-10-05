/**
 * Ledger Playground engine — pure TypeScript, deterministic, no UI code.
 *
 * Educational model of double-entry bookkeeping:
 * - accounts hold balances in integer minor units per currency
 * - journal entries must balance (sum of debits == sum of credits per currency)
 * - mistakes are fixed with reversal entries, never deletes
 * - seeded RNG for scenario presets (fully deterministic)
 */

export interface EngineAccount {
  id: string;
  name: string; // language-neutral key or plain label (UI translates presets)
  currency: string;
  balance_minor: number; // signed: debit-positive accounts normal
  isDebitNormal: boolean;
}

export interface EngineEntryLine {
  account_id: string;
  debit_minor: number;
  credit_minor: number;
}

export interface EnginePosting {
  id: number;
  lines: EngineEntryLine[];
  memo: string;
  reversed_by: number | null; // posting id that reversed this one, or null
  reverses: number | null; // posting id this one reverses, or null
}

export interface EngineState {
  accounts: EngineAccount[];
  postings: EnginePosting[];
  nextId: number;
  lastError: string | null;
}

export type EngineResult =
  | { ok: true; state: EngineState; postingId: number }
  | { ok: false; state: EngineState; error: string };

/** Mulberry32 — small, deterministic seeded RNG. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initialState(accounts: EngineAccount[] = []): EngineState {
  return { accounts, postings: [], nextId: 1, lastError: null };
}

export function account(state: EngineState, id: string): EngineAccount | undefined {
  return state.accounts.find((a) => a.id === id);
}

/**
 * Post a journal entry. Rejects:
 * - unknown account ids
 * - non-positive amounts (each line must have exactly one side > 0)
 * - lines where both debit and credit are set
 * - unbalanced entries (per currency: Σdebit ≠ Σcredit)
 */
export function postEntry(state: EngineState, lines: EngineEntryLine[], memo: string): EngineResult {
  const fail = (error: string): EngineResult => ({ ok: false, state: { ...state, lastError: error }, error });

  if (lines.length < 2) return fail('A journal entry needs at least two lines.');

  const seen = new Set<string>();
  for (const line of lines) {
    if (!account(state, line.account_id)) return fail(`Unknown account: ${line.account_id}`);
    if (seen.has(line.account_id)) return fail(`Duplicate account in one entry: ${line.account_id}`);
    seen.add(line.account_id);
    if (line.debit_minor < 0 || line.credit_minor < 0) return fail('Amounts cannot be negative.');
    if (line.debit_minor > 0 && line.credit_minor > 0) return fail('A line cannot be both debit and credit.');
    if (line.debit_minor === 0 && line.credit_minor === 0) return fail('A line must have an amount.');
    if (!Number.isInteger(line.debit_minor) || !Number.isInteger(line.credit_minor))
      return fail('Amounts must be integers in minor units.');
  }

  // balance check per currency
  const byCurrency = new Map<string, { d: number; c: number }>();
  for (const line of lines) {
    const acc = account(state, line.account_id)!;
    const cur = byCurrency.get(acc.currency) ?? { d: 0, c: 0 };
    cur.d += line.debit_minor;
    cur.c += line.credit_minor;
    byCurrency.set(acc.currency, cur);
  }
  for (const [cur, { d, c }] of byCurrency) {
    if (d !== c) return fail(`Entry not balanced in ${cur}: debits ${d} ≠ credits ${c}.`);
  }

  const posting: EnginePosting = { id: state.nextId, lines, memo, reversed_by: null, reverses: null };
  const accounts = state.accounts.map((a) => {
    const line = lines.find((l) => l.account_id === a.id);
    if (!line) return a;
    // debit-normal accounts: debit increases, credit decreases (and vice versa)
    const delta = a.isDebitNormal
      ? line.debit_minor - line.credit_minor
      : line.credit_minor - line.debit_minor;
    return { ...a, balance_minor: a.balance_minor + delta };
  });
  return {
    ok: true,
    state: { accounts, postings: [...state.postings, posting], nextId: state.nextId + 1, lastError: null },
    postingId: posting.id,
  };
}

/**
 * Reverse an existing posting with a mirrored entry — the ONLY way to fix a
 * mistake (no deletes). Returns a new state with the reversal posting.
 */
export function reversePosting(state: EngineState, postingId: number, memo: string): EngineResult {
  const original = state.postings.find((p) => p.id === postingId);
  if (!original) return { ok: false, state: { ...state, lastError: 'Posting not found.' }, error: 'Posting not found.' };
  if (original.reversed_by !== null)
    return {
      ok: false,
      state: { ...state, lastError: 'Posting already reversed.' },
      error: 'Posting already reversed.',
    };
  const lines = original.lines.map((l) => ({ account_id: l.account_id, debit_minor: l.credit_minor, credit_minor: l.debit_minor }));
  const result = postEntry(state, lines, memo);
  if (!result.ok) return result;
  const postings = result.state.postings.map((p) =>
    p.id === postingId ? { ...p, reversed_by: result.ok ? result.postingId : null } : p,
  );
  const revPost = postings.find((p) => p.id === result.postingId);
  const fixed = revPost ? { ...revPost, reverses: postingId } : revPost;
  if (fixed) postings.splice(postings.indexOf(revPost!), 1, fixed);
  return { ...result, state: { ...result.state, postings } };
}

/** Trial balance: per currency, sum of debit-normal balances vs credit-normal (sign-flipped). */
export function trialBalance(state: EngineState): {
  currency: string;
  debits_minor: number;
  credits_minor: number;
  balanced: boolean;
}[] {
  const map = new Map<string, { debits_minor: number; credits_minor: number }>();
  for (const a of state.accounts) {
    const cur = map.get(a.currency) ?? { debits_minor: 0, credits_minor: 0 };
    if (a.isDebitNormal) cur.debits_minor += a.balance_minor;
    else cur.credits_minor += a.balance_minor;
    map.set(a.currency, cur);
  }
  return [...map.entries()].map(([currency, v]) => ({
    currency,
    debits_minor: v.debits_minor,
    credits_minor: v.credits_minor,
    balanced: v.debits_minor === v.credits_minor,
  }));
}

/** Deterministic scenario preset: Numuw Bank opening day. */
export function numuwPreset(): EngineState {
  return initialState([
    { id: 'cash', name: 'Cash at central bank', currency: 'EGP', balance_minor: 0, isDebitNormal: true },
    { id: 'vault', name: 'Cash in vault', currency: 'EGP', balance_minor: 0, isDebitNormal: true },
    { id: 'amal', name: 'Amal - checking account', currency: 'EGP', balance_minor: 0, isDebitNormal: false },
    { id: 'yusuf', name: 'Yusuf - savings account', currency: 'EGP', balance_minor: 0, isDebitNormal: false },
    { id: 'loans', name: 'Loans to customers', currency: 'EGP', balance_minor: 0, isDebitNormal: true },
    { id: 'interest-income', name: 'Interest income', currency: 'EGP', balance_minor: 0, isDebitNormal: false },
    { id: 'capital', name: 'Share capital', currency: 'EGP', balance_minor: 0, isDebitNormal: false },
    { id: 'usd-nostro', name: 'USD nostro account', currency: 'USD', balance_minor: 0, isDebitNormal: true },
    { id: 'usd-deposits', name: 'USD customer deposits', currency: 'USD', balance_minor: 0, isDebitNormal: false },
  ]);
}
