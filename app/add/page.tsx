'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link2, Dumbbell, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchGyms, fetchAllEquipment } from '@/lib/api';
import type { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';
import AssignEquipmentCard from './_components/AssignEquipmentCard';
import NewMachineCard from './_components/NewMachineCard';
import NewGymCard from './_components/NewGymCard';

type Tab = 'assign' | 'newMachine' | 'newGym';

const TABS: { key: Tab; label: string; icon: typeof Link2 }[] = [
	{ key: 'assign', label: 'Assign', icon: Link2 },
	{ key: 'newMachine', label: 'Machine', icon: Dumbbell },
	{ key: 'newGym', label: 'Gym', icon: Building2 }
];

function AddPageInner() {
	const searchParams = useSearchParams();
	const equipmentIdParam = searchParams.get('equipmentId');
	const tabParam = searchParams.get('tab');
	const initialTab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : 'assign';

	const [tab, setTab] = useState<Tab>(initialTab);
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [equipment, setEquipment] = useState<Equipment[]>([]);

	useEffect(() => {
		Promise.all([fetchGyms(), fetchAllEquipment()])
			.then(([g, e]) => {
				setGyms(g);
				setEquipment(e);
			})
			.catch(() => {});
	}, []);

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-8">
			<h1 className="text-main mb-1 text-2xl font-semibold tracking-tight">Add to library</h1>
			<p className="text-sub mb-6 text-sm">Manage gyms, equipment, and their relationships</p>

			{/* Segmented control */}
			<div className="bg-main/5 mb-6 flex w-fit gap-1 rounded-full p-1">
				{TABS.map(({ key, label, icon: Icon }) => {
					const active = tab === key;
					return (
						<button
							key={key}
							type="button"
							onClick={() => setTab(key)}
							className={cn(
								'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition',
								active ? 'bg-surface text-main shadow-sm' : 'text-sub hover:text-main'
							)}
						>
							<Icon className="h-3.5 w-3.5" />
							{label}
						</button>
					);
				})}
			</div>

			{/* Panels stay mounted so in-progress input survives switching tabs */}
			<div className={tab === 'assign' ? '' : 'hidden'}>
				<AssignEquipmentCard
					gyms={gyms}
					equipment={equipment}
					preselectedEquipmentId={equipmentIdParam ? Number(equipmentIdParam) : undefined}
				/>
			</div>
			<div className={tab === 'newMachine' ? '' : 'hidden'}>
				<NewMachineCard onCreated={() => {}} />
			</div>
			<div className={tab === 'newGym' ? '' : 'hidden'}>
				<NewGymCard onCreated={() => {}} />
			</div>
		</div>
	);
}

export default function AddPage() {
	return (
		<Suspense>
			<AddPageInner />
		</Suspense>
	);
}
