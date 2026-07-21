'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { Gym } from '@/types/gym';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { createGym, uploadGymImage } from '@/lib/api';

type Props = {
	onCreated: (gym: Gym) => void;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SearchSuggestion {
	place_name: string;
	center: [number, number];
	context?: Array<{ id: string; text: string }>;
}

export default function NewGymCard({ onCreated }: Props) {
	const { addToast } = useToastContext();
	const { requireAuth } = useAuthGate();
	const [name, setName] = useState('');
	const [address, setAddress] = useState('');
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [city, setCity] = useState('');
	const [country, setCountry] = useState('');

	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (address.length < 3) {
			setSuggestions([]);
			return;
		}

		const delayDebounce = setTimeout(async () => {
			try {
				const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`;
				const res = await fetch(endpoint);
				const data = await res.json();
				if (data.features) {
					setSuggestions(data.features);
				}
			} catch (err) {
				console.error('Error fetching address suggestions:', err);
			}
		}, 300);

		return () => clearTimeout(delayDebounce);
	}, [address]);

	const handleSelectAddress = (suggestion: SearchSuggestion) => {
		setAddress(suggestion.place_name);
		setLng(suggestion.center[0].toString());
		setLat(suggestion.center[1].toString());

		let extractedCity = '';
		let extractedCountry = '';

		suggestion.context?.forEach((ctx) => {
			if (ctx.id.startsWith('place')) extractedCity = ctx.text;
			if (ctx.id.startsWith('country')) extractedCountry = ctx.text;
		});

		setCity(extractedCity);
		setCountry(extractedCountry);
		setShowSuggestions(false);
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setImagePreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const isValid = Boolean(name && lat && lng);

	const handleCreate = async () => {
		if (!isValid || isCreating) return;
		if (!requireAuth('add a gym')) return;
		setIsCreating(true);
		try {
			const created = await createGym({
				name,
				latitude: parseFloat(lat),
				longitude: parseFloat(lng),
				address,
				city,
				country
			});

			if (imageFile && created.id) await uploadGymImage(created.id, imageFile);

			onCreated(created);
			addToast(`"${name}" submitted for review`, 'success');

			setName('');
			setAddress('');
			setLat('');
			setLng('');
			setCity('');
			setCountry('');
			setImageFile(null);
			setImagePreview(null);
		} catch {
			addToast('Failed to create gym', 'error');
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
			{/* Photo upload */}
			<label
				className={`bg-sub-alt border-border relative flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[20px] ${
					imagePreview ? '' : 'border-2 border-dashed'
				}`}
			>
				{imagePreview ? (
					<>
						<img src={imagePreview} alt="gym cover preview" className="absolute inset-0 h-full w-full object-cover" />
						<span className="bg-surface/90 text-main absolute bottom-3 right-3 rounded-lg px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
							Change photo
						</span>
					</>
				) : (
					<>
						<div className="bg-main flex h-13 w-13 items-center justify-center rounded-2xl">
							<MapPin className="text-bg h-6 w-6" />
						</div>
						<div className="text-center">
							<p className="text-main text-base font-semibold">Upload gym profile</p>
							<p className="text-sub mt-0.5 text-xs">Logo or cover · optional</p>
						</div>
					</>
				)}
				<input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
			</label>

			{/* Name */}
			<input
				placeholder="Gym name  ·  e.g. PureGym Glasgow"
				value={name}
				onChange={(e) => setName(e.target.value)}
				className="bg-sub-alt text-main placeholder:text-sub h-14 w-full rounded-2xl border-none px-4.5 text-[17px] font-medium outline-none"
			/>

			{/* Address search */}
			<div ref={wrapperRef} className="relative">
				<div className="bg-sub-alt flex h-14 items-center gap-2.5 rounded-2xl px-4.5">
					<MapPin className="text-sub h-4.5 w-4.5 shrink-0" />
					<input
						placeholder="Search for gym address..."
						value={address}
						onChange={(e) => {
							setAddress(e.target.value);
							setShowSuggestions(true);
						}}
						onFocus={() => setShowSuggestions(true)}
						className="text-main placeholder:text-sub w-full min-w-0 flex-1 border-none bg-transparent text-[15px] outline-none"
						autoComplete="off"
						spellCheck={false}
					/>
				</div>

				{showSuggestions && suggestions.length > 0 && (
					<ul className="bg-surface border-border absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border p-1 shadow-lg">
						{suggestions.map((suggestion, index) => (
							<li
								key={index}
								onMouseDown={() => handleSelectAddress(suggestion)}
								className="text-main hover:bg-sub-alt cursor-pointer rounded-lg px-3 py-2 text-sm transition"
							>
								{suggestion.place_name}
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Resolved info */}
			<div className="bg-sub-alt flex flex-col gap-2.5 rounded-2xl px-4.5 py-3.5">
				<div className="flex items-center justify-between">
					<span className="text-sub text-sm">City</span>
					<span className={city ? 'text-main text-sm font-semibold' : 'text-sub text-sm font-semibold'}>
						{city || 'Unresolved'}
					</span>
				</div>
				<div className="border-border border-t" />
				<div className="flex items-center justify-between">
					<span className="text-sub text-sm">Coordinates</span>
					{lat && lng ? (
						<span className="text-main font-mono text-sm font-semibold">
							{parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
						</span>
					) : (
						<span className="text-sub text-sm font-semibold">Awaiting lookup</span>
					)}
				</div>
			</div>

			{/* Submit */}
			<button
				type="button"
				onClick={handleCreate}
				disabled={!isValid || isCreating}
				className={`mt-1 flex h-13.5 w-full items-center justify-center gap-2 rounded-2xl text-[16.5px] font-semibold transition disabled:cursor-not-allowed ${
					isValid ? 'bg-main text-bg shadow-lg hover:opacity-90' : 'bg-sub-alt text-sub'
				}`}
			>
				{isCreating ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Plus className="h-4.5 w-4.5" />}
				{isCreating ? 'Creating...' : 'Create gym'}
			</button>
		</div>
	);
}
