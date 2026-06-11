'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Combobox from '@/components/ui/Combobox';
import { Equipment } from '@/types/equipment';
import {
	fetchEquipmentBrands,
	fetchEquipmentSeries,
	createEquipment,
	uploadEquipmentImage,
	rateEquipment
} from '@/lib/api';
import ImageTile from './ImageTile';
import TypeButtons from './TypeButtons';
import ResistanceButtons from './ResistanceButtons';
import RatingRow from './RatingRow';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';

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
	const [brandsLoading, setBrandsLoading] = useState(false);
	const [seriesLoading, setSeriesLoading] = useState(false);

	useEffect(() => {
		setBrandsLoading(true);
		fetchEquipmentBrands()
			.then((data) => setBrands(data ?? []))
			.catch(() => addToast('Failed to load brands', 'error'))
			.finally(() => setBrandsLoading(false));
	}, []);

	useEffect(() => {
		const matched = brands.find((b) => b.toLowerCase() === brand.toLowerCase());
		if (!brand.trim() || !matched) {
			setSeriesOptions([]);
			if (!brand.trim()) setSeries('');
			return;
		}
		setSeriesLoading(true);
		fetchEquipmentSeries(matched)
			.then((data) => setSeriesOptions(data ?? []))
			.catch(() => addToast('Failed to load series', 'error'))
			.finally(() => setSeriesLoading(false));
	}, [brand, brands]);

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

	const handleCreate = async () => {
		if (!isValid || isCreating) return;
		if (!requireAuth('add a machine')) return;
		setIsCreating(true);
		try {
			const created = await createEquipment({
				name,
				brand,
				series,
				type,
				resistance_profile: resistance || undefined
			});

			if (imageFile && created.id) await uploadEquipmentImage(created.id, imageFile);
			if (userRating > 0 && created.id) await rateEquipment(created.id, userRating);

			onCreated(created);
			addToast(`"${brand} ${series} ${name}" submitted for review`, 'success');

			setBrand('');
			setSeries('');
			setName('');
			setType(null);
			setResistance(null);
			setUserRating(0);
			setImageFile(null);
			setImagePreview(null);
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
		<div className="w-full">
			{/* ── Desktop Bento Layout ── */}
			<div
				className="hidden sm:grid sm:grid-cols-4 sm:gap-3"
				style={{ gridTemplateRows: '160px 160px auto 56px auto' }}
			>
				<ImageTile
					preview={imagePreview}
					onImageChange={handleImageChange}
					className="col-span-2 row-span-2"
				/>

				<div className="border-border bg-surface col-span-2 row-span-2 flex flex-col justify-between rounded-2xl border p-5">
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

				<div className={`${tileCls} col-span-2`}>
					<p className={labelCls}>type</p>
					<TypeButtons type={type} setType={setType} />
				</div>

				<div className={`${tileCls} col-span-2`}>
					<p className={labelCls}>resistance</p>
					<ResistanceButtons resistance={resistance} setResistance={setResistance} />
				</div>

				<div className="border-border bg-sub-alt col-span-4 flex items-center gap-4 rounded-2xl border px-4 py-3">
					<p className={`${labelCls} shrink-0`}>your rating</p>
					<RatingRow
						rating={userRating}
						setRating={setUserRating}
					/>
				</div>

				<SubmitButton {...submitProps} className="col-span-4" />
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
