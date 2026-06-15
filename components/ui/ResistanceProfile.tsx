'use client';

import { catmullRomPath, valToSVGY, xAt, CURVE_POINTS } from './CustomCurveEditor';

type Props = {
	profile?: 'constant' | 'ascending' | 'descending' | 'adjustable' | 'custom';
	curve?: number[];
};

// ViewBox for the mini display chart
const VB = { w: 56, h: 28 };
// Chart area within the mini display
const C = { x0: 4, x1: 52, y0: 4, y1: 24 };

const PRESET_CONFIGS = {
	constant: {
		label: 'Constant',
		color: '#6b7280',
		d: 'M4,14 L52,14',
	},
	ascending: {
		label: 'Ascending',
		color: '#22c55e',
		d: 'M4,22 C20,22 32,6 52,6',
	},
	descending: {
		label: 'Descending',
		color: '#ef4444',
		d: 'M4,6 C20,6 32,22 52,22',
	},
	adjustable: {
		label: 'Adjustable',
		color: '#3b82f6',
		d: 'M4,20 C12,20 16,6 28,6 C40,6 44,20 52,20',
	},
} as const;

function customCurvePath(curve: number[]): string {
	// Scale the shared CURVE_POINTS layout into the mini display coordinate space
	const pts: [number, number][] = curve.map((v, i) => {
		const x = C.x0 + (i / (CURVE_POINTS - 1)) * (C.x1 - C.x0);
		// valToSVGY uses the editor's chart bounds; scale to mini display Y range
		const normY = (valToSVGY(v) - 8) / (78 - 8); // editor chart y0=8, y1=78
		const y = C.y0 + normY * (C.y1 - C.y0);
		return [x, y];
	});
	return catmullRomPath(pts);
}

export default function ResistanceProfile({ profile, curve }: Props) {
	if (profile === 'custom') {
		const path = curve && curve.length === CURVE_POINTS ? customCurvePath(curve) : null;
		return (
			<div className="flex items-center gap-2">
				<svg
					width="56"
					height="28"
					viewBox={`0 0 ${VB.w} ${VB.h}`}
					fill="none"
					className="shrink-0 overflow-visible"
				>
					<line x1={C.x0} y1={C.y0} x2={C.x0} y2={C.y1} stroke="var(--border-color)" strokeWidth="0.75" />
					<line x1={C.x0} y1={C.y1} x2={C.x1} y2={C.y1} stroke="var(--border-color)" strokeWidth="0.75" />
					{path ? (
						<path d={path} stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					) : (
						<line x1={C.x0} y1="14" x2={C.x1} y2="14" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="3 2" />
					)}
				</svg>
				<span className="text-[11px] font-medium" style={{ color: '#3b82f6' }}>
					Custom
				</span>
			</div>
		);
	}

	const cfg = profile ? PRESET_CONFIGS[profile] : PRESET_CONFIGS.constant;

	return (
		<div className="flex items-center gap-2">
			<svg
				width="56"
				height="28"
				viewBox={`0 0 ${VB.w} ${VB.h}`}
				fill="none"
				className="shrink-0 overflow-visible"
			>
				<line x1={C.x0} y1={C.y0} x2={C.x0} y2={C.y1} stroke="var(--border-color)" strokeWidth="0.75" />
				<line x1={C.x0} y1={C.y1} x2={C.x1} y2={C.y1} stroke="var(--border-color)" strokeWidth="0.75" />
				<path
					d={cfg.d}
					stroke={cfg.color}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<span className="text-[11px] font-medium" style={{ color: cfg.color }}>
				{cfg.label}
			</span>
		</div>
	);
}
