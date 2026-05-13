import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RebootModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRebootConfirmed: () => Promise<void>;
}

export const RebootModal = ({ isOpen, onClose, onRebootConfirmed }: RebootModalProps) => {
    const [status, setStatus] = useState<'idle' | 'rebooting' | 'waiting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const startReboot = async () => {
        setStatus('rebooting');
        setError(null);
        try {
            await onRebootConfirmed();
            setStatus('waiting');
        } catch (e: any) {
            setError(e.message || 'Failed to initiate reboot');
            setStatus('error');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'waiting') {
            interval = setInterval(async () => {
                try {
                    // Try to ping the router
                    const res = await window.api.lte.ping('192.168.1.1');
                    if (res.success && res.latency !== null) {
                        setStatus('success');
                        setTimeout(() => {
                            onClose();
                            setStatus('idle');
                            window.location.reload(); // Reload to refresh all states
                        }, 2000);
                    }
                } catch {
                    // Ignore errors, just keep waiting
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [status, onClose]);

    // Reset status when modal opens
    useEffect(() => {
        if (isOpen && status !== 'waiting' && status !== 'success') {
            setStatus('idle');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5"
            >
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold">Reboot Router</h3>
                    <p className="text-sm text-muted-foreground">
                        {status === 'idle' && "Are you sure? This will disconnect all devices for about 2 minutes."}
                        {status === 'rebooting' && "Sending reboot command..."}
                        {status === 'waiting' && "Router is restarting. Waiting for connection..."}
                        {status === 'success' && "Router is back online!"}
                        {status === 'error' && "Failed to reboot."}
                    </p>
                </div>

                {status === 'idle' && (
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="cursor-pointer flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={startReboot}
                            className="cursor-pointer flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
                        >
                            Reboot Now
                        </button>
                    </div>
                )}

                {status !== 'idle' && (
                    <div className="flex justify-center py-4">
                        {(status === 'rebooting' || status === 'waiting') && (
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        )}
                        {status === 'success' && (
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        )}
                        {status === 'error' && (
                            <div className="text-center w-full">
                                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="text-xs text-red-400">{error}</p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
