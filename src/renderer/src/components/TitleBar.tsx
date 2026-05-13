import { useContext } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { LTEContext } from '../lib/context/LTEContext';

export const TitleBar = () => {
    const context = useContext(LTEContext);
    const deviceInfo = context?.deviceInfo;

    const handleMinimize = () => {
        window.api.window.minimize();
    };

    const handleMaximize = () => {
        window.api.window.maximize();
    };

    const handleClose = () => {
        window.api.window.close();
    };

    return (
        <div className="h-8 bg-[#0a0a0f] flex items-center justify-between select-none border-b border-white/5 relative z-[60]">
            {/* Device Name */}
            <div className="px-4 flex items-center gap-2 h-full z-10" style={{ WebkitAppRegion: 'drag' } as any}>
                <span className="text-xs font-medium text-muted-foreground/60">
                    {deviceInfo?.DeviceName || '...'}
                </span>
            </div>

            {/* Drag Region */}
            <div className="flex-1 h-full" style={{ WebkitAppRegion: 'drag' } as any}></div>

            {/* Window Controls */}
            <div className="flex h-full z-10">
                <button
                    onClick={handleMinimize}
                    className="h-full px-4 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors flex items-center justify-center outline-none focus:outline-none"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="h-full px-4 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors flex items-center justify-center outline-none focus:outline-none"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    <Square className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={handleClose}
                    className="h-full px-4 hover:bg-red-500 hover:text-white text-muted-foreground transition-colors flex items-center justify-center outline-none focus:outline-none"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
