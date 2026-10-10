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
          <svg width="64" height="64" viewBox="0 0 36 36">
            <rect width="36" height="36" rx="10" fill="#124B57" />
            <path d="M27 27A18 18 0 0 0 9 9" fill="none" stroke="#9DB3A5" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 27 L20.5 15.5M9 27H24" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="9" cy="27" r="2.6" fill="#fff" />
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
