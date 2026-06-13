'use client';

import { useRef, useCallback } from 'react';

export const CURVE_POINTS = 5;
export const DEFAULT_CURVE: number[] = Array(CURVE_POINTS).fill(50);

const SNAP: [number, number, number] = [0, 50, 100];

const VB = { w: 220, h: 90 };
const CHART = { x0: 20, x1: 208, y0: 8, y1: 78 };

export function valToSVGY(v: number): number {
	return CHART.y0 + ((100 - v) / 100) * (CHART.y1 - CHART.y0);
}

export function xAt(i: number): number {
	return CHART.x0 + (i / (CURVE_POINTS - 1)) * (CHART.x1 - CHART.x0);
}

export function catmullRomPath(pts: [number, number][]): string {
	if (pts.length < 2) return '';
	const d: string[] = [`M${pts[0][0]},${pts[0][1]}`];
	for (let i = 1; i < pts.length; i++) {
		const p0 = pts[Math.max(0, i - 2)];
		const p1 = pts[i - 1];
		const p2 = pts[i];
		const p3 = pts[Math.min(pts.length - 1, i + 1)];
		const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
		const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
		const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
		const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
		d.push(
			`C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0]},${p2[1]}`
		);
	}
	return d.join(' ');
}

function snapNearest(svgY: number): number {
	const raw = 100 - ((svgY - CHART.y0) / (CHART.y1 - CHART.y0)) * 100;
	const clamped = Math.max(0, Math.min(100, raw));
	return SNAP.reduce((a, b) => (Math.abs(b - clamped) < Math.abs(a - clamped) ? b : a));
}

const LEVEL_LABEL: Record<number, string> = { 0: 'low', 50: 'mid', 100: 'peak' };

type Props = {
	value: number[];
	onChange: (v: number[]) => void;
};

export default function CustomCurveEditor({ value, onChange }: Props) {
	const svgRef = useRef<SVGSVGElement>(null);

	const clientToSVGY = useCallback((clientY: number): number | null => {
		const svg = svgRef.current;
		if (!svg) return null;
		const pt = svg.createSVGPoint();
		pt.x = 0;
		pt.y = clientY;
		const ctm = svg.getScreenCTM();
		if (!ctm) return null;
		return pt.matrixTransform(ctm.inverse()).y;
	}, []);

	const pts: [number, number][] = value.map((v, i) => [xAt(i), valToSVGY(v)]);
	const curvePath = catmullRomPath(pts);

	return (
		<svg
			ref={svgRef}
			viewBox={`0 0 ${VB.w} ${VB.h}`}
			width="100%"
			className="overflow-visible"
			style={{ userSelect: 'none', touchAction: 'none' }}
		>
			{/* Chart background */}
			<rect
				x={CHART.x0} y={CHART.y0}
				width={CHART.x1 - CHART.x0} height={CHART.y1 - CHART.y0}
				fill="var(--sub-alt-color)" rx="4"
			/>

			{/* Snap-level guide lines + y-axis labels */}
			{SNAP.map((v) => (
				<g key={v}>
					<line
						x1={CHART.x0} y1={valToSVGY(v)}
						x2={CHART.x1} y2={valToSVGY(v)}
						stroke="var(--border-color)" strokeWidth="0.75" strokeDasharray="3 3"
					/>
					<text
						x={CHART.x0 - 3}
						y={valToSVGY(v) + 2}
						textAnchor="end"
						fontSize="5"
						fill="var(--sub-color)"
					>
						{LEVEL_LABEL[v]}
					</text>
				</g>
			))}

			{/* Axes */}
			<line x1={CHART.x0} y1={CHART.y0} x2={CHART.x0} y2={CHART.y1}
				stroke="var(--border-color)" strokeWidth="0.75" />
			<line x1={CHART.x0} y1={CHART.y1} x2={CHART.x1} y2={CHART.y1}
				stroke="var(--border-color)" strokeWidth="0.75" />

			{/* Area fill */}
			{curvePath && (
				<path
					d={`${curvePath} L${CHART.x1},${CHART.y1} L${CHART.x0},${CHART.y1} Z`}
					fill="#3b82f6" fillOpacity="0.1"
				/>
			)}

			{/* Curve */}
			{curvePath && (
				<path
					d={curvePath}
					fill="none" stroke="#3b82f6" strokeWidth="2"
					strokeLinecap="round" strokeLinejoin="round"
				/>
			)}

			{/* Handles */}
			{pts.map(([x, y], i) => (
				<g key={i}>
					{/* Enlarged invisible hit area carries the pointer events */}
					<circle
						cx={x} cy={y} r={10}
						fill="transparent"
						style={{ cursor: 'ns-resize' }}
						onPointerDown={(e) => {
							e.preventDefault();
							e.currentTarget.setPointerCapture(e.pointerId);
							const svgY = clientToSVGY(e.clientY);
							if (svgY !== null) {
								onChange(value.map((v, idx) => (idx === i ? snapNearest(svgY) : v)));
							}
						}}
						onPointerMove={(e) => {
							if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
							const svgY = clientToSVGY(e.clientY);
							if (svgY === null) return;
							onChange(value.map((v, idx) => (idx === i ? snapNearest(svgY) : v)));
						}}
					/>
					{/* Visual dot — no pointer events so it doesn't interfere */}
					<circle
						cx={x} cy={y} r={5}
						fill="#3b82f6"
						stroke="var(--surface-color)"
						strokeWidth="1.5"
						style={{ pointerEvents: 'none' }}
					/>
				</g>
			))}

			{/* X-axis labels */}
			<text x={CHART.x0} y={VB.h - 1} textAnchor="middle" fontSize="5.5" fill="var(--sub-color)">0%</text>
			<text x={(CHART.x0 + CHART.x1) / 2} y={VB.h - 1} textAnchor="middle" fontSize="5.5" fill="var(--sub-color)">50%</text>
			<text x={CHART.x1} y={VB.h - 1} textAnchor="middle" fontSize="5.5" fill="var(--sub-color)">100%</text>
		</svg>
	);
}
