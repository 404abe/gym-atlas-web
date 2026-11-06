'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { Menu as MenuIcon, X } from 'lucide-react';
import AnimatedLogo from '@/components/ui/AnimatedLogo';
import { cn } from '@/lib/utils';

const PRODUCT_LINKS = [
	{ label: 'Home', href: '/' },
	{ label: 'Map', href: '/map' },
	{ label: 'Search', href: '/data' },
	{ label: 'Community', href: '/leaderboard' },
	{ label: 'About', href: '/about' }
];

const EXPLORE_LINKS = [
	{ label: 'Equipment', href: '/data' },
	{ label: 'Gyms', href: '/data?view=gyms' },
	{ label: 'Add your gym', href: '/add' },
	{ label: 'Leaderboard', href: '/leaderboard' },
	{ label: 'API', href: '/developers', soon: true }
];

const pillCls =
	'bg-bg border-border text-main flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium shadow-[0_6px_20px_-10px_rgba(0,0,0,0.25)]';
const panelLinkCls =
	'text-main hover:bg-sub-alt block rounded-xl px-3 py-2 text-[15px] no-underline transition-colors';

/**
 * Marketing nav in the Space style: a round logo on the left, a centred
 * "Menu" pill that opens a floating panel, and a solid action pill on the right.
 */
export default function MarketingHeader({ bordered = true }: { bordered?: boolean }) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	// Close on Escape or a click outside the panel (link clicks close it too).
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
		const onDown = (e: MouseEvent) => {
			if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('keydown', onKey);
		document.addEventListener('mousedown', onDown);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('mousedown', onDown);
		};
	}, [open]);

	return (
		<header
			className={cn(
				'bg-bg/90 sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 backdrop-blur md:px-8',
				bordered && 'border-border border-b'
			)}
		>
			<AnimatedLogo />

			<div ref={rootRef} className="relative justify-self-center">
				<button
					type="button"
					aria-expanded={open}
					aria-controls="marketing-menu"
					onClick={() => setOpen((v) => !v)}
					className={cn(pillCls, 'cursor-pointer')}
				>
					{open ? <X size={15} /> : <MenuIcon size={15} />}
					{open ? 'Close' : 'Menu'}
				</button>

				{open && (
					<div
						id="marketing-menu"
						onClick={(e) => {
							if ((e.target as HTMLElement).closest('a')) setOpen(false);
						}}
						className="bg-bg/95 border-border absolute left-1/2 top-[calc(100%+10px)] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-[28px] border p-3 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.35),0_6px_16px_-8px_rgba(0,0,0,0.14)] backdrop-blur-xl"
					>
						<div className="grid grid-cols-2 gap-x-2 gap-y-3 p-2 sm:gap-x-6">
							<nav aria-label="Product">
								<p className="text-sub px-3 pb-1 text-xs tracking-wide">Product</p>
								{PRODUCT_LINKS.map((l) => (
									<Link key={l.label} href={l.href} className={panelLinkCls}>
										{l.label}
									</Link>
								))}
							</nav>
							<nav aria-label="Explore">
								<p className="text-sub px-3 pb-1 text-xs tracking-wide">Explore</p>
								{EXPLORE_LINKS.map((l) => (
									<Link key={l.label} href={l.href} className={panelLinkCls}>
										<span className="flex items-center justify-between gap-2">
											{l.label}
											{l.soon && (
												<span className="border-border text-sub rounded-full border px-2 py-px text-[10px] font-medium">
													Soon
												</span>
											)}
										</span>
									</Link>
								))}
							</nav>
						</div>
						<div className="bg-sub-alt mt-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
							<span className="text-sub text-sm">Open source</span>
							<div className="flex items-center gap-4">
								<Link
									href="https://github.com/404abe"
									target="_blank"
									rel="noopener noreferrer"
									className="text-main flex items-center gap-1.5 text-sm no-underline"
								>
									<FaGithub size={14} />
									GitHub
								</Link>
								<Link
									href="mailto:abraham.ama2003@gmail.com"
									className="text-main flex items-center gap-1.5 text-sm no-underline"
								>
									<MdEmail size={14} />
									Contact
								</Link>
							</div>
						</div>
					</div>
				)}
			</div>

			<Link
				href="/map"
				className="bg-main text-bg flex h-11 items-center justify-self-end rounded-full px-5 text-sm font-medium no-underline shadow-[0_6px_20px_-10px_rgba(0,0,0,0.4)] transition-opacity hover:opacity-90"
			>
				Open map
			</Link>
		</header>
	);
}
