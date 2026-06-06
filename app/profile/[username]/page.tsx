'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProfileView from '@/components/ProfileView';
import type { ProfileViewProps } from '@/components/ProfileView';
import { fetchLeaderboardUser, fetchUserByUsername, fetchUserBestInClass } from '@/lib/api';

export default function ProfilePage() {
	const { username } = useParams();
	const [data, setData] = useState<Omit<ProfileViewProps, 'isOwn'> | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const userData = await fetchUserByUsername(username as string);
				const userId = (userData as { id: string }).id;

				const [contribData, bestData] = await Promise.all([
					fetchLeaderboardUser(userId),
					fetchUserBestInClass(userId)
				]);
				setData({
					profile: userData as any,
					contributions: contribData as any,
					bestInClass: (bestData.best_in_class as any[]) || []
				});
			} catch (err) {
				console.error('Failed to load profile:', err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [username]);

	if (loading) return <div className="text-sub p-8 text-sm">Loading profile...</div>;
	if (!data) return <div className="text-sub p-8 text-sm">Profile not found</div>;

	return (
		<div id="pageUserProfile" className="content-grid py-8">
			<Link
				href="/leaderboard"
				className="text-sub hover:text-main mb-6 inline-flex items-center gap-2 text-sm transition"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Back to leaderboard
			</Link>

			<ProfileView {...data} />
		</div>
	);
}