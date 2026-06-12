import { AuthProvider } from './AuthContext';
import { AuthGateProvider } from './AuthGateContext';
import { ToastProvider } from './ToastContext';
import { GymFilterProvider } from './GymFilterContext';
import { ThemeProvider } from './ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AuthGateProvider>
					<ToastProvider>
						<GymFilterProvider>{children}</GymFilterProvider>
					</ToastProvider>
				</AuthGateProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
