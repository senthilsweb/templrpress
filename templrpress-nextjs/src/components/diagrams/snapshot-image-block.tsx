"use client";

import { cn } from "@/lib/utils";
import type { ImageElement } from "./snapshot-types";

/* ── Component ──────────────────────────────────────────────────── */

interface Props {
  element: ImageElement;
}

export function SnapshotImageBlock({ element }: Props) {
  const { image, window: win, size } = element;
  const radius = image.border_radius ?? win?.border_radius ?? 8;
  const hasShadow = win?.shadow !== false;
  const fit = image.fit ?? "contain";

  return (
    <div
      style={{
        width: size.width,
        height: size.height === "auto" ? undefined : size.height,
        borderRadius: radius,
      }}
      className={cn(
        "overflow-hidden",
        hasShadow && "shadow-2xl"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          borderRadius: radius,
        }}
      />
    </div>
  );
}
