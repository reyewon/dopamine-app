'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { User, Mail, MapPin, Calendar, MoreHorizontal, Edit, Wind, Upload, FileText, X, Check, FileBadge, Phone, Share2, Wallet, Trash2, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ProgressChecklist = ({ progress, onToggle }) => {
    const stages = [
        { key: 'shoot', label: 'Shoot' },
        { key: 'tickoff', label: 'Tick off' },
        { key: 'cull', label: 'Cull' },
        { key: 'edit', label: 'Edit' },
        { key: 'exportUpload', label: 'Export/Upload' },
    ];

    return (
        <div className="space-y-3">
            {stages.map((stage) => (
                <button
                    key={stage.key}
                    onClick={() => onToggle(stage.key)}
                    className={cn(
                        "w-full flex items-center gap-3 text-left p-3 rounded-lg border transition-colors",
                        progress[stage.key]
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-background hover:bg-primary/5 border-border'
                    )}
                >
                    <div className={cn("size-5 rounded-md border-2 flex items-center justify-center", progress[stage.key] ? 'border-primary bg-primary' : 'border-muted-foreground/30')}>
                        {progress[stage.key] && <Check size={12} className="text-white" />}
                    </div>
                    <span className={cn("font-medium text-sm", progress[stage.key] ? 'text-primary' : 'text-foreground')}>{stage.label}</span>
                </button>
            ))}
        </div>
    );
};

const InvoiceStatusPill = ({ status, onClick }) => {
    const statusStyles = {
        'Unsent': 'bg-gray-400 text-white',
        'Sent': 'bg-yellow-400 text-black',
        'Overdue': 'bg-red-500 text-white',
        'Paid': 'bg-green-500 text-white',
    };
    return (
        <button onClick={onClick} className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", statusStyles[status] || statusStyles['Unsent'])}>
            {status}
        </button>
    );
};

const VibeCheckAsset = ({ asset, onDelete }) => {
    const isImage = asset.url.startsWith('data:image');
    return (
        <div className="relative group/asset size-24 rounded-xl overflow-hidden shrink-0 shadow-inner bg-background border border-border">
            {isImage ? (
                <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                    <FileText size={24} className="text-muted-foreground" />
                    <p className="text-[10px] leading-tight mt-1 text-muted-foreground truncate">{asset.label}</p>
                </div>
            )}
            <button onClick={onDelete} className="absolute -top-1 -right-1 size-5 bg-muted-foreground/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/asset:opacity-100 transition-opacity z-10">
                <X size={12} />
            </button>
        </div>
    );
};

export const ShootCard = ({ shoot, onEditShoot, onShootUpdate, onDeleteShoot }) => {
    const [mobileExpanded, setMobileExpanded] = useState(false);

    const locationUrl = shoot.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shoot.location)}` : '#';
    const showWeather = shoot.shootDate && differenceInHours(new Date(shoot.shootDate), new Date()) <= 48 && differenceInHours(new Date(shoot.shootDate), new Date()) > 0;

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAsset = { id: `asset-${Date.now()}`, label: file.name, url: event.target.result as string };
                onShootUpdate(shoot.id, { assets: [...(shoot.assets || []), newAsset] });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteAsset = (assetId) => {
        const newAssets = (shoot.assets || []).filter(asset => asset.id !== assetId);
        onShootUpdate(shoot.id, { assets: newAssets });
    };

    const handleProgressToggle = (stageKey) => {
        const newProgress = { ...shoot.progress };
        const currentState = newProgress[stageKey];
        newProgress[stageKey] = !currentState;
        if (stageKey === 'exportUpload' && !currentState) {
            newProgress.shoot = true;
            newProgress.tickoff = true;
            newProgress.cull = true;
            newProgress.edit = true;
        }
        onShootUpdate(shoot.id, { progress: newProgress });
    };

    const handleInvoiceStatusCycle = () => {
        const statuses = ['Unsent', 'Sent', 'Overdue', 'Paid'];
        const currentIndex = statuses.indexOf(shoot.invoiceStatus);
        const nextIndex = (currentIndex + 1) % statuses.length;
        onShootUpdate(shoot.id, { invoiceStatus: statuses[nextIndex] });
    };

    const handlePriceChange = (newPrice) => {
        onShootUpdate(shoot.id, { price: newPrice });
    };

    const completedStages = Object.values(shoot.progress || {}).filter(Boolean).length;
    const totalStages = 5;

    return (
        <Card className="flex flex-col h-full rounded-3xl overflow-hidden shadow-lg border-border">
            {/* ── Header (always visible) ───────────────────────── */}
            <CardHeader className="bg-primary text-primary-foreground p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl font-bold pr-4 truncate">{shoot.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1 text-primary-foreground/80">
                            <User size={14} /> {shoot.clientName}
                        </CardDescription>
                        {/* Mobile summary row — shown when collapsed */}
                        <div className="flex items-center gap-3 mt-2 md:hidden">
                            {shoot.shootDate && (
                                <span className="text-xs text-primary-foreground/70 flex items-center gap-1">
                                    <Calendar size={12} /> {format(new Date(shoot.shootDate), 'd MMM yyyy')}
                                    {shoot.shootTime && <><Clock size={12} className="ml-1" /> {shoot.shootTime}</>}
                                </span>
                            )}
                            <InvoiceStatusPill status={shoot.invoiceStatus} onClick={handleInvoiceStatusCycle} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Mobile expand/collapse toggle */}
                        <button
                            className="md:hidden p-2 text-primary-foreground/70 hover:text-primary-foreground rounded-full hover:bg-white/20 transition-colors"
                            onClick={() => setMobileExpanded(prev => !prev)}
                            aria-label={mobileExpanded ? 'Collapse' : 'Expand'}
                        >
                            <ChevronDown
                                size={20}
                                className={cn('transition-transform duration-200', mobileExpanded ? 'rotate-180' : '')}
                            />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20 -mr-2 -mt-2">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditShoot(shoot)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit Shoot</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Share</span>
                                </DropdownMenuItem>
                                {onDeleteShoot && (
                                    <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onClick={() => {
                                            if (window.confirm(`Delete shoot "${shoot.title}"? This cannot be undone.`)) {
                                                onDeleteShoot(shoot.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Shoot</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            {/* ── Expandable body — always visible on desktop, toggle on mobile ── */}
            <div className={cn('flex flex-col flex-1', mobileExpanded ? 'block' : 'hidden md:flex md:flex-col md:flex-1')}>
                <CardContent className="flex-1 space-y-4 p-6 bg-card">
                    {/* Contact & Location */}
                    <div className="text-sm text-muted-foreground space-y-3">
                        {shoot.clientEmail && <a href={`mailto:${shoot.clientEmail}`} className="flex items-center gap-2 hover:text-primary hover:underline"><Mail size={14} /> {shoot.clientEmail}</a>}
                        {shoot.clientContact && <a href={`tel:${shoot.clientContact}`} className="flex items-center gap-2 hover:text-primary hover:underline"><Phone size={14} /> {shoot.clientContact}</a>}
                        {shoot.location && (
                            <div className="flex gap-4 items-start pt-2">
                                <a href={locationUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-primary hover:underline flex-1">
                                    <MapPin size={14} className="mt-0.5 shrink-0" /> {shoot.location}
                                </a>
                                <a href={locationUrl} target="_blank" rel="noopener noreferrer" className="block size-16 rounded-lg overflow-hidden shrink-0 ring-1 ring-border shadow-sm hover:ring-primary transition-all">
                                    <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(shoot.location)}&zoom=14&size=128x128&maptype=roadmap&markers=color:0xD97757%7C${encodeURIComponent(shoot.location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`} alt={`Map of ${shoot.location}`} className="w-full h-full object-cover" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Date / Time / Edit due */}
                    <div className="flex flex-col gap-2 pt-2">
                        {shoot.shootDate && (
                            <p className="flex items-center gap-2 font-bold text-foreground text-md">
                                <Calendar size={14} /> {format(new Date(shoot.shootDate), 'PPP')}
                                {shoot.shootTime && <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground ml-1"><Clock size={13} /> {shoot.shootTime} GMT</span>}
                            </p>
                        )}
                        {shoot.editDueDate && <p className="flex items-center gap-2 font-medium text-muted-foreground text-sm"><FileBadge size={14} /> Due: {format(new Date(shoot.editDueDate), 'PPP')} ({formatDistanceToNow(new Date(shoot.editDueDate), { addSuffix: true })})</p>}
                        {showWeather && (
                            <div className="flex items-center gap-1.5 bg-accent/50 text-accent-foreground px-2 py-1 rounded-full text-xs font-medium self-start">
                                <Wind size={14} /> 19°C
                            </div>
                        )}
                    </div>

                    {/* Vibe Check Moodboard */}
                    <div className="pt-4 space-y-3">
                        <p className="text-[11px] font-bold opacity-50 uppercase tracking-wider">Vibe Check</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                            {(shoot.assets || []).map(asset => <VibeCheckAsset key={asset.id} asset={asset} onDelete={() => handleDeleteAsset(asset.id)} />)}
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                            <button onClick={() => fileInputRef.current?.click()} className="size-24 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-primary shrink-0">
                                <Upload size={24} />
                                <span className="text-[10px] mt-1 font-semibold">Upload Assets</span>
                            </button>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex-col items-start gap-4 p-6 bg-card">
                    <div className="w-full space-y-4">
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold opacity-50 uppercase tracking-wider">Post-Shoot Admin</p>
                            <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                                <Label htmlFor={`price-${shoot.id}`} className="text-sm font-medium pr-4 flex items-center gap-2"><Wallet size={14} /> Agreed Price (£)</Label>
                                <Input
                                    id={`price-${shoot.id}`}
                                    type="number"
                                    value={shoot.price || 0}
                                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                                    className="max-w-[100px] text-right font-semibold"
                                />
                            </div>
                            <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                                <Label className="text-sm font-medium pr-4">Invoice Status</Label>
                                <InvoiceStatusPill status={shoot.invoiceStatus} onClick={handleInvoiceStatusCycle} />
                            </div>
                            <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                                <Label htmlFor={`sneak-peek-${shoot.id}`} className="text-sm font-medium pr-4">Send Sneak Peeks</Label>
                                <Switch id={`sneak-peek-${shoot.id}`} checked={shoot.sendSneakPeeks} onCheckedChange={(checked) => onShootUpdate(shoot.id, { sendSneakPeeks: checked })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[11px] font-bold opacity-50 uppercase tracking-wider">Progress ({completedStages}/{totalStages})</p>
                            <div className="bg-background p-3 rounded-xl border border-border">
                                <ProgressChecklist progress={shoot.progress} onToggle={handleProgressToggle} />
                            </div>
                        </div>
                    </div>

                    <Collapsible className="w-full pt-4">
                        <CollapsibleTrigger className="text-xs text-muted-foreground font-bold hover:text-primary transition-colors">Notes / Friction Log</CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                            <Textarea
                                placeholder="What went well? What could be improved?"
                                value={shoot.frictionLog}
                                onChange={(e) => onShootUpdate(shoot.id, { frictionLog: e.target.value })}
                                className="text-xs"
                            />
                        </CollapsibleContent>
                    </Collapsible>
                </CardFooter>
            </div>
        </Card>
    );
};
