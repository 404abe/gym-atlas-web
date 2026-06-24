import { API_URL } from './config';
import type { Gym, GymEquipment, GymWithQuantity } from '@/types/gym';
import type { Equipment, EquipmentVariant } from '@/types/equipment';
import type { PendingGym, PendingEquipment, PendingSuggestion, PendingPhoto, PendingVariant, PendingWeightStack, PendingGymInstagram, AdminUser } from '@/types/admin';
import type { LeaderboardEntry } from '@/types/leaderboard';
import { BestInClassCategory, BestInClassEntry } from '@/types/bestInClass';

// ── Auth helpers ──────────────────────────────────────────────────────────────

// AuthContext calls setAuthToken whenever the Supabase session changes so that
// authHeaders() stays synchronous without reading localStorage directly.
let _token: string | null = null;

export function setAuthToken(token: string | null): void {
	console.log('[api] setAuthToken called with:', token ? token.slice(0, 20) + '...' : null);
	_token = token;
}

function getToken(): string | null {
	return _token;
}

function authHeaders(): Record<string, string> {
	const token = getToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, options);
	if (!res.ok) {
		const error = await res.json().catch(() => ({ error: 'Request failed' }));
		throw new Error(error.error || `HTTP ${res.status}`);
	}
	const body = await res.json();
	return body.data;
}

// ── Gyms ──────────────────────────────────────────────────────────────────────

export const fetchGyms = (): Promise<Gym[]> => apiFetch('/gyms');

export const fetchGymById = (id: number): Promise<Gym> => apiFetch(`/gyms/${id}`);

export const fetchGymEquipment = (id: number): Promise<GymEquipment[]> =>
	apiFetch(`/gyms/${id}/equipment`);


export const favouriteGym = (id: number): Promise<void> =>
	apiFetch(`/gyms/${id}/favourite`, { method: 'POST', headers: authHeaders() });

export const unfavouriteGym = (id: number): Promise<void> =>
	apiFetch(`/gyms/${id}/favourite`, { method: 'DELETE', headers: authHeaders() });

export const rateGym = (id: number, rating: number): Promise<void> =>
	apiFetch(`/gyms/${id}/rate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ rating })
	});

// Suggests an Instagram handle for a gym; staged for admin review, not live until approved.
export const updateGymInstagram = (
	id: number,
	instagram: string
): Promise<{ id: number; instagram: string | null; pending_instagram: string; instagram_status: string }> =>
	apiFetch(`/gyms/${id}/instagram`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(
			{ instagram })
	});

export const uploadGymImage = async (id: number, file: File): Promise<string> => {
	const formData = new FormData();
	formData.append('image', file);
	const data = await apiFetch<{ image_url: string }>(`/gyms/${id}/image`, {
		method: 'POST',
		headers: authHeaders(),
		body: formData
	});
	return data.image_url;
};

export const createGym = (body: {
	name: string;
	latitude: number;
	longitude: number;
	address?: string;
	city?: string;
	country?: string;
}): Promise<Gym> =>
	apiFetch('/gyms', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(body)
	});

export const addGymEquipment = (
	gymId: number,
	equipmentId: number,
	quantity: number
): Promise<unknown> =>
	apiFetch(`/gyms/${gymId}/equipment`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ equipment_id: equipmentId, quantity })
	});

export const removeGymEquipment = (gymId: number, equipmentId: number): Promise<void> =>
	apiFetch(`/gyms/${gymId}/equipment/${equipmentId}`, {
		method: 'DELETE',
		headers: authHeaders()
	});

// ── Equipment ─────────────────────────────────────────────────────────────────

export const fetchAllEquipment = (): Promise<Equipment[]> =>
	apiFetch('/equipment', { headers: authHeaders() });

export const fetchEquipmentById = (id: string | number): Promise<Equipment> =>
	apiFetch(`/equipment/${id}`, { headers: authHeaders() });

export const fetchEquipmentGyms = (slug: string): Promise<{ gyms: GymWithQuantity[] }> =>
	apiFetch(`/equipment/${slug}/gyms`, { headers: authHeaders() });

// Submits a weight-stack change for admin review; the live value is unchanged until approved.
export const updateWeightStack = (id: string | number, weightStack: number | null): Promise<{ id: number; pending_weight_stack: number | null; weight_stack_status: string }> =>
	apiFetch(`/equipment/${id}/weight-stack`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ weight_stack: weightStack })
	});

// ── Variants ──────────────────────────────────────────────────────────────────

export const fetchEquipmentVariants = (equipmentId: string | number): Promise<EquipmentVariant[]> =>
	apiFetch(`/equipment/${equipmentId}/variants`);

// Submits a variant for admin review; it is not visible publicly until approved.
export const createVariant = (
	equipmentId: string | number,
	body: { label: string; variation_type: EquipmentVariant['variation_type']; is_default?: boolean }
): Promise<EquipmentVariant> =>
	apiFetch(`/equipment/${equipmentId}/variants`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(body)
	});

export const deleteVariant = (variantId: number): Promise<void> =>
	apiFetch(`/equipment/variants/${variantId}`, {
		method: 'DELETE',
		headers: authHeaders()
	});

export type EquipmentBrand = { name: string; equipment_count: number };
export type EquipmentSeriesItem = { name: string; equipment_count: number };
export type DuplicateMatch = { id: string; slug: string; name: string } | null;

export type Brand = {
	id: number;
	name: string;
	slug: string;
	logo_url: string | null;
	equipment_count: number;
};

// ── Brands ────────────────────────────────────────────────────────────────────

export const fetchBrands = (): Promise<Brand[]> => apiFetch('/brands');

export const fetchSeriesByBrandId = (brandId: number): Promise<EquipmentSeriesItem[]> =>
	apiFetch(`/brands/${brandId}/series`);

export const createBrand = (name: string): Promise<Brand> =>
	apiFetch('/brands', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ name })
	});

export const uploadBrandLogo = async (brandId: number, file: File): Promise<Brand> => {
	const formData = new FormData();
	formData.append('image', file);
	return apiFetch(`/brands/${brandId}/logo`, {
		method: 'POST',
		headers: authHeaders(),
		body: formData
	});
};

// ── Equipment ─────────────────────────────────────────────────────────────────

export const fetchEquipmentBrands = (): Promise<EquipmentBrand[]> =>
	apiFetch('/equipment/brands');

export const fetchEquipmentSeries = (brand: string): Promise<EquipmentSeriesItem[]> =>
	apiFetch(`/equipment/series?brand=${encodeURIComponent(brand)}`);

export const checkEquipmentDuplicate = (
	brandId: number,
	series: string,
	name: string
): Promise<{ match: DuplicateMatch }> =>
	apiFetch(
		`/equipment/check-duplicate?brandId=${brandId}&series=${encodeURIComponent(series)}&name=${encodeURIComponent(name)}`
	);

export const searchEquipment = (query: string): Promise<unknown[]> =>
	apiFetch(`/equipment/search?q=${encodeURIComponent(query)}`);

export const createEquipment = (body: {
	name: string;
	brand: string;
	brand_id?: number;
	series: string;
	type: string;
	resistance_profile?: string;
	resistance_curve?: number[];
}): Promise<Equipment> =>
	apiFetch('/equipment', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(body)
	});

export const updateAdminEquipment = (
	id: string | number,
	body: {
		name: string;
		brand: string;
		series?: string | null;
		type: Equipment['type'];
		resistance_profile?: Equipment['resistance_profile'];
		resistance_curve?: number[] | null;
	}
): Promise<Equipment> =>
	apiFetch<Equipment>(`/admin/equipment/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(body)
	});

export const rateEquipment = (id: string | number, rating: number): Promise<void> =>
	apiFetch(`/equipment/${id}/rate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ rating })
	});

export const favouriteEquipment = (id: string | number): Promise<void> =>
	apiFetch(`/equipment/${id}/favourite`, {
		method: 'POST',
		headers: authHeaders()
	});

export const unfavouriteEquipment = (id: string | number): Promise<void> =>
	apiFetch(`/equipment/${id}/favourite`, {
		method: 'DELETE',
		headers: authHeaders()
	});

export const uploadEquipmentImage = async (id: string | number, file: File): Promise<string> => {
	const formData = new FormData();
	formData.append('image', file);
	const data = await apiFetch<{ image_url: string }>(`/equipment/${id}/image`, {
		method: 'POST',
		headers: authHeaders(),
		body: formData
	});
	return data.image_url;
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const fetchAdminPending = (): Promise<{
	gyms: PendingGym[];
	equipment: PendingEquipment[];
	suggestions: PendingSuggestion[];
	photos: PendingPhoto[];
	variants: PendingVariant[];
	weightStacks: PendingWeightStack[];
	gymInstagrams: PendingGymInstagram[];
}> => apiFetch('/admin/pending', { headers: authHeaders() });

export const adminPhotoAction = (action: 'approve' | 'reject', id: number): Promise<void> =>
	apiFetch(`/admin/${action}/photo/${id}`, {
		method: 'POST',
		headers: authHeaders()
	});

export const fetchAdminUsers = (): Promise<{ users: AdminUser[] }> =>
	apiFetch('/admin/users', { headers: authHeaders() });

export const adminAction = (
	action: 'approve' | 'reject',
	type: 'gym' | 'equipment' | 'suggestion' | 'variant' | 'weight-stack' | 'gym-instagram',
	id: number
): Promise<void> =>
	apiFetch(`/admin/${action}/${type}/${id}`, {
		method: 'POST',
		headers: authHeaders()
	});

export const makeAdmin = (userId: string): Promise<void> =>
	apiFetch(`/admin/make-admin/${userId}`, {
		method: 'POST',
		headers: authHeaders()
	});

// ── Best in Class ─────────────────────────────────────────────────────────────

export const fetchBestInClassCategories = async (): Promise<{ categories: BestInClassCategory[] }> => {
	const data = await apiFetch<BestInClassCategory[] | { categories: BestInClassCategory[] }>('/best-in-class/categories');
	return Array.isArray(data) ? { categories: data } : data;
};

export const setBestInClass = (categoryId: number, equipmentId: number): Promise<void> =>
	apiFetch('/best-in-class', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ category_id: categoryId, equipment_id: equipmentId })
	});

export const removeBestInClass = (categoryId: number): Promise<void> =>
	apiFetch(`/best-in-class/${categoryId}`, {
		method: 'DELETE',
		headers: authHeaders()
	});

export const fetchUserBestInClass = async (
	userId: string | number
): Promise<{ best_in_class: BestInClassEntry[] }> => {
	const data = await apiFetch<BestInClassEntry[] | { best_in_class: BestInClassEntry[] }>(`/best-in-class/user/${userId}`, { headers: authHeaders() });
	return Array.isArray(data) ? { best_in_class: data } : data;
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const fetchLeaderboard = (): Promise<LeaderboardEntry[]> =>
	apiFetch('/leaderboard');

export const fetchLeaderboardUser = (id: string | number): Promise<unknown> =>
	apiFetch(`/leaderboard/user/${id}`, { headers: authHeaders() });

export const fetchUserByUsername = (username: string) =>
	apiFetch(`/users/by-username/${username}`);

export const syncUser = (): Promise<{ id: string; email: string; username: string; role: 'user' | 'admin' | 'super_admin' }> =>
	apiFetch('/users/sync', { method: 'POST', headers: authHeaders() });

// ── Users ─────────────────────────────────────────────────────────────────────

export const fetchUser = (id: string | number): Promise<unknown> =>
	apiFetch(`/users/${id}`, { headers: authHeaders() });

export type UserStats = {
	favouriteGymsCount: number;
	favouriteEquipmentCount: number;
	gyms_rated: number;
	equipment_rated: number;
};

export const fetchUserStats = (id: string | number): Promise<UserStats> =>
	apiFetch(`/users/${id}/stats`, { headers: authHeaders() });

export const fetchUserRatingsGyms = (id: string | number): Promise<unknown> =>
	apiFetch(`/users/${id}/ratings/gyms`, { headers: authHeaders() });

export const fetchUserRatingsEquipment = (id: string | number): Promise<unknown> =>
	apiFetch(`/users/${id}/ratings/equipment`, { headers: authHeaders() });

export const fetchUserFavouritesGyms = (id: string | number): Promise<unknown> =>
	apiFetch(`/users/${id}/favourites/gyms`, { headers: authHeaders() });

export const fetchUserFavouritesEquipment = (id: string | number): Promise<unknown> =>
	apiFetch(`/users/${id}/favourites/equipment`, { headers: authHeaders() });
