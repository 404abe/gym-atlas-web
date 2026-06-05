// components/layout/MobileHeader.tsx
import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import GymAtlasLogo from '../ui/GymAtlasLogo';
import NotificationDrawer from '@/components/NotificationDrawer';

export default function MobileHeader() {
    return (
        <header className="flex h-12 shrink-0 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 no-underline">
                <GymAtlasLogo size={20} />
                <span className="text-lg font-bold tracking-tight text-text">GymAtlas</span>
            </Link>
            <div className="flex items-center gap-1.5">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-sub-alt">
                    <NotificationDrawer />
                </div>
                <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-sub-alt text-sub no-underline">
                    <UserCircle size={15} />
                </Link>
            </div>
        </header>
    );
}