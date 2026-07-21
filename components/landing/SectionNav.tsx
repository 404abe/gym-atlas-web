'use client';

import { JetBrains_Mono } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });

const ITEMS = [
	{ id: 'filter', label: 'Filter by equipment' },
	{ id: 'database', label: 'Browse the database' },
	{ id: 'community', label: 'Built by the community' }
] as const;

export default function SectionNav() {
	// scrollIntoView finds the real scroll container (AppMain) itself and
	// honours the scroll-mt-* set on each section, so targets never land under
	// the sticky marketing header. Falls back to native anchor behaviour if the
	// element isn't found.
	const scrollTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		const target = document.getElementById(id);
		if (!target) return;
		event.preventDefault();
		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<nav
			className={`${jetbrainsMono.className} border-border flex items-center gap-6 overflow-x-auto border-y py-4 [scrollbar-width:none] sm:justify-center sm:gap-12 [&::-webkit-scrollbar]:hidden`}
			aria-label="Jump to section"
		>
			{ITEMS.map((item) => (
				<a
					key={item.id}
					href={`#${item.id}`}
					onClick={(event) => scrollTo(event, item.id)}
					className="text-sub hover:text-main flex shrink-0 items-center gap-2 whitespace-nowrap text-[11px] uppercase tracking-[0.14em] no-underline transition-colors"
				>
					<span className="text-accent" aria-hidden="true">
						↓
					</span>
					{item.label}
				</a>
			))}
		</nav>
	);
}
