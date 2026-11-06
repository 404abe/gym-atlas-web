'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Simplified mark (same geometry as /public/gymatlas-mark-white-simple.svg), drawn inline so the
// two signs can turn independently around the pole. Colour follows the theme via currentColor.
const POLE_X = 100;
const SIGN_DURATION = 1540; // ms, the "slow-mo" feel
const SIGN_STAGGER = 200; // ms between top and bottom sign

// Overshoot so the signs settle like heavy objects.
function easeOutBack(t: number) {
	const c1 = 1.9;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// rotateY around the pole, projected: scaleX(cos a) about the pole's x.
function signTransform(angle: number) {
	return `translate(${POLE_X} 0) scale(${Math.cos(angle)} 1) translate(${-POLE_X} 0)`;
}

type Props = {
	href?: string;
	/** Mark size in px. Default matches the existing 44px circle button. */
	size?: number;
	className?: string;
};

export default function AnimatedLogo({ href = '/', size = 24, className }: Props) {
	const [open, setOpen] = useState(false);
	const topRef = useRef<SVGGElement>(null);
	const botRef = useRef<SVGGElement>(null);
	const rafRef = useRef<number | null>(null);
	// Each flip adds 180deg, so the signs alternate between their two directions.
	const baseRef = useRef(0);
	const reducedRef = useRef(false);

	useEffect(() => {
		reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	const flip = useCallback(() => {
		if (reducedRef.current) return;
		const top = topRef.current;
		const bot = botRef.current;
		if (!top || !bot) return;

		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		const base = baseRef.current;
		const start = performance.now();

		const frame = (now: number) => {
			let done = true;
			([
				[top, 0],
				[bot, SIGN_STAGGER],
			] as const).forEach(([el, delay]) => {
				const t = Math.min(Math.max((now - start - delay) / SIGN_DURATION, 0), 1);
				if (t < 1) done = false;
				el.setAttribute('transform', signTransform(base + Math.PI * easeOutBack(t)));
			});
			if (done) {
				baseRef.current = (base + Math.PI) % (Math.PI * 2);
				rafRef.current = null;
			} else {
				rafRef.current = requestAnimationFrame(frame);
			}
		};
		rafRef.current = requestAnimationFrame(frame);
	}, []);

	const set = (next: boolean) => {
		if (next === open) return;
		setOpen(next);
		flip();
	};

	return (
		<Link
			href={href}
			aria-label="GymAtlas home"
			onPointerEnter={() => set(true)}
			onPointerLeave={() => set(false)}
			onFocus={() => set(true)}
			onBlur={() => set(false)}
			className={cn(
				'bg-bg border-border text-text flex h-11 items-center justify-self-start rounded-full border shadow-[0_6px_20px_-10px_rgba(0,0,0,0.25)]',
				'transition-[padding] duration-500 ease-out motion-reduce:transition-none',
				// Constant left padding keeps the closed state a 44px circle (10 + 24 + 10) and lets only the
				// right padding and the wordmark animate, so the pill never shrinks before it grows.
				'pl-[10px]',
				open ? 'pr-4' : 'pr-[10px]',
				className
			)}
		>
			<svg
				viewBox="20 12 160 176"
				width={size}
				height={size}
				aria-hidden="true"
				className="shrink-0 overflow-visible"
				fill="currentColor"
				stroke="currentColor"
			>
				<rect x="93" y="20" width="14" height="160" rx="7" stroke="none" />
				<g ref={topRef}>
					<polygon points="54,46 140,46 164,70 140,94 54,94" strokeWidth="6" strokeLinejoin="round" />
				</g>
				<g ref={botRef}>
					<polygon points="146,108 60,108 36,131 60,154 146,154" strokeWidth="6" strokeLinejoin="round" />
				</g>
			</svg>
			<span
				style={{ fontFamily: "Satoshi, var(--font-sans), 'DM Sans', sans-serif" }}
				className={cn(
					'overflow-hidden whitespace-nowrap text-sm font-bold tracking-tight transition-[max-width,opacity,margin] duration-500 ease-out motion-reduce:transition-none',
					open ? 'ml-2 max-w-[140px] opacity-100' : 'ml-0 max-w-0 opacity-0'
				)}
			>
				GymAtlas
			</span>
		</Link>
	);
}
