'use client';

import { Check, Dumbbell } from 'lucide-react';
import type { Gym } from '@/types/gym';

function initialsFor(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
}

export default function GymMarker({
	gym,
	selected,
	matched,
	onClick
}: {
	gym: Gym;
	selected: boolean;
	matched: boolean;
	onClick: () => void;
}) {
	return (
		<div className="relative flex flex-col items-center">
			<button
				type="button"
				onClick={onClick}
				aria-label={`Select ${gym.name}`}
				className={`group relative z-20 grid h-[58px] w-[58px] place-items-center rounded-full border-2 border-border bg-surface shadow-[0_8px_20px_rgb(0_0_0/0.2)] transition-transform duration-150 ${
					selected ? 'scale-110' : 'hover:scale-105'
				}`}
			>
				<span
					className="absolute -bottom-[9px] left-1/2 -z-10 h-[18px] w-[18px] -translate-x-1/2 rotate-45 rounded-[3px] bg-[#050606]"
					aria-hidden="true"
				/>
				<span className="absolute inset-[6px] grid place-items-center overflow-hidden rounded-full border-2 border-border bg-linear-to-br from-[#e7ece9] to-[#75807c] text-[11px] font-bold text-[#151616]">
					{gym.image_url ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={gym.image_url} alt="" className="h-full w-full object-cover" />
					) : (
						initialsFor(gym.name) || <Dumbbell className="h-4 w-4" />
					)}
				</span>
				{matched && (
					<span className="absolute -right-1 bottom-0 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-[#3ee7a6] bg-[#101212] text-[#3ee7a6] ring-[3px] ring-[#050606]">
						<Check className="h-3.5 w-3.5 stroke-[3]" />
					</span>
				)}
			</button>

		</div>
	);
}
