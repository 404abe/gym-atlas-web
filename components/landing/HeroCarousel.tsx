'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchAllEquipment, fetchGyms } from '@/lib/api';
import { cn } from '@/lib/utils';
import { logoForGym } from '@/lib/gymLogos';

// ── Card data ───────────────────────────────────────────
// The hero carousel alternates machine cards and gym cards. It starts on a
// small static set (so the first paint is never empty) and swaps to real
// gyms/equipment from the API once they load. Machines are only shown when
// they have a photo; gyms prefer ones with a photo, then the best-stocked.

type MachineCard = {
	kind: 'machine';
	key: string;
	title: string;
	subtitle: string;
	group: string;
	image: string | null;
};

type GymCard = {
	kind: 'gym';
	key: string;
	title: string;
	eyebrow: string;
	meta: string | null;
	image: string | null;
	logo: string | null;
};

type CarouselCard = MachineCard | GymCard;

const PUREGYM_LOGO = logoForGym('PureGym');

const FALLBACK: CarouselCard[] = [
	{
		kind: 'machine',
		key: 'fallback-matrix',
		title: 'Converging Chest Press',
		subtitle: 'Matrix · Aura',
		group: 'CHEST',
		image: '/landing/matrix-aura-converging-chest-press.png'
	},
	{
		kind: 'gym',
		key: 'fallback-puregym',
		title: 'PureGym',
		eyebrow: 'ABERDEEN',
		meta: null,
		image: null,
		logo: PUREGYM_LOGO
	}
];

const MAX_MACHINES = 5;
const MAX_GYMS = 4;
// Enough cards per loop that the track is always taller/wider than the stage.
const MIN_LOOP = 8;

function interleave(machines: CarouselCard[], gyms: CarouselCard[]): CarouselCard[] {
	const out: CarouselCard[] = [];
	for (let i = 0; i < Math.max(machines.length, gyms.length); i++) {
		if (machines[i]) out.push(machines[i]);
		if (gyms[i]) out.push(gyms[i]);
	}
	return out;
}

/** Repeat the list until it has at least MIN_LOOP cards, keeping keys unique. */
function fillLoop(cards: CarouselCard[]): CarouselCard[] {
	if (cards.length === 0) return cards;
	const out: CarouselCard[] = [];
	for (let round = 0; out.length < MIN_LOOP; round++) {
		for (const card of cards) out.push({ ...card, key: `${card.key}-${round}` });
	}
	return out;
}

function useCarouselCards(): CarouselCard[] {
	const [cards, setCards] = useState<CarouselCard[]>(FALLBACK);

	useEffect(() => {
		let cancelled = false;

		Promise.allSettled([fetchAllEquipment(), fetchGyms()]).then(([equipmentRes, gymsRes]) => {
			if (cancelled) return;

			const machines: CarouselCard[] =
				equipmentRes.status === 'fulfilled'
					? equipmentRes.value
							.filter((eq) => !!eq.image_url)
							.slice(0, MAX_MACHINES)
							.map((eq) => ({
								kind: 'machine' as const,
								key: `eq-${eq.id}`,
								title: eq.name,
								subtitle: [eq.brand, eq.series].filter(Boolean).join(' · '),
								group: (
									eq.exercise?.category_name ||
									(eq.type === 'plate_loaded' ? 'Plate' : 'Pin')
								).toUpperCase(),
								image: eq.image_url ?? null
							}))
					: [];

			const gyms: CarouselCard[] =
				gymsRes.status === 'fulfilled'
					? [...gymsRes.value]
							.sort(
								(a, b) =>
									Number(!!b.image_url) - Number(!!a.image_url) ||
									Number(b.total_equipment) - Number(a.total_equipment)
							)
							.slice(0, MAX_GYMS)
							.map((gym) => ({
								kind: 'gym' as const,
								key: `gym-${gym.id}`,
								title: gym.name,
								eyebrow: (gym.city || gym.country || '').toUpperCase(),
								meta:
									Number(gym.total_equipment) > 0
										? `${Number(gym.total_equipment)} machines`
										: null,
								image: gym.image_url ?? null,
								logo: logoForGym(gym.name)
							}))
					: [];

			// Keep the static set unless the API gave us enough to fill a loop.
			if (machines.length + gyms.length >= 4) setCards(interleave(machines, gyms));
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return cards;
}

// ── Cards ───────────────────────────────────────────────

const SHADOW =
	'shadow-[0_30px_60px_-24px_rgba(0,0,0,0.28),0_6px_16px_-8px_rgba(0,0,0,0.14)]';

function MachineGlyph({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 120 120"
			fill="none"
			stroke="currentColor"
			strokeWidth={2.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M22 100V24M22 24h44M66 24l20 46M14 100h82M44 100V70h42M22 52h26" />
			<circle cx="86" cy="70" r="14" />
			<circle cx="86" cy="70" r="4" />
		</svg>
	);
}

function GymGlyph({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 120 120"
			fill="none"
			stroke="currentColor"
			strokeWidth={3}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M16 98h88M24 98V46l36-22 36 22v52M48 98V72h24v26M40 54h40M34 54v-6M86 54v-6" />
		</svg>
	);
}

/** Small "file" badge beside the machine name, after macOS-style file cards. */
function GroupBadge({ group, mono }: { group: string; mono: string }) {
	return (
		<div className="relative h-[50px] w-10 shrink-0">
			<svg viewBox="0 0 40 50" fill="none" className="absolute inset-0 h-full w-full">
				<path
					d="M4 3h22l10 10v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
					className="fill-bg stroke-border"
					strokeWidth={1.5}
				/>
				<path d="M26 3v8a2 2 0 0 0 2 2h8" className="stroke-border" strokeWidth={1.5} />
				<rect x="11" y="15" width="18" height="15" rx="3" className="fill-accent" />
				<path
					d="M15 22.5h10M16 19.5v6M24 19.5v6"
					className="stroke-bg"
					strokeWidth={1.8}
					strokeLinecap="round"
				/>
			</svg>
			<span
				className={cn(
					mono,
					'text-sub absolute inset-x-0 bottom-[7px] truncate px-1 text-center text-[6px] leading-none'
				)}
			>
				{group}
			</span>
		</div>
	);
}

function MachineCardView({ card, mono }: { card: MachineCard; mono: string }) {
	return (
		<div
			className={cn(
				'bg-bg border-border flex h-[390px] w-[380px] flex-col rounded-[30px] border p-3.5',
				SHADOW
			)}
		>
			{/* The photo well stays light in both themes: equipment photos are
			    shot on white, and multiply blends that white into the well. */}
			<div className="relative flex h-[272px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#eeede9] shadow-[inset_0_0_0_1px_#e3e1db]">
				{card.image ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={card.image}
						alt=""
						loading="lazy"
						decoding="async"
						className="absolute inset-0 h-full w-full object-contain p-4 mix-blend-multiply"
					/>
				) : (
					<MachineGlyph className="h-36 w-36 text-[#a7a49a]" />
				)}
			</div>
			<div className="flex flex-1 items-center gap-4 px-2">
				<GroupBadge group={card.group} mono={mono} />
				<div className="flex min-w-0 flex-col gap-0.5">
					<span className="text-main truncate text-2xl font-medium tracking-tight">
						{card.title}
					</span>
					<span className="text-sub truncate text-[17px]">{card.subtitle}</span>
				</div>
			</div>
		</div>
	);
}

function GymCardView({ card, mono }: { card: GymCard; mono: string }) {
	return (
		<div
			className={cn(
				'bg-sub-alt relative h-[300px] w-[460px] overflow-hidden rounded-[20px]',
				SHADOW
			)}
		>
			{card.image ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={card.image}
					alt=""
					loading="lazy"
					decoding="async"
					className="absolute inset-0 h-full w-full object-cover"
				/>
			) : (
				<div className="absolute inset-x-0 bottom-24 top-0 flex items-center justify-center">
					<GymGlyph className="text-sub h-28 w-28" />
				</div>
			)}

			<span
				className={cn(
					mono,
					'bg-bg/90 text-main absolute left-3.5 top-3.5 flex h-7 items-center gap-2 rounded-full px-3 text-[11px] tracking-wider'
				)}
			>
				<span className="bg-main h-[7px] w-[7px] rounded-full" />
				GYM
			</span>

			<div className="bg-bg/95 absolute inset-x-3.5 bottom-3.5 flex h-[72px] items-center justify-between gap-3 rounded-[14px] px-4">
				<div className="flex min-w-0 items-center gap-3.5">
					{card.logo && (
						<div className="border-border flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={card.logo} alt="" className="h-[38px] w-[38px] object-contain" />
						</div>
					)}
					<div className="flex min-w-0 flex-col gap-0.5">
						{card.eyebrow && (
							<span className={cn(mono, 'text-sub text-[11px] tracking-wider')}>
								{card.eyebrow}
							</span>
						)}
						<span className="text-main truncate text-xl font-semibold tracking-tight">
							{card.title}
						</span>
					</div>
				</div>
				{card.meta && (
					<span
						className={cn(
							mono,
							'bg-sub-alt text-main flex h-[30px] shrink-0 items-center rounded-full px-3 text-xs'
						)}
					>
						{card.meta}
					</span>
				)}
			</div>
		</div>
	);
}

function Card({ card, mono }: { card: CarouselCard; mono: string }) {
	return card.kind === 'machine' ? (
		<MachineCardView card={card} mono={mono} />
	) : (
		<GymCardView card={card} mono={mono} />
	);
}

// ── Desktop: radial arc ─────────────────────────────────
// Every card sits on ONE circle whose centre is off the right edge of the
// hero, so the stack reads as a single object sweeping past rather than
// separate floating cards. Cards drift along the arc, tilt with it, overlap
// their neighbours, and grow slightly (and come to the front) near the middle.

const CARD_SIZE = {
	machine: { w: 380, h: 390 },
	gym: { w: 460, h: 300 }
} as const;

const ARC_BASE_SCALE = 0.72; // cards are drawn smaller so more fit on the arc
const ARC_STEP_DEG = 19; // angular gap between neighbouring cards (smaller = more overlap)
const ARC_SPEED_DEG_PER_S = 3.2; // drift speed along the arc
const ARC_TILT = 0.45; // card rotation per degree of arc
const ARC_SCALE_BOOST = 0.07; // extra scale at the middle of the arc

function ArcStack({ cards, mono }: { cards: CarouselCard[]; mono: string }) {
	const stageRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const pausedRef = useRef(false);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const span = cards.length * ARC_STEP_DEG; // total angle the loop covers
		let offset = 0;
		let last = performance.now();
		let raf = 0;

		const place = () => {
			const w = stage.clientWidth;
			const h = stage.clientHeight;
			const r = Math.max(500, h * 0.66);
			// Centre far enough right that the leftmost card never crosses into the
			// hero copy, and the outer cards run off the edge.
			const cx = Math.max(w + r * 0.25, r + 190);
			const cy = h / 2;

			cards.forEach((card, i) => {
				const el = itemRefs.current[i];
				if (!el) return;
				// Angle from the leftmost point of the circle: negative = above, positive = below.
				const a = (((i * ARC_STEP_DEG + offset) % span) + span) % span - span / 2;
				const rad = (a * Math.PI) / 180;
				const x = cx - r * Math.cos(rad);
				const y = cy + r * Math.sin(rad);
				const { w: cw, h: ch } = CARD_SIZE[card.kind];
				const scale = ARC_BASE_SCALE + ARC_SCALE_BOOST * Math.max(0, Math.cos(rad * 1.6));
				el.style.transform = `translate(${x - cw / 2}px, ${y - ch / 2}px) rotate(${-a * ARC_TILT}deg) scale(${scale})`;
				el.style.zIndex = String(Math.round(200 - Math.abs(a)));
				el.style.visibility = Math.abs(a) > 88 ? 'hidden' : 'visible';
			});
		};

		const tick = (now: number) => {
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;
			if (!pausedRef.current) offset += dt * ARC_SPEED_DEG_PER_S;
			place();
			raf = requestAnimationFrame(tick);
		};

		place();
		if (!reduceMotion) raf = requestAnimationFrame(tick);
		const ro = new ResizeObserver(place);
		ro.observe(stage);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	}, [cards]);

	return (
		<div
			ref={stageRef}
			aria-hidden="true"
			onMouseEnter={() => (pausedRef.current = true)}
			onMouseLeave={() => (pausedRef.current = false)}
			className="hero-mask-y pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden lg:block"
		>
			{cards.map((card, i) => (
				<div
					key={card.key}
					ref={(el) => {
						itemRefs.current[i] = el;
					}}
					className="pointer-events-auto absolute left-0 top-0 origin-center will-change-transform"
					style={{ visibility: 'hidden' }}
				>
					<Card card={card} mono={mono} />
				</div>
			))}
		</div>
	);
}

// ── Mobile: horizontal strip ────────────────────────────

const OFFSETS_X = ['0px', '44px', '8px', '52px', '4px', '40px', '12px', '48px'];
const ROTATIONS = ['-3deg', '2deg', '-1.5deg', '3deg', '-2.5deg', '1.5deg', '-2deg', '2.5deg'];
// Negative spacing makes each card tuck under the next. Every item gets the
// same margin, so the -50% loop still lands exactly on the seam.
const OVERLAP_X = '-44px';

/**
 * Decorative stack of machine and gym cards for the landing hero.
 * Desktop (lg+): cards orbit along a single arc bleeding off the right edge.
 * Below lg: a tilted horizontal strip under the hero copy, rendered twice and
 * slid by -50% for a seamless CSS loop (see globals.css).
 */
export default function HeroCarousel({ mono }: { mono: string }) {
	const loop = fillLoop(useCarouselCards());
	const doubled = [...loop, ...loop.map((c) => ({ ...c, key: `${c.key}-b` }))];

	return (
		<>
			<ArcStack cards={loop} mono={mono} />

			<div aria-hidden="true" className="hero-mask-x mt-10 h-[330px] overflow-hidden lg:hidden">
				<div className="h-full w-full -rotate-6 pl-6 pt-10">
					<div className="hero-track-x flex w-max items-start">
						{doubled.map((card, i) => {
							const isMachine = card.kind === 'machine';
							return (
								<div
									key={card.key}
									className={cn(
										'relative shrink-0',
										isMachine ? 'h-[218px] w-[213px]' : 'h-[168px] w-[258px]'
									)}
									style={{
										zIndex: doubled.length - i,
										marginTop: OFFSETS_X[i % OFFSETS_X.length],
										marginRight: OVERLAP_X,
										transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})`
									}}
								>
									<div className="origin-top-left scale-[0.56]">
										<Card card={card} mono={mono} />
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}
