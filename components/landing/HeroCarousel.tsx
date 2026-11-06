'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchAllEquipment, fetchGyms } from '@/lib/api';
import { cn } from '@/lib/utils';
import { logoForGym } from '@/lib/gymLogos';
import { cloudinaryThumb } from '@/lib/cloudinary';

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

export type CarouselCard = MachineCard | GymCard;

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

// The hero and footer draw from one pool of unique cards (no photo twice).
// The pool holds every machine with a PNG photo; only the slots below are ever in
// the DOM at once, so its size has no effect on rendering cost.
// Rendered width of a card in CSS px (hero 200, footer 220, mobile ~213).
const THUMB_PX = 220;
// Mobile strip renders every card twice for its CSS loop, so keep it short.
const MOBILE_MAX = 16;
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

/** Keep the first item for each distinct key; items with a null key are dropped. */
function uniqueBy<T>(items: T[], keyOf: (item: T) => string | null): T[] {
	const seen = new Set<string>();
	const out: T[] = [];
	for (const item of items) {
		const k = keyOf(item);
		if (k === null || seen.has(k)) continue;
		seen.add(k);
		out.push(item);
	}
	return out;
}

/** True for a .png photo URL (ignoring any query string or fragment). */
function isPng(url: string | null | undefined): boolean {
	return !!url && /\.png(?:[?#].*)?$/i.test(url);
}

/** Fisher-Yates shuffle into a new array. */
function shuffled<T>(items: T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Case/space-insensitive identity for a machine: brand + series + name. */
function identityKey(...parts: (string | null | undefined)[]): string {
	return parts
		.map((p) => (p ?? '').toLowerCase().replace(/\s+/g, ' ').trim())
		.join('|');
}

/**
 * Stand-in shown until real data loads, so the first paint (or a slow API
 * wake-up) is never nearly empty. Only two static cards exist, so these repeat;
 * they are replaced by the unique pool as soon as it arrives.
 */
function placeholderCards(section: CarouselSection): CarouselCard[] {
	const count = section === 'hero' ? HERO_MAX : FOOTER_MAX;
	return Array.from({ length: count }, (_, i) => ({
		...FALLBACK[i % FALLBACK.length],
		key: `${FALLBACK[i % FALLBACK.length].key}-ph${i}`
	}));
}

export type CarouselSection = 'hero' | 'footer';

// Slots available on each landing section (hero: two wave rows, footer: the fan).
const HERO_MAX = 24;
const FOOTER_MAX = 13;

/**
 * Split the unique pool between footer and hero so no card shows in both.
 * The footer gets a fixed, evenly spread handful (so it keeps the mix of
 * machine and gym cards). The hero gets everything else: it shows HERO_MAX of
 * them at a time and swaps cards out as they leave the screen.
 */
function splitPool(pool: CarouselCard[], section: CarouselSection): CarouselCard[] {
	const n = pool.length;
	if (n < 2) return section === 'hero' ? pool : [];
	const footerN = Math.min(
		FOOTER_MAX,
		Math.max(1, Math.min(n - 1, Math.round((n * FOOTER_MAX) / (HERO_MAX + FOOTER_MAX))))
	);
	const hero: CarouselCard[] = [];
	const footer: CarouselCard[] = [];
	pool.forEach((card, i) => {
		const toFooter = Math.floor(((i + 1) * footerN) / n) > Math.floor((i * footerN) / n);
		(toFooter ? footer : hero).push(card);
	});
	return section === 'hero' ? hero : footer;
}

/** Repeat the list until it has at least MIN_LOOP cards, keeping keys unique. */
export function fillLoop(cards: CarouselCard[]): CarouselCard[] {
	if (cards.length === 0) return cards;
	const out: CarouselCard[] = [];
	for (let round = 0; out.length < MIN_LOOP; round++) {
		for (const card of cards) out.push({ ...card, key: `${card.key}-${round}` });
	}
	return out;
}

export function useCarouselCards(section: CarouselSection = 'hero'): CarouselCard[] {
	const [pool, setPool] = useState<CarouselCard[]>(FALLBACK);
	// False until the API answers (it can take a while to wake on free hosting).
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;

		Promise.allSettled([fetchAllEquipment(), fetchGyms()]).then(([equipmentRes, gymsRes]) => {
			if (cancelled) return;

			const machines: CarouselCard[] = shuffled(
				equipmentRes.status === 'fulfilled'
					? uniqueBy(
							// Same machine entered twice (or as variants) must show once, even if
							// each record carries its own copy of the photo.
							uniqueBy(
								equipmentRes.value.filter((eq) => isPng(eq.image_url)),
								(eq) => identityKey(eq.brand, eq.series, eq.name)
							),
							(eq) => eq.image_url ?? null
						)
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
					: []
			);

			const gyms: CarouselCard[] =
				gymsRes.status === 'fulfilled'
					? uniqueBy(
							[...gymsRes.value].sort(
								(a, b) =>
									Number(!!b.image_url) - Number(!!a.image_url) ||
									Number(b.total_equipment) - Number(a.total_equipment)
							),
							// Branches of one chain share a logo card, so key on what is drawn.
							(gym) => gym.image_url || logoForGym(gym.name) || null
						)
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
			if (machines.length + gyms.length >= 4) {
				setPool(interleave(machines, gyms));
				setLoaded(true);
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return useMemo(
		() => (loaded ? splitPool(pool, section) : placeholderCards(section)),
		[loaded, pool, section]
	);
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

/** Resized, modern-format Cloudinary URL for a card photo; other URLs pass through. */
function thumb(url: string | null): string | undefined {
	return cloudinaryThumb(url, { size: THUMB_PX, fit: 'limit' }) ?? url ?? undefined;
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
						src={thumb(card.image)}
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
					src={thumb(card.image)}
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

export function Card({ card, mono }: { card: CarouselCard; mono: string }) {
	return card.kind === 'machine' ? (
		<MachineCardView card={card} mono={mono} />
	) : (
		<GymCardView card={card} mono={mono} />
	);
}

// ── Desktop: two wavy card paths ────────────────────────
// Cards ride two bezier paths around the centred hero copy: a gentle wave
// across the top and a smile-shaped curve underneath. The top row drifts
// right, the bottom row drifts left, and every card turns to follow the
// tangent of its path. Positions are written straight to the DOM each frame
// (no React state), and the loop is static under prefers-reduced-motion.

export const CARD_SIZE = {
	machine: { w: 380, h: 390 },
	gym: { w: 460, h: 300 }
} as const;

type Pt = [number, number];
type Path = { pts: Pt[]; cum: number[] };

const WAVE_STAGE = { w: 1440, h: 1100 } as const;
const WAVE_CARD_W = 200; // every card is scaled to this width

/** Smooth cubic chain: each segment mirrors the previous control point. */
function buildPath(start: Pt, first: [Pt, Pt, Pt], rest: [Pt, Pt][]): Path {
	const segs: [Pt, Pt, Pt, Pt][] = [[start, first[0], first[1], first[2]]];
	let p0 = first[2];
	let prevC = first[1];
	for (const [c2, end] of rest) {
		segs.push([p0, [2 * p0[0] - prevC[0], 2 * p0[1] - prevC[1]], c2, end]);
		p0 = end;
		prevC = c2;
	}
	const pts: Pt[] = [];
	for (const [a, b, c, d] of segs) {
		for (let n = 0; n <= 200; n++) {
			const t = n / 200;
			const u = 1 - t;
			pts.push([
				u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
				u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]
			]);
		}
	}
	const cum = [0];
	for (let n = 1; n < pts.length; n++) {
		cum.push(cum[n - 1] + Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1]));
	}
	return { pts, cum };
}

const WAVE_TOP = buildPath(
	[-520, 310],
	[[-200, 310], [60, 80], [330, 80]],
	[[[700, 150], [1000, 190]], [[1500, 230], [1960, 100]]]
);
const WAVE_BOTTOM = buildPath(
	[-520, 760],
	[[-300, 700], [0, 640], [220, 650]],
	[[[600, 940], [1000, 940]], [[1500, 700], [1960, 470]]]
);

/** Point and tangent angle (deg) at fraction f (0..1) of the path's length. */
function pointAt(path: Path, f: number): { x: number; y: number; angle: number } {
	const want = path.cum[path.cum.length - 1] * f;
	let j = 1;
	while (j < path.cum.length - 1 && path.cum[j] < want) j++;
	const a = path.pts[j - 1];
	const b = path.pts[j];
	const span = path.cum[j] - path.cum[j - 1] || 1;
	const r = (want - path.cum[j - 1]) / span;
	return {
		x: a[0] + (b[0] - a[0]) * r,
		y: a[1] + (b[1] - a[1]) * r,
		angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
	};
}

/** Deal cards across the two rows, mixing kinds, so no card is used twice. */
function dealRows(cards: CarouselCard[]): [CarouselCard[], CarouselCard[]] {
	const top: CarouselCard[] = [];
	const bottom: CarouselCard[] = [];
	cards.forEach((card, i) => ((i + (i >> 1)) % 2 === 0 ? top : bottom).push(card));
	return [top, bottom];
}

type WaveRow = { path: Path; dir: 1 | -1; seconds: number };
type WaveState = { slots: [CarouselCard[], CarouselCard[]]; reserve: CarouselCard[] };

/** First HERO_MAX cards go on screen; the rest wait in reserve to be swapped in. */
function initWave(cards: CarouselCard[]): WaveState {
	return { slots: dealRows(cards.slice(0, HERO_MAX)), reserve: cards.slice(HERO_MAX) };
}

/**
 * Swap the card in one slot for the next reserve card. The outgoing card joins
 * the back of the reserve, so every card is on screen at most once at a time
 * and the whole pool cycles through.
 */
function recycleSlot(state: WaveState, r: 0 | 1, i: number): WaveState {
	if (state.reserve.length === 0) return state;
	const [next, ...rest] = state.reserve;
	const row = state.slots[r].slice();
	const out = row[i];
	row[i] = next;
	return {
		slots: r === 0 ? [row, state.slots[1]] : [state.slots[0], row],
		reserve: [...rest, out]
	};
}

const WAVE_ROWS: WaveRow[] = [
	{ path: WAVE_TOP, dir: 1, seconds: 90 },
	{ path: WAVE_BOTTOM, dir: -1, seconds: 100 }
];

function WaveStack({ cards, mono }: { cards: CarouselCard[]; mono: string }) {
	const itemRefs = useRef<(HTMLDivElement | null)[][]>([[], []]);
	const [source, setSource] = useState(cards);
	const [wave, setWave] = useState<WaveState>(() => initWave(cards));
	// The animation loop reads the live slots through a ref (no per-frame React work).
	const slotsRef = useRef(wave.slots);

	// A new card pool (placeholder -> real data) restarts the wave.
	if (source !== cards) {
		setSource(cards);
		setWave(initWave(cards));
	}

	useEffect(() => {
		slotsRef.current = wave.slots;
	}, [wave.slots]);

	useEffect(() => {
		if (cards.length === 0) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let elapsed = 0;
		let last = performance.now();
		let raf = 0;

		const phase = (r: number, i: number) =>
			i / slotsRef.current[r].length + (WAVE_ROWS[r].dir * elapsed) / WAVE_ROWS[r].seconds;
		// Which lap of its path each slot is on; a change means it wrapped past an
		// off-screen end, which is when its card is swapped for a fresh one.
		const laps = slotsRef.current.map((row, r) => row.map((_, i) => Math.floor(phase(r, i))));

		const place = () => {
			WAVE_ROWS.forEach((row, r) => {
				slotsRef.current[r].forEach((card, i) => {
					const el = itemRefs.current[r][i];
					if (!el) return;
					const ph = phase(r, i);
					const lap = Math.floor(ph);
					if (lap !== laps[r][i]) {
						laps[r][i] = lap;
						setWave((prev) => recycleSlot(prev, r as 0 | 1, i));
					}
					const f = ((ph % 1) + 1) % 1;
					const { x, y, angle } = pointAt(row.path, f);
					const hh = (CARD_SIZE[card.kind].h * WAVE_CARD_W) / CARD_SIZE[card.kind].w / 2;
					el.style.transform = `translate(${x - WAVE_CARD_W / 2}px, ${y - hh}px) rotate(${angle}deg)`;
				});
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
	}, [cards]);

	return (
		<div
			aria-hidden="true"
			className="hero-mask-x pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
		>
			<div
				className="absolute left-1/2 top-0 -translate-x-1/2"
				style={{ width: WAVE_STAGE.w, height: WAVE_STAGE.h }}
			>
				{wave.slots.map((row, r) =>
					row.map((card, i) => {
						const size = CARD_SIZE[card.kind];
						const scale = WAVE_CARD_W / size.w;
						return (
							<div
								// Keyed by slot, not card: the element (and its transform) persists
								// when the card inside is swapped.
								key={`${r}-${i}`}
								ref={(el) => {
									itemRefs.current[r][i] = el;
								}}
								className="absolute left-0 top-0 will-change-transform"
								style={{ width: WAVE_CARD_W, height: size.h * scale, zIndex: r === 0 ? 1 : 2 }}
							>
								<div
									className="origin-top-left"
									style={{ width: size.w, height: size.h, transform: `scale(${scale})` }}
								>
									<Card key={card.key} card={card} mono={mono} />
								</div>
							</div>
						);
					})
				)}
			</div>
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
 * Desktop (lg+): two rows of cards drift along wavy paths around the hero copy.
 * Below lg: a tilted horizontal strip under the hero copy, rendered twice and
 * slid by -50% for a seamless CSS loop (see globals.css).
 */
export default function HeroCarousel({ mono }: { mono: string }) {
	const cards = useCarouselCards('hero');
	const loop = fillLoop(cards.slice(0, MOBILE_MAX));
	const doubled = [...loop, ...loop.map((c) => ({ ...c, key: `${c.key}-b` }))];

	return (
		<>
			<WaveStack cards={cards} mono={mono} />

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
