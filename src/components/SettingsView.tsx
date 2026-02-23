import React from 'react';
import { Settings } from 'lucide-react';

const SettingsView = ({ user }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Settings size={64} className="text-primary opacity-30 mb-4" />
            <h2 className="text-3xl font-bold text-foreground">App Settings</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
                This is where your settings would be. You could allow the user to change their name, title, or application theme.
            </p>
            <div className="mt-8 bg-card p-6 rounded-2xl border border-border text-left w-full max-w-sm">
                <h3 className="font-bold mb-4">User Information</h3>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Title:</strong> {user.title}</p>
            </div>
        </div>
    );
};

export default SettingsView;
