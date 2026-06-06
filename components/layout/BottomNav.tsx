'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaMap, FaDatabase, FaTrophy } from 'react-icons/fa';
import { Plus, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
	const pathname = usePathname();
	const active = (href: string) => pathname === href;

	return (
		<nav className="flex shrink-0 items-end  border-border bg-bg md:hidden">
			{/* Map */}
			<Link
				href="/"
				className={cn(
					'flex flex-1 flex-col items-center justify-center gap-1 py-3',
					active('/') ? 'text-text' : 'text-sub'
				)}
			>
				<FaMap size={20} />
				<span className="text-[10px]">Map</span>
			</Link>

			{/* Data */}
			<Link
				href="/data"
				className={cn(
					'flex flex-1 flex-col items-center justify-center gap-1 py-3',
					active('/data') ? 'text-text' : 'text-sub'
				)}
			>
				<FaDatabase size={20} />
				<span className="text-[10px]">Data</span>
			</Link>

			{/* Add — raised FAB */}
			<Link href="/add" className="flex flex-1 flex-col items-center pb-2 pt-1">
				<div
					className={cn(
						'-translate-y-3 flex h-12 w-12 items-center justify-center rounded-full border',
						active('/add')
							? 'border-main bg-main/20 text-main'
							: 'border-border bg-surface text-sub'
					)}
				>
					<Plus size={22} />
				</div>
				<span className="-mt-1 text-[10px] text-sub">Add</span>
			</Link>

			{/* Leaderboard */}
			<Link
				href="/leaderboard"
				className={cn(
					'flex flex-1 flex-col items-center justify-center gap-1 py-3',
					active('/leaderboard') ? 'text-text' : 'text-sub'
				)}
			>
				<FaTrophy size={20} />
				<span className="text-[10px]">Board</span>
			</Link>

			{/* Profile */}
			<Link
				href="/account"
				className={cn(
					'flex flex-1 flex-col items-center justify-center gap-1 py-3',
					active('/account') ? 'text-text' : 'text-sub'
				)}
			>
				<UserCircle size={20} />
				<span className="text-[10px]">Profile</span>
			</Link>

		</nav>
	);
}
