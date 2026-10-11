import type { NextConfig } from "next";

/*
 * Politique de sécurité du contenu (CSP) : le navigateur ne charge que ce qui vient du site
 * et des services réellement utilisés (Daily pour la vidéo, Cloudflare Turnstile en option,
 * OpenStreetMap pour la carte affichée à la demande).
 * Domaines Daily : https://docs.daily.co/guides/privacy-and-security/content-security-policy
 */
const DAILY = "https://*.daily.co https://*.dailywebrtc.com https://*.dailywebrtc.net";
const DAILY_WSS = "wss://*.daily.co wss://*.dailywebrtc.com wss://*.dailywebrtc.net";
const isDev = process.env.NODE_ENV !== "production";
const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' : scripts d'amorçage générés par Next.js ; 'unsafe-eval' seulement en développement
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${DAILY} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${DAILY} ${DAILY_WSS} https://challenges.cloudflare.com`,
  "media-src 'self' blob: mediastream:",
  "worker-src 'self' blob:",
  "frame-src https://www.openstreetmap.org https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Le lint se lance à part (npm run lint) : il ne bloque pas la mise en ligne
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
    // Qualité élevée pour les photos (90 au lieu de 75 par défaut)
    qualities: [90],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Caméra et micro autorisés uniquement pour le site lui-même (téléconsultation)
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
