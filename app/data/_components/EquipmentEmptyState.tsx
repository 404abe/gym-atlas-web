'use client';

import { Search } from 'lucide-react';

type Props = {
	hasActiveFilters: boolean;
	onClearFilters: () => void;
};

export default function EquipmentEmptyState({ hasActiveFilters, onClearFilters }: Props) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="bg-sub-alt mb-3 rounded-full p-4">
				<Search className="text-sub h-8 w-8" />
			</div>
			<p className="text-sub text-sm">No equipment found</p>
			{hasActiveFilters && (
				<button onClick={onClearFilters} className="text-sub hover:text-text mt-4 text-sm underline">
					Clear all filters
				</button>
			)}
		</div>
	);
}
