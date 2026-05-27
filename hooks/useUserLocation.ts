import { useEffect, useState } from 'react';

export function useUserLocation() {
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			(pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
			() => setUserLocation(null)
		);
	}, []);

	return userLocation;
}
