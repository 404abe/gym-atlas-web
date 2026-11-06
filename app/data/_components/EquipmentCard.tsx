'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaExpandAlt } from 'react-icons/fa';
import FavoriteButton from '@/components/ui/FavoriteButton';
import RatingStars from '@/components/ui/RatingStars';
import { brandInitials } from '@/lib/utils';
import { Equipment } from '@/types/equipment';

type Props = {
	item: Equipment;
	onToggleFavorite: (id: number) => void;
	onUpdateRating: (id: number, rating: number) => void;
};

export default function EquipmentCard({ item: e, onToggleFavorite, onUpdateRating }: Props) {
	const href = `/equipment/${e.id}`;

	return (
		<article className="bg-surface border-border group flex flex-col gap-3 rounded-2xl border p-2 transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
			<div className="bg-sub-alt relative aspect-[4/3] overflow-hidden rounded-xl">
				<Link href={href} aria-label={e.name || 'Equipment details'} className="absolute inset-0">
					{e.image_url ? (
						<Image
							src={e.image_url}
							alt={e.name}
							fill
							sizes="(min-width: 1361px) 20vw, (min-width: 1105px) 25vw, 50vw"
							className="object-cover"
						/>
					) : (
						<span className="text-sub flex h-full w-full items-center justify-center text-xs">No img</span>
					)}
				</Link>

				<span className="bg-bg/90 text-main pointer-events-none absolute left-2 top-2 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em]">
					{e.type === 'pin_loaded' ? 'Pin' : 'Plate'}
				</span>

				<div className="bg-bg/90 absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full">
					<FavoriteButton isFavorite={e.is_favorite} onToggle={() => onToggleFavorite(e.id)} />
				</div>
			</div>

			<Link href={href} className="flex items-center gap-3 px-1.5">
				<span className="bg-sub-alt text-sub flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-medium">
					{brandInitials(e.brand)}
				</span>
				<span className="min-w-0">
					<span className="text-main block text-sm font-semibold leading-tight">{e.name || '—'}</span>
					<span className="text-sub block truncate font-mono text-xs">
						{[e.brand, e.series].filter(Boolean).join(' · ')}
					</span>
				</span>
			</Link>

			<div className="border-border mx-1.5 flex items-center justify-between gap-2 border-t pb-1 pt-2.5">
				<div className="hidden sm:block">
					<RatingStars
						avgRating={Number(e.avg_rating) || 0}
						userRating={Number(e.user_rating) || undefined}
						onRate={(rating) => onUpdateRating(e.id, rating)}
					/>
				</div>
				<span className="text-sub font-mono text-xs sm:hidden">
					{e.avg_rating ? Number(e.avg_rating).toFixed(1) : '—'}
				</span>
				<Link
					href={href}
					aria-label={`Open ${e.name || 'equipment'} details`}
					className="text-sub hover:text-main flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition"
				>
					<FaExpandAlt className="h-3.5 w-3.5" />
				</Link>
			</div>
		</article>
	);
}
