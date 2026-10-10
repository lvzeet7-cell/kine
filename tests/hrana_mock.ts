/* eslint-disable @typescript-eslint/no-explicit-any */
/** Serveur de test imitant l'API HTTP de Turso (/v2/pipeline), adossé à un fichier SQLite */
import http from "node:http";
const { DatabaseSync } = (process as any).getBuiltinModule("node:sqlite") as typeof import("node:sqlite");

type V = { type: string; value?: any; base64?: string };
const dec = (v: V) => (v.type === "null" ? null : v.type === "integer" ? BigInt(v.value) : v.value);
const enc = (x: any): V =>
  x === null || x === undefined ? { type: "null" } :
  typeof x === "bigint" ? { type: "integer", value: String(x) } :
  typeof x === "number" ? (Number.isInteger(x) ? { type: "integer", value: String(x) } : { type: "float", value: x }) :
  { type: "text", value: String(x) };

export function startMock(file: string, port: number, token = "test-token") {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA busy_timeout = 5000"); db.exec("PRAGMA journal_mode = WAL");
  const run = (stmt: { sql: string; args?: V[] }) => {
    const p = db.prepare(stmt.sql); p.setReadBigInts(true);
    const args = (stmt.args ?? []).map(dec);
    const cols = p.columns();
    if (cols.length) {
      const rows = p.all(...args) as any[];
      return { cols: cols.map((c) => ({ name: c.name })), rows: rows.map((r) => cols.map((c) => enc(r[c.name]))), affected_row_count: 0 };
    }
    const r = p.run(...args);
    return { cols: [], rows: [], affected_row_count: Number(r.changes) };
  };
  const evalCond = (c: any, ok: (boolean | null)[]): boolean =>
    c.type === "ok" ? ok[c.step] === true : c.type === "error" ? ok[c.step] === false : c.type === "not" ? !evalCond(c.cond, ok) :
    c.type === "and" ? c.conds.every((x: any) => evalCond(x, ok)) : c.type === "or" ? c.conds.some((x: any) => evalCond(x, ok)) : false;
  const server = http.createServer((req, res) => {
    if (req.url !== "/v2/pipeline" || req.method !== "POST") { res.writeHead(404); return res.end("not found"); }
    if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401); return res.end("unauthorized"); }
    let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
      const { requests } = JSON.parse(body);
      const results = requests.map((r: any) => {
        if (r.type === "close") return { type: "ok", response: { type: "close" } };
        if (r.type === "execute") {
          try { return { type: "ok", response: { type: "execute", result: run(r.stmt) } }; }
          catch (e: any) { return { type: "error", error: { message: e.message } }; }
        }
        if (r.type === "batch") {
          const steps = r.batch.steps; const ok: (boolean | null)[] = []; const sr: any[] = []; const se: any[] = [];
          steps.forEach((s: any, i: number) => {
            if (s.condition && !evalCond(s.condition, ok)) { ok[i] = null; sr[i] = null; se[i] = null; return; }
            try { sr[i] = run(s.stmt); se[i] = null; ok[i] = true; } catch (e: any) { sr[i] = null; se[i] = { message: e.message }; ok[i] = false; }
          });
          return { type: "ok", response: { type: "batch", result: { step_results: sr, step_errors: se } } };
        }
        return { type: "error", error: { message: "unsupported " + r.type } };
      });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ baton: null, base_url: null, results }));
    });
  });
  return new Promise<http.Server>((ok) => server.listen(port, "127.0.0.1", () => ok(server)));
}

