// Shared by the landing page's "API" section (components/landing/ApiSection.tsx)
// and its data route (app/api/nearby-demo/route.ts).

// A gym only makes it into the "near you" demo if it has at least this many
// distinct approved machines, so the animated listing never looks empty.
export const MIN_MACHINES = 5;

// Gyms further away than this are ignored, and the section falls back to
// FALLBACK_GYMS instead of showing somewhere that isn't "near you".
export const MAX_KM = 80;

export const GYM_COUNT = 3;
export const MACHINES_PER_GYM = 5;

export type DemoMachine = {
	name: string;
	brand: string;
	series: string;
	type: 'pin_loaded' | 'plate_loaded';
	weightStack: number | null;
	count: number;
};

export type DemoGym = {
	name: string;
	// null for the curated defaults (no location involved).
	distanceKm: number | null;
	machines: DemoMachine[];
	// Index into `machines` of the machine printed as JSON.
	spotlight: number;
};

export const FALLBACK_GYMS: DemoGym[] = [
	{
		name: 'PureGym Charing Cross',
		distanceKm: null,
		spotlight: 1,
		machines: [
			{ name: 'Leg Press 45', brand: 'Life Fitness', series: 'Signature', type: 'plate_loaded', weightStack: null, count: 4 },
			{ name: 'Lat Pulldown', brand: 'Life Fitness', series: 'Insignia', type: 'pin_loaded', weightStack: 90, count: 3 },
			{ name: 'Chest Press', brand: 'Technogym', series: 'Selection', type: 'pin_loaded', weightStack: 100, count: 2 },
			{ name: 'Hack Squat', brand: 'Hammer Strength', series: 'Select', type: 'plate_loaded', weightStack: null, count: 2 },
			{ name: 'Pec Deck', brand: 'Matrix', series: 'Ultra', type: 'pin_loaded', weightStack: 80, count: 3 }
		]
	},
	{
		name: 'The Gym Group Leeds',
		distanceKm: null,
		spotlight: 2,
		machines: [
			{ name: 'Leg Curl', brand: 'Technogym', series: 'Selection', type: 'pin_loaded', weightStack: 80, count: 2 },
			{ name: 'Hip Thrust', brand: 'Hammer Strength', series: 'Select', type: 'plate_loaded', weightStack: null, count: 1 },
			{ name: 'Seated Row', brand: 'Life Fitness', series: 'Insignia', type: 'pin_loaded', weightStack: 90, count: 3 },
			{ name: 'Smith Machine', brand: 'Life Fitness', series: 'Signature', type: 'plate_loaded', weightStack: null, count: 5 },
			{ name: 'Shoulder Press', brand: 'Matrix', series: 'Ultra', type: 'pin_loaded', weightStack: 75, count: 2 }
		]
	},
	{
		name: 'JD Gyms Glasgow',
		distanceKm: null,
		spotlight: 1,
		machines: [
			{ name: 'Pendulum Squat', brand: 'Hammer Strength', series: 'Select', type: 'plate_loaded', weightStack: null, count: 1 },
			{ name: 'Leg Extension', brand: 'Cybex', series: 'Prestige', type: 'pin_loaded', weightStack: 100, count: 4 },
			{ name: 'Cable Station', brand: 'Life Fitness', series: 'Signature', type: 'pin_loaded', weightStack: 90, count: 5 },
			{ name: 'Calf Raise', brand: 'Matrix', series: 'Ultra', type: 'pin_loaded', weightStack: 120, count: 3 },
			{ name: 'Pec Deck', brand: 'Technogym', series: 'Selection', type: 'pin_loaded', weightStack: 80, count: 2 }
		]
	}
];

// Great-circle distance in km (haversine).
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// "243 Leg Press 45°" -> "243_leg_press_45", for the terminal's machine list.
export function toSnake(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

// Prefer a pin-loaded machine with a known weight stack so the JSON has real
// numbers in it; otherwise just the first machine.
export function pickSpotlight(machines: DemoMachine[]): number {
	const index = machines.findIndex((m) => m.type === 'pin_loaded' && m.weightStack != null);
	return index === -1 ? 0 : index;
}
