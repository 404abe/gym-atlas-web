'use client';

import EquipmentCard from './EquipmentCard';
import EquipmentEmptyState from './EquipmentEmptyState';
import { Equipment } from '@/types/equipment';

type Props = {
	equipment: Equipment[];
	brandLogos: Record<string, string | null>;
	onToggleFavorite: (id: number) => void;
	onUpdateRating: (id: number, rating: number) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
};

export default function EquipmentGrid({
	equipment,
	brandLogos,
	onToggleFavorite,
	onUpdateRating,
	hasActiveFilters,
	onClearFilters
}: Props) {
	if (equipment.length === 0) {
		return <EquipmentEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />;
	}

	return (
		<div className="xs:gap-4 xs:px-6 grid grid-cols-2 gap-3 px-2 pb-6 lg:grid-cols-3 xl:grid-cols-4">
			{equipment.map((e) => (
				<EquipmentCard
					key={e.id}
					item={e}
					brandLogo={brandLogos[e.brand]}
					onToggleFavorite={onToggleFavorite}
					onUpdateRating={onUpdateRating}
				/>
			))}
		</div>
	);
}
