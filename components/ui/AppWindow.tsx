// AppWindow.tsx
// A fake macOS-style window built only from divs, Tailwind and inline styles.
// Works in Next.js (App Router) with Tailwind v4. No images needed.

import type { ReactNode } from "react";

const DOTS = ["#ff5f57", "#febc2e", "#28c840"]; // close, minimise, zoom

type AppWindowProps = {
  title: string;
  children: ReactNode;
  width?: number;
  height?: number;
  dark?: boolean;
  className?: string;
};

export function AppWindow({
  title,
  children,
  width = 320,
  height = 240,
  dark = false,
  className = "",
}: AppWindowProps) {
  return (
    <div
      className={[
        "flex flex-col overflow-hidden rounded-[14px]",
        dark ? "bg-[#1e1f22] text-white" : "bg-white text-black",
        className,
      ].join(" ")}
      style={{
        width,
        height,
        // Layered shadow: a big soft one plus a tighter contact shadow
        boxShadow:
          "0 24px 48px -12px rgb(0 0 0 / 0.32), 0 6px 16px -6px rgb(0 0 0 / 0.14)",
        fontFamily:
          '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Title bar */}
      <div
        className={[
          "relative flex h-[30px] shrink-0 items-center justify-center border-b",
          dark ? "border-white/10 bg-[#2b2d31]" : "border-black/[0.08] bg-[#f6f6f7]",
        ].join(" ")}
      >
        {/* Traffic lights */}
        <div className="absolute left-[11px] flex" style={{ gap: 8 }}>
          {DOTS.map((c) => (
            <span
              key={c}
              className="block rounded-full"
              style={{
                width: 12,
                height: 12,
                background: c,
                // thin inner edge so the dots do not look flat
                boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.12)",
              }}
            />
          ))}
        </div>

        <span
          className={[
            "truncate px-[58px] text-[12px] font-semibold",
            dark ? "text-white/80" : "text-black/80",
          ].join(" ")}
        >
          {title}
        </span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

// ---------- Theme-aware fluid window ----------
// Same chrome as AppWindow (14px radius, 30px title bar, traffic lights,
// layered shadow) but sized by its parent and coloured from the site's theme
// tokens, so it follows the light/dark toggle. Used by the landing sections.

export function WindowFrame({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "bg-bg text-main flex w-full flex-col overflow-hidden rounded-[14px]",
        className,
      ].join(" ")}
      style={{
        boxShadow:
          "0 24px 48px -12px rgb(0 0 0 / 0.32), 0 6px 16px -6px rgb(0 0 0 / 0.14)",
      }}
    >
      <div className="border-border bg-surface relative flex h-[30px] shrink-0 items-center justify-center border-b">
        <div className="absolute left-[11px] flex" style={{ gap: 8 }} aria-hidden="true">
          {DOTS.map((c) => (
            <span
              key={c}
              className="block rounded-full"
              style={{
                width: 12,
                height: 12,
                background: c,
                boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.12)",
              }}
            />
          ))}
        </div>
        <span className="text-main/80 truncate px-[58px] text-[12px] font-semibold">{title}</span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

// ---------- Example: GymAtlas "find equipment" mock ----------

export function GymAtlasMock() {
  const rows = [
    { name: "Leg Press (plate loaded)", gym: "PureGym Aberdeen", d: "0.4 mi" },
    { name: "Cable Crossover", gym: "Total Fitness", d: "0.9 mi" },
    { name: "Hack Squat", gym: "The Foundry", d: "1.3 mi" },
  ];

  return (
    <div className="relative h-[360px] w-[520px]">
      {/* Back window */}
      <AppWindow title="Search" width={300} height={250} className="absolute left-0 top-10">
        <div className="space-y-2 p-3 text-[12px]">
          <div className="rounded-md bg-black/[0.05] px-2 py-1.5 text-black/50">
            leg press near me
          </div>
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-black/50">{r.gym}</div>
              </div>
              <span className="text-black/40">{r.d}</span>
            </div>
          ))}
        </div>
      </AppWindow>

      {/* Front dark window, overlapping */}
      <AppWindow
        title="gym-atlas-api — 80×24"
        width={260}
        height={200}
        dark
        className="absolute right-0 top-0 z-10"
      >
        <pre className="p-3 font-mono text-[11px] leading-[1.5] text-white/80">
{`> GET /machines?q=leg+press
`}
          <span className="block bg-green-500/20 text-green-300">
            + 200 OK · 3 results
          </span>
          <span className="inline-block h-[12px] w-[7px] translate-y-[2px] animate-pulse bg-white/80" />
        </pre>
      </AppWindow>
    </div>
  );
}
