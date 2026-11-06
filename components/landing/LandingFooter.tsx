'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CARD_SIZE, useCarouselCards, type CarouselCard } from '@/components/landing/HeroCarousel';

// A fan of equipment and gym cards above the footer links, sliding slowly
// to the right and wrapping round. Like the hero, positions are written to
// the DOM each frame and the fan is static under prefers-reduced-motion.

const FAN_COUNT = 13;
const FAN_CARD_W = 220;
const FAN_STEP_PX = 150;
const FAN_SPEED = 0.12; // cards per second

function fanCards(cards: CarouselCard[]): CarouselCard[] {
	return Array.from({ length: FAN_COUNT }, (_, i) => {
		const card = cards[i % cards.length];
		return { ...card, key: `${card.key}-fan${Math.floor(i / cards.length)}` };
	});
}

function CardFan({ mono }: { mono: string }) {
	const base = useCarouselCards();
	const cards = fanCards(base);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const mid = Math.floor(FAN_COUNT / 2);
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let elapsed = 0;
		let last = performance.now();
		let raf = 0;

		const place = () => {
			itemRefs.current.forEach((el, i) => {
				if (!el) return;
				const d =
					((((i - mid + FAN_SPEED * elapsed + FAN_COUNT / 2) % FAN_COUNT) + FAN_COUNT) % FAN_COUNT) -
					FAN_COUNT / 2;
				const size = CARD_SIZE[cards[i].kind];
				const h = (size.h * FAN_CARD_W) / size.w;
				el.style.transform = `translate(calc(-50% + ${(d * FAN_STEP_PX).toFixed(1)}px), ${(36 + d * d * 6).toFixed(1)}px) rotate(${(d * 4.2).toFixed(1)}deg)`;
				el.style.height = `${h}px`;
				el.style.zIndex = String(Math.round(30 - Math.abs(d)));
			});
		};

		const tick = (now: number) => {
			elapsed += Math.min(0.1, (now - last) / 1000);
			last = now;
			place();
			raf = requestAnimationFrame(tick);
		};

		place();
		if (!reduceMotion) raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cards.length, base]);

	return (
		<div aria-hidden="true" className="relative mx-auto h-[360px] max-w-[1440px]">
			{cards.map((card, i) => {
				const size = CARD_SIZE[card.kind];
				return (
					<div
						key={card.key}
						ref={(el) => {
							itemRefs.current[i] = el;
						}}
						className="absolute top-0 will-change-transform"
						style={{ left: '50%', width: FAN_CARD_W }}
					>
						<div
							className="origin-top-left"
							style={{
								width: size.w,
								height: size.h,
								transform: `scale(${FAN_CARD_W / size.w})`
							}}
						>
							<Card card={card} mono={mono} />
						</div>
					</div>
				);
			})}
		</div>
	);
}

const linkCls = 'text-sub hover:text-main no-underline transition-colors';

export default function LandingFooter({ mono }: { mono: string }) {
	return (
		<footer className="relative mt-24 overflow-hidden">
			<div className="hero-mask-x">
				<CardFan mono={mono} />
			</div>

			<div className="mx-auto flex w-full max-w-328.5 flex-col gap-4 px-6 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
				<span className="text-sub">© {new Date().getFullYear()} GymAtlas</span>
				<nav className="flex items-center gap-6">
					<Link href="/about" className={linkCls}>
						About
					</Link>
					<Link href="https://github.com/404abe" target="_blank" rel="noopener noreferrer" className={linkCls}>
						GitHub
					</Link>
					<Link href="mailto:abraham.ama2003@gmail.com" className={linkCls}>
						Contact
					</Link>
				</nav>
				<span className="text-sub">Built by lifters</span>
			</div>

			<div
				aria-hidden="true"
				className="landing-wordmark-wrap mt-14 flex h-[clamp(150px,20vw,290px)] justify-center overflow-hidden"
			>
				<span className="landing-wordmark select-none whitespace-nowrap text-[clamp(100px,20vw,340px)] font-bold leading-[0.9] tracking-[-0.05em]">
					GymAtlas
				</span>
			</div>
		</footer>
	);
}
