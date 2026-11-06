import Image from 'next/image';
import { brandInitials } from '@/lib/utils';

type Props = {
	name: string;
	logoUrl?: string | null;
	/** Tailwind size classes for the tile, e.g. "h-9 w-9". */
	className?: string;
};

/** Square brand tile: the uploaded logo when there is one, otherwise a monogram. */
export default function BrandLogo({ name, logoUrl, className = 'h-9 w-9' }: Props) {
	return (
		<span
			className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${
				logoUrl ? 'bg-white' : 'bg-sub-alt text-sub'
			} ${className}`}
		>
			{logoUrl ? (
				<Image src={logoUrl} alt={`${name} logo`} fill sizes="48px" className="object-contain p-1" />
			) : (
				<span className="font-mono text-[11px] font-medium" aria-hidden="true">
					{brandInitials(name)}
				</span>
			)}
		</span>
	);
}
