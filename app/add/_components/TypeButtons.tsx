'use client';

import { Equipment } from '@/types/equipment';

type TypeButtonsProps = {
    type: Equipment['type'] | null;
    setType: (t: Equipment['type']) => void;
    col?: boolean;
};

export default function TypeButtons({ type, setType, col }: TypeButtonsProps) {
    return (
        <div className={`mt-1 flex ${col ? 'flex-col' : ''} gap-2`}>
            {(['pin_loaded', 'plate_loaded'] as const).map((t) => (
                <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                        type === t ? 'bg-main text-bg border-transparent' : 'border-border text-sub hover:text-main'
                    }`}
                >
                    {t === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
                </button>
            ))}
        </div>
    );
}