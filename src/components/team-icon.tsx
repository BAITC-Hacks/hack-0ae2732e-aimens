import type { ReactNode } from "react";
import type { TeamIconKey } from "@/domain/task";

const iconPaths: Record<TeamIconKey, ReactNode> = {
  shanyrak: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </>
  ),
  yurt: (
    <>
      <path d="M3 20h18M4 20V11l8-7 8 7v9M8 20v-6h8v6M8 11h.01M16 11h.01" />
    </>
  ),
  horse: (
    <>
      <path d="m4 17 2-6 4-2 3-4 4 2 3 5-2 3-4-1-2 4H8l-1-4-3 3ZM13 8l1-3 3 2M18 12h2M8 18v3M15 17v4" />
    </>
  ),
  tulpar: (
    <>
      <path d="M4 19c4-1 5-5 7-8 2-3 5-4 9-4-1 3-1 5-4 7-3 2-6 2-8 5H4ZM11 11l-1-5 4 3M8 15l-4-1 3-3M15 13l4 1" />
    </>
  ),
  ornament: (
    <>
      <path d="M3 12c3-7 6-7 9 0 3 7 6 7 9 0M3 12c3 7 6 7 9 0 3-7 6-7 9 0M3 7h18M3 17h18" />
    </>
  ),
  steppe: (
    <>
      <path d="M2 19c3-3 5-3 8 0 3-3 5-3 8 0 2-2 3-2 4-2M4 15l4-5 3 3 4-7 5 9M7 10V6M5 8h4" />
    </>
  ),
  tulip: (
    <>
      <path d="M12 21v-9M12 12C5 12 5 5 5 5c4 0 7 2 7 7ZM12 12c0-5 3-8 7-8 0 4-1 8-7 8ZM12 21c-2-4-5-5-8-5 1 4 4 5 8 5ZM12 21c2-4 5-5 8-5-1 4-4 5-8 5Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7m10 10 2.1 2.1m0-14.2L17 7M7 17l-2.1 2.1" />
    </>
  ),
  bow: (
    <>
      <path d="M5 3c13 3 13 15 0 18M5 3v18M5 12h15M16 9l4 3-4 3" />
    </>
  ),
  eagle: (
    <>
      <path d="M3 8c4 0 6 2 9 5 3-3 5-5 9-5-2 4-4 6-7 7l-2 5-2-5C7 14 5 12 3 8ZM11 13l1-3 2 2" />
    </>
  ),
};

export function TeamIcon({
  iconKey = "shanyrak",
  size = 28,
}: {
  iconKey?: TeamIconKey;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[iconKey]}
    </svg>
  );
}
