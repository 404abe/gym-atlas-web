'use client';

import { Check, Dumbbell, Plus, /*Star,*/ ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gym, GymEquipment } from '@/types/gym';
import { fetchGymEquipment } from '@/lib/api';

function initialsFor(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
}

// function formatRating(gym: Gym) {
// 	const rating = gym.avg_rating ?? gym.rating;
// 	if (!rating) return null;
// 	return Number(rating).toFixed(1).replace(/\.0$/, '');
// }

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
	const router = useRouter();
	// const rating = formatRating(gym);
	const machineCount = gym.total_equipment ?? 0;
	const [equipment, setEquipment] = useState<GymEquipment[]>([]);

	useEffect(() => {
		if (!selected) return;
		fetchGymEquipment(gym.id)
			.then(setEquipment)
			.catch(() => setEquipment([]));
	}, [selected, gym.id]);


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
				<div className="absolute left-18.5 top-1/2 z-10 w-auto min-w-64 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-lg">
					{/* Header */}
					<div className="flex items-center gap-2.5 p-3 pb-2">
						<div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-border bg-linear-to-br from-[#e7ece9] to-[#75807c] text-[10px] font-bold text-[#151616]">
							{gym.image_url ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={gym.image_url} alt="" className="h-full w-full object-cover" />
							) : (
								initialsFor(gym.name) || <Dumbbell className="h-3.5 w-3.5" />
							)}
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-main">{gym.name}</p>
							<p className="text-xs text-sub">{gym.city || 'Gym'}</p>
						</div>
					</div>

					{/* Stats pills */}
					<div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
						<span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
							<Dumbbell className="h-2.5 w-2.5" />
							{machineCount} machines
						</span>
						{gym.unique_machines > 0 && (
							<span className="rounded-full border border-border px-2 py-0.5 text-xs text-sub">
								{gym.unique_machines} unique
							</span>
						)}
						{/* {rating && (
							<span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
								<Star className="h-2.5 w-2.5 fill-[#f4c35b] stroke-[#f4c35b]" />
								{rating}
							</span>
						)} */}
					</div>

					{/* Equipment thumbnails */}
					{equipment.length > 0 && (
						<div className="flex gap-1.5 px-3 pb-2.5">
							{equipment.slice(0, 4).map((eq, i) => (
								<div
									key={eq.equipment_id}
									className={`h-15.5 w-15.5 shrink-0 overflow-hidden rounded-xl bg-sub-alt ${i === 3 ? 'hidden sm:flex' : 'flex'} items-center justify-center`}
								>
									{eq.image_url ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={eq.image_url} alt="" className="h-full w-full object-cover" />
									) : (
										<Dumbbell className="h-5 w-5 text-sub" />
									)}
								</div>
							))}
							{/* mobile: show when > 3 */}
							{equipment.length > 3 && (
								<div className="flex h-15.5 w-15.5 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-sub-alt sm:hidden">
									<Plus className="h-4 w-4 text-sub" />
									<span className="text-[11px] text-sub">{equipment.length - 3} more</span>
								</div>
							)}
							{/* desktop: show when > 4 */}
							{equipment.length > 4 && (
								<div className="hidden h-15.5 w-15.5 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-sub-alt sm:flex">
									<Plus className="h-4 w-4 text-sub" />
									<span className="text-[11px] text-sub">{equipment.length - 4} more</span>
								</div>
							)}
						</div>
					)}

					{/* View gym button */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							router.push(`/gyms/${gym.id}`);
						}}
						className="flex w-full items-center justify-between border-t border-border px-3 py-2.5 text-sm font-medium text-main transition-colors hover:bg-sub-alt"
					>
						View gym
						<ArrowRight className="h-4 w-4" />
					</button>
				</div>
			)}
		</div>
	);
}
