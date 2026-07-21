'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRedirectTarget } from '@/app/contexts/AuthContext';
import Login from './_components/Login';
import Register from './_components/Register';

export default function LoginPage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && user) router.push(getRedirectTarget('/account'));
	}, [user, loading, router]);

	if (loading || user) {
		return (
			<div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
				<p className="text-sub text-sm">Redirecting...</p>
			</div>
		);
	}

	return (
		<div
			id="pageSignIn"
			className="content-grid min-h-[calc(100vh-120px)]"
		>
			<div className="flex items-center justify-center py-24">
				<div className="flex items-start gap-16 lg:gap-24">
					<Register />

					<div className="bg-sub-alt relative hidden w-px self-stretch md:block">
						<span className="bg-bg text-sub absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs">
							or
						</span>
					</div>

					<Login />
				</div>
			</div>
		</div>
	);
}
