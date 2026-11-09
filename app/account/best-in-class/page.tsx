'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToastContext } from '@/app/contexts/ToastContext';
import {
	fetchAllEquipment,
	fetchBestInClassCategories,
	fetchUserBestInClass,
	setBestInClass,
	removeBestInClass
} from '@/lib/api';
import { Trophy, Plus, X, Dumbbell } from 'lucide-react';
import { BestInClassCategory as Category } from '@/types/bestInClass';
import type { Equipment } from '@/types/equipment';
import BestInClassPicker from './BestInClassPicker';

type BestInClass = {
	id: number;
	category_name: string;
	category_slug: string;
	category_type: 'exercise' | 'muscle_group';
	equipment_id: number;
	brand: string;
	series?: string;
	equipment_name: string;
	image_url?: string;
};

export default function BestInClassPage() {
	const { user } = useAuth();
	const { addToast } = useToastContext();
	const [tab, setTab] = useState<'exercise' | 'muscle_group'>('exercise');
	const [categories, setCategories] = useState<Category[]>([]);
	const [selections, setSelections] = useState<BestInClass[]>([]);
	const [loading, setLoading] = useState(true);

	// Machine picker
	const [pickerCategory, setPickerCategory] = useState<Category | null>(null);
	const [equipment, setEquipment] = useState<Equipment[] | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!user) return;
		Promise.all([fetchBestInClassCategories(), fetchUserBestInClass(user.id)])
			.then(([catData, bicData]) => {
				setCategories(catData.categories ?? []);
				setSelections((bicData.best_in_class as unknown as BestInClass[]) ?? []);
			})
			.finally(() => setLoading(false));
	}, [user]);

	const openPicker = (cat: Category) => {
		setPickerCategory(cat);
		// Machines load the first time a slot is opened, then stay cached.
		if (equipment === null) {
			fetchAllEquipment()
				.then(setEquipment)
				.catch(() => {
					addToast('Could not load machines', 'error');
					setPickerCategory(null);
				});
		}
	};

	const handleSelect = async (equipmentId: number) => {
		if (!pickerCategory || !user) return;
		setSaving(true);
		try {
			await setBestInClass(pickerCategory.id, equipmentId);
			const updated = await fetchUserBestInClass(user.id);
			setSelections((updated.best_in_class as unknown as BestInClass[]) ?? []);
			setPickerCategory(null);
		} catch {
			addToast('Could not save your pick', 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleRemove = async (categoryId: number) => {
		await removeBestInClass(categoryId);
		const updated = await fetchUserBestInClass(user!.id);
		setSelections((updated.best_in_class as unknown as BestInClass[]) ?? []);
	};

	const filtered = categories.filter((c) => c.type === tab);

	if (loading) return <p className="text-sub text-sm">Loading...</p>;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center gap-2">
				<Trophy className="h-4 w-4 text-amber-400" />
				<h2 className="text-main text-sm font-semibold">Best in Class</h2>
				<span className="bg-main/10 text-sub rounded-full px-2 py-0.5 text-xs">
					{selections.length}
				</span>
			</div>

			{/* Tabs */}
			<div className="bg-main/5 flex w-fit items-center rounded-xl p-1">
				<button
					onClick={() => setTab('exercise')}
					className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
						tab === 'exercise' ? 'bg-main text-bg' : 'text-sub hover:text-main'
					}`}
				>
					Movement
				</button>
				<button
					onClick={() => setTab('muscle_group')}
					className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
						tab === 'muscle_group' ? 'bg-main text-bg' : 'text-sub hover:text-main'
					}`}
				>
					Muscle Group
				</button>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{filtered.map((cat) => {
					const sel = selections.find((s) => s.category_slug === cat.slug);
					return sel ? (
						// Filled slot: tap to change, X to remove
						<div key={cat.id} className="bg-sub-alt hover:bg-main/5 group relative rounded-xl transition">
							<button
								type="button"
								onClick={() => openPicker(cat)}
								aria-label={`Change best ${cat.name}`}
								className="block w-full rounded-xl p-3 text-left"
							>
								{sel.image_url ? (
									<div className="bg-surface relative mb-2 aspect-square w-full overflow-hidden rounded-lg">
										<Image
											src={sel.image_url}
											alt={sel.equipment_name}
											fill
											sizes="(max-width: 640px) 45vw, 340px"
											className="object-contain"
										/>
									</div>
								) : (
									<div className="bg-main/5 mb-2 flex aspect-square w-full items-center justify-center rounded-lg">
										<Dumbbell className="text-sub h-5 w-5 opacity-30" />
									</div>
								)}
								<p className="text-sub text-[10px] uppercase tracking-wide">{cat.name}</p>
								<p className="text-main mt-0.5 text-xs font-medium leading-tight">
									{sel.brand} {sel.equipment_name}
								</p>
							</button>
							<button
								type="button"
								onClick={() => handleRemove(cat.id)}
								aria-label={`Remove best ${cat.name}`}
								className="bg-bg/80 absolute right-2 top-2 hidden rounded-full p-0.5 group-hover:flex"
							>
								<X className="text-sub h-3 w-3" />
							</button>
						</div>
					) : (
						// Empty slot: opens the machine picker
						<button
							key={cat.id}
							type="button"
							onClick={() => openPicker(cat)}
							aria-label={`Choose best ${cat.name}`}
							className="bg-sub-alt hover:bg-main/5 group flex flex-col items-center justify-center gap-2 rounded-xl p-3 transition"
							style={{ minHeight: '120px' }}
						>
							<div className="bg-main/10 group-hover:bg-main/20 flex h-8 w-8 items-center justify-center rounded-full transition">
								<Plus className="text-sub h-4 w-4" />
							</div>
							<p className="text-sub text-[10px] uppercase tracking-wide">{cat.name}</p>
						</button>
					);
				})}
			</div>

			{pickerCategory && (
				<BestInClassPicker
					category={pickerCategory}
					equipment={equipment}
					currentEquipmentId={selections.find((s) => s.category_slug === pickerCategory.slug)?.equipment_id}
					saving={saving}
					onClose={() => setPickerCategory(null)}
					onConfirm={handleSelect}
				/>
			)}
		</div>
	);
}
