'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export default function Login() {
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleGoogle = async () => {
		const redirect = new URLSearchParams(window.location.search).get('redirect');
		const callback = `${window.location.origin}/auth/callback${
			redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
		}`;
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: callback }
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await login(email, password);
		} catch (err: any) {
			setError(err.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	const inputClass =
		'bg-sub-alt border-0 text-main placeholder:text-sub w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-main/20';

	return (
		<div className="w-full max-w-xs">
			<div className="mb-6 flex items-center gap-2">
				<LogIn className="text-sub h-4 w-4" />
				<span className="text-sub text-sm">login</span>
			</div>

			<form onSubmit={handleSubmit} className="space-y-2">
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					placeholder="email"
					className={inputClass}
				/>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					placeholder="password"
					className={inputClass}
				/>

				{error && <p className="text-xs text-red-400">{error}</p>}

				<div className="flex items-center gap-2 py-1">
					<input type="checkbox" id="remember" className="accent-main h-3.5 w-3.5 rounded" />
					<label htmlFor="remember" className="text-sub text-sm">
						remember me
					</label>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="bg-sub-alt text-sub hover:text-main flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
				>
					<LogIn className="h-3.5 w-3.5" />
					{loading ? 'signing in...' : 'sign in'}
				</button>
			</form>

			<div className="my-4 flex items-center gap-3">
				<div className="bg-border h-px flex-1" />
				<span className="text-sub text-xs">or</span>
				<div className="bg-border h-px flex-1" />
			</div>

			<button
				type="button"
				onClick={handleGoogle}
				className="bg-sub-alt text-sub hover:text-main flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition"
			>
				<FcGoogle className="h-4 w-4" />
				continue with google
			</button>

			<button className="text-sub mt-4 w-full text-right text-xs hover:underline">
				forgot password?
			</button>
		</div>
	);
}
