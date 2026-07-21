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

export function clusterGyms(gyms: Gym[], zoom: number): GymCluster[] {
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
