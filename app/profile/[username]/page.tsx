import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export async function generateMetadata({
	params
}: {
	params: Promise<{ username: string }>;
}): Promise<Metadata> {
	const { username } = await params;
	return {
		title: `${username} | GymAtlas`,
		description: `${username}'s contributions, ratings, and best-in-class picks on GymAtlas.`
	};
}

export default function ProfilePage() {
	return <ProfileClient />;
}
