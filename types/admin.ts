export interface PendingGym {
	id: number;
	name: string;
	city?: string;
	country?: string;
	address?: string;
	instagram?: string;
	created_at: string;
	submitted_by?: string;
}

export interface PendingEquipment {
	id: number;
	brand: string;
	series: string;
	name: string;
	type: string;
	created_at: string;
	submitted_by?: string;
}

export interface PendingSuggestion {
	id: number;
	gym_name: string;
	equipment_name: string;
	quantity: number;
	created_at: string;
	submitted_by?: string;
}

export interface PendingPhoto {
	id: number;
	brand: string;
	series: string | null;
	name: string;
	image_url: string;
	photo_uploaded_at: string;
	submitted_by?: string;
}

export interface AdminUser {
	id: string;
	email: string;
	role: 'user' | 'admin' | 'super_admin';
	created_at: string;
}
