'use client';

import Map, { Marker } from 'react-map-gl/mapbox';
import { useEffect, useRef, useState } from 'react';
import { Gym } from '@/types/gym';

export default function MapView({
	gyms,
	selectedGym,
	onSelectGym,
	userLocation
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	userLocation: { lat: number; lng: number } | null;
}) {
	const mapRef = useRef<any>(null);

	const [viewState, setViewState] = useState({
		longitude: -3.1883,
		latitude: 55.9533,
		zoom: 5
	});

	useEffect(() => {
		if (!userLocation || !mapRef.current) return;
		mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1500 });
	}, [userLocation]);

	useEffect(() => {
		if (!selectedGym || !mapRef.current) return;

		mapRef.current.flyTo({
			center: [Number(selectedGym.lng), Number(selectedGym.lat)],
			zoom: 14,
			duration: 1200
		});
	}, [selectedGym]);




	return (
		<div id="MapView" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
			<Map
				ref={mapRef}
				{...viewState}
				onMove={(evt) => setViewState(evt.viewState)}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
				mapStyle="mapbox://styles/mapbox/dark-v11"
				style={{ width: '100%', height: '100%' }}
			>
				{gyms.map((gym) => (
					<Marker
						key={gym.id}
						longitude={Number(gym.lng)}
						latitude={Number(gym.lat)}
						anchor="bottom"
					>
						<div
							onClick={() => onSelectGym(gym)}
							className={`h-4 w-4 cursor-pointer rounded-full transition ${
								selectedGym?.id === gym.id ? 'scale-125 bg-red-500' : 'bg-blue-500'
							}`}
						/>
					</Marker>
				))}
			</Map>
		</div>
	);
}
