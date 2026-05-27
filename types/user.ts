// types/user.ts
import type { Gym } from './gym';
import type { Equipment } from './equipment';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
	id: number;
	email: string;
	username: string;
	role: UserRole;
}

export interface UserProfile {
	username: string;
	created_at: string;
	leaderboard_rank?: number;
	gyms_rated?: number;
	equipment_rated?: number;
}

export interface ContributionSummary {
	gyms_added: string;
	equipment_added: string;
	equipment_linked: string;
	total_contributions: string;
}

export interface EquipmentLink {
	id: number;
	gym_name: string;
	equipment_name: string;
	created_at: string;
}

export interface UserContributions {
	summary: ContributionSummary;
	recent: {
		gyms: Gym[];
		equipment: Equipment[];
		links: EquipmentLink[];
	};
}
