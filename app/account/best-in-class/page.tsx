'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import {
	fetchBestInClassCategories,
	fetchUserBestInClass,
	searchEquipment,
	setBestInClass,
	removeBestInClass
} from '@/lib/api';
import { Plus, X, Search, Dumbbell } from 'lucide-react';
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
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<p className="text-sub text-xs uppercase tracking-wide">Best in Class · {selections.length}</p>

				{/* Tabs */}
				<div className="bg-main/5 flex w-fit items-center rounded-lg p-0.5">
					<button
						onClick={() => setTab('exercise')}
						className={`rounded-md px-3 py-1 text-xs font-medium transition ${
							tab === 'exercise' ? 'bg-main text-bg' : 'text-sub hover:text-main'
						}`}
					>
						Movement
					</button>
					<button
						onClick={() => setTab('muscle_group')}
						className={`rounded-md px-3 py-1 text-xs font-medium transition ${
							tab === 'muscle_group' ? 'bg-main text-bg' : 'text-sub hover:text-main'
						}`}
					>
						Muscle Group
					</button>
				</div>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
				{filtered.map((cat) => {
					const sel = selections.find((s) => s.category_slug === cat.slug);
					return sel ? (
						// Filled slot
						<div key={cat.id} className="group">
							<div className="bg-sub-alt relative aspect-square overflow-hidden rounded-lg">
								{sel.image_url ? (
									<Image
										src={sel.image_url}
										alt={sel.equipment_name}
										fill
										sizes="(max-width: 640px) 45vw, 200px"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<Dumbbell className="text-sub h-6 w-6 opacity-30" />
									</div>
								)}
								<button
									onClick={() => handleRemove(cat.id)}
									aria-label="Remove"
									className="bg-bg/80 absolute right-2 top-2 hidden rounded-full p-1 group-hover:flex"
								>
									<X className="text-sub h-3 w-3" />
								</button>
							</div>
							<p className="text-sub mt-2 text-[10px] uppercase tracking-wide">{cat.name}</p>
							<p className="text-main mt-0.5 text-xs font-medium leading-tight">
								{sel.brand} {sel.equipment_name}
							</p>
						</div>
					) : (
						// Empty slot
						<Link key={cat.id} href={`/data?bic=${cat.slug}`} className="group flex flex-col">
							<div className="border-border group-hover:border-main/40 flex aspect-square items-center justify-center rounded-lg border border-dashed transition">
								<Plus className="text-sub group-hover:text-main h-5 w-5 transition" />
							</div>
							<p className="text-sub mt-2 text-[10px] uppercase tracking-wide">{cat.name}</p>
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
								aria-label="Close"
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
									className="hover:bg-sub-alt/50 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
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
