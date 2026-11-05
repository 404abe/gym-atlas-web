import Image from 'next/image';

// Below this size the pin and dumbbell cutouts blur, so the simple mark is used.
const DETAIL_MIN_SIZE = 36;

export default function GymAtlasLogo({ size = 24 }: { size?: number }) {
	return (
		<Image
			src={size >= DETAIL_MIN_SIZE ? '/gymatlas-mark-white.svg' : '/gymatlas-mark-white-simple.svg'}
			alt="GymAtlas"
			width={size}
			height={size}
			priority
			className="gym-atlas-logo"
		/>
	);
}
