'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { fetchMachineExercises, fetchBrands, type Brand } from '@/lib/api';
import type { Equipment, ExerciseRef } from '@/types/equipment';

/** The full equipment + exercise + brand catalogue, used by anything that searches machines/exercises/brands. */
export function useEquipmentCatalog() {
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [exercises, setExercises] = useState<ExerciseRef[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);

	useEffect(() => {
		fetch(`${API_URL}/equipment`)
			.then((r) => r.json())
			.then((data) => setEquipment(data.data ?? data ?? []))
			.catch(() => {});
		fetchMachineExercises()
			.then(setExercises)
			.catch(() => {});
		fetchBrands()
			.then(setBrands)
			.catch(() => {});
	}, []);

	return { equipment, exercises, brands };
}
