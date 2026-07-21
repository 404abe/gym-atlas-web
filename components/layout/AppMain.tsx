'use client';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const MARKETING_ROUTES = ['/', '/about'];

export default function AppMain({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isMarketing = MARKETING_ROUTES.includes(pathname ?? '');

	return (
		<main className={cn('min-h-0 flex-1 overflow-y-auto', !isMarketing && 'md:pt-17')}>
			{children}
		</main>
	);
}
