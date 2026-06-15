'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import {
	fetchBestInClassCategories,
	fetchUserBestInClass,
	searchEquipment,
	setBestInClass,
	removeBestInClass
} from '@/lib/api';
import { Trophy, Plus, X, Search, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { BestInClassCategory as Category } from '@/types/bestInClass';

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
type EquipmentResult = { id: number; name: string; brand: string; series?: string; slug: string };

export default function BestInClassPage() {
	const { user } = useAuth();
	const [tab, setTab] = useState<'exercise' | 'muscle_group'>('exercise');
	const [categories, setCategories] = useState<Category[]>([]);
	const [selections, setSelections] = useState<BestInClass[]>([]);
	const [loading, setLoading] = useState(true);

	// Search modal state
	const [modalCategory, setModalCategory] = useState<Category | null>(null);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<EquipmentResult[]>([]);
	const [searching, setSearching] = useState(false);

	useEffect(() => {
		if (!user) return;
		Promise.all([fetchBestInClassCategories(), fetchUserBestInClass(user.id)])
			.then(([catData, bicData]) => {
				setCategories(catData.categories ?? []);
				setSelections((bicData.best_in_class as unknown as BestInClass[]) ?? []);
			})
			.finally(() => setLoading(false));
	}, [user]);

	// Debounced search
	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}
		const t = setTimeout(async () => {
			setSearching(true);
			const data = await searchEquipment(query);
			setResults((data as EquipmentResult[]) ?? []);
			setSearching(false);
		}, 300);
		return () => clearTimeout(t);
	}, [query]);

	const handleSelect = async (equipmentId: number) => {
		if (!modalCategory) return;
		await setBestInClass(modalCategory.id, equipmentId);
		const updated = await fetchUserBestInClass(user!.id);
		setSelections((updated.best_in_class as unknown as BestInClass[]) ?? []);
		setModalCategory(null);
		setQuery('');
		setResults([]);
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
						// Filled slot
						<div key={cat.id} className="bg-sub-alt group relative rounded-xl p-3">
							<button
								onClick={() => handleRemove(cat.id)}
								className="bg-bg/80 absolute right-2 top-2 hidden rounded-full p-0.5 group-hover:flex"
							>
								<X className="text-sub h-3 w-3" />
							</button>
							{sel.image_url ? (
								<img
									src={sel.image_url}
									alt={sel.equipment_name}
									className="mb-2 h-16 w-full rounded-lg object-cover"
								/>
							) : (
								<div className="bg-main/5 mb-2 flex h-16 w-full items-center justify-center rounded-lg">
									<Dumbbell className="text-sub h-5 w-5 opacity-30" />
								</div>
							)}
							<p className="text-sub text-[10px] uppercase tracking-wide">{cat.name}</p>
							<p className="text-main mt-0.5 text-xs font-medium leading-tight">
								{sel.brand} {sel.equipment_name}
							</p>
						</div>
					) : (
						// Empty slot
						<Link
							key={cat.id}
							href={`/data?bic=${cat.slug}`}
							className="bg-sub-alt hover:bg-main/5 group flex flex-col items-center justify-center gap-2 rounded-xl p-3 transition"
							style={{ minHeight: '120px' }}
						>
							<div className="bg-main/10 group-hover:bg-main/20 flex h-8 w-8 items-center justify-center rounded-full transition">
								<Plus className="text-sub h-4 w-4" />
							</div>
							<p className="text-sub text-[10px] uppercase tracking-wide">{cat.name}</p>
						</Link>
					);
				})}
			</div>

			{/* Search Modal */}
			{modalCategory && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					onClick={() => {
						setModalCategory(null);
						setQuery('');
						setResults([]);
					}}
				>
					<div
						className="bg-bg border-border w-full max-w-md rounded-2xl border p-4 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<p className="text-main text-sm font-semibold">
								Best for <span className="text-amber-400">{modalCategory.name}</span>
							</p>
							<button
								onClick={() => {
									setModalCategory(null);
									setQuery('');
									setResults([]);
								}}
							>
								<X className="text-sub h-4 w-4" />
							</button>
						</div>

						{/* Search input */}
						<div className="bg-sub-alt flex items-center gap-2 rounded-xl px-3 py-2">
							<Search className="text-sub h-4 w-4 shrink-0" />
							<input
								autoFocus
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search equipment..."
								className="text-main placeholder:text-sub w-full bg-transparent text-sm outline-none"
							/>
						</div>

						{/* Results */}
						<div className="mt-2 max-h-64 overflow-y-auto">
							{searching && <p className="text-sub py-4 text-center text-xs">Searching...</p>}
							{!searching && query && results.length === 0 && (
								<p className="text-sub py-4 text-center text-xs">No equipment found</p>
							)}
							{!searching && !query && (
								<p className="text-sub py-4 text-center text-xs">Type to search equipment</p>
							)}
							{results.map((eq) => (
								<button
									key={eq.id}
									onClick={() => handleSelect(eq.id)}
									className="hover:bg-sub-alt flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
								>
									<div>
										<p className="text-main text-sm font-medium">{eq.name}</p>
										<p className="text-sub text-xs">
											{eq.brand}
											{eq.series ? ` · ${eq.series}` : ''}
										</p>
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
