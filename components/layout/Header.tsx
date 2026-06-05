// 'use client';
// import Link from 'next/link';
// import { FaDatabase, FaPlus, FaSearch, FaTrophy } from 'react-icons/fa';
// import GymAtlasLogo from '@/components/GymAtlasLogo';
// import { ShieldCheck } from 'lucide-react';
// import { useAuth } from '@/app/contexts/AuthContext';
// import NotificationDrawer from '../NotificationDrawer';

// export default function Header() {
// 	const { user } = useAuth();

// 	return (
// 		<header id="header" className="content-grid shrink-0 py-4 sm:px-8">
// 			<div className="flex items-center gap-4 sm:gap-8">
// 				{/* Logo */}
// 				<Link href="/" className="text-main flex items-center gap-2 transition-colors">
// 					<GymAtlasLogo size={22} />
// 					<span className="text-lg font-bold tracking-tight sm:text-2xl">GymAtlas</span>
// 				</Link>

// 				{/* Nav icons */}
// 				<nav id="header-nav" className="text-sub flex items-center gap-4 sm:gap-5">
// 					<Link href="/" title="Search" className="hover:text-main transition-colors">
// 						<FaSearch size={15} />
// 					</Link>
// 					<Link href="/add" title="Add" className="hover:text-main transition-colors">
// 						<FaPlus size={15} />
// 					</Link>
// 					<Link href="/data" title="Data" className="hover:text-main transition-colors">
// 						<FaDatabase size={15} />
// 					</Link>
// 					<Link
// 						href="/leaderboard"
// 						title="Leaderboard"
// 						className="hover:text-main transition-colors"
// 					>
// 						<FaTrophy size={15} />
// 					</Link>
// 					{(user?.role === 'admin' || user?.role === 'super_admin') && (
// 						<Link href="/admin" title="Admin" className="hover:text-main transition-colors">
// 							<ShieldCheck size={15} />
// 						</Link>
// 					)}
// 				</nav>

// 				{/* Spacer */}
// 				<div className="flex-1" />

// 				{user && (
// 					<NotificationDrawer buttonClassName="text-sub hover:text-main relative rounded-lg p-2 transition" />
// 				)}

// 				{/* Account */}
// 				<Link
// 					id="header-account-link"
// 					href="/account"
// 					className="text-sub hover:text-main shrink-0 text-sm transition-colors"
// 				>
// 					Account
// 				</Link>
// 			</div>
// 		</header>
// 	);
// }


//legacy header