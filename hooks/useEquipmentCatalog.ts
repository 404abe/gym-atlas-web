'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { fetchMachineExercises } from '@/lib/api';
import type { Equipment, ExerciseRef } from '@/types/equipment';

/** The full equipment + exercise catalogue, used by anything that searches machines/exercises. */
export function useEquipmentCatalog() {
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [exercises, setExercises] = useState<ExerciseRef[]>([]);

	useEffect(() => {
		fetch(`${API_URL}/equipment`)
			.then((r) => r.json())
			.then((data) => setEquipment(data.data ?? data ?? []))
			.catch(() => {});
		fetchMachineExercises()
			.then(setExercises)
			.catch(() => {});
	}, []);

	return { equipment, exercises };
}
