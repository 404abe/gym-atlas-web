import type { Metadata } from 'next';
import { fetchEquipmentById } from '@/lib/api';
import EquipmentProfileClient from './EquipmentProfileClient';

export async function generateMetadata({
	params
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	try {
		const item = await fetchEquipmentById(id);
		const name = item.name || item.slug;
		return {
			title: `${name} | GymAtlas`,
			description: `${item.brand ? `${item.brand} ` : ''}${name} — specs, ratings, and which gyms have it, on GymAtlas.`
		};
	} catch {
		return { title: 'Equipment | GymAtlas' };
	}
}

export default function EquipmentProfilePage() {
	return <EquipmentProfileClient />;
}
