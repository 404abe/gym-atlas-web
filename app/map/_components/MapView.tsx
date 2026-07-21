'use client';

import ReactMap, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Gym } from '@/types/gym';
import { useTheme } from '@/app/contexts/ThemeContext';
import GymMarker from './GymMarker';
import { clusterGyms, type GymCluster } from './clustering';

function isClusterIntact(gyms: Gym[], clusterId: string, zoom: number) {
	return clusterGyms(gyms, zoom).some((cluster) => cluster.id === clusterId);
}

// Cluster radius shrinks with zoom but scales continuously (screen-pixel
// distance grows with 2^zoom), so a cluster can split at any zoom, not just
// at the getClusterRadius() bracket boundaries. Binary-search the exact
// point where this specific cluster's id (a stable hash of its gym ids)
// stops appearing, so a single click always zooms in exactly far enough to
// split it instead of relying on a fixed increment that may undershoot.
function getExpansionZoom(gyms: Gym[], cluster: GymCluster, currentZoom: number, maxZoom = 14) {
	if (isClusterIntact(gyms, cluster.id, maxZoom)) return maxZoom;

	let lo = currentZoom;
	let hi = maxZoom;
	for (let i = 0; i < 18; i += 1) {
		const mid = (lo + hi) / 2;
		if (isClusterIntact(gyms, cluster.id, mid)) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return hi;
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
	const lastFlownGymId = useRef<number | null>(null);
	const [zoom, setZoom] = useState(5);
	const [mapLoaded, setMapLoaded] = useState(false);
	const { theme } = useTheme();
	const mapStyle = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';
	const clusters = useMemo(() => clusterGyms(gyms, zoom), [gyms, zoom]);

	useEffect(() => {
		if (!userLocation || !mapRef.current) return;
		mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1500 });
	}, [userLocation]);

	useEffect(() => {
		if (!selectedGym || !mapRef.current) return;
		// Only fly when the selection actually changes to a different gym. Without
		// this, re-selecting the same pin (e.g. tap to open → tap to close → tap to
		// re-open) re-triggers a redundant flyTo, which re-renders the map mid-
		// animation and makes the card visibly flash. Not reset on deselect, so
		// re-opening the same gym stays put.
		if (lastFlownGymId.current === selectedGym.id) return;
		lastFlownGymId.current = selectedGym.id;

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

	// mapbox-gl only re-fits its canvas on a *window* resize, not on its
	// container resizing (e.g. the sidebar collapsing/expanding), so the map
	// is left stale — cropped or with dead space — until told to resize.
	useEffect(() => {
		if (!mapLoaded) return;
		const container = mapRef.current?.getContainer();
		if (!container) return;
		const observer = new ResizeObserver(() => mapRef.current?.resize());
		observer.observe(container);
		return () => observer.disconnect();
	}, [mapLoaded]);

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
				onLoad={() => setMapLoaded(true)}
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
										const targetZoom = getExpansionZoom(gyms, cluster, zoom);
										// Scale duration to the distance actually travelled: a
										// cluster that's one nudge from splitting shouldn't take
										// as long as one that needs to jump from a country-wide
										// zoom all the way down to street level.
										const duration = Math.min(1100, Math.max(350, (targetZoom - zoom) * 220));
										mapRef.current?.flyTo({
											center: [cluster.lng, cluster.lat],
											zoom: targetZoom,
											duration
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
