'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import ProfileView from '@/components/ProfileView';
import type { ProfileViewProps } from '@/components/ProfileView';
import { fetchLeaderboardUser, fetchUser, fetchUserBestInClass } from '@/lib/api';

export default function AccountPage() {
	const { user, loading, token } = useAuth();
	const [profileData, setProfileData] = useState<Omit<ProfileViewProps, 'isOwn'> | null>(null);

	console.log('[AccountPage] render — loading:', loading, 'user:', user?.id ?? null, 'token:', token ? token.slice(0, 20) + '...' : null);

	useEffect(() => {
		console.log('[AccountPage] useEffect([user]) fired — user:', user?.id ?? null);
		if (!user) return;
		Promise.all([fetchLeaderboardUser(user.id), fetchUser(user.id), fetchUserBestInClass(user.id)])
			.then(([contribData, userData, bestData]) => {
				console.log('[AccountPage] fetch succeeded');
				setProfileData({
					profile: userData as any,
					contributions: contribData as any,
					bestInClass: (bestData.best_in_class as any[]) || []
				});
			})
			.catch((err) => console.error('[AccountPage] fetch failed:', err));
	}, [user]);

	if (loading || !profileData)
		return (
			<div className="bg-sub-alt flex items-center justify-center rounded-2xl p-10">
				<p className="text-sub text-sm">Loading profile...</p>
			</div>
		);

	return <ProfileView {...profileData} isOwn />;
}
