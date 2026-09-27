import { useEffect, useState } from 'react';

// Pass enabled=false to hold off the permission prompt until it's needed.
export function useUserLocation(enabled = true) {
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		if (!enabled) return;
		navigator.geolocation.getCurrentPosition(
			(pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
			() => setUserLocation(null)
		);
	}, [enabled]);

	return userLocation;
}
