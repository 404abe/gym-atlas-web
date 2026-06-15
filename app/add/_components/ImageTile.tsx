'use client';

import React from 'react';
import { Dumbbell } from 'lucide-react';

type ImageTileProps = {
    preview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
};

export default function ImageTile({ preview, onImageChange, className = '' }: ImageTileProps) {
    return (
        <div className={`bg-sub-alt relative overflow-hidden rounded-2xl ${className}`}>
            {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-contain" />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <Dumbbell className="text-sub h-10 w-10 opacity-30" />
                </div>
            )}
            <label className="absolute bottom-3 right-3 cursor-pointer">
                <div className="bg-surface/80 text-sub hover:text-main rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm transition">
                    {preview ? 'Change photo' : 'Add photo'}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
            </label>
        </div>
    );
}
