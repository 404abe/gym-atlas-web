'use client';

import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';
import { FaCodeBranch } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { cn } from '@/lib/utils';
const pillCls =
	'flex items-center bg-surface rounded-lg backdrop-blur pointer-events-auto';
const footerLinkCls =
	'flex items-center gap-2 h-[var(--hit-size)] px-4 text-sub hover:text-text text-[11px] tracking-[0.04em] uppercase no-underline transition-colors duration-[0.22s]';

export default function Footer() {
	return (
		<footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-50 hidden items-center justify-between px-6 md:flex">
			{' '}
			{/* Left — links */}
			<div className={pillCls}>
				<Link
					href="https://github.com/404abe"
					target="_blank"
					rel="noopener noreferrer"
					className={footerLinkCls}
				>
					<FaGithub size={13} />
					github
				</Link>
				<Link href="mailto:abraham.ama2003@gmail.com" className={footerLinkCls}>
					<MdEmail size={13} />
					contact
				</Link>
			</div>
			{/* Right — version badge */}
			<div className={cn(pillCls, 'h-[var(--hit-size)] gap-1.5 px-4')}>
				<FaCodeBranch size={12} className="text-sub" />
				<span className="text-sub text-[11px] tracking-[0.04em]">v0.1.0</span>
			</div>
		</footer>
	);
}
