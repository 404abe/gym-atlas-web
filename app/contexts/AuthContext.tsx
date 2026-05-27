'use client';
import { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { loginUser, registerUser } from '@/lib/api';
import { User } from '@/types/user';

type AuthContextType = {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, username: string) => Promise<void>;
	logout: () => void;
	loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeToken(token: string): User {
	const payload = JSON.parse(atob(token.split('.')[1]));
	return {
		id: payload.id,
		email: payload.email,
		username: payload.username || '',
		role: payload.role ?? 'user'
	};
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const storedToken = localStorage.getItem('auth_token');
		if (storedToken) {
			try {
				setUser(decodeToken(storedToken));
				setToken(storedToken);
			} catch (error) {
				console.error('❌ Invalid token:', error);
				localStorage.removeItem('auth_token');
			}
		}
		setLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		const data = await loginUser(email, password);
		localStorage.setItem('auth_token', data.token);
		setUser(decodeToken(data.token));
		setToken(data.token);
		router.push('/');
	};

	const register = async (email: string, password: string, username: string) => {
		await registerUser(email, password, username);
		await login(email, password);
	};

	const logout = () => {
		localStorage.removeItem('auth_token');
		setUser(null);
		setToken(null);
		router.push('/');
	};

	return (
		<AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export { AuthContext };

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
}
