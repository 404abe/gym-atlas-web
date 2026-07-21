import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { ArrowRight, Check, Search } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { createClient } from '@/lib/supabaseServer';
import MarketingHeader from '@/components/layout/MarketingHeader';
import CoordinateTicker from '@/components/landing/CoordinateTicker';
import HeroMap from '@/components/landing/HeroMap';
import SectionNav from '@/components/landing/SectionNav';
import CommunityPanel from '@/components/landing/CommunityPanel';
import DatabasePanel from '@/components/landing/DatabasePanel';
import { PANEL_CLS, PANEL_LABEL_CLS } from '@/components/landing/panelStyles';

const dmSans = DM_Sans({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const mono = jetbrainsMono.className;

const REPO_URL = 'https://github.com/404abe/gym-atlas-web';

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
	title,
	body,
	ctaText,
	ctaHref,
	visual,
	reverse = false
}: {
	id: string;
	index: string;
	title: string;
	body: string;
	ctaText: string;
	ctaHref: string;
	visual: React.ReactNode;
	reverse?: boolean;
}) {
	return (
		<section
			id={id}
			className="flex scroll-mt-24 flex-col items-center gap-8 py-16 lg:flex-row lg:gap-14 lg:py-24"
		>
			<div className={`w-full max-w-120 lg:w-120 ${reverse ? 'lg:order-2' : 'lg:order-1'}`}>
				<span className={`${mono} text-accent text-xs tracking-[0.25em]`}>{index}</span>
				<h2 className="text-main mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
					{title}
				</h2>
				<p className="text-sub mt-3 text-base leading-relaxed">{body}</p>
				<Link
					href={ctaHref}
					className="text-main hover:text-accent border-accent mt-6 inline-flex items-center gap-1.5 border-b pb-0.5 text-sm font-medium no-underline transition-colors"
				>
					{ctaText}
					<ArrowRight size={15} />
				</Link>
			</div>
			<div className={`w-full max-w-182.5 lg:w-182.5 ${reverse ? 'lg:order-1' : 'lg:order-2'}`}>
				{visual}
			</div>
		</section>
	);
}

export default async function LandingPage() {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (user) redirect('/map');

	return (
		<div className={`${dmSans.className} flex min-h-full flex-col`}>
			<MarketingHeader bordered={false} />

			<div className="overflow-x-hidden pb-28">
				{/* 1314px = 730px panel + 480px text column + 56px gap (lg:gap-14) +
				    48px padding (px-6) — the exact width where both columns sit at
				    their full size with no shrinking needed. Below that (but still
				    ≥lg), flex-shrink compresses both columns together, keeping
				    their 730:480 ratio, instead of overflowing. */}
				<div className="mx-auto w-full max-w-328.5 px-6">
					{/* ── Hero ── */}
					<section className="mx-auto flex max-w-2xl flex-col items-center pt-14 text-center md:pt-20">
						<h1 className="text-main mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
							Find a gym with the right equipment.
						</h1>
						<p className="text-sub mt-5 max-w-xl text-balance text-lg">
							Not just a pin on a map. Search gyms by the exact machines and brands they carry.
						</p>

						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							<Link
								href="/map"
								className="bg-main text-bg flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium no-underline transition-opacity hover:opacity-90"
							>
								Open the map
								<ArrowRight size={16} />
							</Link>
							<Link
								href={REPO_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="border-border text-main hover:bg-sub-alt flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium no-underline transition-colors"
							>
								<FaGithub size={16} />
								View on GitHub
							</Link>
						</div>

						<CoordinateTicker />
					</section>

					{/* ── Hero map ── */}
					<HeroMap />

					{/* ── Anchor strip ── */}
					<div className="mt-16 md:mt-20">
						<SectionNav />
					</div>

					{/* ── Feature sections ── */}
					<FeatureSection
						id="filter"
						index="01"
						title="Filter by equipment"
						body="Don't just find a gym nearby — find one with the specific machines and brands you train on. Search by category, brand, or exercise."
						ctaText="Try it on the map"
						ctaHref="/map"
						visual={<FilterPanel />}
					/>
					<FeatureSection
						id="database"
						index="02"
						title="Browse the database"
						body="Every gym's full equipment list, searchable by category, brand, and exercise — so you always know what you're walking into."
						ctaText="Browse gyms"
						ctaHref="/map"
						visual={<DatabasePanel />}
						reverse
					/>
					<FeatureSection
						id="community"
						index="03"
						title="Built by the community"
						body="Gyms and machines are added by the people who train there. Contribute a find and climb the leaderboard."
						ctaText="View the leaderboard"
						ctaHref="/leaderboard"
						visual={<CommunityPanel />}
					/>
				</div>
			</div>
		</div>
	);
}
