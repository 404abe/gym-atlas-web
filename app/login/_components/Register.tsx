'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export default function Register() {
	const { register } = useAuth();
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleGoogle = async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: `${window.location.origin}/auth/callback` }
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
			setError('Username must be 3-20 characters (letters, numbers, underscores only)');
			return;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			return;
		}

		setLoading(true);
		try {
			await register(email, password, username);
		} catch (err: any) {
			setError(err.message || 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	const inputClass =
		'bg-sub-alt border-0 text-main placeholder:text-sub w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-main/20';

	return (
		<div className="w-full max-w-xs">
			<div className="mb-6 flex items-center gap-2">
				<UserPlus className="text-sub h-4 w-4" />
				<span className="text-sub text-sm">register</span>
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
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
					placeholder="username"
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
				<input
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					required
					placeholder="verify password"
					className={inputClass}
				/>

				{error && <p className="text-xs text-red-400">{error}</p>}

				<button
					type="submit"
					disabled={loading}
					className="bg-sub-alt text-sub hover:text-main flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
				>
					<UserPlus className="h-3.5 w-3.5" />
					{loading ? 'creating account...' : 'sign up'}
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
		</div>
	);
}
