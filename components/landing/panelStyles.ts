// Shared shell for the landing page's alternating visual panels.
//
// STAGE_CLS is the soft backdrop each AppWindow floats on. From `sm` up it
// matches the 730×502 marketing images the layout is modelled on: capped at
// 730px wide, and aspect-[730/502] means the moment it reaches that cap the
// height resolves to exactly 502px. Below `sm` the aspect ratio is dropped
// so the window keeps its natural height instead of clipping its rows.
export const STAGE_CLS =
	'from-surface to-sub-alt border-border flex w-full max-w-[730px] items-center justify-center overflow-hidden rounded-xl border bg-linear-to-b px-5 py-8 sm:aspect-[730/502] sm:p-8';

export const WINDOW_CLS = 'w-full max-w-[480px] sm:h-full';

export const PANEL_LABEL_CLS = 'text-sub text-[10px] uppercase tracking-[0.18em]';
