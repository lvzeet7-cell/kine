import { ImageResponse } from "next/og";
import { SITE, isSet } from "@/data/site";
import { siteName } from "@/lib/seo";

export const alt = "Cabinet de kinésithérapie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image de partage (réseaux sociaux, messageries), générée à partir de la configuration */
export default function OpengraphImage() {
  const city = isSet(SITE.CITY) ? SITE.CITY : "";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0C353F",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="15 7 57 57">
            <path fill="#ECF0EE" d="M22 9h5v33h20v5H40v15h-4V47H22z" />
            <path fill="none" stroke="#6FA6D6" strokeWidth="4.3" d="M35 23H50.2a10.4 10.4 0 0 1 0 20.8H49.5" />
            <path fill="#6FA6D6" d="M40 30v7.2h-4v-3.6c0-2 1.6-3.4 4-3.6z" />
          </svg>
          <div style={{ fontSize: 28, color: "#C9D6CE" }}>Kinésithérapie</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{siteName}</div>
          <div style={{ fontSize: 32, color: "#C9D6CE" }}>
            {city ? `Rééducation et accompagnement à ${city}` : "Rééducation et accompagnement"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
