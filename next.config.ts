import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	allowedDevOrigins: ['192.168.1.6', 'localhost', '127.0.0.1'],
	transpilePackages: ['react-map-gl', 'mapbox-gl'],
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'res.cloudinary.com' },
			{ protocol: 'https', hostname: 'gymatlasstorage.blob.core.windows.net' }
		],
		// Gym/equipment photos are immutable once uploaded — a replacement upload
		// is staged under a new URL and only swapped in after admin approval, so
		// the URL a page requests today will never change out from under a cache.
		minimumCacheTTL: 31536000
	}
};

export default nextConfig;
