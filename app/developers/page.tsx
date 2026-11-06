import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import MarketingHeader from '@/components/layout/MarketingHeader';
import ApiDemo from '@/components/developers/ApiDemo';

const dmSans = DM_Sans({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const mono = jetbrainsMono.className;

export const metadata = {
	title: 'Gym Atlas API: coming soon',
	description:
		'The Gym Atlas API is coming soon: query gyms and per-machine equipment data from your own app.'
};

export default function DevelopersPage() {
	return (
		<div className={`${dmSans.className} flex min-h-full flex-col`}>
			<MarketingHeader bordered={false} />

			<main className="mx-auto w-full max-w-[1100px] px-6 pb-24 pt-14 md:pt-20">
				<div className="flex flex-col items-center text-center">
					<h1 className="text-main text-[clamp(48px,8vw,96px)] font-semibold leading-none tracking-[-0.045em]">
						API
					</h1>
					<p className={`${mono} text-sub mt-5 text-sm`}>Coming soon</p>
				</div>

				<div className="mt-14 md:mt-20">
					<ApiDemo mono={mono} />
				</div>
			</main>
		</div>
	);
}
