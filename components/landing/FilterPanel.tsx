import { JetBrains_Mono } from 'next/font/google';
import { Check, Search } from 'lucide-react';
import AppWindow from './AppWindow';
import { PANEL_LABEL_CLS, STAGE_CLS, WINDOW_CLS } from './panelStyles';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const mono = jetbrainsMono.className;

// Static mock: generic placeholder content standing in for the real product
// screen. DatabasePanel and CommunityPanel read real data instead.
const ROWS = [
	{ label: 'Leg Press', brand: 'Hammer Strength', count: 128, on: true },
	{ label: 'Lat Pulldown', brand: 'Life Fitness', count: 112, on: true },
	{ label: 'Chest Press', brand: 'Technogym', count: 96, on: true },
	{ label: 'Cable Crossover', brand: 'Matrix', count: 74, on: false },
	{ label: 'Smith Machine', brand: 'Atlantis', count: 68, on: false },
	{ label: 'Hack Squat', brand: 'Cybex', count: 61, on: false },
	{ label: 'Leg Extension', brand: 'Nautilus', count: 54, on: false },
	{ label: 'Seated Row', brand: 'Prime', count: 43, on: false }
];
const CHIPS = ['Category', 'Brand', 'Exercise'];

export default function FilterPanel() {
	return (
		<div className={STAGE_CLS}>
			<AppWindow title="Equipment" className={WINDOW_CLS}>
				<div className="flex shrink-0 items-center justify-between">
					<span className={`${mono} ${PANEL_LABEL_CLS}`}>Equipment</span>
					<span className={`${mono} text-sub text-[10px]`}>3 / 312</span>
				</div>

				<div className="border-border bg-surface mt-3 flex h-9 shrink-0 items-center gap-2.5 rounded-lg border px-3">
					<Search size={14} className="text-sub shrink-0" />
					<div className="bg-border h-1.5 w-28 rounded-full" />
				</div>

				<div className="mt-3 flex shrink-0 gap-2">
					{CHIPS.map((chip, index) => (
						<span
							key={chip}
							className={`${mono} rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
								index === 0 ? 'border-accent text-accent' : 'border-border text-sub'
							}`}
						>
							{chip}
						</span>
					))}
				</div>

				<ul className="mt-3 flex flex-1 flex-col justify-between gap-0.5">
					{ROWS.map((row) => (
						<li
							key={row.label}
							className={`-mx-2 flex items-center gap-3 rounded-md px-2 py-1 ${
								row.on ? 'bg-accent/10' : ''
							}`}
						>
							<span
								className={`grid h-4 w-4 shrink-0 place-items-center rounded ${
									row.on ? 'bg-accent' : 'border-border border'
								}`}
							>
								{row.on && <Check size={11} className="text-bg" />}
							</span>
							<span className="text-main shrink-0 text-sm">{row.label}</span>
							<span className={`${mono} text-sub truncate text-[11px]`}>{row.brand}</span>
							<span className={`${mono} text-sub ml-auto shrink-0 text-xs`}>{row.count}</span>
						</li>
					))}
				</ul>
			</AppWindow>
		</div>
	);
}
