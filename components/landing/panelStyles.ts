// Shared shell for the landing page's alternating visual panels.
//
// Matches the 730×502 marketing images the layout is modelled on: capped at
// 730px wide, and aspect-[730/502] means the moment it reaches that cap the
// height resolves to exactly 502px (730 × 502/730 = 502) — no breakpoint
// gating needed. Below 730px available width (narrow viewports, where the
// section stacks to a single column) it scales down keeping the same shape.
export const PANEL_CLS =
	'bg-sub-alt border-border flex w-full max-w-[730px] flex-col overflow-hidden rounded-xl border p-7 aspect-[730/502]';

export const PANEL_LABEL_CLS = 'text-sub text-[10px] uppercase tracking-[0.18em]';
