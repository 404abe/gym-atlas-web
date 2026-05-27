'use client';
import { useEffect, useState } from 'react';
import AssignEquipmentCard from './_components/AssignEquipmentCard';
import { fetchGymStats, fetchAllEquipment } from '@/lib/api';
import type { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';

export default function AddPage() {
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [equipment, setEquipment] = useState<Equipment[]>([]);

	useEffect(() => {
		Promise.all([fetchGymStats(), fetchAllEquipment()])
			.then(([g, e]) => {
				setGyms(g);
				setEquipment(e);
			})
			.catch(() => {});
	}, []);

	return <AssignEquipmentCard gyms={gyms} equipment={equipment} />;
}
