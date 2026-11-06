import Link from 'next/link';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { ArrowRight, Check, Search } from 'lucide-react';
import MarketingHeader from '@/components/layout/MarketingHeader';
import HeroCarousel from '@/components/landing/HeroCarousel';
import LandingFooter from '@/components/landing/LandingFooter';
import { WindowFrame } from '@/components/ui/AppWindow';
import SectionNav from '@/components/landing/SectionNav';
import CommunityPanel from '@/components/landing/CommunityPanel';
import DatabasePanel from '@/components/landing/DatabasePanel';
import { PANEL_CLS, PANEL_LABEL_CLS } from '@/components/landing/panelStyles';

const dmSans = DM_Sans({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const mono = jetbrainsMono.className;

export const metadata = {
	title: 'Gym Atlas — find a gym with the equipment you actually want',
	description:
		'Search gyms by the exact machines and brands they carry, browse the full equipment database, and help build the map.'
};

// ── Schematic visual panels ─────────────────────────────
// FilterPanel below is a static mock — generic placeholder content standing
// in for the real product screen. DatabasePanel and CommunityPanel instead
// live in their own files (components/landing/DatabasePanel.tsx and
// CommunityPanel.tsx) and read real gyms/leaderboard data.

function FilterPanel() {
	const rows = [
		{ label: 'Leg Press', brand: 'Hammer Strength', count: 128, on: true },
		{ label: 'Lat Pulldown', brand: 'Life Fitness', count: 112, on: true },
		{ label: 'Chest Press', brand: 'Technogym', count: 96, on: true },
		{ label: 'Cable Crossover', brand: 'Matrix', count: 74, on: false },
		{ label: 'Smith Machine', brand: 'Atlantis', count: 68, on: false },
		{ label: 'Hack Squat', brand: 'Cybex', count: 61, on: false },
		{ label: 'Leg Extension', brand: 'Nautilus', count: 54, on: false },
		{ label: 'Seated Row', brand: 'Prime', count: 43, on: false }
	];
	const chips = ['Category', 'Brand', 'Exercise'];

	return (
		<div className={PANEL_CLS}>
			<div className="flex items-center justify-between">
				<span className={`${mono} ${PANEL_LABEL_CLS}`}>Equipment</span>
				<span className={`${mono} text-sub text-[10px]`}>3 / 312</span>
			</div>

			<div className="border-border bg-bg mt-5 flex h-10 shrink-0 items-center gap-2.5 rounded-lg border px-3">
				<Search size={14} className="text-sub shrink-0" />
				<div className="bg-border h-1.5 w-28 rounded-full" />
			</div>

			<div className="mt-4 flex shrink-0 gap-2">
				{chips.map((chip, index) => (
					<span
						key={chip}
						className={`${mono} rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
							index === 0 ? 'border-accent text-accent' : 'border-border text-sub'
						}`}
					>
						{chip}
					</span>
				))}
			</div>

			<ul className="mt-5 flex flex-1 flex-col justify-between gap-3">
				{rows.map((row) => (
					<li key={row.label} className="flex items-center gap-3">
						<span
							className={`grid h-4 w-4 shrink-0 place-items-center rounded ${
								row.on ? 'bg-accent' : 'border-border border'
							}`}
						>
							{row.on && <Check size={11} className="text-bg" />}
						</span>
						<span className="text-main shrink-0 text-sm">{row.label}</span>
						<span className={`${mono} text-sub truncate text-[11px]`}>{row.brand}</span>
						<span className={`${mono} text-sub ml-auto shrink-0 text-xs`}>{row.count}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

// ── Feature section ─────────────────────────────────────

function FeatureSection({
	id,
	index,
	lead,
	muted,
	body,
	ctaText,
	ctaHref,
	visual,
	windowTitle
}: {
	id: string;
	index: string;
	lead: string;
	muted: string;
	body: string;
	ctaText: string;
	ctaHref: string;
	visual: React.ReactNode;
	windowTitle: string;
}) {
	return (
		<section id={id} className="flex scroll-mt-24 flex-col gap-10 py-16 lg:py-24">
			<div className="flex flex-wrap items-end justify-between gap-6">
				<div className="flex min-w-0 flex-[1_1_480px] flex-col gap-5">
					<span className={`${mono} text-accent text-xs tracking-[0.25em]`}>{index}</span>
					<h2 className="text-main text-[clamp(32px,4vw,52px)] font-bold leading-[1.06] tracking-[-0.035em]">
						{lead} <span className="text-sub">{muted}</span>
					</h2>
				</div>
				<div className="max-w-105 flex-[1_1_340px]">
					<p className="text-sub text-lg leading-relaxed">{body}</p>
					<Link
						href={ctaHref}
						className="text-main hover:text-accent border-accent mt-5 inline-flex items-center gap-1.5 border-b pb-0.5 text-sm font-medium no-underline transition-colors"
					>
						{ctaText}
						<ArrowRight size={15} />
					</Link>
				</div>
			</div>
			<div className="bg-sub-alt flex justify-center rounded-[32px] p-5 md:p-10">
				<div className="w-full max-w-182.5">
					<WindowFrame title={windowTitle}>{visual}</WindowFrame>
				</div>
			</div>
		</section>
	);
}

export default function LandingPage() {
	return (
		<div className={`${dmSans.className} flex min-h-full flex-col`}>
			<MarketingHeader bordered={false} />

			<div className="overflow-x-hidden pb-10">
				{/* ── Hero ── centred copy; on lg+ two rows of cards drift along a
				    wave above and a smile below it, below lg a tilted strip slides
				    underneath. */}
				<section className="relative lg:h-[1080px]">
					<div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-12 text-center md:pt-16 lg:pt-[300px]">
						<h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
							<span className="text-main block">Every gym.</span>
							<span className="text-main/50 block">Every machine.</span>
						</h1>
						<p className="text-sub mt-7 max-w-xl text-lg leading-relaxed md:text-xl">
							Search gyms by the exact equipment on the floor, down to the brand and model.
							Mapped, photographed and checked by lifters.
						</p>
						<div className="xs:flex-row mt-9 flex flex-col gap-3">
							<Link
								href="/map"
								className="bg-main text-bg flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-medium no-underline transition-opacity hover:opacity-90"
							>
								Open the map
								<ArrowRight size={16} />
							</Link>
							<Link
								href="/data"
								className="border-border bg-bg text-main hover:bg-sub-alt flex h-14 items-center justify-center rounded-full border px-8 text-base font-medium no-underline transition-colors"
							>
								Browse equipment
							</Link>
						</div>
					</div>
					<HeroCarousel mono={mono} />
				</section>

				{/* 1314px = 730px panel + 480px text column + 56px gap (lg:gap-14) +
				    48px padding (px-6) — the exact width where both columns sit at
				    their full size with no shrinking needed. Below that (but still
				    ≥lg), flex-shrink compresses both columns together, keeping
				    their 730:480 ratio, instead of overflowing. */}
				<div className="mx-auto w-full max-w-328.5 px-6">
					{/* ── Anchor strip ── */}
					<div className="mt-16 md:mt-20">
						<SectionNav />
					</div>

					{/* ── Feature sections ── */}
					<FeatureSection
						id="filter"
						index="01"
						lead="Search by the machine,"
						muted="not just the gym."
						body="Looking for a pendulum squat or a chest-supported T-bar row? Filter by brand, model and category and see only the gyms that stock it."
						ctaText="Filter the database"
						ctaHref="/data"
						visual={<FilterPanel />}
						windowTitle="Equipment"
					/>
					<FeatureSection
						id="database"
						index="02"
						lead="See what is really"
						muted="on the floor."
						body="Every gym page lists its equipment with photos, brands and models, so you know what you are walking into before the commute."
						ctaText="Browse gyms"
						ctaHref="/data?view=gyms"
						visual={<DatabasePanel />}
						windowTitle="Gyms"
					/>
					<FeatureSection
						id="community"
						index="03"
						lead="Built by lifters,"
						muted="checked before it goes live."
						body="Anyone can add a gym or a machine. Photos wait for admin approval first, so the map stays clean. The code is open, so you can read it or contribute."
						ctaText="View the leaderboard"
						ctaHref="/leaderboard"
						visual={<CommunityPanel />}
						windowTitle="Leaderboard"
					/>
				</div>
			</div>

			<LandingFooter mono={mono} />
		</div>
	);
}
