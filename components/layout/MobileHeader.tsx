'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgePlus, Trophy, UserCircle, ShieldCheck, Map, Database } from 'lucide-react';
import GymAtlasLogo from '../ui/GymAtlasLogo';
import NotificationDrawer from '@/components/NotificationDrawer';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { cn } from '@/lib/utils';

const iconCls =
	'flex items-center justify-center w-10 h-10 rounded-lg text-sub hover:text-text transition-colors duration-[0.22s]';

export default function MobileHeader() {
	const { user } = useAuth();
	const { requireAuth } = useAuthGate();
	const pathname = usePathname();
	const active = (href: string) => pathname === href;

	if (pathname === '/landing' || pathname === '/about') return null;

	return (
		<header className="bg-bg border-border flex shrink-0 items-center px-2 py-1 md:hidden">
			<Link href="/" className="flex items-center no-underline">
				<GymAtlasLogo size={40} />
			</Link>

			<div className="flex items-center">
				<Link href="/" className={cn(iconCls, active('/') ? 'text-text' : '')}>
					<Map size={18} />
				</Link>
				<Link href="/data" className={cn(iconCls, active('/data') ? 'text-text' : '')}>
					<Database size={18} />
				</Link>
				<Link
					href="/add"
					onClick={(e) => {
						if (!requireAuth('make a contribution')) e.preventDefault();
					}}
					className={cn(iconCls, active('/add') ? 'text-text' : '')}
				>
					<BadgePlus size={20} />
				</Link>
				<Link
					href="/leaderboard"
					className={cn(iconCls, active('/leaderboard') ? 'text-text' : '')}
				>
					<Trophy size={18} />
				</Link>
			</div>

			<div className="flex-1" />

			<div className="bg-border mx-1 h-4 w-px shrink-0" />

			<div className="flex items-center">
				<ThemeToggle className={iconCls} />
				{(user?.role === 'admin' || user?.role === 'super_admin') && (
					<Link href="/admin" title="Admin" className={iconCls}>
						<ShieldCheck size={18} />
					</Link>
				)}
				<NotificationDrawer buttonClassName={iconCls} />
				<Link href="/account" className={cn(iconCls, active('/account') ? 'text-text' : '')}>
					<UserCircle size={18} />
				</Link>
			</div>
		</header>
	);
}
