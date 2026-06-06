'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function ThemeToggle({ className }: { className?: string }) {
	const { theme, toggle } = useTheme();

	return (
		<button
			onClick={toggle}
			aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
			className={className}
		>
			{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
		</button>
	);
}
