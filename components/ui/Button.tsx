import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'icon' | 'pill' | 'ghost' | 'nav';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	active?: boolean;
}

export function Button({ variant = 'icon', active = false, className, ...props }: ButtonProps) {
	const base =
		'flex items-center justify-center cursor-pointer transition-colors duration-[0.22s] border-none outline-none';

	const variants: Record<Variant, string> = {
		icon: 'w-[var(--hit-size)] h-[var(--hit-size)] rounded-[var(--roundness)] bg-transparent text-sub hover:text-text',
		pill: 'h-[var(--hit-size)] px-4 gap-2 rounded-lg bg-[rgba(20,20,20,0.92)] border border-[0.5px] border-[var(--border-color)] backdrop-blur text-sub hover:text-text',
		ghost: 'bg-transparent text-sub hover:text-text p-0 shrink-0',
		nav: 'h-[var(--hit-size)] px-4 rounded-[var(--roundness)] bg-transparent text-sub hover:text-text'
	};

	const activeClass = active ? 'text-text bg-[#1e1e1e]' : '';

	return <button className={cn(base, variants[variant], activeClass, className)} {...props} />;
}
