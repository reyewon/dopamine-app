'use client';
import React from 'react';
import { Plus, Camera, CheckCircle2, TrendingUp, AlertTriangle, FileText, BadgeCheck } from 'lucide-react';
import { ShootCard } from './ShootCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const AddShootCard = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col h-full rounded-3xl border-2 border-dashed border-border hover:border-primary hover:text-primary transition-all text-muted-foreground items-center justify-center p-8 group min-h-[400px]"
    >
        <div className="size-16 rounded-full bg-background group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
            <Plus size={32} />
        </div>
        <p className="font-bold text-lg">Add New Shoot</p>
        <p className="text-sm">Schedule your next session.</p>
    </button>
);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
};

const IncomeDashboard = ({ shoots }) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const incomingRevenue = shoots
        .filter(s => s.invoiceStatus === 'Sent' || s.invoiceStatus === 'Overdue')
        .reduce((acc, s) => acc + (s.price || 0), 0);
    
    const overduePayments = shoots
        .filter(s => s.invoiceStatus === 'Overdue')
        .reduce((acc, s) => acc + (s.price || 0), 0);

    const paidThisMonth = shoots
        .filter(s => {
            if (s.invoiceStatus !== 'Paid' || !s.shootDate) return false;
            const shootDate = new Date(s.shootDate);
            return shootDate.getMonth() === currentMonth && shootDate.getFullYear() === currentYear;
        })
        .reduce((acc, s) => acc + (s.price || 0), 0);

    return (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={18} className="text-muted-foreground" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Incoming Revenue</h3>
                </div>
                <p className="text-4xl font-bold text-foreground">{formatCurrency(incomingRevenue)}</p>
            </div>
             <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Overdue Payments</h3>
                </div>
                <p className="text-4xl font-bold text-red-500">{formatCurrency(overduePayments)}</p>
            </div>
             <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <BadgeCheck size={18} className="text-green-500" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Paid This Month</h3>
                </div>
                <p className="text-4xl font-bold text-green-500">{formatCurrency(paidThisMonth)}</p>
            </div>
        </div>
    );
};


const ShootsView = ({ shoots, onAddShoot, onEditShoot, onShootUpdate, onDeleteShoot }) => {
    const upcomingShoots = shoots.filter(shoot => !shoot.progress.exportUpload);
    const completedShoots = shoots.filter(shoot => shoot.progress.exportUpload);

    return (
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-20">
            <div className="mx-auto space-y-12 max-w-7xl 2xl:max-w-none">
                <IncomeDashboard shoots={shoots} />
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-6">Upcoming</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-8">
                        {upcomingShoots.map(shoot => (
                            <ShootCard
                                key={shoot.id}
                                shoot={shoot}
                                onEditShoot={onEditShoot}
                                onShootUpdate={onShootUpdate}
                                onDeleteShoot={onDeleteShoot}
                            />
                        ))}
                        <AddShootCard onClick={onAddShoot} />
                    </div>
                </div>

                {completedShoots.length > 0 && (
                    <div>
                         <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="completed-shoots">
                                 <AccordionTrigger className="w-full text-muted-foreground font-bold hover:no-underline hover:text-foreground text-xl py-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={22} /> Completed ({completedShoots.length})
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-8 pt-6">
                                        {completedShoots.map(shoot => (
                                            <ShootCard
                                                key={shoot.id}
                                                shoot={shoot}
                                                onEditShoot={onEditShoot}
                                                onShootUpdate={onShootUpdate}
                                                onDeleteShoot={onDeleteShoot}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ShootsView;
