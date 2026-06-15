'use client';

import ReactMap, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gym } from '@/types/gym';
import { useTheme } from '@/app/contexts/ThemeContext';
import { ArrowRight, Building2, Dumbbell, Link2, Navigation, Plus, Star } from 'lucide-react';
import { API_URL } from '@/lib/config';
import GymMarker from './GymMarker';

type GymCluster = {
	id: string;
	lat: number;
	lng: number;
	gyms: Gym[];
};

type MappedGym = {
	gym: Gym;
	lat: number;
	lng: number;
	x: number;
	y: number;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getClusterRadius(zoom: number) {
	if (zoom < 5) return 104;
	if (zoom < 6) return 82;
	if (zoom < 7) return 64;
	if (zoom < 8) return 48;
	if (zoom < 9) return 34;
	if (zoom < 10.2) return 22;
	return 0;
}

function getClusterGeoRadiusKm(zoom: number) {
	if (zoom < 5) return 300;
	if (zoom < 6) return 130;
	if (zoom < 7) return 55;
	if (zoom < 8) return 38;
	if (zoom < 9) return 22;
	if (zoom < 10.2) return 12;
	return 0;
}

function distanceInKm(a: Pick<MappedGym, 'lat' | 'lng'>, b: Pick<MappedGym, 'lat' | 'lng'>) {
	const earthRadiusKm = 6371;
	const latDelta = ((b.lat - a.lat) * Math.PI) / 180;
	const lngDelta = ((b.lng - a.lng) * Math.PI) / 180;
	const startLat = (a.lat * Math.PI) / 180;
	const endLat = (b.lat * Math.PI) / 180;
	const value =
		Math.sin(latDelta / 2) ** 2 +
		Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

	return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function projectToWorldPixels(lat: number, lng: number, zoom: number) {
	const siny = Math.sin((lat * Math.PI) / 180);
	const clampedSiny = Math.min(Math.max(siny, -0.9999), 0.9999);
	const scale = 256 * 2 ** zoom;

	return {
		x: ((lng + 180) / 360) * scale,
		y: (0.5 - Math.log((1 + clampedSiny) / (1 - clampedSiny)) / (4 * Math.PI)) * scale
	};
}

function clusterGyms(gyms: Gym[], zoom: number): GymCluster[] {
	const mappedGyms = gyms
		.map((gym) => {
			const lat = Number(gym.lat);
			const lng = Number(gym.lng);
			return { gym, lat, lng, ...projectToWorldPixels(lat, lng, zoom) };
		})
		.filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng));

	const radius = getClusterRadius(zoom);
	const geoRadius = getClusterGeoRadiusKm(zoom);

	if (!radius) {
		return mappedGyms.map(({ gym, lat, lng }) => ({
			id: `gym-${gym.id}`,
			lat,
			lng,
			gyms: [gym]
		}));
	}

	const remaining = [...mappedGyms].sort((a, b) => a.lng - b.lng);
	const clusters: MappedGym[][] = [];

	while (remaining.length) {
		const seed = remaining.shift();
		if (!seed) continue;

		const cluster = [seed];
		let centerX = seed.x;
		let centerY = seed.y;
		let centerLat = seed.lat;
		let centerLng = seed.lng;

		for (let index = remaining.length - 1; index >= 0; index -= 1) {
			const candidate = remaining[index];
			const screenDistance = Math.hypot(candidate.x - centerX, candidate.y - centerY);
			const geoDistance = distanceInKm(candidate, { lat: centerLat, lng: centerLng });
			if (screenDistance > radius || geoDistance > geoRadius) continue;

			cluster.push(candidate);
			remaining.splice(index, 1);
			centerX = cluster.reduce((sum, item) => sum + item.x, 0) / cluster.length;
			centerY = cluster.reduce((sum, item) => sum + item.y, 0) / cluster.length;
			centerLat = cluster.reduce((sum, item) => sum + item.lat, 0) / cluster.length;
			centerLng = cluster.reduce((sum, item) => sum + item.lng, 0) / cluster.length;
		}

		clusters.push(cluster);
	}

	return clusters.map((cluster) => {
		const gymsInCluster = cluster.map(({ gym }) => gym);
		const totals = cluster.reduce(
			(acc, { lat, lng }) => ({
				lat: acc.lat + lat,
				lng: acc.lng + lng
			}),
			{ lat: 0, lng: 0 }
		);
		const center = {
			lat: totals.lat / gymsInCluster.length,
			lng: totals.lng / gymsInCluster.length
		};
		const representative = cluster.reduce((closest, item) => {
			const closestDistance = Math.hypot(closest.lat - center.lat, closest.lng - center.lng);
			const itemDistance = Math.hypot(item.lat - center.lat, item.lng - center.lng);
			return itemDistance < closestDistance ? item : closest;
		}, cluster[0]);

		return {
			id:
				gymsInCluster.length > 1
					? `cluster-${gymsInCluster.map((gym) => gym.id).sort().join('-')}`
					: `gym-${gymsInCluster[0].id}`,
			lat: representative.lat,
			lng: representative.lng,
			gyms: gymsInCluster
		};
	});
}

const FULL_CLUSTER_COUNT = 100;

function ClusterMarker({ count, matched }: { count: number; matched: boolean }) {
	const sizeClass = count < 4 ? 'h-[46px] w-[46px]' : count < 10 ? 'h-[50px] w-[50px]' : 'h-[54px] w-[54px]';
	const innerClass = count < 4 ? 'inset-[13px]' : count < 10 ? 'inset-[14px]' : 'inset-[15px]';
	const fill = Math.min(100, Math.round((count / FULL_CLUSTER_COUNT) * 100));

	return (
		<div
			className={`map-marker-shell relative grid ${sizeClass} place-items-center rounded-full border border-border bg-surface shadow-[0_10px_24px_rgb(0_0_0/0.24)] ${
				matched ? '' : 'opacity-85'
			}`}
		>
			<div
				className="absolute inset-[4px] rounded-full"
				style={{
					background: `conic-gradient(${matched ? '#3ee7a6' : 'var(--sub-color)'} 0 ${fill}%, var(--border-color) ${fill}% 100%)`,
					boxShadow: '0 0 0 2px var(--bg-color), inset 0 0 0 2px var(--bg-color)'
				}}
			/>
			<div
				className={`absolute ${innerClass} rounded-full bg-bg`}
				style={{
					boxShadow: '0 0 0 2px var(--bg-color)'
				}}
			/>
			<strong className="relative z-10 text-sm font-semibold text-main">{count}</strong>
		</div>
	);
}

export default function MapView({
	gyms,
	selectedGym,
	onSelectGym,
	userLocation,
	isFiltered = false,
	filteredGymIds
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	userLocation: { lat: number; lng: number } | null;
	isFiltered?: boolean;
	filteredGymIds?: Set<number> | null;
}) {
	const router = useRouter();
	const mapRef = useRef<MapRef>(null);
	const [zoom, setZoom] = useState(5);
	const [previewEquipment, setPreviewEquipment] = useState<{ id: number; name: string; brand: string; image_url?: string }[]>([]);
	const [popupOpen, setPopupOpen] = useState(false);
	const { theme } = useTheme();
	const mapStyle = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';
	const clusters = useMemo(() => clusterGyms(gyms, zoom), [gyms, zoom]);

	useEffect(() => {
		if (!selectedGym) { setPreviewEquipment([]); setPopupOpen(false); return; }
		setPopupOpen(true);
		fetch(`${API_URL}/gyms/${selectedGym.id}/equipment`)
			.then((r) => r.json())
			.then((data) => setPreviewEquipment((data.data ?? data).slice(0, 2)));
	}, [selectedGym]);

	const distanceKm =
		userLocation && selectedGym?.lat && selectedGym?.lng
			? Math.round(haversineKm(userLocation.lat, userLocation.lng, Number(selectedGym.lat), Number(selectedGym.lng)) * 10) / 10
			: null;

	useEffect(() => {
		if (!userLocation || !mapRef.current) return;
		mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1500 });
	}, [userLocation]);

	useEffect(() => {
		if (!selectedGym || !mapRef.current) return;

		mapRef.current.flyTo({
			center: [Number(selectedGym.lng), Number(selectedGym.lat)],
			zoom: 14,
			duration: 1200
		});
	}, [selectedGym]);

	return (
		<div id="MapView" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
			<ReactMap
				ref={mapRef}
				initialViewState={{
					longitude: -3.1883,
					latitude: 55.9533,
					zoom: 5
				}}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
				mapStyle={mapStyle}
				style={{ width: '100%', height: '100%' }}
				onMove={(event) => setZoom(event.viewState.zoom)}
				onZoomStart={() => setPopupOpen(false)}
				onDragStart={() => setPopupOpen(false)}
			>
				{clusters.map((cluster) => (
					<Marker
						key={cluster.id}
						longitude={cluster.lng}
						latitude={cluster.lat}
						anchor="bottom"
					>
						{cluster.gyms.length > 1 ? (
							<button
								type="button"
								aria-label={`${cluster.gyms.length} gyms in this area`}
								onClick={() => {
									mapRef.current?.flyTo({
										center: [cluster.lng, cluster.lat],
										zoom: Math.min(zoom + 1.35, 12),
										duration: 1300
									});
								}}
								className="cursor-pointer opacity-95 transition duration-500 ease-out hover:scale-105 hover:opacity-100"
							>
								<ClusterMarker count={cluster.gyms.length} matched={isFiltered} />
							</button>
						) : (
							<GymMarker
								gym={cluster.gyms[0]}
								selected={selectedGym?.id === cluster.gyms[0].id}
								matched={isFiltered}
								onClick={() => { onSelectGym(cluster.gyms[0]); setPopupOpen(true); }}
							/>
						)}
					</Marker>
				))}

				{popupOpen && selectedGym && selectedGym.lat && selectedGym.lng && (
					<Popup
						longitude={Number(selectedGym.lng)}
						latitude={Number(selectedGym.lat)}
						anchor="left"
						closeButton={false}
						closeOnClick={false}
						focusAfterOpen={false}
						maxWidth="none"
						offset={16}
						className="gym-popup"
						onClose={() => {}}
					>
						<style>{`.gym-popup .mapboxgl-popup-content{padding:0;background:transparent;box-shadow:none;border-radius:0}.gym-popup .mapboxgl-popup-tip{display:none}`}</style>
						<div className="w-65 overflow-hidden rounded-2xl border border-border bg-bg shadow-xl">
							{/* Header */}
							<div className="flex items-center justify-between gap-2 px-3 pt-3">
								<div className="flex min-w-0 items-center gap-2">
									<div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-sub-alt">
										{selectedGym.image_url
											? <img src={selectedGym.image_url} alt={selectedGym.name} className="h-full w-full object-cover" />
											: <Building2 size={13} className="text-sub" />}
									</div>
									<div className="min-w-0">
										<p className="truncate text-[13px] font-medium leading-tight text-main">{selectedGym.name}</p>
										<p className="text-[11px] text-sub">{selectedGym.city}</p>
									</div>
								</div>
								{distanceKm != null && (
									<span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-sub-alt px-2 py-0.5 text-[11px] text-sub">
										<Navigation size={10} />
										{distanceKm}km
									</span>
								)}
							</div>

							{/* Chips */}
							<div className="flex flex-wrap gap-1.5 px-3 pt-2">
								<span className="flex items-center gap-1 rounded-full border border-border bg-sub-alt px-2 py-0.5 text-[11px] text-sub">
									<Link2 size={10} />
									{selectedGym.total_equipment} machines
								</span>
								<span className="rounded-full border border-border bg-sub-alt px-2 py-0.5 text-[11px] text-sub">
									{selectedGym.unique_machines} unique
								</span>
								{selectedGym.avg_rating && Number(selectedGym.avg_rating) > 0 && (
									<span className="flex items-center gap-1 rounded-full border border-border bg-sub-alt px-2 py-0.5 text-[11px] text-sub">
										<Star size={10} />
										{Number(selectedGym.avg_rating).toFixed(1)}
									</span>
								)}
							</div>

							{/* Equipment thumbnails */}
							<div className="flex gap-2 px-3 pt-2">
								{previewEquipment.map((eq) => (
									<div key={eq.id} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-sub-alt py-3">
										{eq.image_url
											? <img src={eq.image_url} alt={eq.name} className="h-10 w-10 object-contain" />
											: <Dumbbell size={20} className="text-sub" />}
										<span className="line-clamp-1 px-1 text-center text-[10px] text-sub">{eq.brand} {eq.name}</span>
									</div>
								))}
								{selectedGym.total_equipment > 2 && (
									<div key="more" className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-sub-alt py-3">
										<Plus size={16} className="text-sub" />
										<span className="text-[10px] text-sub">{selectedGym.total_equipment - 2} more</span>
									</div>
								)}
								{previewEquipment.length === 0 && selectedGym.total_equipment === 0 && (
									<div key="empty" className="flex w-full items-center justify-center rounded-xl border border-border bg-sub-alt py-3">
										<span className="text-[10px] text-sub">No equipment logged yet</span>
									</div>
								)}
							</div>

							{/* View gym button */}
							<div className="p-3">
								<button
									onClick={() => router.push(`/gyms/${selectedGym.id}`)}
									className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-sub-alt py-2 text-[12px] font-medium text-main transition hover:border-main hover:bg-main hover:text-bg"
								>
									View gym
									<ArrowRight size={12} />
								</button>
							</div>
						</div>
					</Popup>
				)}
			</ReactMap>
		</div>
	);
}
