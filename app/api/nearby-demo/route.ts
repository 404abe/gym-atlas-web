import { NextRequest, NextResponse } from 'next/server';
import {
	GYM_COUNT,
	MACHINES_PER_GYM,
	MAX_KM,
	MIN_MACHINES,
	distanceKm,
	pickSpotlight,
	type DemoGym,
	type DemoMachine
} from '@/lib/apiDemo';

const API_ORIGIN = process.env.GYM_ATLAS_API_URL || 'https://gym-atlas-api.onrender.com';

// Every upstream URL below is identical for all visitors, so Next's data cache
// serves them for an hour no matter how many people (or where) hit this route.
// Only the "pick the nearest gyms" step is per-visitor, and that is just maths.
// Note: don't pass an AbortSignal to these fetches, it opts them out of the cache.
const REVALIDATE_SECONDS = 3600;
const BUDGET_MS = 7000;

type ApiGym = {
	id: number;
	name: string;
	lat: number | null;
	lng: number | null;
	unique_machines: number;
};

type ApiGymEquipment = {
	equipment_id: number;
	brand: string;
	series: string | null;
	name: string;
	quantity: number;
	status: string;
};

type ApiEquipment = {
	id: number;
	type: 'pin_loaded' | 'plate_loaded' | null;
	weight_stack: number | null;
};

async function getData<T>(path: string): Promise<T> {
	const res = await fetch(new URL(path, API_ORIGIN), { next: { revalidate: REVALIDATE_SECONDS } });
	if (!res.ok) throw new Error(`${path} responded ${res.status}`);
	const body = await res.json();
	return body.data as T;
}

function parseCoord(value: string | null, limit: number): number | null {
	if (!value) return null;
	const n = Number(value);
	return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

async function buildGyms(lat: number, lng: number): Promise<DemoGym[]> {
	const [gyms, equipment] = await Promise.all([
		getData<ApiGym[]>('/gyms'),
		getData<ApiEquipment[]>('/equipment')
	]);

	const specById = new Map(equipment.map((e) => [e.id, e]));

	const nearest = gyms
		.filter((g) => g.lat != null && g.lng != null && Number(g.unique_machines) >= MIN_MACHINES)
		.map((g) => ({ gym: g, km: distanceKm(lat, lng, Number(g.lat), Number(g.lng)) }))
		.filter((entry) => entry.km <= MAX_KM)
		.sort((a, b) => a.km - b.km)
		.slice(0, GYM_COUNT);

	const results = await Promise.all(
		nearest.map(async ({ gym, km }): Promise<DemoGym | null> => {
			const rows = await getData<ApiGymEquipment[]>(`/gyms/${gym.id}/equipment`);
			const machines: DemoMachine[] = rows
				.filter((row) => row.status === 'approved')
				.sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
				.slice(0, MACHINES_PER_GYM)
				.map((row) => {
					const spec = specById.get(row.equipment_id);
					return {
						name: row.name,
						brand: row.brand,
						series: row.series ?? '',
						type: spec?.type ?? 'plate_loaded',
						weightStack: spec?.weight_stack ?? null,
						count: row.quantity
					};
				});

			if (machines.length < MIN_MACHINES) return null;

			// IP geolocation is city-level at best, so don't pretend to sub-km precision.
			return {
				name: gym.name,
				distanceKm: Math.max(1, Math.round(km)),
				machines,
				spotlight: pickSpotlight(machines)
			};
		})
	);

	return results.filter((g): g is DemoGym => g !== null);
}

export async function GET(request: NextRequest) {
	// Vercel adds these from the visitor's IP. They are absent in local dev and
	// on other hosts, in which case the client keeps playing its default gyms.
	const lat = parseCoord(request.headers.get('x-vercel-ip-latitude'), 90);
	const lng = parseCoord(request.headers.get('x-vercel-ip-longitude'), 180);

	// The answer depends on the visitor's IP, so it must never be stored in a
	// shared (CDN) cache. `private` lets only their own browser reuse it.
	const headers = { 'Cache-Control': 'private, max-age=1800' };

	if (lat === null || lng === null) {
		return NextResponse.json({ gyms: [] }, { headers });
	}

	try {
		const gyms = await Promise.race([
			buildGyms(lat, lng),
			new Promise<DemoGym[]>((resolve) => setTimeout(() => resolve([]), BUDGET_MS))
		]);
		return NextResponse.json({ gyms }, { headers });
	} catch (error) {
		console.error('[nearby-demo]', error);
		return NextResponse.json({ gyms: [] }, { headers });
	}
}
