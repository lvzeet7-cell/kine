import { fullAddress, isAddressSet } from "@/data/site";
import { icsContent } from "@/lib/booking/calendar";
import { getRepo } from "@/lib/booking/server";
import { findByToken } from "@/lib/booking/service";
import { json, safe } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/booking/ics/[token] — fichier .ics du rendez-vous */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  return safe(async () => {
    const { token } = await params;
    const a = await findByToken(await getRepo(), token);
    if (!a) return json({ message: "Ce rendez-vous est introuvable." }, 404);
    const ics = icsContent(
      {
        uid: `${a.id}@cabinet`,
        title: `Kinésithérapie — ${a.serviceName}`,
        startAt: a.startAt,
        endAt: a.endAt,
        location: isAddressSet() ? fullAddress() : "",
        description: "",
      },
      a.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
    );
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rendez-vous.ics"',
        "Cache-Control": "no-store",
      },
    });
  });
}
