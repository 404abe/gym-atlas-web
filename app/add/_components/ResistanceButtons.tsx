'use client';

import { Equipment } from '@/types/equipment';

type ResistanceButtonsProps = {
	resistance: Equipment['resistance_profile'] | null;
	setResistance: (r: Equipment['resistance_profile'] | null) => void;
	col?: boolean;
};

export default function ResistanceButtons({
	resistance,
	setResistance,
	col
}: ResistanceButtonsProps) {
	return (
		<div className={`mt-1 flex ${col ? 'flex-col' : ''} gap-1.5`}>
			{(['constant', 'ascending', 'descending'] as const).map((r) => (
				<button
					key={r}
					type="button"
					onClick={() => setResistance(r === resistance ? null : r)}
					className={`flex-1 rounded-lg border px-1.5 py-1.5 text-[11px] font-medium capitalize transition ${
						resistance === r
							? 'bg-main text-bg border-transparent'
							: 'border-border text-sub hover:text-main'
					}`}
				>
					{r}
				</button>
			))}
		</div>
	);
}
