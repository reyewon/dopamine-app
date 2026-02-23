'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface EmailInquiry {
  id: string;
  account: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  extractedData: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    shootType?: string;
    shootDate?: string;
    location?: string;
    notes?: string;
  };
  read: boolean;
  addedAsShoot: boolean;
}

export interface GmailStatus {
  photography: boolean;
  personal: boolean;
}

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useEmailInquiries() {
  const [inquiries, setInquiries] = useState<EmailInquiry[]>([]);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({ photography: false, personal: false });
  const [statusLoaded, setStatusLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail/status');
      if (res.ok) {
        const data = await res.json() as GmailStatus;
        setGmailStatus(data);
        setStatusLoaded(true);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail/inquiries');
      if (res.ok) {
        const data = await res.json() as EmailInquiry[];
        setInquiries(data);
      }
    } catch {
      // silently fail — don't disrupt the app
    }
  }, []);

  const pollNow = useCallback(async () => {
    try {
      await fetch('/api/gmail/poll');
      await fetchInquiries();
    } catch {
      // silently fail
    }
  }, [fetchInquiries]);

  const markAsRead = useCallback(async (id: string) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
    try {
      await fetch('/api/gmail/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { read: true } }),
      });
    } catch { /* silent */ }
  }, []);

  const markInquiryAsAdded = useCallback(async (id: string) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, addedAsShoot: true, read: true } : i));
    try {
      await fetch('/api/gmail/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { addedAsShoot: true, read: true } }),
      });
    } catch { /* silent */ }
  }, []);

  const dismissInquiry = useCallback(async (id: string) => {
    setInquiries(prev => prev.filter(i => i.id !== id));
    try {
      await fetch(`/api/gmail/inquiries?id=${id}`, { method: 'DELETE' });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    // Load status and inquiries on mount
    fetchStatus();
    fetchInquiries();
    // Poll every 5 minutes
    intervalRef.current = setInterval(pollNow, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus, fetchInquiries, pollNow]);

  const unreadCount = inquiries.filter(i => !i.read && !i.addedAsShoot).length;

  // Allow manual refresh of status (e.g. after OAuth popup completes)
  const refreshStatus = useCallback(async () => {
    await fetchStatus();
    await fetchInquiries();
  }, [fetchStatus, fetchInquiries]);

  return { inquiries, unreadCount, gmailStatus, statusLoaded, markAsRead, markInquiryAsAdded, dismissInquiry, pollNow, refreshStatus };
}
