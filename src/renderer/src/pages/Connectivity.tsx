import { useState, useEffect, useRef } from 'react';
import SpeedTest from '@cloudflare/speedtest';
import {
    Radio,
    RefreshCcw,
    Lock,
    CheckCircle2,
    AlertCircle,
    Signal,
    Activity,
    Zap,
    Globe,
    Wifi,
    ArrowUp,
    ArrowDown,
    Gauge,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { LTE_BANDS, getBandName, getNetworkTypeName } from '../lib/constants';



const NETWORK_MODES = [
    { label: 'Auto', value: '00', icon: Wifi },
    { label: '4G Only', value: '03', icon: Signal },
    { label: '3G Only', value: '02', icon: Radio },
    { label: '2G Only', value: '01', icon: Activity },
];

import { useLTE } from '../lib/context/LTEContext';

const LATENCY_REGIONS = [
    { label: 'Madrid, ES', host: 'ec2.eu-south-2.amazonaws.com', code: 'es' }, // AWS Madrid
    { label: 'Milan, IT', host: 'ec2.eu-south-1.amazonaws.com', code: 'it' }, // AWS Milan
    { label: 'London, UK', host: 'ec2.eu-west-2.amazonaws.com', code: 'gb' }, // AWS London
    { label: 'Paris, FR', host: 'ec2.eu-west-1.amazonaws.com', code: 'fr' }, // AWS Paris
    { label: 'Frankfurt, DE', host: 'ec2.eu-central-1.amazonaws.com', code: 'de' }, // AWS Frankfurt
    { label: 'New York, US', host: 'ec2.us-east-1.amazonaws.com', code: 'us' }, // AWS Virginia
    { label: 'Los Angeles, US', host: 'ec2.us-west-1.amazonaws.com', code: 'us' }, // AWS N. California
    { label: 'São Paulo, BR', host: 'ec2.sa-east-1.amazonaws.com', code: 'br' }, // AWS São Paulo
    { label: 'Tokyo, JP', host: 'ec2.ap-northeast-1.amazonaws.com', code: 'jp' }, // AWS Tokyo
    { label: 'Singapore, SG', host: 'ec2.ap-southeast-1.amazonaws.com', code: 'sg' }, // AWS Singapore
    { label: 'Dubai, AE', host: 'ec2.me-central-1.amazonaws.com', code: 'ae' }, // AWS UAE
    { label: 'Johannesburg, ZA', host: 'ec2.af-south-1.amazonaws.com', code: 'za' }, // AWS Cape Town
    { label: 'Bahrain, BH', host: 'ec2.me-south-1.amazonaws.com', code: 'bh' }, // AWS Bahrain (closest)
    { label: 'Sydney, AU', host: 'ec2.ap-southeast-2.amazonaws.com', code: 'au' }, // AWS Sydney
];

export const ConnectivityPage = () => {
    const {
        netMode: currentMode,
        loading,
        refreshAll,
        setPaused
    } = useLTE();

    const [saving, setSaving] = useState(false);

    const [pinging, setPinging] = useState(false);
    const [testingAll, setTestingAll] = useState(false);
    const [selectedLatencyRegion, setSelectedLatencyRegion] = useState(LATENCY_REGIONS[0]);
    const [regionalResults, setRegionalResults] = useState<Record<string, number | null>>({});
    const [testingSpeed, setTestingSpeed] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);
    const [speedResults, setSpeedResults] = useState<{
        phase: 'idle' | 'latency' | 'download' | 'upload' | 'packetLoss' | 'complete';
        progress: number;
        downloadMbps: number;
        uploadMbps: number;
    }>({
        phase: 'idle',
        progress: 0,
        downloadMbps: 0,
        uploadMbps: 0
    });
    const speedTestRef = useRef<SpeedTest | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isDirty, setIsDirty] = useState(false);

    // Band Discovery states
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveryTarget, setDiscoveryTarget] = useState(LATENCY_REGIONS[0]);
    const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
    const [currentTestingBand, setCurrentTestingBand] = useState<any>(null);
    const discoveryCancelled = useRef(false);

    const [selectedMode, setSelectedMode] = useState('00');
    const [selectedBands, setSelectedBands] = useState<string[]>([]);

    useEffect(() => {
        // Only sync from context if the user hasn't made manual changes
        if (currentMode && !isDirty) {
            setSelectedMode(currentMode.NetworkMode);
            setSelectedBands(currentMode.LTEBand.split(',').map(b => b.trim()));
        }
    }, [currentMode, isDirty]);

    useEffect(() => {
        return () => {
            if (speedTestRef.current) {
                speedTestRef.current.pause();
                speedTestRef.current = null;
            }
        };
    }, []);

    const toggleBand = (value: string) => {
        setIsDirty(true);
        setSelectedBands(prev =>
            prev.includes(value) ? prev.filter(b => b !== value) : [...prev, value]
        );
    };

    const handleApply = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            let bandMask = currentMode?.LTEBand || '7FFFFFFFFFFFFFFF';
            if (selectedBands.length > 0) {
                const sum = selectedBands.reduce((acc, val) => {
                    return BigInt(`0x${acc}`) + BigInt(`0x${val}`);
                }, BigInt(0)).toString(16).toUpperCase();
                bandMask = sum;
            }

            // Using the router's current network band mask is much safer than hardcoding 3FFFFFFF
            const nbMask = currentMode?.NetworkBand || '3FFFFFFF';
            await window.api.lte.setNetMode(bandMask, nbMask, selectedMode);
            setSuccess('Settings applied!');
            setIsDirty(false);
            await refreshAll();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to apply settings');
        } finally {
            setSaving(false);
        }
    };



    const runPingTest = async (region: typeof LATENCY_REGIONS[0] = selectedLatencyRegion) => {
        setPinging(true);
        setError(null);
        if (!testingAll) {
            setLatency(null);
        }

        const pings: number[] = [];
        const iterations = 3; // Reduced for faster batch testing

        try {
            for (let i = 0; i < iterations; i++) {
                const result = await window.api.lte.ping(region.host);
                if (result.success && result.latency !== null) {
                    pings.push(result.latency);
                }
                //await new Promise(r => setTimeout(r, 100));
            }

            const resultLatency = pings.length > 0
                ? Math.round(pings.reduce((a, b) => a + b) / pings.length)
                : null;

            if (!testingAll) setLatency(resultLatency);
            setRegionalResults(prev => ({ ...prev, [region.label]: resultLatency }));

            return resultLatency;
        } catch (err) {
            console.error(`Ping failed for ${region.label}:`, err);
            return null;
        } finally {
            if (!testingAll) setPinging(false);
        }
    };

    const runAllPings = async () => {
        setTestingAll(true);
        setPinging(true);
        setRegionalResults({});
        setLatency(null);

        try {
            for (const region of LATENCY_REGIONS) {
                await runPingTest(region);
            }
        } finally {
            setTestingAll(false);
            setPinging(false);
        }
    };

    const runDiscovery = async () => {
        if (!window.confirm('Band discovery will temporarily disconnect your internet while testing each band. Proceed?')) return;

        setIsDiscovering(true);
        setPaused(true);
        setDiscoveryResults([]);
        setError(null);
        discoveryCancelled.current = false;

        const originalBands = [...selectedBands];
        const originalMode = selectedMode;
        // Use the router's current network band mask as a base for discovery
        const nbMask = currentMode?.NetworkBand || '3FFFFFFF'; // Default to a common mask if not available

        try {
            for (const band of LTE_BANDS) {
                if (discoveryCancelled.current) break;

                setCurrentTestingBand(band);
                setDiscoveryResults(prev => [...prev, { band: band.name, status: 'switching', ping: null }]);

                const applyBand = async () => {
                    // Use dynamic NetworkBand mask
                    await window.api.lte.setNetMode(band.value, nbMask, '03');
                };

                await applyBand();

                // Phase 1: Verify the switch actually happened at the API/Router level
                let verified = false;
                let retries = 0;
                const maxRetries = 1;

                while (!verified && retries <= maxRetries) {
                    if (discoveryCancelled.current) break;
                    setDiscoveryResults(prev => prev.map(r => r.band === band.name ? { ...r, status: retries > 0 ? 'retrying' : 'verifying' } : r));

                    for (let i = 0; i < 5; i++) { // 10s verification window
                        if (discoveryCancelled.current) break;
                        await new Promise(r => setTimeout(r, 2000));
                        const nm = await window.api.lte.getNetMode();
                        // Check if the current mask matches our target band value
                        if (nm.LTEBand === band.value) {
                            verified = true;
                            break;
                        }
                    }

                    if (discoveryCancelled.current) break;

                    if (!verified && retries < maxRetries) {
                        await applyBand();
                        retries++;
                    } else if (!verified) {
                        break;
                    }
                }

                if (discoveryCancelled.current) break;

                if (verified) {
                    setDiscoveryResults(prev => prev.map(r => r.band === band.name ? { ...r, status: 'connecting' } : r));

                    // Phase 2: Wait for network restoration (901)
                    let connected = false;
                    for (let i = 0; i < 15; i++) { // 30s timeout
                        if (discoveryCancelled.current) break;
                        await new Promise(r => setTimeout(r, 2000));
                        const status = await window.api.lte.getStatus();
                        if (status.ConnectionStatus === '901') {
                            connected = true;
                            break;
                        }
                    }

                    if (discoveryCancelled.current) break;

                    if (connected) {
                        setDiscoveryResults(prev => prev.map(r => r.band === band.name ? { ...r, status: 'pinging' } : r));

                        // Phase 3: Run ping test
                        const pings: number[] = [];
                        for (let i = 0; i < 3; i++) {
                            if (discoveryCancelled.current) break;
                            const res = await window.api.lte.ping(discoveryTarget.host);
                            if (res.success && res.latency !== null) pings.push(res.latency);
                        }

                        if (discoveryCancelled.current) break;

                        const avg = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b) / pings.length) : null;
                        setDiscoveryResults(prev => prev.map(r => r.band === band.name ? { ...r, status: 'done', ping: avg } : r));
                    } else {
                        setDiscoveryResults(prev => prev.map(r => r.band === band.name ? { ...r, status: 'timeout', ping: null } : r));
                    }
                } else {
                    setDiscoveryResults(prev => prev.map(r => r.band === band.name ? { ...r, status: 'failed-switch', ping: null } : r));
                }
            }

            if (!discoveryCancelled.current) {
                setSuccess('Discovery complete! You can now lock to the best band.');
            } else {
                setSuccess('Discovery stopped by user.');
            }
        } catch (err: any) {
            if (!discoveryCancelled.current) {
                setError('Discovery failed: ' + err.message);
            }
        } finally {
            // Restore original settings
            let bandMask = '7FFFFFFFFFFFFFFF';
            if (originalBands.length > 0) {
                bandMask = originalBands.reduce((acc, val) => {
                    return BigInt(`0x${acc}`) + BigInt(`0x${val}`);
                }, BigInt(0)).toString(16).toUpperCase();
            }
            await window.api.lte.setNetMode(bandMask, '3FFFFFFF', originalMode);

            setIsDiscovering(false);
            setPaused(false);
            setCurrentTestingBand(null);
            discoveryCancelled.current = false;
        }
    };

    const stopDiscovery = () => {
        discoveryCancelled.current = true;
    };


    const runSpeedTest = async () => {
        setTestingSpeed(true);
        setError(null);
        setPaused(true); // Pause LTE polling
        setSpeedResults({
            phase: 'latency',
            progress: 0,
            downloadMbps: 0,
            uploadMbps: 0
        });

        const st = new SpeedTest({
            autoStart: false,
            measurements: [
                { type: 'latency', numPackets: 5 },
                { type: 'download', bytes: 1e6, count: 2 },
                { type: 'download', bytes: 5e6, count: 2 },
                { type: 'upload', bytes: 1e6, count: 2 },
                { type: 'upload', bytes: 5e6, count: 2 }
            ]
        });

        st.onResultsChange = ({ type }) => {
            const results = st.results;
            const summary = results.getSummary();
            const dl = results.getDownloadBandwidth();
            const ul = results.getUploadBandwidth();

            setSpeedResults(prev => {
                let currentPhase = prev.phase;
                if (['latency', 'download', 'upload', 'packetLoss'].includes(type)) {
                    currentPhase = type as any;
                }

                return {
                    ...prev,
                    phase: currentPhase,
                    downloadMbps: dl ? parseFloat((dl / 1_000_000).toFixed(2)) : (summary.download ? parseFloat((summary.download / 1_000_000).toFixed(2)) : prev.downloadMbps),
                    uploadMbps: ul ? parseFloat((ul / 1_000_000).toFixed(2)) : (summary.upload ? parseFloat((summary.upload / 1_000_000).toFixed(2)) : prev.uploadMbps),
                    progress: Math.max(prev.progress, type === 'latency' ? 5 : type === 'download' ? 30 : type === 'upload' ? 70 : type === 'packetLoss' ? 90 : prev.progress)
                };
            });
        };

        st.onFinish = (results) => {
            const summary = results.getSummary();
            const dl = results.getDownloadBandwidth();
            const ul = results.getUploadBandwidth();

            setSpeedResults({
                phase: 'complete',
                progress: 100,
                downloadMbps: parseFloat(((dl || summary.download || 0) / 1_000_000).toFixed(2)),
                uploadMbps: parseFloat(((ul || summary.upload || 0) / 1_000_000).toFixed(2))
            });
            setTestingSpeed(false);
            setPaused(false); // Resume LTE polling
        };

        st.onError = (err) => {
            console.error('[SPEEDTEST] FATAL ERROR:', err);
            setError(`Error: ${typeof err === 'string' ? err : 'Check console for details'}`);
            setTestingSpeed(false);
            setPaused(false);
        };

        speedTestRef.current = st;
        st.play();
    };

    const stopSpeedTest = async () => {
        if (speedTestRef.current) {
            speedTestRef.current.pause();
            speedTestRef.current = null;
            setTestingSpeed(false);
            setPaused(false);
            setSpeedResults({
                phase: 'idle',
                progress: 0,
                downloadMbps: 0,
                uploadMbps: 0
            });
        }
    };



    return (
        <div className="space-y-5 animate-in fade-in duration-500 ">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Wifi className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mt-[-7px]">Connectivity</h1>
                        <p className="text-xs text-muted-foreground">Network mode, bands & tools</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsDirty(false); // Reset dirty flag to re-sync from context
                        refreshAll();
                    }}
                    disabled={loading}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                >
                    <RefreshCcw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center gap-3 text-emerald-400 text-sm animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 gap-y-5">

                <div className="lg:col-span-1 md:col-span-1 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 min-h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Signal className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-semibold">LTE Band Locking</span>
                        </div>
                        <div className="text-[10px] px-2 py-1 bg-white/5 rounded-full text-muted-foreground font-mono">
                            Current: {currentMode?.NetworkMode && `${getNetworkTypeName(currentMode.NetworkMode)} - `}{getBandName(currentMode?.LTEBand)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-dashed border-b border-white/5">
                        {NETWORK_MODES.map((mode) => (
                            <button
                                key={mode.value}
                                onClick={() => {
                                    setIsDirty(true);
                                    setSelectedMode(mode.value);
                                }}
                                className={cn(
                                    "cursor-pointer p-3 rounded-xl border transition-all text-sm font-medium flex items-center gap-2",
                                    selectedMode === mode.value
                                        ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                        : "bg-white/5 border-white/10 hover:border-blue-500/50 text-muted-foreground hover:text-white"
                                )}
                            >
                                <mode.icon className="w-4 h-4" />
                                {mode.label}
                            </button>
                        ))}
                    </div>


                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {LTE_BANDS.map((band) => (
                            <button
                                key={band.id}
                                onClick={() => toggleBand(band.value)}
                                className={cn(
                                    "cursor-pointer p-3 rounded-xl border transition-all text-left",
                                    selectedBands.includes(band.value)
                                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                                        : "bg-white/5 border-white/10 hover:border-white/20 text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                        selectedBands.includes(band.value)
                                            ? "bg-orange-500 border-orange-500"
                                            : "border-white/20"
                                    )}>
                                        {selectedBands.includes(band.value) && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{band.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-dashed border-t border-white/5">
                        <p className="text-xs text-muted-foreground max-w-md">
                            {selectedBands.length === 0
                                ? 'No bands selected - will use Auto mode.'
                                : `${selectedBands.length} band(s) selected. Connection may drop momentarily.`
                            }
                        </p>
                        <button
                            onClick={handleApply}
                            disabled={saving || loading || isDiscovering || !isDirty}
                            className="cursor-pointer px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
                        >
                            {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Apply
                        </button>
                    </div>

                    {/* Band Discovery Section */}
                    <div className="mt-8 pt-6 border-t border-white/10 space-y-6">
                        <div className={cn(
                            "flex transition-all duration-500",
                            isDiscovering || discoveryResults.length > 0
                                ? "flex-row items-center justify-between"
                                : "flex-col items-center justify-center py-10 space-y-6"
                        )}>
                            <div className={cn(
                                "flex items-center gap-2 transition-all duration-500",
                                isDiscovering || discoveryResults.length > 0 ? "" : "flex-col"
                            )}>
                                <div className={cn(
                                    "rounded-xl flex items-center justify-center transition-all duration-500",
                                    isDiscovering || discoveryResults.length > 0 ? "w-8 h-8 bg-emerald-500/0" : "w-16 h-16 bg-emerald-500/10 mb-2"
                                )}>
                                    <Activity className={cn(
                                        "transition-all duration-500",
                                        isDiscovering || discoveryResults.length > 0 ? "w-4 h-4 text-emerald-400" : "w-8 h-8 text-emerald-500"
                                    )} />
                                </div>
                                <div className={cn(
                                    "transition-all duration-500",
                                    isDiscovering || discoveryResults.length > 0 ? "text-left" : "text-center"
                                )}>
                                    <span className={cn(
                                        "font-semibold block transition-all duration-500",
                                        isDiscovering || discoveryResults.length > 0 ? "text-sm" : "text-xl"
                                    )}>Discovery Tool</span>
                                    {!isDiscovering && discoveryResults.length === 0 && (
                                        <span className="text-sm text-muted-foreground">Find the best performing band for your location</span>
                                    )}
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center gap-3 transition-all duration-500",
                                isDiscovering || discoveryResults.length > 0 ? "" : "w-full max-w-sm flex-col"
                            )}>
                                <select
                                    value={discoveryTarget.label}
                                    disabled={isDiscovering}
                                    onChange={(e) => {
                                        const region = LATENCY_REGIONS.find(r => r.label === e.target.value);
                                        if (region) setDiscoveryTarget(region);
                                    }}
                                    className={cn(
                                        "bg-white/5 border border-white/10 rounded-xl font-bold outline-none cursor-pointer hover:bg-white/10 transition-all",
                                        isDiscovering || discoveryResults.length > 0
                                            ? "px-3 py-1.5 text-[10px]"
                                            : "w-full p-3 text-sm text-center"
                                    )}
                                >
                                    {LATENCY_REGIONS.map(r => (
                                        <option key={r.label} value={r.label} className="bg-[#1a1a1a]">{r.label}</option>
                                    ))}
                                </select>
                                {isDiscovering ? (
                                    <button
                                        onClick={stopDiscovery}
                                        className="cursor-pointer bg-red-500 rounded-xl text-white font-bold uppercase transition-all hover:bg-red-600 active:scale-95 px-4 py-1.5 text-[10px]"
                                    >
                                        Stop
                                    </button>
                                ) : (
                                    <button
                                        onClick={runDiscovery}
                                        disabled={loading}
                                        className={cn(
                                            "cursor-pointer bg-emerald-500 rounded-xl text-white font-bold uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50",
                                            discoveryResults.length > 0
                                                ? "px-4 py-1.5 text-[10px]"
                                                : "w-full py-3 text-sm shadow-xl shadow-emerald-500/20"
                                        )}
                                    >
                                        Start Discovery
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Current Progress */}
                        <AnimatePresence>
                            {isDiscovering && currentTestingBand && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between animate-pulse"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <RefreshCcw className="w-4 h-4 text-emerald-400 animate-spin" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 block">Testing Multi-Band</span>
                                            <span className="text-xs font-bold">{currentTestingBand.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Target Server</span>
                                        <span className="text-xs font-bold">{discoveryTarget.label}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results Table */}
                        {discoveryResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="overflow-hidden border border-white/10 rounded-xl bg-white/5"
                            >
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/10 border-b border-white/10">
                                            <th className="px-4 py-2 text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground w-1/3">LTE Band</th>
                                            <th className="px-4 py-2 text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground w-1/3">Avg Ping</th>
                                            <th className="px-4 py-2 text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {discoveryResults.map((res, i) => (
                                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-white/80">{res.band}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {res.ping ? (
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={cn(
                                                                "text-sm font-bold tabular-nums",
                                                                res.ping < 50 ? "text-emerald-400" : res.ping < 150 ? "text-orange-400" : "text-red-400"
                                                            )}>{res.ping}</span>
                                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">ms</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase italic">--</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn(
                                                            "text-[9px] font-bold uppercase tracking-widest",
                                                            res.status === 'switching' ? "text-blue-400 animate-pulse" :
                                                                res.status === 'verifying' ? "text-purple-400 animate-pulse" :
                                                                    res.status === 'retrying' ? "text-orange-400 animate-pulse" :
                                                                        res.status === 'connecting' ? "text-emerald-400 animate-pulse" :
                                                                            res.status === 'pinging' ? "text-emerald-400 animate-pulse" :
                                                                                res.status === 'done' ? (res.ping ? "text-emerald-500/60" : "text-red-400/60") :
                                                                                    res.status === 'timeout' ? "text-red-500" :
                                                                                        res.status === 'failed-switch' ? "text-red-600 font-bold" : "text-muted-foreground"
                                                        )}>
                                                            {res.status}
                                                        </span>
                                                        {res.status === 'done' && res.ping && (
                                                            <button
                                                                onClick={() => {
                                                                    const band = LTE_BANDS.find(b => b.name === res.band);
                                                                    if (band) {
                                                                        setSelectedBands([band.value]);
                                                                        handleApply();
                                                                    }
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/50 rounded-lg text-[8px] font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition-all uppercase"
                                                            >
                                                                Lock Band <ArrowRight className="w-2.5 h-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 md:col-span-1 space-y-5">

                    {/* Speed Test Section */}
                    <div className="space-y-3">
                        <AnimatePresence mode="wait">
                            {!testingSpeed && speedResults.phase === 'idle' ? (
                                <motion.button
                                    key="run-btn"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={runSpeedTest}
                                    className="cursor-pointer w-full p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border border-blue-500/20 rounded-2xl flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Gauge className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm font-bold block">Speed Test</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fast check</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">RUN &rarr;</span>
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="testing-card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-5 relative overflow-hidden"
                                >
                                    {/* Background Glow */}
                                    {testingSpeed && (
                                        <motion.div
                                            animate={{
                                                opacity: [0.1, 0.2, 0.1],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none"
                                        />
                                    )}

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                speedResults.phase === 'complete' ? "bg-emerald-500" : "bg-blue-500 animate-pulse"
                                            )} />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                {speedResults.phase === 'complete' ? 'Test Finished' : `${speedResults.phase}...`}
                                            </span>
                                        </div>
                                        {testingSpeed && (
                                            <button
                                                onClick={stopSpeedTest}
                                                className="cursor-pointer text-[10px] font-bold text-red-500/50 hover:text-red-400 uppercase tracking-widest transition-colors"
                                            >
                                                Abort Test
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        {/* Download */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase">
                                                <ArrowDown className="w-3 h-3" />
                                                <span>Download</span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <motion.span
                                                    key={speedResults.downloadMbps}
                                                    initial={{ opacity: 0.5, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-2xl font-bold tabular-nums tracking-tighter"
                                                >
                                                    {speedResults.downloadMbps}
                                                </motion.span>
                                                <span className="text-[10px] font-bold text-muted-foreground">Mbps</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${speedResults.phase === 'download' ? speedResults.progress : (speedResults.phase === 'idle' ? 0 : 100)}%` }}
                                                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                />
                                            </div>
                                        </div>

                                        {/* Upload */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase">
                                                <ArrowUp className="w-3 h-3" />
                                                <span>Upload</span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <motion.span
                                                    key={speedResults.uploadMbps}
                                                    initial={{ opacity: 0.5, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-2xl font-bold tabular-nums tracking-tighter"
                                                >
                                                    {speedResults.uploadMbps}
                                                </motion.span>
                                                <span className="text-[10px] font-bold text-muted-foreground">Mbps</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${speedResults.phase === 'upload' ? speedResults.progress : (speedResults.phase === 'complete' ? 100 : 0)}%` }}
                                                    className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {speedResults.phase === 'complete' && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={runSpeedTest}
                                            className="cursor-pointer w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all border border-white/10"
                                        >
                                            Start New Test
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Regional Latency Overhaul */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-6 relative overflow-hidden">
                        {/* Animated Background Pulse */}
                        {pinging && (
                            <motion.div
                                animate={{
                                    opacity: [0.05, 0.1, 0.05],
                                    scale: [1, 1.02, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-emerald-500/10 pointer-events-none"
                            />
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Globe className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-bold block">Global Latency</span>
                                    <span className="text-[10px] text-muted-foreground uppercase trackfing-wider">Diagnostics</span>
                                </div>
                            </div>

                            <button
                                onClick={runAllPings}
                                disabled={pinging}
                                className="cursor-pointer px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-all disabled:opacity-50"
                            >
                                {testingAll ? 'Running All...' : 'Test All Regions'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            {/* Main Region Selector & Single Test */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <select
                                        value={selectedLatencyRegion.label}
                                        disabled={pinging}
                                        onChange={(e) => {
                                            const region = LATENCY_REGIONS.find(r => r.label === e.target.value);
                                            if (region) setSelectedLatencyRegion(region);
                                        }}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold transition-all outline-none appearance-none cursor-pointer hover:bg-white/10 disabled:opacity-50"
                                    >
                                        {LATENCY_REGIONS.map((region) => (
                                            <option key={region.label} value={region.label} className="bg-[#1a1a1a]">
                                                {region.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => runPingTest()}
                                        disabled={pinging}
                                        className="cursor-pointer w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                    >
                                        {pinging && !testingAll ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Big Result Display */}
                                <AnimatePresence mode="wait">
                                    {(latency !== null || (pinging && !testingAll)) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`fi fi-${selectedLatencyRegion.code} text-2xl rounded shadow-sm`} />
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 block">Latency Response</span>
                                                    <span className="text-xs font-bold">{selectedLatencyRegion.label}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {pinging && !testingAll ? (
                                                    <div className="flex gap-1">
                                                        {[0, 1, 2].map(i => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                                                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-bold text-emerald-400 tabular-nums">{latency}</span>
                                                        <span className="text-[10px] font-bold text-emerald-400/60">MS</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Results Grid (Visible during/after Test All) */}
                            {Object.keys(regionalResults).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                                >
                                    {LATENCY_REGIONS.map((region) => {
                                        const result = regionalResults[region.label];
                                        const isTesting = testingAll && result === undefined;
                                        const hasResult = result !== undefined;

                                        return (
                                            <div
                                                key={region.label}
                                                className={cn(
                                                    "p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                                                    isTesting ? "bg-white/5 border-emerald-500/30 animate-pulse" :
                                                        hasResult ? "bg-white/5 border-white/10" : "bg-transparent border-transparent opacity-30"
                                                )}
                                            >
                                                <span className={`fi fi-${region.code} text-sm shadow-sm`} />
                                                <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground text-center line-clamp-1">{region.label}</span>
                                                {hasResult && (
                                                    <span className={cn(
                                                        "text-xs font-bold tabular-nums",
                                                        result === null ? "text-red-400" :
                                                            result < 50 ? "text-emerald-400" :
                                                                result < 150 ? "text-orange-400" : "text-red-400"
                                                    )}>
                                                        {result === null ? 'ERR' : `${result}ms`}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
