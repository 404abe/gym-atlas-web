'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Dumbbell, MapPinPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchGyms, fetchAllEquipment } from '@/lib/api';
import type { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';
import AssignEquipmentCard from './_components/AssignEquipmentCard';
import NewMachineCard from './_components/NewMachineCard';
import NewGymCard from './_components/NewGymCard';

type Tab = 'assign' | 'newMachine' | 'newGym';

const TABS: { key: Tab; label: string; short: string; icon: typeof Dumbbell }[] = [
	{ key: 'assign', label: 'Add to a gym', short: 'Add to gym', icon: MapPinPlus },
	{ key: 'newMachine', label: 'New machine', short: 'New machine', icon: Dumbbell },
	{ key: 'newGym', label: 'New gym', short: 'New gym', icon: Building2 }
];

function AddPageInner() {
	const searchParams = useSearchParams();
	const equipmentIdParam = searchParams.get('equipmentId');
	const gymIdParam = searchParams.get('gymId');
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
		<div className={cn('mx-auto w-full px-4 pb-8 pt-6 md:pt-8', tab === 'assign' ? 'max-w-6xl' : 'max-w-2xl')}>
			<div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-main text-[28px] font-semibold tracking-tight md:text-[34px]">Contribute</h1>
					<p className="text-sub mt-1 text-sm md:text-base">
						Add the machines at your gym, or something that&apos;s missing. Everything is reviewed before it goes
						live.
					</p>
				</div>

				{/* Segmented control */}
				<div
					role="tablist"
					aria-label="What are you adding?"
					className="bg-surface grid shrink-0 grid-cols-3 gap-1 rounded-[14px] p-1 md:flex"
				>
					{TABS.map(({ key, label, short, icon: Icon }) => {
						const active = tab === key;
						return (
							<button
								key={key}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => setTab(key)}
								className={cn(
									'flex h-10 items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition md:px-4',
									active ? 'bg-bg text-main shadow-sm' : 'text-sub hover:text-main'
								)}
							>
								<Icon className="hidden h-3.5 w-3.5 md:block" />
								<span className="md:hidden">{short}</span>
								<span className="hidden md:inline">{label}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Panels stay mounted so in-progress input survives switching tabs */}
			<div className={tab === 'assign' ? '' : 'hidden'}>
				<AssignEquipmentCard
					gyms={gyms}
					equipment={equipment}
					preselectedEquipmentId={equipmentIdParam ? Number(equipmentIdParam) : undefined}
					preselectedGymId={gymIdParam ? Number(gymIdParam) : undefined}
					onCreateMachine={() => setTab('newMachine')}
					onCreateGym={() => setTab('newGym')}
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
