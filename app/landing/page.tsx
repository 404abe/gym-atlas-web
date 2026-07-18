import Link from 'next/link';
import { ArrowRight, MapPin, Dumbbell, Trophy } from 'lucide-react';
import GymAtlasLogo from '@/components/ui/GymAtlasLogo';
import MarketingHeader from '@/components/layout/MarketingHeader';
import CoordinateTicker from '@/components/landing/CoordinateTicker';

export const metadata = {
	title: 'Gym Atlas — find a gym with the equipment you actually want',
	description:
		'Search gyms by the exact machines and brands they carry, browse the full equipment database, and help build the map.'
};

const features = [
	{
		icon: MapPin,
		title: 'Filter by equipment',
		body: "Don't just find a gym nearby — find one that has the specific machines and brands you train on."
	},
	{
		icon: Dumbbell,
		title: 'Browse the database',
		body: 'Every gym’s full equipment list, searchable by category, brand, and exercise.'
	},
	{
		icon: Trophy,
		title: 'Built by the community',
		body: 'Gyms and machines are added by people who train there. Contribute a find and climb the leaderboard.'
	}
];

export default function LandingPage() {
	return (
		<div className="flex min-h-full flex-col">
			<MarketingHeader />

			<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pb-24 pt-10 text-center md:pt-14">
				<GymAtlasLogo size={40} />

				<h1 className="text-main mt-8 text-4xl font-semibold tracking-tight md:text-5xl">
					Find a gym with the right equipment.
				</h1>
				<p className="text-sub mt-4 max-w-xl text-balance text-lg">
					Not just a pin on a map. Search gyms by the exact machines and brands they carry.
				</p>

				<Link
					href="/"
					className="bg-main text-bg mt-8 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium no-underline transition-opacity hover:opacity-90"
				>
					Open the map
					<ArrowRight size={16} />
				</Link>

				<CoordinateTicker />

				<div className="mt-20 grid gap-4 text-left sm:grid-cols-3">
					{features.map(({ icon: Icon, title, body }) => (
						<div key={title} className="border-border bg-surface rounded-2xl border p-5">
							<Icon size={20} className="text-sub" />
							<h2 className="text-main mt-3 text-sm font-semibold">{title}</h2>
							<p className="text-sub mt-1.5 text-sm">{body}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
