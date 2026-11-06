'use client';

import type { ReactNode } from 'react';
import { Activity, Dumbbell, Heart, Star, X } from 'lucide-react';
import { brandInitials } from '@/lib/utils';

type Props = {
	selectedType: string;
	onTypeChange: (val: string) => void;
	selectedBrand: string;
	onBrandChange: (val: string) => void;
	selectedResistance: string;
	onResistanceChange: (val: string) => void;
	showFavoritesOnly: boolean;
	onFavoritesChange: (val: boolean) => void;
	minRating: number;
	onMinRatingChange: (val: number) => void;
	itemCount: number;
	onClearFilters: () => void;
};

type Card = {
	key: string;
	label: string;
	value: string;
	tile: ReactNode;
	onRemove: () => void;
};

const TYPE_LABELS: Record<string, string> = {
	pin_loaded: 'Pin loaded',
	plate_loaded: 'Plate loaded'
};

function capitalise(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ActiveFilterCards({
	selectedType,
	onTypeChange,
	selectedBrand,
	onBrandChange,
	selectedResistance,
	onResistanceChange,
	showFavoritesOnly,
	onFavoritesChange,
	minRating,
	onMinRatingChange,
	itemCount,
	onClearFilters
}: Props) {
	const cards: Card[] = [];

	if (selectedBrand !== 'all') {
		cards.push({
			key: 'brand',
			label: 'Brand',
			value: selectedBrand,
			tile: <span className="font-mono text-xs font-medium">{brandInitials(selectedBrand)}</span>,
			onRemove: () => onBrandChange('all')
		});
	}
	if (selectedType !== 'all') {
		cards.push({
			key: 'type',
			label: 'Type',
			value: TYPE_LABELS[selectedType] ?? selectedType,
			tile: <Dumbbell className="h-4 w-4" />,
			onRemove: () => onTypeChange('all')
		});
	}
	if (selectedResistance !== 'all') {
		cards.push({
			key: 'resistance',
			label: 'Resistance',
			value: capitalise(selectedResistance),
			tile: <Activity className="h-4 w-4" />,
			onRemove: () => onResistanceChange('all')
		});
	}
	if (showFavoritesOnly) {
		cards.push({
			key: 'favourites',
			label: 'Show',
			value: 'Favourites only',
			tile: <Heart className="h-4 w-4" />,
			onRemove: () => onFavoritesChange(false)
		});
	}
	if (minRating > 0) {
		cards.push({
			key: 'rating',
			label: 'Rating',
			value: `≥ ${minRating.toFixed(1)}`,
			tile: <Star className="h-4 w-4" />,
			onRemove: () => onMinRatingChange(0)
		});
	}

	if (cards.length === 0) return null;

	return (
		<div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
			{cards.map((card) => (
				<div
					key={card.key}
					className="bg-surface border-border flex items-center gap-2.5 rounded-2xl border py-1.5 pl-1.5 pr-1.5"
				>
					<span className="bg-sub-alt text-main flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
						{card.tile}
					</span>
					<span className="flex flex-col">
						<span className="text-sub font-mono text-[10px] font-medium uppercase tracking-[0.14em]">
							{card.label}
						</span>
						<span className="text-main text-sm font-medium leading-tight">{card.value}</span>
					</span>
					<button
						onClick={card.onRemove}
						aria-label={`Remove ${card.label.toLowerCase()} filter`}
						className="bg-sub-alt text-sub hover:text-main flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</div>
			))}
			<button onClick={onClearFilters} className="text-sub hover:text-main px-2 text-xs underline">
				Clear all
			</button>
			<span className="text-sub font-mono text-xs">
				{itemCount} {itemCount === 1 ? 'result' : 'results'}
			</span>
		</div>
	);
}
