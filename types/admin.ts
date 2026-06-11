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
	image_url?: string;
}

export interface PendingSuggestion {
	id: number;
	gym_name: string;
	equipment_name: string;
	equipment_image_url?: string;
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

export interface PendingVariant {
	id: number;
	equipment_id: number;
	equipment_name: string;
	equipment_image_url?: string;
	label: string;
	variation_type: 'grip' | 'unilateral' | 'incline';
	is_default: boolean;
	created_at: string;
	submitted_by?: string;
}

export interface PendingWeightStack {
	id: number;
	brand: string;
	series: string | null;
	name: string;
	image_url?: string;
	weight_stack: number | null;
	pending_weight_stack: number;
	submitted_by?: string;
}

export interface AdminUser {
	id: string;
	email: string;
	role: 'user' | 'admin' | 'super_admin';
	created_at: string;
}
