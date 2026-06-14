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

function getClusterCellSize(zoom: number) {
	if (zoom < 5) return 3;
	if (zoom < 7) return 1.4;
	if (zoom < 9) return 0.7;
	return 0.35;
}

function clusterGyms(gyms: Gym[], zoom: number): GymCluster[] {
	const mappedGyms = gyms
		.map((gym) => ({ gym, lat: Number(gym.lat), lng: Number(gym.lng) }))
		.filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng));

	if (zoom >= 10) {
		return mappedGyms.map(({ gym, lat, lng }) => ({
			id: `gym-${gym.id}`,
			lat,
			lng,
			gyms: [gym]
		}));
	}

	const cellSize = getClusterCellSize(zoom);
	const buckets = new Map<string, Gym[]>();

	mappedGyms.forEach(({ gym, lat, lng }) => {
		const key = `${Math.round(lat / cellSize)}:${Math.round(lng / cellSize)}`;
		buckets.set(key, [...(buckets.get(key) ?? []), gym]);
	});

	return Array.from(buckets.entries()).map(([key, bucket]) => {
		const totals = bucket.reduce(
			(acc, gym) => ({
				lat: acc.lat + Number(gym.lat),
				lng: acc.lng + Number(gym.lng)
			}),
			{ lat: 0, lng: 0 }
		);

		return {
			id: `cluster-${key}`,
			lat: totals.lat / bucket.length,
			lng: totals.lng / bucket.length,
			gyms: bucket
		};
	});
}

function ClusterMarker({ count, matched }: { count: number; matched: boolean }) {
	return (
		<div
			className={`relative grid h-[68px] w-[68px] place-items-center rounded-full border border-[#050606] bg-[#090a0a] ${
				matched ? '' : 'opacity-85'
			}`}
		>
			<div
				className="absolute inset-[5px] rounded-full"
				style={{
					background: `conic-gradient(${matched ? '#3ee7a6' : '#6f7474'} 0 70%, #3c4041 70% 100%)`,
					boxShadow: '0 0 0 2px #050606, inset 0 0 0 2px #050606'
				}}
			/>
			<div
				className="absolute inset-[18px] rounded-full bg-[#101111]"
				style={{
					boxShadow: '0 0 0 2px #050606, inset 0 0 0 1px rgb(255 255 255 / 0.06)'
				}}
			/>
			<strong className="relative z-10 text-lg font-semibold text-main">{count}</strong>
		</div>
	);
}

export default function MapView({
	gyms,
	selectedGym,
	onSelectGym,
	userLocation,
	isFiltered = false
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	userLocation: { lat: number; lng: number } | null;
	isFiltered?: boolean;
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
				onMoveEnd={(event) => setZoom(event.viewState.zoom)}
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
										zoom: Math.min(zoom + 2, 12),
										duration: 800
									});
								}}
								className="cursor-pointer transition-transform hover:scale-105"
							>
								<ClusterMarker count={cluster.gyms.length} matched={isFiltered} />
							</button>
						) : (
							<GymMarker
								gym={cluster.gyms[0]}
								selected={selectedGym?.id === cluster.gyms[0].id}
								matched={isFiltered}
								onClick={() => onSelectGym(cluster.gyms[0])}
							/>
						)}
					</Marker>
				))}
			</ReactMap>
		</div>
	);
}
