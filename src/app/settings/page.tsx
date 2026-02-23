import React, { Suspense } from 'react';
import { DopamineApp } from '@/components/DopamineApp';

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DopamineApp defaultView="settings" />
        </Suspense>
    );
}
