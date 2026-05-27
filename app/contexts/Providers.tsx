import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { GymFilterProvider } from './GymFilterContext';

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<ToastProvider>
				<GymFilterProvider>
					{children}
				</GymFilterProvider>
			</ToastProvider>
		</AuthProvider>
	);
}
