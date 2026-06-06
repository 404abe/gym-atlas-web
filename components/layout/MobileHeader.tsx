'use client';
import Link from 'next/link';
import { UserCircle, ShieldCheck } from 'lucide-react';
import GymAtlasLogo from '../ui/GymAtlasLogo';
import NotificationDrawer from '@/components/NotificationDrawer';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/app/contexts/AuthContext';

const iconCls =
	'flex items-center justify-center w-10 h-10 rounded-lg text-sub hover:text-text transition-colors duration-[0.22s]';

export default function MobileHeader() {
	const { user } = useAuth();

	return (
		<header className="bg-bg border-border flex shrink-0 items-center justify-between  px-4 py-2 md:hidden">
			<Link href="/" className="flex items-center gap-2 no-underline">
				<GymAtlasLogo size={24} />
				<span className="text-xl font-medium uppercase tracking-[0.14em]">
					<span className="text-text">GYM</span>
					<span className="text-sub">ATLAS</span>
				</span>
			</Link>
			<div className="flex items-center gap-0.5">
				<ThemeToggle className={iconCls} />
				{(user?.role === 'admin' || user?.role === 'super_admin') && (
					<Link href="/admin" title="Admin" className={iconCls}>
						<ShieldCheck size={20} />
					</Link>
				)}
				<NotificationDrawer buttonClassName={iconCls} />
				<Link href="/account" className={iconCls}>
					<UserCircle size={20} />
				</Link>
			</div>
		</header>
	);
}
