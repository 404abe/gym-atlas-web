//app/layout.tsx
import './globals.css';
import Topbar from '@/components/layout/Topbar';
import MobileHeader from '@/components/layout/MobileHeader';
import Footer from '@/components/layout/Footer';
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
						<main className="md:pt-17 min-h-0 flex-1 overflow-y-auto">{children}</main>
						<Footer />
					</div>
				</Providers>
			</body>
		</html>
	);
}
