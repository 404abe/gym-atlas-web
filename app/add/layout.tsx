'use client';
import { usePathname } from 'next/navigation';
import { Building2, Dumbbell, Link2 } from 'lucide-react';
import Link from 'next/link';

export default function AddLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isActive = (href: string) => pathname === href;

	const navItems = [
		{ label: 'Assign Equipment', href: '/add', icon: Link2, iconClass: 'text-green-400' },
		{ label: 'New Machine', href: '/add/machine', icon: Dumbbell, iconClass: 'text-blue-400' },
		{ label: 'New Gym', href: '/add/gym', icon: Building2, iconClass: 'text-purple-400' }
	];

	return (
		<div id="pageAdd" className="content-grid">
			<div className="mb-6">
				<h1 className="text-main text-xl font-semibold">Add to library</h1>
				<p className="text-sub mt-0.5 text-sm">Manage gyms, equipment, and their relationships</p>
			</div>

			<div className="grid grid-cols-12 gap-6">
				{/* Sidebar */}
				<div className="col-span-12 md:col-span-3">
					<div className="bg-sub-alt rounded-2xl p-2">
						{navItems.map(({ label, href, icon: Icon, iconClass }) => (
							<Link
								key={href}
								href={href}
								className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
									isActive(href) ? 'bg-main text-bg' : 'text-sub hover:bg-main/5 hover:text-main'
								}`}
							>
								<Icon className={`h-3.5 w-3.5 ${isActive(href) ? 'text-bg' : iconClass}`} />
								<span className="font-medium">{label}</span>
							</Link>
						))}
					</div>
				</div>

				{/* Content slot */}
				<div className="col-span-12 min-w-0 md:col-span-9">{children}</div>
			</div>
		</div>
	);
}
