//app/layout.tsx
import './globals.css';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import Providers from '@/app/contexts/Providers';
import Header from '@/components/layout/Header';
import ApiWakeUp from '@/components/ApiWakeUp';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full">
			<body id="app" style={{ height: '100dvh', overflow: 'hidden' }}>
				<Providers>
					<ApiWakeUp />
					<div className="flex h-full flex-col">
						<Topbar />
						{/* <Header/> */}
						<main className="md:pt-17 min-h-0 flex-1 overflow-y-auto">{children}</main>
						<BottomNav />
						<Footer />
					</div>
				</Providers>
			</body>
		</html>
	);
}
