'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from './DatePicker';
import { add } from 'date-fns';
import { Textarea } from './ui/textarea';

export const EditShootModal = ({ isOpen, onClose, onEditShoot, shoot }) => {
    const [title, setTitle] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [location, setLocation] = useState('');
    const [shootDate, setShootDate] = useState<Date | null>(null);
    const [editDueDate, setEditDueDate] = useState<Date | null>(null);
    const [price, setPrice] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (shoot) {
            setTitle(shoot.title || '');
            setClientName(shoot.clientName || '');
            setClientEmail(shoot.clientEmail || '');
            setClientContact(shoot.clientContact || '');
            setLocation(shoot.location || '');
            setShootDate(shoot.shootDate ? new Date(shoot.shootDate) : null);
            setEditDueDate(shoot.editDueDate ? new Date(shoot.editDueDate) : null);
            setPrice(shoot.price || '');
            setNotes(shoot.frictionLog || '');
            setIsInitialLoad(true);
        }
    }, [shoot]);
    
    useEffect(() => {
        if (!isInitialLoad && shootDate) {
            setEditDueDate(add(shootDate, { days: 14 }));
        }
        setIsInitialLoad(false);
    }, [shootDate, isInitialLoad]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !shoot) return;
        onEditShoot({ 
            ...shoot,
            title, 
            clientName, 
            clientEmail,
            clientContact, 
            location, 
            shootDate,
            editDueDate,
            price: Number(price),
            frictionLog: notes
        });
    };
    
    if (!shoot) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Shoot</DialogTitle>
                    <DialogDescription>
                        Update the details for this shoot. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., La Terraza Cafe" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientName" className="text-right">Client</Label>
                            <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="col-span-3" placeholder="e.g., Maria Rodriguez" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientEmail" className="text-right">Email</Label>
                            <Input id="clientEmail" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="col-span-3" placeholder="e.g., name@example.com" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientContact" className="text-right">Phone</Label>
                            <Input id="clientContact" type="tel" value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="col-span-3" placeholder="e.g., +447..." />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" placeholder="e.g., 123 Blossom St, Valencia" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="shootDate" className="text-right">Shoot Date</Label>
                            <DatePicker date={shootDate} setDate={setShootDate} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editDueDate" className="text-right">Edit Due Date</Label>
                            <DatePicker date={editDueDate} setDate={setEditDueDate} />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Agreed Price (£)</Label>
                            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="notes" className="text-right">
                                Notes
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="col-span-3"
                                placeholder="Initial thoughts or requirements."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
