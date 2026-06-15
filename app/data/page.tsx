'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DataSidebar from './_components/DataSidebar';
import EquipmentTable from './_components/EquipmentTable';
import EquipmentToolbar from './_components/EquipmentToolbar';
import GymTable from './_components/GymTable';
import GymToolbar from './_components/GymToolbar';
import { SlidersHorizontal } from 'lucide-react';
import { useDataPageData } from '@/hooks/useDataPageData';
import { useEquipmentFilters } from '@/hooks/useEquipmentFilters';
import { useGymFilters } from '@/hooks/useGymFilters';

function DataPageInner() {
	const searchParams = useSearchParams();
	const [activeView, setActiveView] = useState<'equipment' | 'gyms'>('equipment');
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const { equipment, gyms, categories, toggleFavorite, toggleGymFavorite, updateRating, updateGymRating } =
		useDataPageData();
	const eq = useEquipmentFilters(equipment, categories, searchParams.get('bic') ?? 'all');
	const gym = useGymFilters(gyms);

	return (
		<div id="data-page" className="xs:p-4 flex h-full flex-col overflow-hidden p-2">
			<div className="full-width-padding xs:gap-4 flex h-full min-h-0 flex-col gap-2 md:grid md:grid-cols-12 md:gap-9">
				{sidebarOpen && (
					<div
						className="fixed inset-0 z-20 bg-black/40 md:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				<div
					className={`overflow-hidden rounded-xl md:col-span-3 ${
						sidebarOpen
							? 'bg-surface fixed inset-y-0 left-0 z-30 flex w-[80vw] max-w-sm flex-col'
							: 'hidden md:block'
					}`}
				>
					<DataSidebar
						gymCount={gyms.length}
						equipmentCount={equipment.length}
						brandCount={eq.brands.length}
						selectedType={eq.selectedType}
						selectedCategory={eq.selectedCategory}
						activeView={activeView}
						categories={categories}
						onSelectGymFilter={() => {
							setActiveView('gyms');
							setSidebarOpen(false);
						}}
						onSelectEquipmentFilter={(filter) => {
							setActiveView('equipment');
							eq.setSelectedType(filter === 'all' ? 'all' : filter);
							eq.setSelectedCategory('all');
							setSidebarOpen(false);
						}}
						onSelectCategory={(slug) => {
							eq.setSelectedCategory(slug);
							setActiveView('equipment');
							setSidebarOpen(false);
						}}
					/>
				</div>

				<div className="flex min-h-0 flex-1 flex-col overflow-hidden md:col-span-9">
					<div className="mb-2 flex items-center gap-2 md:hidden">
						<button
							id="data-mobile-filter-btn"
							onClick={() => setSidebarOpen(true)}
							className="bg-surface flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
						>
							<SlidersHorizontal className="h-3.5 w-3.5" />
							Filters
							{(activeView === 'equipment' ? eq.hasActiveFilters : gym.hasActiveFilters) && (
								<span className="bg-main text-bg flex h-4 w-4 items-center justify-center rounded-full text-xs">
									!
								</span>
							)}
						</button>
					</div>

					{activeView === 'equipment' ? (
						<>
							<EquipmentToolbar
								search={eq.search}
								onSearchChange={eq.setSearch}
								showFilters={eq.showFilters}
								onToggleFilters={() => eq.setShowFilters(!eq.showFilters)}
								hasActiveFilters={eq.hasActiveFilters}
								activeFilterCount={eq.activeFilterCount}
								selectedType={eq.selectedType}
								onTypeChange={eq.setSelectedType}
								selectedBrand={eq.selectedBrand}
								onBrandChange={eq.setSelectedBrand}
								selectedResistance={eq.selectedResistance}
								onResistanceChange={eq.setSelectedResistance}
								showFavoritesOnly={eq.showFavoritesOnly}
								onFavoritesChange={eq.setShowFavoritesOnly}
								minRating={eq.minRating}
								onMinRatingChange={eq.setMinRating}
								brands={eq.brands}
								itemCount={eq.filtered.length}
								onClearFilters={eq.clearFilters}
								viewMode={eq.viewMode}
								onViewModeChange={eq.handleViewModeChange}
							/>
							<div className="min-h-0 flex-1 overflow-auto">
								<EquipmentTable
									equipment={eq.filtered}
									sortField={eq.sortField}
									sortDirection={eq.sortDirection}
									onSort={eq.handleSort}
									onToggleFavorite={toggleFavorite}
									onUpdateRating={updateRating}
									hasActiveFilters={eq.hasActiveFilters}
									onClearFilters={eq.clearFilters}
									viewMode={eq.viewMode}
								/>
							</div>
						</>
					) : (
						<>
							<GymToolbar
								search={gym.search}
								onSearchChange={gym.setSearch}
								showFilters={gym.showFilters}
								onToggleFilters={() => gym.setShowFilters(!gym.showFilters)}
								hasActiveFilters={gym.hasActiveFilters}
								activeFilterCount={gym.activeFilterCount}
								selectedCity={gym.selectedCity}
								onCityChange={gym.setSelectedCity}
								showFavoritesOnly={gym.showFavoritesOnly}
								onFavoritesChange={gym.setShowFavoritesOnly}
								minRating={gym.minRating}
								onMinRatingChange={gym.setMinRating}
								cities={gym.cities}
								gymCount={gym.filtered.length}
								onClearFilters={gym.clearFilters}
								viewMode={gym.viewMode}
								onViewModeChange={gym.handleViewModeChange}
							/>
							<div className="min-h-0 flex-1 overflow-auto">
								<GymTable
									gyms={gym.filtered}
									viewMode={gym.viewMode}
									sortField={gym.sortField}
									sortDirection={gym.sortDirection}
									onSort={gym.handleSort}
									hasSearch={gym.search !== ''}
									onClearSearch={() => gym.setSearch('')}
									onToggleFavorite={toggleGymFavorite}
									onRateGym={updateGymRating}
								/>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default function DataPage() {
	return (
		<Suspense>
			<DataPageInner />
		</Suspense>
	);
}
