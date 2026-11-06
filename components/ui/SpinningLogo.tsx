'use client';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Simplified mark (same geometry as AnimatedLogo), drawn inline so the two signs can turn
// independently around the pole. Colour follows the theme via currentColor.
const POLE_X = 100;
const FLIP_MS = 1540; // the "slow-mo" flip from the logo demo
const STAGGER_MS = 200; // the bottom sign trails the top one
const HOLD_MS = 880; // rest between flips
const CYCLE_MS = STAGGER_MS + FLIP_MS + HOLD_MS;

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

function progress(elapsed: number, delay: number) {
	return Math.min(Math.max((elapsed - delay) / FLIP_MS, 0), 1);
}

type Props = {
	/** Mark size in px. */
	size?: number;
	className?: string;
};

/** The GymAtlas mark flipping continuously: each flip swaps the direction the signs point. */
export default function SpinningLogo({ size = 72, className }: Props) {
	const topRef = useRef<SVGGElement>(null);
	const botRef = useRef<SVGGElement>(null);

	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const top = topRef.current;
		const bot = botRef.current;
		if (!top || !bot) return;

		const start = performance.now();
		let raf = requestAnimationFrame(function frame(now) {
			const elapsed = now - start;
			const cycle = Math.floor(elapsed / CYCLE_MS);
			const local = elapsed - cycle * CYCLE_MS;
			// Each cycle adds 180deg, so the signs alternate between their two directions.
			const base = cycle * Math.PI;
			top.setAttribute('transform', signTransform(base + Math.PI * easeOutBack(progress(local, 0))));
			bot.setAttribute(
				'transform',
				signTransform(base + Math.PI * easeOutBack(progress(local, STAGGER_MS)))
			);
			raf = requestAnimationFrame(frame);
		});
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<svg
			viewBox="20 20 160 160"
			width={size}
			height={size}
			aria-hidden="true"
			className={cn('shrink-0 overflow-visible', className)}
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
	);
}
