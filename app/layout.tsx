//app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: {
		default: 'GymAtlas | Find Gyms by the Equipment They Actually Have',
		template: '%s | GymAtlas'
	},
	description:
		'GymAtlas is a community-driven gym discovery platform with per-machine equipment data. Search gyms by brand, machine, and exercise — not just location.'
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
};
import Topbar from '@/components/layout/Topbar';
import MobileHeader from '@/components/layout/MobileHeader';
import Footer from '@/components/layout/Footer';
import AppMain from '@/components/layout/AppMain';
import Providers from '@/app/contexts/Providers';
// import Header from '@/components/layout/Header';
import ApiWakeUp from '@/components/ApiWakeUp';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);})()`
					}}
				/>
			</head>
			<body id="app" style={{ height: '100dvh', overflow: 'hidden' }}>
				<Providers>
					<ApiWakeUp />
					<div className="flex h-full flex-col">
						<Topbar />
						<MobileHeader />
						{/* <Header/> */}
						<AppMain>{children}</AppMain>
						<Footer />
					</div>
				</Providers>
			</body>
		</html>
	);
}
