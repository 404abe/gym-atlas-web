'use client';
import { Search, Filter, X, LayoutList, List, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthGate } from '@/app/contexts/AuthGateContext';

type Props = {
	search: string;
	onSearchChange: (val: string) => void;
	showFilters: boolean;
	onToggleFilters: () => void;
	hasActiveFilters: boolean;
	activeFilterCount: number;
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
	brands: string[];
	itemCount: number;
	onClearFilters: () => void;
	viewMode: 'expanded' | 'compact';
	onViewModeChange: (mode: 'expanded' | 'compact') => void;
};

export default function EquipmentToolbar({
	search,
	onSearchChange,
	showFilters,
	onToggleFilters,
	hasActiveFilters,
	activeFilterCount,
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
	brands,
	itemCount,
	onClearFilters,
	viewMode,
	onViewModeChange
}: Props) {
	const router = useRouter();
	const { requireAuth } = useAuthGate();

	return (
		<div id="equipment-toolbar" className="xs:px-6 xs:py-4 shrink-0 px-2 py-3">
			{/* Title row */}
			<div className="mb-3 flex items-start justify-between gap-2">
				<div>
					<h2 className="text-sub xs:text-lg text-base font-medium">Equipment database</h2>
					<p className="text-sub xs:text-sm mt-0.5 text-xs">
						{itemCount} items · Last updated today
					</p>
				</div>

				{/* Add button — top right on mobile */}
				<button
					id="equipment-add-btn"
					onClick={() => requireAuth('add equipment') && router.push('/equipment/new')}
					className="bg-main text-bg flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:opacity-90"
				>
					<Plus className="h-3.5 w-3.5" />
					<span className="xs:inline hidden">Add equipment</span>
					<span className="xs:hidden">Add</span>
				</button>
			</div>

			{/* Search + controls row */}
			<div className="flex items-center gap-2">
				{/* Search — grows to fill */}
				<div className="relative min-w-0 flex-1">
					<Search className="text-sub absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
					<input
						id="equipment-search-input"
						type="text"
						placeholder="Search brand, series, name..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="hover:bg-sub-alt bg-sub-alt focus:ring-sub h-9 w-full rounded-lg pl-9 pr-8 text-sm outline-none focus:ring-1"
					/>
					{search && (
						<button
							onClick={() => onSearchChange('')}
							className="absolute right-2 top-1/2 -translate-y-1/2"
							aria-label="Clear search"
						>
							<X className="text-sub h-3.5 w-3.5" />
						</button>
					)}
				</div>

				{/* View toggle */}
				<div className="bg-sub-alt flex shrink-0 rounded-lg p-1">
					<button
						onClick={() => onViewModeChange('expanded')}
						className={`flex items-center rounded-md px-2 py-1 text-sm transition ${
							viewMode === 'expanded' ? 'bg-main text-sub-alt' : 'text-sub hover:text-main'
						}`}
						title="Expanded view"
						aria-label="Expanded view"
					>
						<LayoutList className="h-3.5 w-3.5" />
					</button>
					<button
						onClick={() => onViewModeChange('compact')}
						className={`flex items-center rounded-md px-2 py-1 text-sm transition ${
							viewMode === 'compact' ? 'bg-main text-sub-alt' : 'text-sub hover:text-main'
						}`}
						title="Compact view"
						aria-label="Compact view"
					>
						<List className="h-3.5 w-3.5" />
					</button>
				</div>

				{/* Filter toggle */}
				<button
					id="equipment-filter-btn"
					onClick={onToggleFilters}
					className={`flex shrink-0 items-center gap-1.5 rounded-lg p-2 text-sm transition ${
						showFilters || hasActiveFilters
							? 'text-sub-alt bg-main'
							: 'bg-sub-alt text-sub hover:text-sub-alt hover:bg-main'
					}`}
					aria-label="Toggle filters"
				>
					<Filter className="h-3.5 w-3.5" />
					{hasActiveFilters && (
						<span className="bg-main text-sub-alt rounded-full px-1.5 py-0.5 text-[10px]">
							{activeFilterCount}
						</span>
					)}
				</button>
			</div>

			{/* Filter panel */}
			{showFilters && (
				<div className="xs:gap-4 border-border mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
					<select
						value={selectedType}
						onChange={(e) => onTypeChange(e.target.value)}
						className="select-toolbar"
					>
						<option value="all">All types</option>
						<option value="pin_loaded">Pin loaded</option>
						<option value="plate_loaded">Plate loaded</option>
					</select>

					<select
						value={selectedBrand}
						onChange={(e) => onBrandChange(e.target.value)}
						className="select-toolbar"
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
						className="select-toolbar"
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
						Favourites only
					</label>

					<div className="flex items-center gap-2">
						<span className="text-sub text-sm">Rating ≥</span>
						<select
							value={minRating}
							onChange={(e) => onMinRatingChange(Number(e.target.value))}
							className="select-toolbar"
						>
							<option value={1}>Any</option>
							<option value={2}>2+</option>
							<option value={3}>3+</option>
							<option value={4}>4+</option>
							<option value={5}>5</option>
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
