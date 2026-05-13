import { useState, useEffect } from 'react';
import {
    Signal,
    ArrowUp,
    ArrowDown,
    Activity,
    Users,
    Ban,
    RefreshCcw,
    AlertTriangle,
    Smartphone,
    Cpu,
    ChevronDown,
    ChevronUp,
    Gauge
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getBandName, getNetworkTypeName } from '../lib/constants';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

import { useLTE } from '../lib/context/LTEContext';


export const OverviewPage = () => {
    const {
        stats,
        traffic,
        signal,
        netMode,
        deviceInfo,
        hosts,
        blockedMacs,
        refreshAll
    } = useLTE();

    const [trafficHistory, setTrafficHistory] = useState<{ rx: number[], tx: number[] }>({ rx: [], tx: [] });
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showDeviceInfo, setShowDeviceInfo] = useState(false);

    // Update traffic history when new data arrives
    useEffect(() => {
        if (!traffic) return;
        setTrafficHistory(prev => ({
            rx: [...prev.rx, (parseInt(traffic.CurrentDownloadRate) / 1024 / 1024) || 0].slice(-30),
            tx: [...prev.tx, (parseInt(traffic.CurrentUploadRate) / 1024 / 1024) || 0].slice(-30)
        }));
    }, [traffic]);

    const handleBlock = async (mac: string) => {
        const upperMac = mac.toUpperCase();
        if (blockedMacs.includes(upperMac)) return;

        setActionLoading(mac);
        setError(null);
        try {
            const newList = [...blockedMacs, upperMac];
            await window.api.lte.setMacFilter(newList);
            await refreshAll();
        } catch (err) {
            setError('Failed to block device');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblock = async (mac: string) => {
        const upperMac = mac.toUpperCase();
        setActionLoading(mac);
        setError(null);
        try {
            const newList = blockedMacs.filter(m => m !== upperMac);
            await window.api.lte.setMacFilter(newList);
            await refreshAll();
        } catch (err) {
            setError('Failed to unblock device');
        } finally {
            setActionLoading(null);
        }
    };

    const chartData = {
        labels: Array(trafficHistory.rx.length).fill(''),
        datasets: [
            {
                fill: true,
                data: trafficHistory.rx,
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                fill: true,
                data: trafficHistory.tx,
                borderColor: 'rgb(100, 116, 139)',
                backgroundColor: 'rgba(100, 116, 139, 0.05)',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
        animation: { duration: 0 } as const
    };

    const SignalMeter = ({ value, label, min, max, unit }: { value: number, label: string, min: number, max: number, unit: string }) => {
        const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
        return (
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase w-12 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-16 text-right">{value || '--'} {unit}</span>
            </div>
        );
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500 ">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Gauge className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mt-[-7px]">Overview</h1>
                        <p className="text-xs text-muted-foreground">{stats?.WanIPAddress || 'Connecting...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", stats?.ConnectionStatus === '901' ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                        {stats?.ConnectionStatus === '901' ? 'Connected' : 'Offline'}
                    </span>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase">Download</span>
                        <ArrowDown className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold">{((parseInt(traffic?.CurrentDownloadRate) / 1024 / 1024) || 0).toFixed(1)}<span className="text-sm text-muted-foreground ml-1">MB/s</span></p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase">Upload</span>
                        <ArrowUp className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold">{((parseInt(traffic?.CurrentUploadRate) / 1024 / 1024) || 0).toFixed(1)}<span className="text-sm text-muted-foreground ml-1">MB/s</span></p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase">Signal</span>
                        <Signal className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold">{signal?.rsrp || '--'}<span className="text-sm text-muted-foreground ml-1">dBm</span></p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-bold uppercase">Band</span>
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold truncate">
                        {netMode?.NetworkMode && `${getNetworkTypeName(netMode.NetworkMode)} - `}
                        {getBandName(netMode?.LTEBand)}
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 gap-y-5">
                {/* Left Column - Traffic & Signal */}
                <div className="lg:col-span-2 gap-5 grid lg:grid-cols-2 grid-cols-1">
                    {/* Mini Chart */}
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-4 mb-3 text-[10px] font-bold uppercase text-muted-foreground">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> DL</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500" /> UL</div>
                        </div>
                        <div className="h-20">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Signal Metrics */}
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Signal className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-semibold">Signal Quality</span>
                        </div>
                        <SignalMeter label="RSRP" value={parseInt(signal?.rsrp)} min={-140} max={-44} unit="dBm" />
                        <SignalMeter label="SINR" value={parseInt(signal?.sinr)} min={-20} max={30} unit="dB" />
                        <SignalMeter label="RSRQ" value={parseInt(signal?.rsrq)} min={-20} max={-3} unit="dB" />
                        <SignalMeter label="RSSI" value={parseInt(signal?.rssi)} min={-110} max={-25} unit="dBm" />
                    </div>
                </div>

                {/* Right Column - Connected & Blocked Devices */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold">Devices</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">
                                {hosts.length} Online
                            </span>
                            {blockedMacs.length > 0 && (
                                <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full">
                                    {blockedMacs.length} Blocked
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                        {hosts.length === 0 && blockedMacs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-50">
                                <Users className="w-8 h-8 mb-2 opacity-50" />
                                <span>No devices found</span>
                            </div>
                        ) : (
                            <>
                                {/* Combined List: Online First, then Blocked (that aren't in online list) */}
                                {[
                                    ...hosts.map(h => ({ ...h, status: 'online', isBlocked: blockedMacs.includes(h.MacAddress?.toUpperCase()) })),
                                    ...blockedMacs
                                        .filter(mac => !hosts.some(h => h.MacAddress?.toUpperCase() === mac))
                                        .map(mac => ({
                                            MacAddress: mac,
                                            HostName: 'Blocked Device',
                                            IpAddress: '---',
                                            status: 'blocked',
                                            isBlocked: true
                                        }))
                                ].map((device, idx) => {
                                    // Robust MAC handling
                                    const mac = device.MacAddress || 'UNKNOWN';
                                    const isBlocked = device.isBlocked;
                                    const isOnline = device.status === 'online';

                                    return (
                                        <div
                                            key={`${mac}-${idx}`}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl transition-all border",
                                                isBlocked
                                                    ? "bg-red-500/5 border-red-500/10 hover:bg-red-500/10"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                    isBlocked ? "bg-red-500/20" : "bg-emerald-500/20"
                                                )}>
                                                    {isBlocked ? <Ban className="w-4 h-4 text-red-400" /> : <Smartphone className="w-4 h-4 text-emerald-400" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn("text-sm font-medium truncate", isBlocked && "text-red-300")}>
                                                        {device.HostName || 'Unknown Device'}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-muted-foreground font-mono">{device.IpAddress} · {mac}</p>
                                                        {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {isBlocked ? (
                                                <button
                                                    onClick={() => handleUnblock(mac)}
                                                    disabled={actionLoading === mac}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {actionLoading === mac ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Unblock'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBlock(mac)}
                                                    disabled={actionLoading === mac}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 text-xs font-bold rounded-lg transition-all opacity-50 hover:opacity-100 disabled:opacity-50 hover:border-red-500/20 border border-transparent"
                                                >
                                                    {actionLoading === mac ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Block'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Device Info Accordion */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold">Device Info</span>
                        </div>
                        {showDeviceInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showDeviceInfo && (
                        <div className="px-4 pb-4 space-y-2 text-sm animate-in slide-in-from-top-2 duration-200 pt-4">
                            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-mono">{deviceInfo?.DeviceName || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">S/N</span><span className="font-mono text-xs">{deviceInfo?.SerialNumber || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">IMEI</span><span className="font-mono text-xs">{deviceInfo?.Imei || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Software</span><span className="font-mono text-xs">{deviceInfo?.SoftwareVersion || 'N/A'}</span></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
