import { useEffect, useRef, useState } from 'react';
import { Equipment } from '@/types/equipment';
import { Gym } from '@/types/gym';
import type { BestInClassCategory as Category } from '@/types/bestInClass';
import {
	favouriteEquipment,
	unfavouriteEquipment,
	favouriteGym,
	unfavouriteGym,
	fetchAllEquipment,
	fetchGyms,
	fetchGymStats,
	fetchBestInClassCategories,
	rateEquipment,
	rateGym
} from '@/lib/api';

export function useDataPageData() {
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const pendingEqFavs = useRef(new Set<number>());
	const pendingGymFavs = useRef(new Set<number>());

	useEffect(() => {
		const load = async () => {
			try {
				const [eqData, gymsData, baseGyms, catsData] = await Promise.all([
					fetchAllEquipment(),
					fetchGymStats(),
					fetchGyms(),
					fetchBestInClassCategories()
				]);
				const imageMap = new Map(baseGyms.map((g: Gym) => [g.id, g.image_url]));
				setEquipment(
					eqData.map((item: Equipment) => ({
						...item,
						avg_rating: Number(item.avg_rating) || 0,
						user_rating: item.user_rating ? Number(item.user_rating) : undefined,
						rating: Number(item.user_rating) || Number(item.avg_rating) || 0
					}))
				);
				setGyms(gymsData.map((g: Gym) => ({ ...g, image_url: imageMap.get(g.id) ?? g.image_url })));
				setCategories(catsData.categories ?? []);
			} catch (err) {
				console.error('Failed to load data:', err);
			}
		};
		load();
	}, []);

	const toggleFavorite = async (id: number) => {
		if (pendingEqFavs.current.has(id)) return;
		pendingEqFavs.current.add(id);

		const current = equipment.find((e) => e.id === id);
		const wasFavorite = current?.is_favorite ?? false;

		setEquipment((prev) =>
			prev.map((item) => (item.id === id ? { ...item, is_favorite: !wasFavorite } : item))
		);

		try {
			if (wasFavorite) await unfavouriteEquipment(id);
			else await favouriteEquipment(id);
		} catch (err) {
			setEquipment((prev) =>
				prev.map((item) => (item.id === id ? { ...item, is_favorite: wasFavorite } : item))
			);
			console.error('Failed to toggle equipment favourite:', err);
		} finally {
			pendingEqFavs.current.delete(id);
		}
	};

	const toggleGymFavorite = async (id: number) => {
		if (pendingGymFavs.current.has(id)) return;
		pendingGymFavs.current.add(id);

		const current = gyms.find((g) => g.id === id);
		const wasFavorite = current?.is_favorite ?? false;

		setGyms((prev) =>
			prev.map((g) => (g.id === id ? { ...g, is_favorite: !wasFavorite } : g))
		);

		try {
			if (wasFavorite) await unfavouriteGym(id);
			else await favouriteGym(id);
		} catch (err) {
			setGyms((prev) =>
				prev.map((g) => (g.id === id ? { ...g, is_favorite: wasFavorite } : g))
			);
			console.error('Failed to toggle gym favourite:', err);
		} finally {
			pendingGymFavs.current.delete(id);
		}
	};

	const updateRating = async (id: number, rating: number) => {
		setEquipment((prev) =>
			prev.map((item) => (item.id === id ? { ...item, user_rating: rating, rating } : item))
		);
		try {
			await rateEquipment(id, rating);
		} catch (err) {
			console.error('Failed to save rating:', err);
		}
	};

	const updateGymRating = async (id: number, rating: number) => {
		setGyms((prev) => prev.map((g) => (g.id === id ? { ...g, user_rating: rating } : g)));
		try {
			await rateGym(id, rating);
		} catch (err) {
			console.error('Failed to rate gym:', err);
		}
	};

	return { equipment, gyms, categories, toggleFavorite, toggleGymFavorite, updateRating, updateGymRating };
}
