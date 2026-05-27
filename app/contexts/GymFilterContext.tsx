'use client';

import { createContext, useContext, useState } from 'react';
import { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';
import { API_URL } from '@/lib/config';

interface GymFilterContextValue {
	filteredGyms: Gym[] | null;
	setFilteredGyms: (gyms: Gym[] | null) => void;
	selectedEquipment: Equipment[];
	setSelectedEquipment: (items: Equipment[]) => void;
	searchByEquipment: (equipment: Equipment[]) => Promise<void>;
	removeEquipment: (item: Equipment) => void;
}

const GymFilterContext = createContext<GymFilterContextValue>({
	filteredGyms: null,
	setFilteredGyms: () => {},
	selectedEquipment: [],
	setSelectedEquipment: () => {},
	searchByEquipment: async () => {},
	removeEquipment: () => {},
});

export function GymFilterProvider({ children }: { children: React.ReactNode }) {
	const [filteredGyms, setFilteredGyms] = useState<Gym[] | null>(null);
	const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);

	const searchByEquipment = async (equipment: Equipment[]) => {
		if (equipment.length === 0) {
			setFilteredGyms(null);
			return;
		}
		try {
			const machines = equipment.map((e) =>
				e.slug
					.split('-')
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(' ')
			);
			const res = await fetch(`${API_URL}/gyms/search`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ machines }),
			});
			const data = await res.json();
			setFilteredGyms(Array.isArray(data) ? data : (data.data ?? []));
		} catch (e) {
			console.error(e);
		}
	};

	const removeEquipment = (item: Equipment) => {
		const next = selectedEquipment.filter((e) => e.id !== item.id);
		setSelectedEquipment(next);
		searchByEquipment(next);
	};

	return (
		<GymFilterContext.Provider
			value={{
				filteredGyms,
				setFilteredGyms,
				selectedEquipment,
				setSelectedEquipment,
				searchByEquipment,
				removeEquipment,
			}}
		>
			{children}
		</GymFilterContext.Provider>
	);
}

export const useGymFilter = () => useContext(GymFilterContext);
