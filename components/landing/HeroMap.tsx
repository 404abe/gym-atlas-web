'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMap, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { Dumbbell } from 'lucide-react';
import { fetchGyms } from '@/lib/api';
import { useTheme } from '@/app/contexts/ThemeContext';
import type { Gym } from '@/types/gym';

// UK-wide fallback view, used until gyms load and whenever there are too
// few points (0-1) to meaningfully fit bounds to.
const DEFAULT_CENTER = { longitude: -3.1883, latitude: 55.9533 };
const DEFAULT_ZOOM = 4.6;
const FIT_PADDING = 44;
const MAX_FIT_ZOOM = 9;

type GymPoint = { id: number; lat: number; lng: number; name: string; image_url?: string };

function initialsFor(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
}

// A smaller, non-interactive echo of the main map's GymMarker — same
// circular border, teardrop tail, and gradient avatar, just scaled down and
// inert (no click/hover/popup) so the hero preview reads as a miniature of
// the real map instead of a generic dot.
function HeroPin({ gym }: { gym: Pick<GymPoint, 'name' | 'image_url'> }) {
	return (
		<div
			className="relative grid h-7.5 w-7.5 place-items-center rounded-full border-2 border-border bg-surface shadow-[0_4px_10px_rgb(0_0_0/0.2)]"
			style={{ pointerEvents: 'none' }}
		>
			<span
				className="absolute -bottom-1.25 left-1/2 -z-10 h-2.25 w-2.25 -translate-x-1/2 rotate-45 rounded-xs bg-border"
				aria-hidden="true"
			/>
			<span className="absolute inset-0.75 grid place-items-center overflow-hidden rounded-full border border-border bg-linear-to-br from-[#e7ece9] to-[#75807c] text-[7px] font-bold text-[#151616]">
				{gym.image_url ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={gym.image_url} alt="" className="h-full w-full object-cover" />
				) : (
					initialsFor(gym.name) || <Dumbbell className="h-2.5 w-2.5" />
				)}
			</span>
		</div>
	);
}

export default function HeroMap() {
	const mapRef = useRef<MapRef>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const [points, setPoints] = useState<GymPoint[]>([]);
	const { theme } = useTheme();
	const mapStyle = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';

	useEffect(() => {
		let cancelled = false;
		fetchGyms()
			.then((data: Gym[]) => {
				if (cancelled) return;
				setPoints(
					data
						.map((gym) => ({
							id: gym.id,
							lat: Number(gym.lat),
							lng: Number(gym.lng),
							name: gym.name,
							image_url: gym.image_url
						}))
						.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
				);
			})
			.catch(() => {
				if (!cancelled) setPoints([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Frame all approved gyms once the map is ready. With 0-1 points there's no
	// meaningful bound to fit, so we leave the UK-wide default view in place.
	useEffect(() => {
		if (!mapLoaded || points.length < 2) return;
		const lats = points.map((point) => point.lat);
		const lngs = points.map((point) => point.lng);
		mapRef.current?.fitBounds(
			[
				[Math.min(...lngs), Math.min(...lats)],
				[Math.max(...lngs), Math.max(...lats)]
			],
			{ padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM, duration: 0 }
		);
	}, [mapLoaded, points]);

	return (
		<div className="relative mx-auto mt-12 w-full">
			{/* Soft accent glow bleeding out behind the frame. Blurred + low opacity
			    so it reads as ambient light, not a coloured box. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -inset-x-10 -inset-y-8 blur-[72px]"
				style={{
					background:
						'radial-gradient(55% 60% at 50% 45%, color-mix(in srgb, var(--accent-color) 26%, transparent) 0%, transparent 70%)'
				}}
			/>

			<div className="border-border bg-sub-alt relative h-[280px] w-full overflow-hidden rounded-2xl border shadow-sm sm:h-[320px]">
				<ReactMap
					ref={mapRef}
					mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
					mapStyle={mapStyle}
					projection="mercator"
					interactive={false}
					initialViewState={{ ...DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
					style={{ width: '100%', height: '100%' }}
					onLoad={() => setMapLoaded(true)}
				>
					{points.map((point) => (
						<Marker key={point.id} longitude={point.lng} latitude={point.lat} anchor="bottom">
							<HeroPin gym={point} />
						</Marker>
					))}
				</ReactMap>
			</div>
		</div>
	);
}
