'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Combobox from '@/components/ui/Combobox';
import { Equipment } from '@/types/equipment';
import {
	fetchEquipmentBrands,
	fetchEquipmentSeries,
	fetchBestInClassCategories,
	createEquipment,
	uploadEquipmentImage,
	rateEquipment,
	setBestInClass
} from '@/lib/api';
import type { BestInClassCategory } from '@/types/bestInClass';
import ImageTile from './ImageTile';
import TypeButtons from './TypeButtons';
import ResistanceButtons from './ResistanceButtons';
import RatingRow from './RatingRow';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { getEquipmentCategorySuggestions } from '@/lib/equipment-categories';

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
	onCreated: (equipment: Equipment) => void;
};

// ── Constants ────────────────────────────────────────────────────────────────

const tileCls = 'border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3';
const labelCls = 'text-sub text-[11px]';
const bareInputCls =
	'bg-transparent text-main placeholder:text-sub w-full border-none outline-none font-[inherit]';
const metaComboInputCls =
	'bg-transparent text-sub placeholder:text-sub border-none outline-none font-[inherit] text-xs';

const toSlug = (str: string) =>
	str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

// ── Subcomponents ────────────────────────────────────────────────────────────

function SubmitButton({
	isValid,
	isCreating,
	onClick,
	className = ''
}: {
	isValid: boolean;
	isCreating: boolean;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={!isValid || isCreating}
			className={`bg-main text-bg flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
		>
			{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
			{isCreating ? 'Creating...' : 'Create machine'}
		</button>
	);
}

function BrandSeriesRow({
	brand,
	series,
	brands,
	seriesOptions,
	brandsLoading,
	seriesLoading,
	onBrandChange,
	onSeriesChange
}: {
	brand: string;
	series: string;
	brands: string[];
	seriesOptions: string[];
	brandsLoading: boolean;
	seriesLoading: boolean;
	onBrandChange: (val: string) => void;
	onSeriesChange: (val: string) => void;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<Combobox
				value={brand}
				onChange={onBrandChange}
				options={brands}
				placeholder="Brand"
				loading={brandsLoading}
				inputClassName={`${metaComboInputCls} w-24`}
			/>
			<span className="text-sub text-xs">·</span>
			<Combobox
				value={series}
				onChange={onSeriesChange}
				options={seriesOptions}
				placeholder="Series"
				loading={seriesLoading}
				inputClassName={`${metaComboInputCls} w-24`}
			/>
		</div>
	);
}

function MuscleGroupButtons({
	categories,
	selectedIds,
	onToggle,
	loading
}: {
	categories: BestInClassCategory[];
	selectedIds: number[];
	onToggle: (id: number) => void;
	loading: boolean;
}) {
	if (loading) {
		return <p className="text-sub mt-2 text-xs">Loading muscle groups...</p>;
	}

	return (
		<div className="mt-2 flex flex-wrap gap-2">
			{categories.map((category) => {
				const selected = selectedIds.includes(category.id);
				return (
					<button
						key={category.id}
						type="button"
						onClick={() => onToggle(category.id)}
						className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
							selected
								? 'bg-main text-bg border-transparent'
								: 'border-border text-sub hover:text-main'
						}`}
					>
						{category.name}
					</button>
				);
			})}
			{categories.length === 0 && (
				<p className="text-sub py-1 text-xs">No muscle groups available yet.</p>
			)}
		</div>
	);
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function NewMachineCard({ onCreated }: Props) {
	const { addToast } = useToastContext();
	const { requireAuth } = useAuthGate();

	const [brand, setBrand] = useState('');
	const [series, setSeries] = useState('');
	const [name, setName] = useState('');
	const [type, setType] = useState<Equipment['type'] | null>(null);
	const [resistance, setResistance] = useState<Equipment['resistance_profile'] | null>(null);
	const [userRating, setUserRating] = useState(0);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	const [brands, setBrands] = useState<string[]>([]);
	const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
	const [brandsLoading, setBrandsLoading] = useState(true);
	const [seriesLoading, setSeriesLoading] = useState(false);
	const [muscleGroups, setMuscleGroups] = useState<BestInClassCategory[]>([]);
	const [muscleGroupsLoading, setMuscleGroupsLoading] = useState(true);
	const [selectedMuscleIds, setSelectedMuscleIds] = useState<number[]>([]);

	useEffect(() => {
		let cancelled = false;

		fetchEquipmentBrands()
			.then((data) => {
				if (!cancelled) setBrands(data ?? []);
			})
			.catch(() => {
				if (!cancelled) addToast('Failed to load brands', 'error');
			})
			.finally(() => {
				if (!cancelled) setBrandsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [addToast]);

	useEffect(() => {
		let cancelled = false;

		fetchBestInClassCategories()
			.then((data) => {
				if (!cancelled) {
					setMuscleGroups(
						(data.categories ?? []).filter((category) => category.type === 'muscle_group')
					);
				}
			})
			.catch(() => {
				if (!cancelled) addToast('Failed to load muscle groups', 'error');
			})
			.finally(() => {
				if (!cancelled) setMuscleGroupsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [addToast]);

	useEffect(() => {
		let cancelled = false;
		const matched = brands.find((b) => b.toLowerCase() === brand.toLowerCase());

		if (!brand.trim() || !matched) {
			queueMicrotask(() => {
				if (cancelled) return;
				setSeriesOptions([]);
				if (!brand.trim()) setSeries('');
			});

			return () => {
				cancelled = true;
			};
		}

		queueMicrotask(() => {
			if (!cancelled) setSeriesLoading(true);
		});

		fetchEquipmentSeries(matched)
			.then((data) => {
				if (!cancelled) setSeriesOptions(data ?? []);
			})
			.catch(() => {
				if (!cancelled) addToast('Failed to load series', 'error');
			})
			.finally(() => {
				if (!cancelled) setSeriesLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [brand, brands, addToast]);

	useEffect(() => {
		if (muscleGroupsLoading) return;
		const suggested = getEquipmentCategorySuggestions(name);
		if (!suggested) {
			setSelectedMuscleIds([]);
			return;
		}
		const ids = muscleGroups
			.filter((mg) => suggested.muscles.includes(mg.name))
			.map((mg) => mg.id);
		setSelectedMuscleIds(ids);
	}, [name, muscleGroups, muscleGroupsLoading]);

	const slug = [brand, series, name].filter(Boolean).map(toSlug).join('-');
	const isValid = !!name && !!brand && !!series && !!type;

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setImagePreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const handleBrandChange = (val: string) => {
		setBrand(val);
		setSeries('');
	};

	const toggleMuscleGroup = (id: number) => {
		setSelectedMuscleIds((current) =>
			current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
		);
	};

	const handleCreate = async () => {
		if (!isValid || isCreating) return;
		if (!requireAuth('add a machine')) return;
		setIsCreating(true);
		try {
			let failedToAssignMuscles = false;
			const created = await createEquipment({
				name,
				brand,
				series,
				type,
				resistance_profile: resistance || undefined
			});

			if (imageFile && created.id) await uploadEquipmentImage(created.id, imageFile);
			if (userRating > 0 && created.id) await rateEquipment(created.id, userRating);
			if (created.id && selectedMuscleIds.length > 0) {
				try {
					await Promise.all(selectedMuscleIds.map((categoryId) => setBestInClass(categoryId, created.id)));
				} catch (error) {
					console.error('Failed to assign muscle groups:', error);
					failedToAssignMuscles = true;
				}
			}

			onCreated(created);
			addToast(
				failedToAssignMuscles
					? `"${brand} ${series} ${name}" submitted, but muscle groups failed to save`
					: `"${brand} ${series} ${name}" submitted for review`,
				failedToAssignMuscles ? 'error' : 'success'
			);

			setBrand('');
			setSeries('');
			setName('');
			setType(null);
			setResistance(null);
			setUserRating(0);
			setImageFile(null);
			setImagePreview(null);
			setSelectedMuscleIds([]);
		} catch (error) {
			console.error(error);
			addToast('Failed to create equipment', 'error');
		} finally {
			setIsCreating(false);
		}
	};

	const brandSeriesProps = {
		brand,
		series,
		brands,
		seriesOptions,
		brandsLoading,
		seriesLoading,
		onBrandChange: handleBrandChange,
		onSeriesChange: setSeries
	};

	const submitProps = { isValid, isCreating, onClick: handleCreate };

	return (
		<div className="mx-auto w-full max-w-2xl">
			{/* ── Desktop Layout ── */}
			<div className="hidden flex-col gap-3 sm:flex">
				<div className="grid grid-cols-2 gap-3">
					<ImageTile
						preview={imagePreview}
						onImageChange={handleImageChange}
						className="aspect-square w-full"
					/>

					<div className="flex flex-col gap-3">
						<div className="border-border bg-surface flex flex-1 flex-col justify-between rounded-2xl border p-5">
							<div className="flex flex-col gap-3">
								<BrandSeriesRow {...brandSeriesProps} />
								<input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Machine name"
									className={`${bareInputCls} text-main text-2xl font-semibold leading-tight`}
								/>
							</div>
							{slug && <p className="text-sub mt-2 truncate text-[11px]">{slug}</p>}
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className={tileCls}>
								<p className={labelCls}>type</p>
								<TypeButtons type={type} setType={setType} col />
							</div>
							<div className={tileCls}>
								<p className={labelCls}>resistance</p>
								<ResistanceButtons resistance={resistance} setResistance={setResistance} col />
							</div>
						</div>
					</div>
				</div>

				<div className={tileCls}>
					<p className={labelCls}>muscle groups</p>
					<MuscleGroupButtons
						categories={muscleGroups}
						selectedIds={selectedMuscleIds}
						onToggle={toggleMuscleGroup}
						loading={muscleGroupsLoading}
					/>
				</div>

				<div className="border-border bg-sub-alt flex items-center gap-4 rounded-2xl border px-4 py-3">
					<p className={`${labelCls} shrink-0`}>your rating</p>
					<RatingRow rating={userRating} setRating={setUserRating} />
				</div>

				<SubmitButton {...submitProps} />
			</div>

			{/* ── Mobile Stack Layout ── */}
			<div className="flex flex-col gap-3 sm:hidden">
				<ImageTile
					preview={imagePreview}
					onImageChange={handleImageChange}
					className="aspect-square w-full"
				/>

				<div className="border-border bg-surface flex flex-col justify-between rounded-2xl border p-5">
					<div className="flex flex-col gap-3">
						<BrandSeriesRow {...brandSeriesProps} />
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Machine name"
							className={`${bareInputCls} text-main text-2xl font-semibold leading-tight`}
						/>
					</div>
					{slug && <p className="text-sub mt-2 truncate text-[11px]">{slug}</p>}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className={tileCls}>
						<p className={labelCls}>type</p>
						<TypeButtons type={type} setType={setType} col />
					</div>
					<div className={tileCls}>
						<p className={labelCls}>resistance</p>
						<ResistanceButtons resistance={resistance} setResistance={setResistance} col />
					</div>
				</div>

				<div className={tileCls}>
					<p className={labelCls}>muscle groups</p>
					<MuscleGroupButtons
						categories={muscleGroups}
						selectedIds={selectedMuscleIds}
						onToggle={toggleMuscleGroup}
						loading={muscleGroupsLoading}
					/>
				</div>

				<div className="border-border bg-sub-alt flex items-center gap-4 rounded-2xl border px-4 py-3">
					<p className={`${labelCls} shrink-0`}>your rating</p>
					<RatingRow
						rating={userRating}
						setRating={setUserRating}
					/>
				</div>

				<SubmitButton {...submitProps} />
			</div>
		</div>
	);
}
