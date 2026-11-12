'use client';

import Image from 'next/image';
import Link from 'next/link';
import FavoriteButton from '@/components/ui/FavoriteButton';
import RatingStars from '@/components/ui/RatingStars';
import BrandLogo from '@/components/ui/BrandLogo';
import { Equipment } from '@/types/equipment';

type Props = {
	item: Equipment;
	brandLogo?: string | null;
	onToggleFavorite: (id: number) => void;
	onUpdateRating: (id: number, rating: number) => void;
};

export default function EquipmentCard({ item: e, brandLogo, onToggleFavorite, onUpdateRating }: Props) {
	const href = `/equipment/${e.id}`;

	return (
		<article className="group flex flex-col gap-4">
			<div className="bg-sub-alt relative aspect-[4/3] overflow-hidden rounded-2xl">
				<Link href={href} aria-label={e.name || 'Equipment details'} className="absolute inset-0">
					{e.image_url ? (
						<Image
							src={e.image_url}
							alt={e.name}
							fill
							sizes="(min-width: 1361px) 20vw, (min-width: 1105px) 25vw, 50vw"
							className="object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
						/>
					) : (
						<span className="text-sub flex h-full w-full items-center justify-center text-xs">No img</span>
					)}
				</Link>

				<BrandLogo
					name={e.brand}
					logoUrl={brandLogo}
					className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-md"
				/>

				<div className="bg-bg/90 absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full">
					<FavoriteButton isFavorite={e.is_favorite} onToggle={() => onToggleFavorite(e.id)} />
				</div>
			</div>

			<div className="flex flex-col items-center gap-1 px-1 text-center">
				<Link href={href} className="flex min-w-0 max-w-full flex-col items-center gap-1">
					<span className="text-main max-w-full truncate text-xs font-bold">
						{[e.brand, e.series].filter(Boolean).join(' · ')}
					</span>
					<span className="text-main text-base font-medium leading-tight">{e.name || '—'}</span>
				</Link>

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
			</div>
		</article>
	);
}
