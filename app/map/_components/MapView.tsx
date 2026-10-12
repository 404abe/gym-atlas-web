'use client';

import ReactMap, { Marker, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gym } from '@/types/gym';
import { useTheme } from '@/app/contexts/ThemeContext';
import GymMarker, { type MarkerState } from './GymMarker';
import { CLUSTER_MAX_ZOOM, clusterGymsCached, type GymCluster } from './clustering';

/**
 * Zoom is quantised to this before it reaches React state. mapbox fires onMove
 * on every frame of a scroll-zoom or a flyTo, and an unrounded zoom in state
 * meant re-clustering and reconciling every marker 60 times a second. Clustering
 * only changes at zoom bracket boundaries, so quarter steps keep the pins
 * correct while cutting the re-render count by roughly an order of magnitude.
 */
const ZOOM_STEP = 0.25;
const quantiseZoom = (zoom: number) => Math.round(zoom / ZOOM_STEP) * ZOOM_STEP;

/**
 * How much bigger than the viewport the rendered marker box is, as a fraction of
 * the viewport span per side. Markers outside it aren't mounted at all. Generous
 * enough that a fast pan never outruns it before the box is recomputed.
 */
const CULL_MARGIN = 0.75;
/**
 * Fraction of the margin that must still be unused before the box is left alone.
 * Panning inside this slack costs no state update and therefore no re-render.
 */
const CULL_SLACK = 0.4;
/** Minimum gap between bounds recomputations while the map is moving. */
const BOUNDS_THROTTLE_MS = 120;

type Bounds = { west: number; south: number; east: number; north: number };

function isClusterIntact(gyms: Gym[], clusterId: string, zoom: number) {
	return clusterGymsCached(gyms, zoom).some((cluster) => cluster.id === clusterId);
}

// Cluster radius shrinks with zoom but scales continuously (screen-pixel
// distance grows with 2^zoom), so a cluster can split at any zoom, not just
// at the getClusterRadius() bracket boundaries. Binary-search the exact
// point where this specific cluster's id (a stable hash of its gym ids)
// stops appearing, so a single click always zooms in exactly far enough to
// split it instead of relying on a fixed increment that may undershoot.
//
// The search runs on a fixed PROBE_STEP grid rather than on continuous
// midpoints: it bounds the work at ~8 clusterings instead of 18, every probe is
// a value clusterGymsCached can reuse across clicks, and the ceiling is the zoom
// at which clustering stops entirely, so it never probes dead levels up at z14.
const PROBE_STEP = 0.05;

function getExpansionZoom(gyms: Gym[], cluster: GymCluster, currentZoom: number) {
	const ceiling = CLUSTER_MAX_ZOOM + PROBE_STEP;
	if (currentZoom >= ceiling) return ceiling;
	if (isClusterIntact(gyms, cluster.id, ceiling)) return ceiling;

	let lo = Math.round(currentZoom / PROBE_STEP);
	let hi = Math.round(ceiling / PROBE_STEP);
	while (hi - lo > 1) {
		const mid = Math.floor((lo + hi) / 2);
		if (isClusterIntact(gyms, cluster.id, mid * PROBE_STEP)) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return hi * PROBE_STEP;
}

const FULL_CLUSTER_COUNT = 100;

const ClusterMarker = memo(function ClusterMarker({
	count,
	state
}: {
	count: number;
	state: MarkerState;
}) {
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
});

/** Memoised so a map re-render skips every cluster bubble that hasn't changed. */
const ClusterButton = memo(function ClusterButton({
	cluster,
	state,
	onExpand
}: {
	cluster: GymCluster;
	state: MarkerState;
	/** Stable across renders, or the memo above never hits. */
	onExpand: (cluster: GymCluster) => void;
}) {
	return (
		<button
			type="button"
			aria-label={`${cluster.gyms.length} gyms in this area`}
			onClick={() => onExpand(cluster)}
			className="cursor-pointer opacity-95 transition duration-500 ease-out hover:scale-105 hover:opacity-100"
		>
			<ClusterMarker count={cluster.gyms.length} state={state} />
		</button>
	);
});

export default function MapView({
	gyms,
	selectedGym,
	onSelectGym,
	userLocation,
	matchedGymIds = null
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
	const [bounds, setBounds] = useState<Bounds | null>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const { theme } = useTheme();
	const mapStyle = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';

	// Both handlers below are handed to several hundred memoised markers, so they
	// must keep the same identity for the lifetime of the map. They read their
	// inputs from refs synced in an effect rather than from deps: a caller passing
	// a fresh callback, or a new gyms array, would otherwise silently un-memoise
	// every pin. Only event handlers read these, never render, so the one-frame
	// lag of an effect is immaterial.
	const gymsRef = useRef(gyms);
	const onSelectGymRef = useRef(onSelectGym);
	const lastBoundsAt = useRef(0);

	useEffect(() => {
		gymsRef.current = gyms;
	}, [gyms]);

	useEffect(() => {
		onSelectGymRef.current = onSelectGym;
	}, [onSelectGym]);

	const selectGym = useCallback((gym: Gym) => onSelectGymRef.current(gym), []);

	const refreshBounds = useCallback(() => {
		const raw = mapRef.current?.getBounds();
		if (!raw) return;
		const west = raw.getWest();
		const east = raw.getEast();
		const south = raw.getSouth();
		const north = raw.getNorth();
		if (!Number.isFinite(west) || !Number.isFinite(east)) return;

		setBounds((prev) => {
			if (prev) {
				const slackX = (east - west) * CULL_MARGIN * CULL_SLACK;
				const slackY = (north - south) * CULL_MARGIN * CULL_SLACK;
				// Still comfortably inside the box we already rendered — keep it, so
				// this move costs no state change at all.
				if (
					west - prev.west > slackX &&
					prev.east - east > slackX &&
					south - prev.south > slackY &&
					prev.north - north > slackY
				) {
					return prev;
				}
			}
			const padX = (east - west) * CULL_MARGIN;
			const padY = (north - south) * CULL_MARGIN;
			return {
				west: west - padX,
				east: east + padX,
				south: south - padY,
				north: north + padY
			};
		});
	}, []);

	const handleMove = useCallback(
		(event: ViewStateChangeEvent) => {
			const next = quantiseZoom(event.viewState.zoom);
			setZoom((prev) => (prev === next ? prev : next));

			const now = performance.now();
			if (now - lastBoundsAt.current < BOUNDS_THROTTLE_MS) return;
			lastBoundsAt.current = now;
			refreshBounds();
		},
		[refreshBounds]
	);

	const handleMoveEnd = useCallback(() => {
		lastBoundsAt.current = performance.now();
		refreshBounds();
	}, [refreshBounds]);

	const expandCluster = useCallback((cluster: GymCluster) => {
		// The rendered clusters come from the quantised zoom, so the search has to
		// start there too — from the live zoom this cluster's id might not exist.
		const fromZoom = quantiseZoom(mapRef.current?.getZoom() ?? 5);
		const targetZoom = getExpansionZoom(gymsRef.current, cluster, fromZoom);
		// Scale duration to the distance actually travelled: a cluster that's one
		// nudge from splitting shouldn't take as long as one that needs to jump from
		// a country-wide zoom all the way down to street level.
		const duration = Math.min(1100, Math.max(350, (targetZoom - fromZoom) * 220));
		mapRef.current?.flyTo({
			center: [cluster.lng, cluster.lat],
			zoom: targetZoom,
			duration
		});
	}, []);

	const clusters = useMemo(() => clusterGymsCached(gyms, zoom), [gyms, zoom]);

	const visibleClusters = useMemo(() => {
		if (!bounds) return clusters;
		// A box wide enough to wrap the antimeridian can't be tested with simple
		// comparisons; at that point almost everything is on screen anyway.
		if (bounds.east - bounds.west >= 360 || bounds.west > bounds.east) return clusters;

		const selectedId = selectedGym?.id;
		return clusters.filter((cluster) => {
			if (
				cluster.lng >= bounds.west &&
				cluster.lng <= bounds.east &&
				cluster.lat >= bounds.south &&
				cluster.lat <= bounds.north
			) {
				return true;
			}
			// Never cull the selection: its popup card is anchored to this marker.
			return selectedId !== undefined && cluster.gyms.some((gym) => gym.id === selectedId);
		});
	}, [clusters, bounds, selectedGym?.id]);

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
	// Resizing changes the viewport, so the cull box has to be re-read too.
	useEffect(() => {
		if (!mapLoaded) return;
		const container = mapRef.current?.getContainer();
		if (!container) return;
		const observer = new ResizeObserver(() => {
			mapRef.current?.resize();
			refreshBounds();
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, [mapLoaded, refreshBounds]);

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
				onMove={handleMove}
				onMoveEnd={handleMoveEnd}
				onLoad={() => {
					setMapLoaded(true);
					refreshBounds();
				}}
			>
				{visibleClusters.map((cluster) => {
					// A cluster is "matched" if any gym inside it matches; dimmed only
					// when a filter is active and none of its gyms match.
					const state: MarkerState = !matchedGymIds
						? 'normal'
						: cluster.gyms.some((gym) => matchedGymIds.has(gym.id))
							? 'matched'
							: 'dimmed';
					const single = cluster.gyms.length === 1 ? cluster.gyms[0] : null;
					const isSelected = single !== null && selectedGym?.id === single.id;

					return (
						<Marker
							key={cluster.id}
							longitude={cluster.lng}
							latitude={cluster.lat}
							anchor="bottom"
							style={{ zIndex: isSelected ? 30 : 10 }}
						>
							{single ? (
								<GymMarker gym={single} selected={isSelected} state={state} onSelect={selectGym} />
							) : (
								<ClusterButton cluster={cluster} state={state} onExpand={expandCluster} />
							)}
						</Marker>
					);
				})}
			</ReactMap>
		</div>
	);
}
