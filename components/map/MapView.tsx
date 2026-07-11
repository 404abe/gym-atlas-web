'use client';

import ReactMap, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Gym } from '@/types/gym';
import { useTheme } from '@/app/contexts/ThemeContext';
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

type MarkerState = 'normal' | 'matched' | 'dimmed';

function ClusterMarker({ count, state }: { count: number; state: MarkerState }) {
	const sizeClass = count < 4 ? 'h-[46px] w-[46px]' : count < 10 ? 'h-[50px] w-[50px]' : 'h-[54px] w-[54px]';
	const innerClass = count < 4 ? 'inset-[13px]' : count < 10 ? 'inset-[14px]' : 'inset-[15px]';
	const fill = Math.min(100, Math.round((count / FULL_CLUSTER_COUNT) * 100));
	const matched = state === 'matched';

	return (
		<div
			className={`map-marker-shell relative grid ${sizeClass} place-items-center rounded-full border border-border bg-surface shadow-[0_10px_24px_rgb(0_0_0/0.24)] ${
				state === 'dimmed' ? 'opacity-[0.28]' : 'opacity-100'
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
	matchedGymIds = null,
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	userLocation: { lat: number; lng: number } | null;
	/** Ids to highlight; others dim. `null` = no active filter, all pins normal. */
	matchedGymIds?: Set<number> | null;
}) {
	const mapRef = useRef<MapRef>(null);
	const [zoom, setZoom] = useState(5);
	const { theme } = useTheme();
	const mapStyle = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';
	const clusters = useMemo(() => clusterGyms(gyms, zoom), [gyms, zoom]);

	useEffect(() => {
		if (!userLocation || !mapRef.current) return;
		mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1500 });
	}, [userLocation]);

	useEffect(() => {
		if (!selectedGym || !mapRef.current) return;

		const mapWidth = mapRef.current.getContainer().offsetWidth;
		// On narrow screens the card popup extends to the right of the pin.
		// Offset the center so pin+card are visually centred rather than just the pin.
		// 0.01 deg ≈ 117px at zoom 14, which centres the ~298px-wide pin+card unit.
		const lngOffset = mapWidth < 640 ? 0.007 : 0;

		mapRef.current.flyTo({
			center: [Number(selectedGym.lng) + lngOffset, Number(selectedGym.lat)],
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
			>
				{clusters.map((cluster) => {
					const matchState = (gym: Gym): MarkerState =>
						!matchedGymIds ? 'normal' : matchedGymIds.has(gym.id) ? 'matched' : 'dimmed';
					// A cluster is "matched" if any gym inside it matches; dimmed only
					// when a filter is active and none of its gyms match.
					const clusterState: MarkerState = !matchedGymIds
						? 'normal'
						: cluster.gyms.some((gym) => matchedGymIds.has(gym.id))
							? 'matched'
							: 'dimmed';

					return (
						<Marker
							key={cluster.id}
							longitude={cluster.lng}
							latitude={cluster.lat}
							anchor="bottom"
							style={{ zIndex: cluster.gyms.length === 1 && selectedGym?.id === cluster.gyms[0].id ? 30 : 10 }}
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
									<ClusterMarker count={cluster.gyms.length} state={clusterState} />
								</button>
							) : (
								<GymMarker
									gym={cluster.gyms[0]}
									selected={selectedGym?.id === cluster.gyms[0].id}
									state={matchState(cluster.gyms[0])}
									onClick={() => onSelectGym(cluster.gyms[0])}
								/>
							)}
						</Marker>
					);
				})}
			</ReactMap>
		</div>
	);
}
