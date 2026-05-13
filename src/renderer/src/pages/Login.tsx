import { useState } from 'react';
import { Signal, Router as RouterIcon, User, Lock, Loader2 } from 'lucide-react';

interface LoginPageProps {
    onLogin: (url: string, user: string, pass: string, remember: boolean) => Promise<boolean>;
    error: string | null;
}

export const LoginPage = ({ onLogin, error }: LoginPageProps) => {
    const [url, setUrl] = useState('http://192.168.1.1/');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(url, username, password, rememberMe);
        setLoading(false);
    };

    return (
        <div className="h-full bg-[#08080c] flex items-center justify-center p-6">
            <div className="w-full max-w-md relative">
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]" />

                {/* Header */}
                <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/30 mb-4">
                        <Signal className="text-white w-8 h-8" />
                    </div>
                </div>
                {/* Card */}
                <div className="relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 shadow-2xl">

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Router URL</label>
                            <div className="relative">
                                <RouterIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm"
                                    placeholder="http://192.168.1.1/"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                            />
                            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                                Remember my credentials
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect to Router'}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-8">
                        Lemon LTE Control v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};
