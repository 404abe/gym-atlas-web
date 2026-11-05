import type { ReactNode } from 'react';

const DOTS = ['#ff5f57', '#febc2e', '#28c840'];

// macOS-style window chrome for the landing page's feature visuals. Built
// from divs only, and themed through the design tokens so it follows the
// light / dark / alt themes.
export default function AppWindow({
	title,
	children,
	className = ''
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`bg-bg border-border flex flex-col overflow-hidden rounded-[14px] border ${className}`}
			style={{
				boxShadow: '0 24px 48px -12px rgb(0 0 0 / 0.28), 0 6px 16px -6px rgb(0 0 0 / 0.14)'
			}}
		>
			<div className="border-border bg-surface relative flex h-[30px] shrink-0 items-center justify-center border-b">
				<div className="absolute left-[11px] flex gap-2" aria-hidden="true">
					{DOTS.map((color) => (
						<span
							key={color}
							className="block h-3 w-3 rounded-full"
							style={{ background: color, boxShadow: 'inset 0 0 0 0.5px rgb(0 0 0 / 0.12)' }}
						/>
					))}
				</div>
				<span className="text-main/80 truncate px-[58px] text-xs font-semibold">{title}</span>
			</div>
			<div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
		</div>
	);
}
