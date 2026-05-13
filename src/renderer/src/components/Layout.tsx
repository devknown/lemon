import { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    Gauge,
    Wifi,
    MessageSquare,
    LogOut,
    Signal,
    Power
} from 'lucide-react';
import { RebootModal } from './RebootModal';
import { useState } from 'react';

interface NavItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
    <NavLink
        to={to}
        className={({ isActive }) => cn(
            "flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-xl transition-all duration-200",
            isActive
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                : "text-muted-foreground hover:bg-white/10 hover:text-white"
        )}
        title={label}
    >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="font-medium hidden md:block whitespace-nowrap">{label}</span>
    </NavLink>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [showReboot, setShowReboot] = useState(false);

    const handleLogout = async () => {
        try {
            await window.api.lte.disconnect();
        } catch (e) {
            console.error('Logout error:', e);
        }
        // Force reload to clear all state and show login
        window.location.href = window.location.href.split('#')[0];
    };

    const handleRebootConfirm = async () => {
        await window.api.lte.reboot();
    };

    return (
        <div className="flex flex-1 overflow-hidden h-full">
            <RebootModal
                isOpen={showReboot}
                onClose={() => setShowReboot(false)}
                onRebootConfirmed={handleRebootConfirm}
            />

            {/* Sidebar */}
            <aside className="w-[70px] md:w-56 border-r border-white/5 bg-[#0a0a0f] flex flex-col transition-all duration-300">
                {/* Logo */}
                <div className="h-20 flex items-center justify-center md:justify-start md:px-6 gap-3 border-b border-white/5 md:border-none">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                        <Signal className="text-white w-5 h-5" />
                    </div>
                    <div className="hidden md:block overflow-hidden whitespace-nowrap">
                        <h1 className="font-bold text-lg tracking-tight pb-0 mt-[-3px]">Lemon</h1>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium pt-0 mt-[-3px]">LTE Control</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-2 flex flex-col gap-y-2">
                    <NavItem to="/overview" icon={Gauge} label="Overview" />
                    <NavItem to="/connectivity" icon={Wifi} label="Connectivity" />
                    <NavItem to="/sms" icon={MessageSquare} label="SMS" />
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 space-y-2">
                    <button
                        onClick={() => setShowReboot(true)}
                        className="cursor-pointer flex items-center justify-center md:justify-start gap-3 px-0 md:px-4 py-3 md:py-2 w-full rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-200"
                        title="Reboot"
                    >
                        <Power className="w-5 h-5" />
                        <span className="font-medium hidden md:block">Reboot</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="cursor-pointer flex items-center justify-center md:justify-start gap-3 px-0 md:px-4 py-3 md:py-2 w-full rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium hidden md:block">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#08080c]">
                <div className="p-4 md:p-8 max-w-full mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
