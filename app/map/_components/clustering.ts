import { Gym } from '@/types/gym';

export type GymCluster = {
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

/**
 * At and above this zoom getClusterRadius() returns 0, so every gym is its own
 * marker and no cluster can survive. Anything searching for "the zoom that
 * splits this cluster" can stop here instead of probing all the way to z14.
 */
export const CLUSTER_MAX_ZOOM = 10.2;

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

function distanceInKm(
	a: Pick<MappedGym, 'lat' | 'lng'>,
	bLat: number,
	bLng: number
) {
	const earthRadiusKm = 6371;
	const latDelta = ((bLat - a.lat) * Math.PI) / 180;
	const lngDelta = ((bLng - a.lng) * Math.PI) / 180;
	const startLat = (a.lat * Math.PI) / 180;
	const endLat = (bLat * Math.PI) / 180;
	const value =
		Math.sin(latDelta / 2) ** 2 +
		Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

	return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

/**
 * Km per degree of latitude implied by distanceInKm's 6371km sphere, rounded
 * down. A pair of points separated by more than geoRadius / this many degrees
 * of latitude is always further apart than geoRadius (the meridional component
 * alone already exceeds it), so the haversine can be skipped outright. Rounded
 * down so the shortcut only ever rejects pairs the haversine would also reject.
 */
const KM_PER_DEGREE_LAT = 111.19;

function projectToWorldPixels(lat: number, lng: number, zoom: number) {
	const siny = Math.sin((lat * Math.PI) / 180);
	const clampedSiny = Math.min(Math.max(siny, -0.9999), 0.9999);
	const scale = 256 * 2 ** zoom;

	return {
		x: ((lng + 180) / 360) * scale,
		y: (0.5 - Math.log((1 + clampedSiny) / (1 - clampedSiny)) / (4 * Math.PI)) * scale
	};
}

export function clusterGyms(gyms: Gym[], zoom: number): GymCluster[] {
	const mappedGyms: MappedGym[] = [];
	for (const gym of gyms) {
		const lat = Number(gym.lat);
		const lng = Number(gym.lng);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
		mappedGyms.push({ gym, lat, lng, ...projectToWorldPixels(lat, lng, zoom) });
	}

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

	// Seeds are taken left to right and absorb candidates from the right-hand end
	// backwards, exactly as the previous splice-based version did — the centroid
	// shifts as members join, so visiting order is part of the output and must be
	// preserved. The difference is bookkeeping: a claimed flag per gym instead of
	// splicing out of a shrinking array (O(n) per removal), running sums instead
	// of re-reducing the whole cluster on every join (O(n) per join), squared
	// pixel distances instead of Math.hypot, and the haversine deferred until the
	// two cheap rejections have had their chance.
	const sorted = mappedGyms.slice().sort((a, b) => a.lng - b.lng);
	const claimed = new Uint8Array(sorted.length);
	const radiusSq = radius * radius;
	const maxLatDelta = geoRadius / KM_PER_DEGREE_LAT;
	const clusters: MappedGym[][] = [];

	for (let seedIndex = 0; seedIndex < sorted.length; seedIndex += 1) {
		if (claimed[seedIndex]) continue;

		const seed = sorted[seedIndex];
		claimed[seedIndex] = 1;

		const cluster = [seed];
		let sumX = seed.x;
		let sumY = seed.y;
		let sumLat = seed.lat;
		let sumLng = seed.lng;
		let centerX = seed.x;
		let centerY = seed.y;
		let centerLat = seed.lat;
		let centerLng = seed.lng;

		// Everything below seedIndex is already claimed, so the sweep only needs to
		// reach back down to the seed itself.
		for (let index = sorted.length - 1; index > seedIndex; index -= 1) {
			if (claimed[index]) continue;

			const candidate = sorted[index];
			const dx = candidate.x - centerX;
			const dy = candidate.y - centerY;
			if (dx * dx + dy * dy > radiusSq) continue;
			if (Math.abs(candidate.lat - centerLat) > maxLatDelta) continue;
			if (distanceInKm(candidate, centerLat, centerLng) > geoRadius) continue;

			claimed[index] = 1;
			cluster.push(candidate);
			sumX += candidate.x;
			sumY += candidate.y;
			sumLat += candidate.lat;
			sumLng += candidate.lng;
			centerX = sumX / cluster.length;
			centerY = sumY / cluster.length;
			centerLat = sumLat / cluster.length;
			centerLng = sumLng / cluster.length;
		}

		clusters.push(cluster);
	}

	return clusters.map((cluster) => {
		const gymsInCluster = cluster.map(({ gym }) => gym);

		let totalLat = 0;
		let totalLng = 0;
		for (const item of cluster) {
			totalLat += item.lat;
			totalLng += item.lng;
		}
		const centerLat = totalLat / cluster.length;
		const centerLng = totalLng / cluster.length;

		// Deliberately Math.hypot and not squared distance, even though squaring is
		// cheaper: in a two-gym cluster both gyms are exactly equidistant from their
		// own centroid, so the pick is always a tie. Math.hypot rounds both sides to
		// the same double and the first gym wins; squared distance disagrees in the
		// last bits and silently moves such markers onto the other gym. This runs
		// once per gym per reclustering, not inside the candidate loop, so it is not
		// worth a behaviour change.
		let representative = cluster[0];
		let bestDistance = Math.hypot(cluster[0].lat - centerLat, cluster[0].lng - centerLng);
		for (let index = 1; index < cluster.length; index += 1) {
			const item = cluster[index];
			const distance = Math.hypot(item.lat - centerLat, item.lng - centerLng);
			if (distance < bestDistance) {
				bestDistance = distance;
				representative = item;
			}
		}

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

/**
 * clusterGyms memoised per gym list. Finding the zoom that splits a cluster
 * probes a handful of zoom levels per click, and the same probes recur across
 * clicks, so caching turns the repeat work into lookups. Keyed by the gym array
 * identity in a WeakMap, so a new array (a filter change, a refetch) drops its
 * predecessor's entries for collection rather than holding them forever.
 */
const clusterCache = new WeakMap<Gym[], Map<number, GymCluster[]>>();
const MAX_CACHED_ZOOMS = 48;

export function clusterGymsCached(gyms: Gym[], zoom: number): GymCluster[] {
	let byZoom = clusterCache.get(gyms);
	if (!byZoom) {
		byZoom = new Map();
		clusterCache.set(gyms, byZoom);
	}

	const cached = byZoom.get(zoom);
	if (cached) return cached;

	const clusters = clusterGyms(gyms, zoom);
	if (byZoom.size >= MAX_CACHED_ZOOMS) {
		// Insertion-ordered, so the first key is the least recently added.
		const oldest = byZoom.keys().next();
		if (!oldest.done) byZoom.delete(oldest.value);
	}
	byZoom.set(zoom, clusters);
	return clusters;
}
