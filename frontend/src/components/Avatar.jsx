import React from "react";
import { initials } from "@/lib/format";

export function Avatar({ src, name, size = 40, online, className = "" }) {
  const px = `${size}px`;
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold overflow-hidden ${className}`}
      style={{ width: px, height: px, fontSize: size * 0.4 }}
      data-testid="avatar"
    >
      {src ? (
        <img src={src} alt={name || "avatar"} className="w-full h-full object-cover" />
      ) : (
        <span>{initials(name || "?")}</span>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-background online-dot"
          style={{ width: Math.max(8, size * 0.25), height: Math.max(8, size * 0.25) }}
        />
      )}
    </div>
  );
}
