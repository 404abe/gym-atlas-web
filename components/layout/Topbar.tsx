'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Trophy, UserCircle, ShieldCheck } from 'lucide-react';
import { FaDatabase, FaMap } from 'react-icons/fa';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { cn } from '@/lib/utils';
import NotificationDrawer from '../NotificationDrawer';
import GymAtlasLogo from '../ui/GymAtlasLogo';
import ThemeToggle from '../ui/ThemeToggle';



const pillCls =
	'flex items-center bg-[var(--pill-bg)] border-[0.5px] border-[var(--border-color)] rounded-lg backdrop-blur pointer-events-auto';

const iconLinkCls =
	'flex items-center justify-center w-[var(--hit-size)] h-[var(--hit-size)] rounded-[var(--roundness)] text-sub hover:text-text transition-colors duration-[0.22s] no-underline';

export default function Topbar() {
	const { user } = useAuth();
	const { requireAuth } = useAuthGate();
	const pathname = usePathname();

	const isMap = pathname === '/';
	const isData = pathname === '/data';

	return (
		<div className="left-5.5 pointer-events-none fixed right-6 z-[60] hidden items-start justify-between p-3 md:flex">
			{' '}
			{/* Logo */}
			<Link href="/" className="pointer-events-auto mt-[9px] flex items-center gap-2 no-underline">
				<GymAtlasLogo size={28} />

				<span className="text-2xl font-medium uppercase tracking-[0.14em]">
					<span className="text-text">GYM</span>
					<span className="text-sub">ATLAS</span>
				</span>
			</Link>
			{/* Center nav pill + search below */}
			<div className="flex flex-col items-center gap-2">
				<div className={pillCls}>
					<Link
						href="/"
						className={cn(
							'flex h-[var(--hit-size)] items-center justify-center rounded-[var(--roundness)] px-4 text-[10px] uppercase tracking-[0.08em] no-underline transition-colors duration-[0.22s]',
							isMap ? 'text-text' : 'text-sub hover:text-text'
						)}
					>
						<FaMap size={18} />
					</Link>
					<Link
						href="/data"
						className={cn(
							'flex h-[var(--hit-size)] items-center justify-center rounded-[var(--roundness)] px-4 text-[10px] uppercase tracking-[0.08em] no-underline transition-colors duration-[0.22s]',
							isData ? 'text-text' : 'text-sub hover:text-text'
						)}
					>
						<FaDatabase size={18} />
					</Link>
					<div className="bg-sub mx-1 h-4 w-px shrink-0" />
					<Link
						href="/add"
						onClick={(e) => {
							if (!requireAuth('make a contribution')) e.preventDefault();
						}}
						className={iconLinkCls}
					>
						<Plus size={18} />
					</Link>
				</div>
			</div>
			{/* Right icon pills */}
			<div className="flex gap-2">
				<div className={cn(pillCls, 'gap-0.5')}>
					<Link href="/leaderboard" className={iconLinkCls}>
						<Trophy size={18} />
					</Link>
					{(user?.role === 'admin' || user?.role === 'super_admin') && (
						<Link href="/admin" title="Admin" className={iconLinkCls}>
							<ShieldCheck size={18} />
						</Link>
					)}
					<NotificationDrawer />
					<ThemeToggle className={iconLinkCls} />
				</div>

				<div className={pillCls}>
					<Link href="/account" className={iconLinkCls}>
						<UserCircle size={18} />
					</Link>
				</div>
			</div>
		</div>
	);
}
