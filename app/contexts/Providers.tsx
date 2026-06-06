import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { GymFilterProvider } from './GymFilterContext';
import { ThemeProvider } from './ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<AuthProvider>
				<ToastProvider>
					<GymFilterProvider>{children}</GymFilterProvider>
				</ToastProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
