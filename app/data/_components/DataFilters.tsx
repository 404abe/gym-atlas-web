'use client';

import { Filter, X, Search } from 'lucide-react';

type DataFiltersProps = {
	selectedType: string;
	onTypeChange: (value: string) => void;
	selectedBrand: string;
	onBrandChange: (value: string) => void;
	selectedResistance: string;
	onResistanceChange: (value: string) => void;
	showFavoritesOnly: boolean;
	onFavoritesChange: (value: boolean) => void;
	minRating: number;
	onRatingChange: (value: number) => void;
	brands: string[];
	hasActiveFilters: boolean;
	activeFilterCount: number;
	onClearFilters: () => void;
	showFilters: boolean;
	onToggleFilters: () => void;
	search: string;
	onSearchChange: (value: string) => void;
	activeView: 'equipment' | 'gyms';
};

export default function DataFilters({
	selectedType,
	onTypeChange,
	selectedBrand,
	onBrandChange,
	selectedResistance,
	onResistanceChange,
	showFavoritesOnly,
	onFavoritesChange,
	minRating,
	onRatingChange,
	brands,
	hasActiveFilters,
	activeFilterCount,
	onClearFilters,
	showFilters,
	onToggleFilters,
	search,
	onSearchChange,
	activeView
}: DataFiltersProps) {
	return (
		<div className="border-border border-b px-6 py-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-main text-lg font-semibold">
						{activeView === 'equipment' ? 'Equipment Database' : 'Gym Database'}
					</h2>
					<p className="text-sub mt-0.5 text-sm">Items will show here</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="relative">
						<Search className="text-sub absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
						<input
							type="text"
							placeholder={activeView === 'equipment' ? 'Search equipment...' : 'Search gyms...'}
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							className="bg-sub-alt text-main focus:ring-sub h-9 w-64 rounded-lg pl-9 pr-3 text-sm outline-none focus:ring-1"
						/>
						{search && (
							<button
								onClick={() => onSearchChange('')}
								className="absolute right-2 top-1/2 -translate-y-1/2"
							>
								<X className="text-sub h-3.5 w-3.5" />
							</button>
						)}
					</div>

					{activeView === 'equipment' && (
						<button
							onClick={onToggleFilters}
							className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
								showFilters || hasActiveFilters
									? 'border-border bg-sub-alt text-main'
									: 'border-border text-sub hover:bg-surface'
							}`}
						>
							<Filter className="h-3.5 w-3.5" />
							Filter
							{hasActiveFilters && (
								<span className="bg-main text-bg ml-1 rounded-full px-1.5 py-0.5 text-[10px]">
									{activeFilterCount}
								</span>
							)}
						</button>
					)}
				</div>
			</div>

			{showFilters && activeView === 'equipment' && (
				<div className="border-border mt-4 flex flex-wrap items-center gap-4 border-t pt-4">
					<select
						value={selectedType}
						onChange={(e) => onTypeChange(e.target.value)}
						className="bg-sub-alt text-main h-8 rounded-lg px-2 text-sm outline-none"
					>
						<option value="all">All types</option>
						<option value="pin_loaded">Pin loaded</option>
						<option value="plate_loaded">Plate loaded</option>
					</select>

					<select
						value={selectedBrand}
						onChange={(e) => onBrandChange(e.target.value)}
						className="bg-sub-alt text-main h-8 rounded-lg px-2 text-sm outline-none"
					>
						<option value="all">All brands</option>
						{brands.map((brand) => (
							<option key={brand} value={brand}>
								{brand}
							</option>
						))}
					</select>

					<select
						value={selectedResistance}
						onChange={(e) => onResistanceChange(e.target.value)}
						className="bg-sub-alt text-main h-8 rounded-lg px-2 text-sm outline-none"
					>
						<option value="all">All resistance</option>
						<option value="constant">Constant</option>
						<option value="ascending">Ascending</option>
						<option value="descending">Descending</option>
					</select>

					<label className="text-sub flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={showFavoritesOnly}
							onChange={(e) => onFavoritesChange(e.target.checked)}
							className="rounded"
						/>
						Favorites only
					</label>

					<div className="flex items-center gap-2">
						<span className="text-sub text-sm">Rating ≥</span>
						<select
							value={minRating}
							onChange={(e) => onRatingChange(Number(e.target.value))}
							className="bg-sub-alt text-main h-8 rounded-lg px-2 text-sm outline-none"
						>
							<option value={0}>Any</option>
							<option value={6}>6+</option>
							<option value={7}>7+</option>
							<option value={8}>8+</option>
							<option value={9}>9+</option>
							<option value={10}>10</option>
						</select>
					</div>

					{hasActiveFilters && (
						<button onClick={onClearFilters} className="hover:text-main text-sub text-xs">
							Clear all
						</button>
					)}
				</div>
			)}
		</div>
	);
}
