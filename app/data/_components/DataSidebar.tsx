'use client';
import { Building2, Dumbbell, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Category = { id: number; name: string; slug: string; type: 'exercise' | 'muscle_group' };

type DataSidebarProps = {
	gymCount: number;
	equipmentCount: number;
	brandCount: number;
	selectedType?: string;
	selectedCategory?: string;
	activeView: 'equipment' | 'gyms';
	categories: Category[];
	onSelectGymFilter?: () => void;
	onSelectEquipmentFilter?: (filter: string) => void;
	onSelectCategory?: (slug: string) => void;
};

type NavButtonProps = {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
	count?: number;
};

function NavButton({ active, onClick, children, count }: NavButtonProps) {
	return (
		<button
			onClick={onClick}
			className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
				active ? 'bg-main text-bg font-medium' : 'text-sub hover:bg-main/5 hover:text-main'
			}`}
		>
			<span className="flex items-center gap-2">{children}</span>
			{count != null && <span className="text-xs opacity-50">{count}</span>}
		</button>
	);
}

export default function DataSidebar({
	gymCount,
	equipmentCount,
	brandCount,
	selectedType,
	selectedCategory,
	activeView,
	categories,
	onSelectGymFilter,
	onSelectEquipmentFilter,
	onSelectCategory
}: DataSidebarProps) {
	const [catTab, setCatTab] = useState<'exercise' | 'muscle_group'>('exercise');
	const [showCats, setShowCats] = useState(true);

	const filteredCats = categories.filter((c) => c.type === catTab);

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			<div className="flex-1 space-y-3 overflow-y-auto p-3">
				{/* Gyms */}
				<div className="bg-sub-alt rounded-2xl p-3">
					<NavButton
						active={activeView === 'gyms'}
						onClick={() => onSelectGymFilter?.()}
						count={gymCount}
					>
						<Building2 className="h-3.5 w-3.5" />
						All gyms
					</NavButton>
				</div>

				{/* Equipment */}
				<div className="bg-sub-alt space-y-0.5 rounded-2xl p-3">
					<NavButton
						active={activeView === 'equipment' && selectedType === 'all' && (!selectedCategory || selectedCategory === 'all')}
						onClick={() => onSelectEquipmentFilter?.('all')}
						count={equipmentCount}
					>
						<Dumbbell className="h-3.5 w-3.5" />
						All equipment
					</NavButton>
					<NavButton
						active={activeView === 'equipment' && selectedType === 'pin_loaded'}
						onClick={() => onSelectEquipmentFilter?.('pin_loaded')}
					>
						Pin loaded
					</NavButton>
					<NavButton
						active={activeView === 'equipment' && selectedType === 'plate_loaded'}
						onClick={() => onSelectEquipmentFilter?.('plate_loaded')}
					>
						Plate loaded
					</NavButton>
				</div>

				{/* Categories */}
				<div className="bg-sub-alt rounded-2xl p-3">
					<button
						onClick={() => setShowCats((p) => !p)}
						className="text-sub mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-main/5 hover:text-main"
					>
						<span>Filter by category</span>
						<ChevronDown
							className={`text-sub h-3.5 w-3.5 transition-transform ${showCats ? 'rotate-180' : ''}`}
						/>
					</button>

					{showCats && (
						<>
							{/* Tab toggle */}
							<div className="bg-main/5 mb-2 flex items-center rounded-lg p-0.5">
								{(['exercise', 'muscle_group'] as const).map((t) => (
									<button
										key={t}
										onClick={() => setCatTab(t)}
										className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
											catTab === t ? 'bg-main text-bg' : 'text-sub hover:text-main'
										}`}
									>
										{t === 'exercise' ? 'Movement' : 'Muscle'}
									</button>
								))}
							</div>

							{/* Category list */}
							<div className="space-y-0.5">
								{filteredCats.map((cat) => (
									<NavButton
										key={cat.id}
										active={selectedCategory === cat.slug && activeView === 'equipment'}
										onClick={() => {
											onSelectEquipmentFilter?.('all');
											onSelectCategory?.(cat.slug);
										}}
									>
										{cat.name}
									</NavButton>
								))}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="text-sub space-y-1 p-4 text-xs">
				<div className="flex justify-between">
					<span>Total gyms</span>
					<span className="font-medium">{gymCount}</span>
				</div>
				<div className="flex justify-between">
					<span>Total machines</span>
					<span className="font-medium">{equipmentCount}</span>
				</div>
				<div className="flex justify-between">
					<span>Unique brands</span>
					<span className="font-medium">{brandCount}</span>
				</div>
			</div>
		</div>
	);
}
