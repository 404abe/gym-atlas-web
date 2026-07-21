import type { MetadataRoute } from 'next';
import { fetchGyms, fetchAllEquipment } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

// Re-check every hour so newly approved gyms/equipment show up without a redeploy.
export const revalidate = 3600;

const STATIC_ROUTES: MetadataRoute.Sitemap = [
	{ url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
	{ url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
	{ url: `${SITE_URL}/login`, changeFrequency: 'monthly', priority: 0.5 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// /gyms and /equipment already filter to status = 'approved' server-side
	// (see gymRepository.getGyms / equipmentRepository.getAllEquipment), so no
	// client-side status filter is needed here.
	//
	// Both lists currently total well under 300 rows and the API has no
	// limit/offset support to page through, so a single fetch per resource is
	// safe. If the catalog grows large enough to risk a build timeout, switch
	// to `generateSitemaps` (app/sitemap.ts docs) to split into chunks.
	try {
		const [gyms, equipment] = await Promise.all([fetchGyms(), fetchAllEquipment()]);

		const gymEntries: MetadataRoute.Sitemap = gyms.map((gym) => ({
			url: `${SITE_URL}/gyms/${gym.id}`,
			lastModified: gym.created_at ? new Date(gym.created_at) : undefined,
			changeFrequency: 'daily',
			priority: 0.8
		}));

		const equipmentEntries: MetadataRoute.Sitemap = equipment.map((item) => ({
			url: `${SITE_URL}/equipment/${item.id}`,
			lastModified: item.created_at ? new Date(item.created_at) : undefined,
			changeFrequency: 'daily',
			priority: 0.8
		}));

		return [...STATIC_ROUTES, ...gymEntries, ...equipmentEntries];
	} catch (err) {
		console.error('SITEMAP GENERATION ERROR:', err);
		return STATIC_ROUTES;
	}
}
