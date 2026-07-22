'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaGithub } from 'react-icons/fa';
import GymAtlasLogo from '@/components/ui/GymAtlasLogo';
import { cn } from '@/lib/utils';

const navLinkCls =
	'text-sub hover:text-text text-sm no-underline transition-colors duration-[0.22s]';

export default function MarketingHeader({ bordered = true }: { bordered?: boolean }) {
	const pathname = usePathname();

	return (
		<header
			className={cn(
				'bg-bg/90 sticky top-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur md:px-10',
				bordered && 'border-border border-b'
			)}
		>
			<div className="flex items-center gap-8">
				<Link href="/" className="flex items-center gap-2 no-underline">
					<GymAtlasLogo size={26} />
					<span className="text-main text-base font-semibold uppercase tracking-[0.14em]">
						Gym<span className="text-sub font-normal">Atlas</span>
					</span>
				</Link>
				<nav className="hidden items-center gap-6 sm:flex">
					<Link href="/about" className={cn(navLinkCls, pathname === '/about' ? 'text-text' : '')}>
						About
					</Link>
					<Link
						href="https://github.com/404abe"
						target="_blank"
						rel="noopener noreferrer"
						className={cn(navLinkCls, 'flex items-center gap-1.5')}
					>
						<FaGithub size={14} />
						GitHub
					</Link>
				</nav>
			</div>
			<Link
				href="/map"
				className="bg-main text-bg rounded-full px-5 py-2 text-sm font-medium no-underline transition-opacity hover:opacity-90"
			>
				Try Gym Atlas
			</Link>
		</header>
	);
}
