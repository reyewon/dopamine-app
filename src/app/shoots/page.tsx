import React, { Suspense } from 'react';
import { DopamineApp } from '@/components/DopamineApp';

export default function ShootsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DopamineApp defaultView="shoots" />
        </Suspense>
    );
}
