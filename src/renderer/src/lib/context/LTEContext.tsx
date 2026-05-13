import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface LTEContextType {
    stats: any;
    traffic: any;
    signal: any;
    netMode: any;
    deviceInfo: any;
    hosts: any[];
    blockedMacs: string[];
    messages: {
        inbox: any[];
        outbox: any[];
    };
    loading: boolean;
    error: string | null;
    refreshAll: () => Promise<void>;
    refreshSms: (boxType: number) => Promise<void>;
    setPaused: (paused: boolean) => void;
}

export const LTEContext = createContext<LTEContextType | undefined>(undefined);

export const LTEProvider: React.FC<{ children: React.ReactNode; enabled?: boolean }> = ({ children, enabled = true }) => {
    const [stats, setStats] = useState<any>(null);
    const [traffic, setTraffic] = useState<any>(null);
    const [signal, setSignal] = useState<any>(null);
    const [netMode, setNetMode] = useState<any>(null);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [hosts, setHosts] = useState<any[]>([]);
    const [blockedMacs, setBlockedMacs] = useState<string[]>([]);
    const [messages, setMessages] = useState({ inbox: [], outbox: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paused, setPaused] = useState(false);

    const isRefreshing = useRef(false);

    const fetchData = async () => {
        if (!enabled || isRefreshing.current || paused) return;
        isRefreshing.current = true;

        try {
            const [s, t, sig, info, hostData, filterData, nm] = await Promise.all([
                window.api.lte.getStatus(),
                window.api.lte.getTrafficStats(),
                window.api.lte.getSignal(),
                window.api.lte.getDeviceInfo(),
                window.api.lte.getHosts(),
                window.api.lte.getMacFilter(),
                window.api.lte.getNetMode()
            ]);

            setStats(s);
            setTraffic(t);
            setSignal(sig);
            setDeviceInfo(info);
            setNetMode(nm);

            // Normalize hosts
            let hostList: any[] = [];
            if (Array.isArray(hostData)) {
                hostList = Array.isArray(hostData[0]) ? hostData[0] : hostData;
            } else if (hostData?.MacAddress) {
                hostList = [hostData];
            }
            setHosts(hostList);

            // Normalize blocked MACs
            const macListStr = (filterData as any)?.MacFilterMacList || '';
            const list = macListStr.split(',').map((m: string) => m.trim().toUpperCase()).filter((m: string) => m);
            setBlockedMacs(list);

            setError(null);
        } catch (e: any) {
            console.error('Failed to fetch LTE data:', e);
            // Don't set error if we already have data (keep stale data)
            if (!stats) setError('Failed to connect to router');
        } finally {
            setLoading(false);
            isRefreshing.current = false;
        }
    };

    const fetchSms = async (boxType: number) => {
        if (!enabled) return;
        try {
            const result = await window.api.lte.getSmsList(1, boxType, 20);
            const msgs = result?.Messages?.Message;
            const normalized = Array.isArray(msgs) ? msgs : msgs ? [msgs] : [];

            setMessages(prev => ({
                ...prev,
                [boxType === 1 ? 'inbox' : 'outbox']: normalized
            }));
        } catch (e) {
            console.error('Failed to fetch SMS:', e);
        }
    };

    const refreshAll = async () => {
        if (!enabled) return;
        await fetchData();
        // Sequential SMS fetch with a small delay to avoid router stress
        await fetchSms(1);
        await new Promise(r => setTimeout(r, 1000));
        await fetchSms(2);
    };

    useEffect(() => {
        if (!enabled) {
            setStats(null);
            setTraffic(null);
            setSignal(null);
            setNetMode(null);
            setDeviceInfo(null);
            setHosts([]);
            setBlockedMacs([]);
            setMessages({ inbox: [], outbox: [] });
            setLoading(true);
            setError(null);
            return;
        }

        refreshAll();

        // Signal/traffic polling
        const statusInterval = setInterval(fetchData, 2000);

        // Sequential SMS polling with delays
        const smsInterval = setInterval(async () => {
            if (paused || !enabled) return;
            await fetchSms(1);
            await new Promise(r => setTimeout(r, 2000)); // Larger gap for background polling
            await fetchSms(2);
        }, 30000); // Increased interval to 30s to reduce load

        return () => {
            clearInterval(statusInterval);
            clearInterval(smsInterval);
        };
    }, [enabled]);

    return (
        <LTEContext.Provider value={{
            stats,
            traffic,
            signal,
            netMode,
            deviceInfo,
            hosts,
            blockedMacs,
            messages,
            loading,
            error,
            refreshAll,
            refreshSms: fetchSms,
            setPaused
        }}>
            {children}
        </LTEContext.Provider>
    );
};

export const useLTE = () => {
    const context = useContext(LTEContext);
    if (context === undefined) {
        throw new Error('useLTE must be used within an LTEProvider');
    }
    return context;
};
