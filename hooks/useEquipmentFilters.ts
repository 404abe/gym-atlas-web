import { useMemo, useState } from 'react';
import { Equipment } from '@/types/equipment';
import type { BestInClassCategory as Category } from '@/types/bestInClass';
import { matchesSearch } from '@/lib/utils';
import { getEquipmentCategorySuggestions } from '@/lib/equipment-categories';

export type EquipmentSortField = 'id' | 'brand' | 'name' | 'resistance_profile' | 'rating';

export function useEquipmentFilters(
	equipment: Equipment[],
	categories: Category[],
	initialCategory = 'all'
) {
	const [search, setSearch] = useState('');
	const [selectedType, setSelectedType] = useState('all');
	const [selectedBrand, setSelectedBrand] = useState('all');
	const [selectedResistance, setSelectedResistance] = useState('all');
	const [selectedCategory, setSelectedCategory] = useState(initialCategory);
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [minRating, setMinRating] = useState(0);
	const [showFilters, setShowFilters] = useState(false);
	const [sortField, setSortField] = useState<EquipmentSortField>('id');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [viewMode, setViewMode] = useState<'expanded' | 'compact'>(() => {
		if (typeof window === 'undefined') return 'expanded';
		const saved = window.localStorage.getItem('equipment_view_mode');
		return saved === 'compact' || saved === 'expanded' ? saved : 'expanded';
	});

	const brands = useMemo(
		() => [...new Set(equipment.map((e) => e.brand).filter(Boolean))].sort(),
		[equipment]
	);

	const filtered = useMemo(() => {
		return equipment
			.filter((e) => {
				const searchMatch = matchesSearch(search, e.brand, e.series, e.name);
				const matchesType = selectedType === 'all' || e.type === selectedType;
				const matchesBrand = selectedBrand === 'all' || e.brand === selectedBrand;
				const matchesResistance =
					selectedResistance === 'all' || e.resistance_profile === selectedResistance;
				const matchesFavorite = !showFavoritesOnly || e.is_favorite === true;
				const matchesRating = (e.rating || 0) >= minRating;
				const matchesCategory = (() => {
					if (selectedCategory === 'all') return true;
					const cat = categories.find((c) => c.slug === selectedCategory);
					if (!cat) return true;
					if (cat.type === 'exercise') {
						return cat.id === e.exercise?.category_id || cat.id === e.secondary_exercise?.category_id;
					}
					// muscle_group matching still relies on the name-based heuristic — there's
					// no DB link from exercises to muscle groups yet.
					const catName = cat.name.toLowerCase();
					const eqName = e.name?.toLowerCase() ?? '';
					if (eqName.includes(catName) || catName.includes(eqName)) return true;
					const suggested = getEquipmentCategorySuggestions(e.name ?? '');
					if (suggested) return suggested.muscles.includes(cat.name);
					return false;
				})();
				return (
					searchMatch &&
					matchesType &&
					matchesBrand &&
					matchesResistance &&
					matchesFavorite &&
					matchesRating &&
					matchesCategory
				);
			})
			.sort((a, b) => {
				let comparison = 0;
				if (sortField === 'id') comparison = a.id - b.id;
				if (sortField === 'brand') comparison = (a.brand || '').localeCompare(b.brand || '');
				if (sortField === 'name') comparison = (a.name || '').localeCompare(b.name || '');
				if (sortField === 'resistance_profile') {
					const order: Record<string, number> = { constant: 0, ascending: 1, descending: 2, adjustable: 3, custom: 4 };
					comparison =
						(order[a.resistance_profile || 'constant'] || 0) -
						(order[b.resistance_profile || 'constant'] || 0);
				}
				if (sortField === 'rating') comparison = (a.rating || 0) - (b.rating || 0);
				return sortDirection === 'asc' ? comparison : -comparison;
			});
	}, [
		equipment,
		search,
		selectedType,
		selectedBrand,
		selectedResistance,
		selectedCategory,
		showFavoritesOnly,
		minRating,
		sortField,
		sortDirection,
		categories
	]);

	const handleSort = (field: EquipmentSortField) => {
		if (sortField === field) setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		else {
			setSortField(field);
			setSortDirection('asc');
		}
	};

	const clearFilters = () => {
		setSearch('');
		setSelectedType('all');
		setSelectedBrand('all');
		setSelectedResistance('all');
		setSelectedCategory('all');
		setShowFavoritesOnly(false);
		setMinRating(0);
	};

	const handleViewModeChange = (mode: 'expanded' | 'compact') => {
		setViewMode(mode);
		localStorage.setItem('equipment_view_mode', mode);
	};

	const activeFilterFlags = [
		search !== '',
		selectedType !== 'all',
		selectedBrand !== 'all',
		selectedResistance !== 'all',
		selectedCategory !== 'all',
		showFavoritesOnly,
		minRating > 0
	];
	const activeFilterCount = activeFilterFlags.filter(Boolean).length;
	const hasActiveFilters = activeFilterCount > 0;

	return {
		search,
		setSearch,
		selectedType,
		setSelectedType,
		selectedBrand,
		setSelectedBrand,
		selectedResistance,
		setSelectedResistance,
		selectedCategory,
		setSelectedCategory,
		showFavoritesOnly,
		setShowFavoritesOnly,
		minRating,
		setMinRating,
		showFilters,
		setShowFilters,
		sortField,
		sortDirection,
		viewMode,
		brands,
		filtered,
		hasActiveFilters,
		activeFilterCount,
		handleSort,
		clearFilters,
		handleViewModeChange
	};
}
