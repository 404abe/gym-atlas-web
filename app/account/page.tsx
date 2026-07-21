'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import ProfileView from '@/components/ProfileView';
import type { ProfileViewProps } from '@/components/ProfileView';
import { fetchLeaderboardUser, fetchUser, fetchUserBestInClass } from '@/lib/api';

export default function AccountPage() {
	const { user, loading } = useAuth();
	const [profileData, setProfileData] = useState<Omit<ProfileViewProps, 'isOwn'> | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);

	useEffect(() => {
		if (!user) return;
		setFetchError(null);
		Promise.all([fetchLeaderboardUser(user.id), fetchUser(user.id), fetchUserBestInClass(user.id)])
			.then(([contribData, userData, bestData]) => {
				setProfileData({
					profile: userData as any,
					contributions: contribData as any,
					bestInClass: (bestData.best_in_class as any[]) || []
				});
			})
			.catch((err) => setFetchError(err.message || 'Failed to load profile'));
	}, [user]);

	if (loading || (!profileData && !fetchError))
		return (
			<div className="flex items-center justify-center p-10">
				<p className="text-sub text-sm">Loading profile...</p>
			</div>
		);

	if (fetchError)
		return (
			<div className="flex items-center justify-center p-10">
				<p className="text-red-400 text-sm">{fetchError}</p>
			</div>
		);

	return <ProfileView {...profileData!} isOwn />;
}
