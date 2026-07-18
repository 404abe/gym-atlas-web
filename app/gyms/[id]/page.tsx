import type { Metadata } from 'next';
import { fetchGymById } from '@/lib/api';
import GymProfileClient from './GymProfileClient';

export async function generateMetadata({
	params
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	try {
		const gym = await fetchGymById(Number(id));
		const location = [gym.city, gym.country].filter(Boolean).join(', ');
		return {
			title: `${gym.name} | GymAtlas`,
			description: location
				? `Equipment and details for ${gym.name} in ${location} on GymAtlas.`
				: `Equipment and details for ${gym.name} on GymAtlas.`
		};
	} catch {
		return { title: 'Gym | GymAtlas' };
	}
}

export default function GymProfilePage() {
	return <GymProfileClient />;
}
