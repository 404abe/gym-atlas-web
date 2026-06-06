'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Heart, Star, User, Trophy } from 'lucide-react';
import Link from 'next/link';
import { fetchUserStats } from '@/lib/api';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [counts, setCounts] = useState({
		favGyms: 0,
		favEquipment: 0,
		ratedGyms: 0,
		ratedEquipment: 0
	});

	useEffect(() => {
		if (!loading && !user) router.push('/login');
	}, [user, loading, router]);

	useEffect(() => {
		if (loading || !user) return;
		fetchUserStats(user.id)
			.then((stats) => {
				setCounts({
					favGyms: stats.favouriteGymsCount ?? 0,
					favEquipment: stats.favouriteEquipmentCount ?? 0,
					ratedGyms: stats.gyms_rated ?? 0,
					ratedEquipment: stats.equipment_rated ?? 0
				});
			})
			.catch(() => {});
	}, [user, loading]);

	if (loading || !user) return null;

	const isActive = (href: string) => pathname === href;

	const navItems = [
		{ label: 'Profile', href: '/account', icon: User, iconClass: 'text-blue-400' },
		{
			label: 'Favourites',
			href: '/account/favourites',
			icon: Heart,
			iconClass: 'text-red-400',
			count: counts.favGyms + counts.favEquipment
		},
		{
			label: 'Ratings',
			href: '/account/ratings',
			icon: Star,
			iconClass: 'text-amber-400',
			count: counts.ratedGyms + counts.ratedEquipment
		},
		{
			label: 'Best in Class',
			href: '/account/best-in-class',
			icon: Trophy,
			iconClass: 'text-amber-400'
		}
	];

	return (
		<div id="pageAccount" className="content-grid">
			<div className="grid grid-cols-12 gap-6">
				{/* Sidebar */}
				<div className="col-span-12 md:col-span-3">
					<div className="bg-sub-alt rounded-2xl p-2">
						{navItems.map(({ label, href, icon: Icon, iconClass, count }) => (
							<Link
								key={href}
								href={href}
								className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
									isActive(href) ? 'bg-main text-bg' : 'text-sub hover:bg-main/5 hover:text-main'
								}`}
							>
								<div className="flex items-center gap-2.5">
									<Icon className={`h-3.5 w-3.5 ${isActive(href) ? 'text-bg' : iconClass}`} />
									<span className="font-medium">{label}</span>
								</div>
								{(count ?? 0) > 0 && (
									<span className={`text-xs ${isActive(href) ? 'opacity-70' : 'opacity-50'}`}>
										{count}
									</span>
								)}
							</Link>
						))}
					</div>
				</div>

				{/* Content slot */}
				<div className="col-span-12 min-w-0 md:col-span-9">{children}</div>
			</div>
		</div>
	);
}
