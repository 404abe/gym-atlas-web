'use client';

import { ChevronUp, ChevronDown, Heart, Search } from 'lucide-react';
import { FaExpandAlt, FaHashtag } from 'react-icons/fa';
import Image from 'next/image';
import ResistanceProfile from '@/components/ui/ResistanceProfile';
import RatingStars from '@/components/ui/RatingStars';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { Equipment } from '@/types/equipment';
import Link from 'next/link';

type SortField = 'id' | 'brand' | 'name' | 'resistance_profile' | 'rating';

type Props = {
	equipment: Equipment[];
	viewMode: 'expanded' | 'compact';
	sortField: SortField;
	sortDirection: 'asc' | 'desc';
	onSort: (field: SortField) => void;
	onToggleFavorite: (id: number) => void;
	onUpdateRating: (id: number, rating: number) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
};

function SortIcon({ field, sortField, sortDirection }: { field: string; sortField: string; sortDirection: 'asc' | 'desc' }) {
	if (sortField !== field) return null;
	return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
}

function TypeBadge({ type, short }: { type: Equipment['type']; short?: boolean }) {
	return (
		<span className="bg-main/10 text-sub inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
			{type === 'pin_loaded' ? (short ? 'Pin' : 'Pin loaded') : (short ? 'Plate' : 'Plate loaded')}
		</span>
	);
}

type RowProps = {
	item: Equipment;
	index?: number;
	onToggleFavorite: (id: number) => void;
	onUpdateRating: (id: number, rating: number) => void;
};

function ExpandedRow({ item: e, index = 0, onToggleFavorite, onUpdateRating }: RowProps) {
	return (
		<tr>
			<td colSpan={9} className="px-2 py-1">
				<div
					className={`flex items-center gap-3 rounded-xl px-4 py-3 ${index % 2 === 0 ? 'bg-sub-alt' : ''}`}
				>
					<div className="bg-main/5 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
						{e.image_url ? (
							<Image src={e.image_url} alt={e.name} fill sizes="56px" className="object-cover" />
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<span className="text-sub text-xs">No img</span>
							</div>
						)}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-main text-sm font-semibold">{e.name || '—'}</p>
							<TypeBadge type={e.type} short />
						</div>
						<p className="text-sub text-xs">
							{[e.brand, e.series].filter(Boolean).join(' · ')}
						</p>
						<div className="mt-1 hidden sm:block">
							<ResistanceProfile profile={e.resistance_profile} curve={e.resistance_curve} />
						</div>
					</div>

					<div className="hidden shrink-0 sm:block">
						<RatingStars
							avgRating={Number(e.avg_rating) || 0}
							userRating={Number(e.user_rating) || undefined}
							onRate={(rating) => onUpdateRating(e.id, rating)}
						/>
					</div>

					<div className="text-sub shrink-0 text-sm sm:hidden">
						{e.avg_rating ? Number(e.avg_rating).toFixed(1) : '—'}
					</div>

					<div className="flex shrink-0 items-center gap-1">
						<FavoriteButton
							isFavorite={e.is_favorite}
							onToggle={() => onToggleFavorite(e.id)}
						/>
						<Link
							href={`/equipment/${e.id}`}
							className="text-sub hover:text-main flex items-center justify-center rounded-lg p-1 transition"
						>
							<FaExpandAlt className="h-3.5 w-3.5" />
						</Link>
					</div>
				</div>
			</td>
		</tr>
	);
}

function CompactRow({ item: e, onToggleFavorite, onUpdateRating }: RowProps) {
	return (
		<tr className="group transition-colors">
			<td className="px-2 py-3 sm:px-4">
				<FavoriteButton
					isFavorite={e.is_favorite}
					onToggle={() => onToggleFavorite(e.id)}
				/>
			</td>
			<td className="text-sub hidden px-2 py-3 text-sm sm:table-cell sm:px-4">{e.id}</td>
			<td className="px-2 py-3 sm:hidden">
				<p className="text-text text-sm font-medium">{e.name || '—'}</p>
				<p className="text-sub text-xs">
					{[e.brand, e.series].filter(Boolean).join(' · ')}
				</p>
			</td>
			<td className="text-text hidden px-2 py-3 text-sm font-medium sm:table-cell sm:px-4">
				{e.brand || '—'}
			</td>
			<td className="text-sub hidden px-2 py-3 text-sm md:table-cell md:px-4">
				{e.series || '—'}
			</td>
			<td className="text-text hidden px-2 py-3 text-sm sm:table-cell sm:px-4">
				{e.name || '—'}
			</td>
			<td className="hidden px-2 py-3 md:table-cell md:px-4">
				<TypeBadge type={e.type} />
			</td>
			<td className="hidden px-2 py-3 lg:table-cell lg:px-4">
				<ResistanceProfile profile={e.resistance_profile} curve={e.resistance_curve} />
			</td>
			<td className="px-2 py-3 sm:px-4">
				<span className="text-sub text-sm sm:hidden">
					{e.avg_rating ? Number(e.avg_rating).toFixed(1) : '—'}
				</span>
				<span className="hidden sm:block">
					<RatingStars
						avgRating={Number(e.avg_rating) || 0}
						userRating={Number(e.user_rating) || undefined}
						onRate={(rating) => onUpdateRating(e.id, rating)}
					/>
				</span>
			</td>
			<td className="px-2 py-3">
				<Link
					href={`/equipment/${e.id}`}
					className="text-sub hover:text-main flex items-center justify-center rounded-lg p-1 transition"
				>
					<FaExpandAlt className="h-3.5 w-3.5" />
				</Link>
			</td>
		</tr>
	);
}

export default function EquipmentTable({
	equipment,
	viewMode,
	sortField,
	sortDirection,
	onSort,
	onToggleFavorite,
	onUpdateRating,
	hasActiveFilters,
	onClearFilters
}: Props) {
	if (equipment.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="bg-sub-alt mb-3 rounded-full p-4">
					<Search className="text-sub h-8 w-8" />
				</div>
				<p className="text-sub text-sm">No equipment found</p>
				{hasActiveFilters && (
					<button
						onClick={onClearFilters}
						className="text-sub hover:text-text mt-4 text-sm underline"
					>
						Clear all filters
					</button>
				)}
			</div>
		);
	}

	return (
		<table className="w-full table-auto border-separate border-spacing-y-1">
			<thead className={`sticky top-0 ${viewMode === 'expanded' ? 'hidden' : ''}`}>
				<tr className="text-sub text-left text-xs font-medium">
					<th className="w-8 px-2 py-3 sm:w-12 sm:px-4">
						<Heart className="h-3.5 w-3.5" />
					</th>
					<th
						onClick={() => onSort('id')}
						className="hover:text-main hidden w-12 cursor-pointer px-2 py-3 sm:table-cell sm:px-4"
					>
						<div className="flex items-center gap-1">
							<FaHashtag />
							<SortIcon field="id" sortField={sortField} sortDirection={sortDirection} />
						</div>
					</th>
					<th
						onClick={() => onSort('name')}
						className="hover:text-main cursor-pointer px-2 py-3 sm:hidden"
					>
						<div className="flex items-center gap-1">
							Machine <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
						</div>
					</th>
					<th
						onClick={() => onSort('brand')}
						className="hover:text-main hidden cursor-pointer px-2 py-3 sm:table-cell sm:px-4"
					>
						<div className="flex items-center gap-1">
							Brand <SortIcon field="brand" sortField={sortField} sortDirection={sortDirection} />
						</div>
					</th>
					<th className="hidden px-2 py-3 md:table-cell md:px-4">Series</th>
					<th
						onClick={() => onSort('name')}
						className="hover:text-main hidden cursor-pointer px-2 py-3 sm:table-cell sm:px-4"
					>
						<div className="flex items-center gap-1">
							Name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
						</div>
					</th>
					<th className="hidden px-2 py-3 md:table-cell md:px-4">Type</th>
					<th
						onClick={() => onSort('resistance_profile')}
						className="hover:text-main hidden cursor-pointer px-2 py-3 lg:table-cell lg:px-4"
					>
						<div className="flex items-center gap-1">
							Resistance <SortIcon field="resistance_profile" sortField={sortField} sortDirection={sortDirection} />
						</div>
					</th>
					<th
						onClick={() => onSort('rating')}
						className="hover:text-main cursor-pointer px-2 py-3 sm:px-4"
					>
						<div className="flex items-center gap-1">
							Rating <SortIcon field="rating" sortField={sortField} sortDirection={sortDirection} />
						</div>
					</th>
				</tr>
			</thead>
			<tbody
				className={
					viewMode === 'compact'
						? '[&>tr:nth-child(odd)>td]:bg-sub-alt [&>tr>td:first-child]:rounded-l-xl [&>tr>td:last-child]:rounded-r-xl'
						: ''
				}
			>
				{equipment.map((e, index) =>
					viewMode === 'expanded' ? (
						<ExpandedRow key={e.id} item={e} index={index} onToggleFavorite={onToggleFavorite} onUpdateRating={onUpdateRating} />
					) : (
						<CompactRow key={e.id} item={e} onToggleFavorite={onToggleFavorite} onUpdateRating={onUpdateRating} />
					)
				)}
			</tbody>
		</table>
	);
}
