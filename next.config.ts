import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	allowedDevOrigins: ['192.168.1.6', 'localhost', '127.0.0.1'],
	transpilePackages: ['react-map-gl', 'mapbox-gl']
};

export default nextConfig;
