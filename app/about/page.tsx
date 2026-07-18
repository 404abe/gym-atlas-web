import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingHeader from '@/components/layout/MarketingHeader';

export const metadata = {
	title: 'About — Gym Atlas',
	description: 'What Gym Atlas is and how the equipment database gets built.'
};

export default function AboutPage() {
	return (
		<div className="flex min-h-full flex-col">
			<MarketingHeader />

			<div className="mx-auto w-full max-w-2xl px-6 py-16 md:py-20">
				<h1 className="text-main text-3xl font-semibold tracking-tight md:text-4xl">
					About Gym Atlas
				</h1>

				<div className="text-sub mt-8 flex flex-col gap-5 text-[15px] leading-relaxed">
					<p>
						Finding a gym near you is easy. Finding one that actually has the machines and
						brands you train on isn&apos;t — most gym listings stop at a pin on a map and a
						photo of a squat rack.
					</p>
					<p>
						Gym Atlas is a map and database of gyms built around their equipment: what
						machines they carry, which brands, and how that maps to the exercises you care
						about. You can filter gyms down to the ones that have exactly what you&apos;re
						looking for, and browse the full equipment list for any gym in the database.
					</p>
					<p>
						The data comes from people who actually train at these gyms. Every gym and
						machine in the database was added by a contributor, and contributions are
						tracked on the{' '}
						<Link href="/leaderboard" className="text-main underline underline-offset-2">
							leaderboard
						</Link>
						.
					</p>
					<p>
						It&apos;s an independent, open project — code and issues live on{' '}
						<Link
							href="https://github.com/404abe"
							target="_blank"
							rel="noopener noreferrer"
							className="text-main underline underline-offset-2"
						>
							GitHub
						</Link>
						.
					</p>
				</div>

				<Link
					href="/"
					className="bg-main text-bg mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium no-underline transition-opacity hover:opacity-90"
				>
					Open the map
					<ArrowRight size={16} />
				</Link>
			</div>
		</div>
	);
}
