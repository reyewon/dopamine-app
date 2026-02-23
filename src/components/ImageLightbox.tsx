'use client';
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

export const ImageLightbox = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <Dialog open={!!imageUrl} onOpenChange={onClose}>
            <DialogContent className="p-0 bg-transparent border-none max-w-4xl w-full h-auto shadow-none">
                <img src={imageUrl} alt="Lightbox" className="max-h-[80vh] w-auto h-auto object-contain mx-auto rounded-lg" />
                 <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 md:-top-4 md:-right-4 size-8 md:size-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    <X size={20} />
                </button>
            </DialogContent>
        </Dialog>
    );
};
