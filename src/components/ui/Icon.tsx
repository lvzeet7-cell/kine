import type { SVGProps } from "react";

/**
 * Jeu d'icônes en ligne (trait 1,5 px) — aucune dépendance externe.
 * Plusieurs tracés sont inspirés de Lucide (licence ISC).
 */
const paths = {
  motion: (
    <>
      <circle cx="6" cy="18" r="2" />
      <path d="M7.6 16.8 18 9" />
      <path d="M8 18h13" />
      <path d="M4 18a14 14 0 0 1 11.2-13.7" strokeDasharray="1.5 2.5" />
    </>
  ),
  bone: (
    <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
  ),
  plus: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  stride: (
    <>
      <circle cx="14" cy="4.5" r="1.8" />
      <path d="m9 21 2.2-5.2L14 13l-1-4.5-3.5 1.5L8 13" />
      <path d="m13 8.5 2 3.5 3 1" />
      <path d="m11.2 15.8 3 2.2.8 3" />
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  external: <path d="M7 17 17 7M8 7h9v9" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>
  ),
  access: (
    <>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M5 8.5 12 10l7-1.5M12 10v4.5m0 0-3 6.5m3-6.5 3 6.5" />
    </>
  ),
  car: (
    <>
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
      <path d="M3 12h18" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="3" width="16" height="15" rx="3" />
      <path d="M4 11h16M8 18v3M16 18v3" />
      <path d="M8 14.5h.01M16 14.5h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20v-5M10.5 20v-8M15 20v-6M19.5 20v-10" />
      <path d="m5 10 5-4.5 3.5 3L19.5 3" />
      <path d="M16 3h3.5v3.5" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
      <rect x="4.5" y="6.5" width="2" height="11" rx="1" />
      <rect x="17.5" y="6.5" width="2" height="11" rx="1" />
    </>
  ),
  bike: (
    <>
      <circle cx="5.5" cy="17" r="3.5" />
      <circle cx="18.5" cy="17" r="3.5" />
      <circle cx="15" cy="5" r="1.5" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h3" />
    </>
  ),
  mountain: (
    <>
      <path d="M3 20 10 7l4 7 2-3 5 9z" />
      <path d="m8.2 10.4 1.8 1.6 1.8-1.6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  flex: (
    <>
      <path d="M7 20c-2-1-3-3-3-5.5C4 10 6 7 8.5 5.5L10 4l2 1.5-1 2.5-2 1 .5 3c1.5-1.5 4-2 6-1 2.5 1.2 3.5 4 2.5 6.5-1 2.3-3.5 3-6 2.5z" />
    </>
  ),
  document: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
      <path d="M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
      <path d="m15 9 5-5M17 4h3v3" />
    </>
  ),
  tick: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
      <path d="M5 19 14 10" />
    </>
  ),
  hand: (
    <>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 10.5V4a1.5 1.5 0 0 1 3 0v7" />
      <path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M17 11.5V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.6 15.6a1.6 1.6 0 0 1 2.4-2.1L8 14.5" />
    </>
  ),
  spine: (
    <>
      <rect x="9.5" y="2.5" width="5" height="3" rx="1.2" />
      <rect x="9" y="7" width="6" height="3" rx="1.2" />
      <rect x="9" y="11.5" width="6" height="3" rx="1.2" />
      <rect x="9.5" y="16" width="5" height="3" rx="1.2" />
      <path d="M12 19v2.5" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
    </>
  ),
  videoOff: (
    <>
      <path d="M10 6h3a2.5 2.5 0 0 1 2.5 2.5v3M15.5 15.5A2.5 2.5 0 0 1 13 18H5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 5 6" />
      <path d="m15.5 10.5 6-3.5v10l-4-2.3" />
      <path d="m3 3 18 18" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  micOff: (
    <>
      <path d="M15 9.5V5.5a3 3 0 0 0-5.7-1.3M9 9v2.5a3 3 0 0 0 4.6 2.5" />
      <path d="M5.5 11a6.5 6.5 0 0 0 10.7 5M18.5 11a6.5 6.5 0 0 1-.4 2.2M12 17.5V21" />
      <path d="m3 3 18 18" />
    </>
  ),
  hangup: (
    <path d="M3.2 14.6 5.4 16.8a1 1 0 0 0 1.3.1l2.4-1.7a1 1 0 0 0 .4-1.1l-.6-2a12 12 0 0 1 6.2 0l-.6 2a1 1 0 0 0 .4 1.1l2.4 1.7a1 1 0 0 0 1.3-.1l2.2-2.2a1 1 0 0 0 0-1.4C17.4 9.7 6.6 9.7 3.2 13.2a1 1 0 0 0 0 1.4z" />
  ),
  signal: (
    <>
      <path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4" />
    </>
  ),
  quote: (
    <path d="M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3" />
  ),
} as const;

export type IconName = keyof typeof paths;

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 24, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
