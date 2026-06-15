'use client';

import { Check, Dumbbell, Star } from 'lucide-react';
import type { Gym } from '@/types/gym';

function initialsFor(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
}

function formatRating(gym: Gym) {
	const rating = gym.avg_rating ?? gym.rating;
	if (!rating) return null;
	return Number(rating).toFixed(1).replace(/\.0$/, '');
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
	const rating = formatRating(gym);
	const machineCount = gym.total_equipment ?? 0;

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
					className="absolute -bottom-[9px] left-1/2 -z-10 h-[18px] w-[18px] -translate-x-1/2 rotate-45 rounded-[3px] bg-border"
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
					<span className="absolute -right-1 bottom-0 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-[#3ee7a6] bg-bg text-[#3ee7a6] ring-[3px] ring-bg">
						<Check className="h-3.5 w-3.5 stroke-[3]" />
					</span>
				)}
			</button>

			{selected && (
				<>
					<div className="pointer-events-none absolute left-[84px] top-1/2 z-10 w-64 -translate-y-1/2 rounded-2xl border border-border bg-surface/95 p-3 text-left">
						<div className="mb-2 flex items-center gap-2.5">
							<div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-main bg-linear-to-br from-[#e7ece9] to-[#75807c] text-[10px] font-bold text-[#151616]">
								{gym.image_url ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={gym.image_url} alt="" className="h-full w-full object-cover" />
								) : (
									initialsFor(gym.name)
								)}
							</div>
							<div className="min-w-0">
								<p className="truncate text-sm font-semibold text-main">{gym.name}</p>
								<p className="truncate text-xs text-sub">
									{gym.city || 'Gym'} {matched ? '· matches filter' : ''}
								</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-xl border border-border px-2 py-2 text-center">
								<strong className="block text-sm text-main">{machineCount}</strong>
								<span className="text-[11px] text-sub">machines</span>
							</div>
							<div className="rounded-xl border border-border px-2 py-2 text-center">
								<strong className="flex items-center justify-center gap-1 text-sm text-main">
									{rating ? (
										<>
											<Star className="h-3 w-3 fill-[#f4c35b] stroke-[#f4c35b]" />
											{rating}
										</>
									) : (
										'--'
									)}
								</strong>
								<span className="text-[11px] text-sub">rating</span>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
