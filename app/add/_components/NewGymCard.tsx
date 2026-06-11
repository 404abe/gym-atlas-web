'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { Gym } from '@/types/gym';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { createGym } from '@/lib/api';

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

	const [isCreating, setIsCreating] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Styling Presets matching NewMachineCard
	const tileCls = 'border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3';
	const labelCls = 'text-sub text-[11px] mb-1';
	const bareInputCls =
		'bg-transparent text-main placeholder:text-sub w-full border-none outline-none font-[inherit]';

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

			onCreated(created);
			addToast(`"${name}" submitted for review`, 'success');

			setName('');
			setAddress('');
			setLat('');
			setLng('');
			setCity('');
			setCountry('');
		} catch {
			addToast('Failed to create gym', 'error');
		} finally {
			setIsCreating(false);
		}
	};

	const isValid = Boolean(name && lat && lng);

	const renderSubmitButton = (className = '') => (
		<button
			type="button"
			onClick={handleCreate}
			disabled={!isValid || isCreating}
			className={`bg-main text-bg flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
		>
			{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
			{isCreating ? 'Creating...' : 'Create gym'}
		</button>
	);

	return (
		<div className="w-full">
			{/* ── Desktop Bento Layout ── */}
			<div
				className="hidden sm:grid sm:grid-cols-4 sm:gap-3"
				style={{ gridTemplateRows: '120px auto 56px auto' }}
			>
				{/* Header Tile Block */}
				<div className="border-border bg-surface col-span-2 flex flex-col justify-center rounded-2xl border p-5">
					<div className="flex items-center gap-3">
						<div className="bg-main flex h-8 w-8 items-center justify-center rounded-xl">
							<MapPin className="text-bg h-4 w-4" />
						</div>
						<div>
							<h2 className="text-main text-sm font-semibold">New gym</h2>
							<p className="text-sub text-xs">Add a new location</p>
						</div>
					</div>
				</div>

				{/* Gym Name Entry Block */}
				<div className={`${tileCls} col-span-2`}>
					<p className={labelCls}>gym name</p>
					<input
						placeholder="e.g. PureGym Glasgow"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className={`${bareInputCls} text-main text-lg font-medium`}
					/>
				</div>

				{/* Mapbox Powered Geocoding Address Block */}
				<div ref={wrapperRef} className={`${tileCls} relative col-span-4`}>
					<p className={labelCls}>location address</p>
					<input
						placeholder="Search for gym address..."
						value={address}
						onChange={(e) => {
							setAddress(e.target.value);
							setShowSuggestions(true);
						}}
						onFocus={() => setShowSuggestions(true)}
						className={`${bareInputCls} text-main text-sm`}
						autoComplete="off"
						spellCheck={false}
					/>

					{showSuggestions && suggestions.length > 0 && (
						<ul className="border-border bg-surface absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border p-1 shadow-lg">
							{suggestions.map((suggestion, index) => (
								<li
									key={index}
									onMouseDown={() => handleSelectAddress(suggestion)}
									className="text-main hover:bg-sub-alt cursor-pointer rounded-lg px-3 py-2 text-xs transition"
								>
									{suggestion.place_name}
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Spatial Mapping Readout Sub-Bar */}
				<div className="border-border bg-sub-alt text-sub col-span-4 flex items-center justify-between rounded-2xl border px-4 py-3 text-[11px]">
					<span>
						City: <span className="text-main font-medium">{city || 'Unresolved'}</span>
					</span>
					{lat && lng ? (
						<span>
							Coordinates:{' '}
							<span className="text-main font-mono">
								{parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
							</span>
						</span>
					) : (
						<span className="italic">Awaiting geolocation lookup</span>
					)}
				</div>

				{renderSubmitButton('col-span-4')}
			</div>

			{/* ── Mobile Stack Layout ── */}
			<div className="flex flex-col gap-3 sm:hidden">
				<div className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-4">
					<div className="bg-main flex h-8 w-8 items-center justify-center rounded-xl">
						<MapPin className="text-bg h-4 w-4" />
					</div>
					<div>
						<h2 className="text-main text-sm font-semibold">New gym</h2>
						<p className="text-sub text-xs">Add a new location</p>
					</div>
				</div>

				<div className={tileCls}>
					<p className={labelCls}>gym name</p>
					<input
						placeholder="e.g. PureGym Glasgow"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className={`${bareInputCls} text-main text-base font-medium`}
					/>
				</div>

				<div ref={wrapperRef} className={`${tileCls} relative`}>
					<p className={labelCls}>location address</p>
					<input
						placeholder="Search for gym address..."
						value={address}
						onChange={(e) => {
							setAddress(e.target.value);
							setShowSuggestions(true);
						}}
						onFocus={() => setShowSuggestions(true)}
						className={`${bareInputCls} text-main text-sm`}
						autoComplete="off"
						spellCheck={false}
					/>

					{showSuggestions && suggestions.length > 0 && (
						<ul className="border-border bg-surface absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border p-1 shadow-lg">
							{suggestions.map((suggestion, index) => (
								<li
									key={index}
									onClick={() => handleSelectAddress(suggestion)}
									className="text-main hover:bg-sub-alt cursor-pointer rounded-lg px-3 py-2 text-xs transition"
								>
									{suggestion.place_name}
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="border-border bg-sub-alt text-sub flex flex-col gap-1 rounded-2xl border p-3 text-[11px]">
					<div className="flex justify-between">
						<span>City:</span>
						<span className="text-main font-medium">{city || 'Unresolved'}</span>
					</div>
					<div className="flex justify-between">
						<span>Coordinates:</span>
						{lat && lng ? (
							<span className="text-main font-mono">
								{parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
							</span>
						) : (
							<span className="italic">Awaiting lookup</span>
						)}
					</div>
				</div>

				{renderSubmitButton()}
			</div>
		</div>
	);
}
