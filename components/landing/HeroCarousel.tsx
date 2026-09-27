'use client';

import { useEffect, useState } from 'react';
import { fetchAllEquipment, fetchGyms } from '@/lib/api';
import { cn } from '@/lib/utils';

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

const PUREGYM_LOGO = '/landing/puregym-logo.png';

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

function logoForGym(name: string): string | null {
	return /pure\s?gym/i.test(name) ? PUREGYM_LOGO : null;
}

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

// ── Carousel ────────────────────────────────────────────

// Horizontal nudges for the desktop column, so the stack reads as scattered
// cards rather than a straight list (machines are narrower than gyms).
const OFFSETS_Y = ['120px', '20px', '150px', '40px', '110px', '10px', '140px', '50px'];
const OFFSETS_X = ['0px', '44px', '8px', '52px', '4px', '40px', '12px', '48px'];

/**
 * Decorative, auto-scrolling stack of machine and gym cards for the landing
 * hero. Desktop (lg+): a tilted vertical column bleeding off the right edge.
 * Below lg: a tilted horizontal strip under the hero copy. Each track renders
 * the list twice and animates by -50% for a seamless loop (see globals.css).
 */
export default function HeroCarousel({ mono }: { mono: string }) {
	const loop = fillLoop(useCarouselCards());
	const doubled = [...loop, ...loop.map((c) => ({ ...c, key: `${c.key}-b` }))];

	return (
		<>
			{/* Desktop: vertical tilted column */}
			<div
				aria-hidden="true"
				className="hero-stage hero-mask-y pointer-events-auto absolute -right-10 -top-10 bottom-0 hidden w-[46%] max-w-[640px] lg:block"
			>
				<div className="hero-tilt h-full w-full pt-10">
					{/* Spacing is per-item padding, not gap, so -50% lands exactly on the seam. */}
					<div className="hero-track-y flex flex-col">
						{doubled.map((card, i) => (
							<div
								key={card.key}
								className="shrink-0 pb-[30px]"
								style={{ marginLeft: OFFSETS_Y[i % OFFSETS_Y.length] }}
							>
								<Card card={card} mono={mono} />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Mobile / tablet: horizontal tilted strip */}
			<div aria-hidden="true" className="hero-mask-x mt-10 h-[330px] overflow-hidden lg:hidden">
				<div className="h-full w-full -rotate-6 pl-6 pt-10">
					<div className="hero-track-x flex w-max items-start">
						{doubled.map((card, i) => {
							const isMachine = card.kind === 'machine';
							return (
								<div
									key={card.key}
									className={cn(
										'mr-4 shrink-0',
										isMachine ? 'h-[218px] w-[213px]' : 'h-[168px] w-[258px]'
									)}
									style={{ marginTop: OFFSETS_X[i % OFFSETS_X.length] }}
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
