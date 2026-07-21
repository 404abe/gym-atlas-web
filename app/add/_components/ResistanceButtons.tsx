'use client';

import { Equipment } from '@/types/equipment';
import CustomCurveEditor from '@/components/ui/CustomCurveEditor';
import { RESISTANCE_COLORS } from '@/lib/resistanceColors';

type Props = {
	resistance: Equipment['resistance_profile'] | null;
	setResistance: (r: Equipment['resistance_profile'] | null) => void;
	curve: number[];
	onCurveChange: (curve: number[]) => void;
	col?: boolean;
	hideCustom?: boolean;
};

const PRESETS = [
	{ key: 'constant' as const, label: 'Constant', color: RESISTANCE_COLORS.constant, d: 'M3,10 L33,10' },
	{ key: 'ascending' as const, label: 'Ascending', color: RESISTANCE_COLORS.ascending, d: 'M3,15 C13,15 23,5 33,5' },
	{ key: 'descending' as const, label: 'Descending', color: RESISTANCE_COLORS.descending, d: 'M3,5 C13,5 23,15 33,15' },
	{ key: 'adjustable' as const, label: 'Adjustable', color: RESISTANCE_COLORS.adjustable, d: 'M3,14 C8,14 12,5 18,5 C24,5 28,14 33,14' },
] as const;

export default function ResistanceButtons({ resistance, setResistance, curve, onCurveChange, col, hideCustom }: Props) {
	const btnClass = (active: boolean, color: string) =>
		`flex flex-1 items-center gap-2 rounded-lg border px-2 py-2 text-[11px] font-medium transition ${
			active
				? 'border-transparent bg-main text-bg'
				: 'border-border text-sub hover:text-main'
		}`;

	return (
		<div className={`mt-1 flex ${col ? 'flex-col' : ''} gap-1.5`}>
			{PRESETS.map(({ key, label, color, d }) => {
				const active = resistance === key;
				return (
					<button
						key={key}
						type="button"
						onClick={() => setResistance(active ? null : key)}
						className={btnClass(active, color)}
					>
						<svg width="36" height="20" viewBox="0 0 36 20" fill="none" className="shrink-0">
							<path
								d={d}
								stroke={active ? 'currentColor' : color}
								strokeWidth="1.75"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						{label}
					</button>
				);
			})}

			{/* Custom option */}
			{!hideCustom && (
				<button
					type="button"
					onClick={() => setResistance(resistance === 'custom' ? null : 'custom')}
					className={btnClass(resistance === 'custom', RESISTANCE_COLORS.custom)}
				>
					<svg width="36" height="20" viewBox="0 0 36 20" fill="none" className="shrink-0">
						<path
							d="M3,14 C8,10 12,6 18,6 C24,6 28,14 33,10"
							stroke={resistance === 'custom' ? 'currentColor' : RESISTANCE_COLORS.custom}
							strokeWidth="1.75"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<circle
							cx="18" cy="6" r="2"
							fill={resistance === 'custom' ? 'currentColor' : RESISTANCE_COLORS.custom}
						/>
					</svg>
					Custom
				</button>
			)}

			{/* Curve editor — expands when Custom is selected */}
			{!hideCustom && resistance === 'custom' && (
				<div className="mt-1">
					<p className="text-sub mb-1.5 text-[10px]">drag handles to shape the curve</p>
					<CustomCurveEditor value={curve} onChange={onCurveChange} />
				</div>
			)}
		</div>
	);
}
