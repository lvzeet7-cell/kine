/**
 * Client minimal pour Turso (libSQL) via son API HTTP — aucune dépendance à installer.
 * Utilisé quand le site est hébergé sans disque persistant (ex. Vercel).
 *
 * Variables d'environnement :
 *   TURSO_DATABASE_URL   ex. libsql://cabinet-xxxx.turso.io
 *   TURSO_AUTH_TOKEN     jeton créé dans le tableau de bord Turso
 *
 * Protocole : https://docs.turso.tech/sdk/http/reference (« Hrana over HTTP », /v2/pipeline)
 */

export type SqlArg = string | number | null;
export type SqlRow = Record<string, unknown>;
export type SqlResult = { rows: SqlRow[]; rowsAffected: number };
export type SqlStatement = { sql: string; args?: SqlArg[] };

/** Exécute des requêtes SQL ; `transaction` est atomique (tout ou rien) */
export interface SqlExecutor {
  execute(sql: string, args?: SqlArg[]): Promise<SqlResult>;
  transaction(statements: SqlStatement[]): Promise<SqlResult[]>;
}

/* --------------------------------------------------------------------------
 * Encodage des valeurs (format Hrana)
 * ------------------------------------------------------------------------ */

type HranaValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };

function encode(v: SqlArg): HranaValue {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  }
  return { type: "text", value: String(v) };
}

function decode(v: HranaValue): unknown {
  switch (v.type) {
    case "null":
      return null;
    case "integer":
      return Number(v.value);
    case "float":
      return v.value;
    case "text":
      return v.value;
    case "blob":
      return v.base64;
  }
}

type HranaStmtResult = {
  cols: { name: string | null }[];
  rows: HranaValue[][];
  affected_row_count: number;
};

function toResult(r: HranaStmtResult): SqlResult {
  const names = r.cols.map((c, i) => c.name ?? String(i));
  return {
    rows: r.rows.map((row) => Object.fromEntries(row.map((v, i) => [names[i], decode(v)]))),
    rowsAffected: r.affected_row_count,
  };
}

type HranaBatchResult = {
  step_results: (HranaStmtResult | null)[];
  step_errors: ({ message: string } | null)[];
};

type HranaResponse =
  | { type: "execute"; result: HranaStmtResult }
  | { type: "batch"; result: HranaBatchResult }
  | { type: "close" };

type HranaResult = { type: "ok"; response: HranaResponse } | { type: "error"; error: { message: string } };

const stmt = (s: SqlStatement) => ({ sql: s.sql, args: (s.args ?? []).map(encode) });

export class SqlError extends Error {}

/* --------------------------------------------------------------------------
 * Exécuteur HTTP
 * ------------------------------------------------------------------------ */

export class TursoHttpExecutor implements SqlExecutor {
  private endpoint: string;

  constructor(
    url: string,
    private token: string,
    private fetchImpl: typeof fetch = fetch,
  ) {
    const base = url.trim().replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
    this.endpoint = `${base}/v2/pipeline`;
  }

  private async pipeline(requests: unknown[]): Promise<HranaResult[]> {
    const res = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [...requests, { type: "close" }] }),
      cache: "no-store",
    });
    if (!res.ok) throw new SqlError(`Turso HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { results: HranaResult[] };
    return data.results;
  }

  async execute(sql: string, args: SqlArg[] = []): Promise<SqlResult> {
    const [r] = await this.pipeline([{ type: "execute", stmt: stmt({ sql, args }) }]);
    if (r.type === "error") throw new SqlError(r.error.message);
    if (r.response.type !== "execute") throw new SqlError("Réponse inattendue de la base de données.");
    return toResult(r.response.result);
  }

  /**
   * Transaction en un seul aller-retour : BEGIN, chaque requête n'est exécutée
   * que si la précédente a réussi, puis COMMIT (ou ROLLBACK en cas d'erreur).
   */
  async transaction(statements: SqlStatement[]): Promise<SqlResult[]> {
    const n = statements.length;
    const steps: unknown[] = [{ stmt: { sql: "BEGIN IMMEDIATE" } }];
    statements.forEach((s, i) => steps.push({ stmt: stmt(s), condition: { type: "ok", step: i } }));
    steps.push({ stmt: { sql: "COMMIT" }, condition: { type: "ok", step: n } });
    steps.push({ stmt: { sql: "ROLLBACK" }, condition: { type: "not", cond: { type: "ok", step: n + 1 } } });

    const [r] = await this.pipeline([{ type: "batch", batch: { steps } }]);
    if (r.type === "error") throw new SqlError(r.error.message);
    if (r.response.type !== "batch") throw new SqlError("Réponse inattendue de la base de données.");
    const { step_results, step_errors } = r.response.result;
    const firstError = step_errors.slice(0, n + 2).find((e) => e);
    if (firstError) throw new SqlError(firstError.message);
    return step_results.slice(1, n + 1).map((x) => toResult(x as HranaStmtResult));
  }
}
