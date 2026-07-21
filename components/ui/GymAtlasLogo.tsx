import Image from 'next/image';

export default function GymAtlasLogo({ size = 24 }: { size?: number }) {
	return (
		<Image
			src="/gymatlas_logo_white.png"
			alt="GymAtlas"
			width={size}
			height={size}
			priority
			className="gym-atlas-logo"
		/>
	);
}
