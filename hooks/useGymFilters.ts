import { useEffect, useMemo, useState } from 'react';
import { Gym } from '@/types/gym';
import { matchesSearch } from '@/lib/utils';

export function useGymFilters(gyms: Gym[]) {
	const [search, setSearch] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [selectedCity, setSelectedCity] = useState('all');
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [minRating, setMinRating] = useState(0);
	const [sortField, setSortField] = useState('id');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [viewMode, setViewMode] = useState<'expanded' | 'compact'>('expanded');

	useEffect(() => {
		const saved = localStorage.getItem('gym_view_mode');
		if (saved === 'compact' || saved === 'expanded') setViewMode(saved as 'expanded' | 'compact');
	}, []);

	const cities = useMemo(
		() => [...new Set(gyms.map((g) => g.city).filter((c): c is string => Boolean(c)))].sort(),
		[gyms]
	);

	const filtered = useMemo(() => {
		return gyms
			.filter((g) => {
				const searchMatch = matchesSearch(search, g.name);
				const matchesCity = selectedCity === 'all' || g.city === selectedCity;
				const matchesFavorite = !showFavoritesOnly || g.is_favorite === true;
				const matchesRating = (Number(g.avg_rating) || 0) >= minRating;
				return searchMatch && matchesCity && matchesFavorite && matchesRating;
			})
			.sort((a, b) => {
				let comparison = 0;
				if (sortField === 'id') comparison = a.id - b.id;
				if (sortField === 'name') comparison = (a.name || '').localeCompare(b.name || '');
				if (sortField === 'total_equipment')
					comparison = (a.total_equipment || 0) - (b.total_equipment || 0);
				if (sortField === 'unique_machines')
					comparison = (a.unique_machines || 0) - (b.unique_machines || 0);
				if (sortField === 'avg_rating')
					comparison = (Number(a.avg_rating) || 0) - (Number(b.avg_rating) || 0);
				return sortDirection === 'asc' ? comparison : -comparison;
			});
	}, [gyms, search, selectedCity, showFavoritesOnly, minRating, sortField, sortDirection]);

	const handleSort = (field: string) => {
		if (sortField === field) setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		else {
			setSortField(field);
			setSortDirection('asc');
		}
	};

	const clearFilters = () => {
		setSearch('');
		setSelectedCity('all');
		setShowFavoritesOnly(false);
		setMinRating(0);
	};

	const handleViewModeChange = (mode: 'expanded' | 'compact') => {
		setViewMode(mode);
		localStorage.setItem('gym_view_mode', mode);
	};

	const activeFilterFlags = [search !== '', selectedCity !== 'all', showFavoritesOnly, minRating > 0];
	const activeFilterCount = activeFilterFlags.filter(Boolean).length;
	const hasActiveFilters = activeFilterCount > 0;

	return {
		search,
		setSearch,
		showFilters,
		setShowFilters,
		selectedCity,
		setSelectedCity,
		showFavoritesOnly,
		setShowFavoritesOnly,
		minRating,
		setMinRating,
		sortField,
		sortDirection,
		viewMode,
		cities,
		filtered,
		hasActiveFilters,
		activeFilterCount,
		handleSort,
		clearFilters,
		handleViewModeChange
	};
}
