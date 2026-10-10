/* eslint-disable @typescript-eslint/no-explicit-any */
/** Faux serveur Daily (API REST) pour les tests : enregistre les appels */
import http from "node:http";
export type Call = { method: string; path: string; body: any; auth: string | undefined };
export function startDailyMock(port: number, opts: { failRooms?: boolean } = {}) {
  const calls: Call[] = [];
  const rooms = new Map<string, any>();
  const server = http.createServer((req, res) => {
    let raw = ""; req.on("data", (c) => (raw += c)); req.on("end", () => {
      const body = raw ? JSON.parse(raw) : null;
      calls.push({ method: req.method!, path: req.url!, body, auth: req.headers.authorization });
      const send = (code: number, data: any) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(data)); };
      if (req.headers.authorization !== "Bearer test-daily-key") return send(401, { error: "authentication-error" });
      if (req.method === "POST" && req.url === "/rooms") {
        if (opts.failRooms) return send(500, { error: "server-error" });
        rooms.set(body.name, body); return send(200, { name: body.name, url: `https://cabinet.daily.co/${body.name}`, privacy: body.privacy, config: body.properties });
      }
      if (req.method === "POST" && req.url === "/meeting-tokens") {
        if (!rooms.has(body.properties.room_name)) return send(400, { error: "invalid-request-error" });
        return send(200, { token: "tok." + Buffer.from(JSON.stringify(body.properties)).toString("base64url") });
      }
      if (req.method === "GET" && req.url!.startsWith("/rooms/")) { const n = decodeURIComponent(req.url!.slice(7)); return rooms.has(n) ? send(200, { name: n }) : send(404, { error: "not-found" }); }
      if (req.method === "DELETE" && req.url!.startsWith("/rooms/")) {
        const n = decodeURIComponent(req.url!.slice(7)); if (!rooms.delete(n)) return send(404, { error: "not-found" }); return send(200, { deleted: true, name: n });
      }
      send(404, { error: "not-found" });
    });
  });
  return new Promise<{ server: http.Server; calls: Call[]; rooms: Map<string, any> }>((ok) => server.listen(port, "127.0.0.1", () => ok({ server, calls, rooms })));
}
export const decodeToken = (t: string) => JSON.parse(Buffer.from(t.slice(4), "base64url").toString());
