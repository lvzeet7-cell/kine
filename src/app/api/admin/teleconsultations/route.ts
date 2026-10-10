import { adminRoute } from "@/lib/admin-route";
import { bookingConfig } from "@/lib/booking/config";
import { getRepo } from "@/lib/booking/server";
import { toAdmin } from "@/lib/booking/service";
import { addDays, localDate, zonedToUtc } from "@/lib/booking/time";
import { json } from "@/lib/http";
import { formatPrice } from "@/lib/teleconsultation/settings";

export const dynamic = "force-dynamic";

const TZ = bookingConfig.timezone;
const VIEWS = ["today", "upcoming", "done", "cancelled", "all"] as const;
type View = (typeof VIEWS)[number];

/** GET /api/admin/teleconsultations?view=today|upcoming|done|cancelled|all&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(request: Request) {
  return adminRoute(request, async () => {
    const p = new URL(request.url).searchParams;
    const view: View = (VIEWS as readonly string[]).includes(p.get("view") ?? "") ? (p.get("view") as View) : "upcoming";
    const now = new Date();
    const today = localDate(now, TZ);
    const isDate = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const dayStart = (d: string) => zonedToUtc(d, 0, TZ)!.toISOString();

    let from = isDate(p.get("from")) ? dayStart(p.get("from")!) : undefined;
    let to = isDate(p.get("to")) ? dayStart(addDays(p.get("to")!, 1)) : undefined;
    if (view === "today") {
      from = dayStart(today);
      to = dayStart(addDays(today, 1));
    }
    const repo = await getRepo();
    const list = (await repo.listAppointments({ from, to, serviceId: "teleconsultation", order: view === "done" || view === "cancelled" ? "desc" : "asc" })).filter(
      (a) => {
        if (view === "cancelled") return a.status === "CANCELLED";
        if (view === "done") return a.status === "COMPLETED" || a.status === "NO_SHOW" || (a.status !== "CANCELLED" && a.endAt < now.toISOString());
        if (view === "upcoming") return (a.status === "PENDING" || a.status === "CONFIRMED") && a.endAt >= now.toISOString();
        if (view === "today") return true;
        return true;
      },
    );
    const teles = await repo.listTeleconsultations(list.map((a) => a.id));
    const byId = new Map(teles.map((t) => [t.appointmentId, t]));
    return json({
      items: list.map((a) => {
        const t = byId.get(a.id);
        return {
          appointment: toAdmin(a),
          price: formatPrice(t?.priceCents ?? null),
          roomReady: !!t?.roomName,
          patientJoinedAt: t?.patientJoinedAt ?? null,
          practitionerJoinedAt: t?.practitionerJoinedAt ?? null,
          issueReport: t?.issueReport ?? null,
          issueAt: t?.issueAt ?? null,
        };
      }),
    });
  });
}
