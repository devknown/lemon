import { useState } from 'react';
import {
    MessageSquare,
    Send,
    Trash2,
    User,
    Calendar,
    Plus,
    X,
    Inbox,
    Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

import { useLTE } from '../lib/context/LTEContext';

export const SMSPage = () => {
    const {
        messages,
        refreshSms
    } = useLTE();

    const [sending, setSending] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [content, setContent] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState(1); // 1 = Inbox, 2 = Outbox

    const currentMessages = activeTab === 1 ? messages.inbox : messages.outbox;

    const handleSend = async () => {
        if (!recipient || !content) return;
        setSending(true);
        try {
            await window.api.lte.sendSms([recipient], content);
            setShowSendModal(false);
            setRecipient('');
            setContent('');
            await refreshSms(2);
            if (activeTab !== 2) setActiveTab(2);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this message?')) return;
        setDeleteLoading(id);
        try {
            await window.api.lte.deleteSms(id);
            await refreshSms(activeTab);
        } catch (e) {
            console.error(e);
        } finally {
            setDeleteLoading(null);
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mt-[-7px]">SMS Messages</h1>
                        <p className="text-xs text-muted-foreground">{currentMessages.length} messages in {activeTab === 1 ? 'Inbox' : 'Outbox'}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSendModal(true)}
                    className="cursor-pointer px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Compose
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab(1)}
                    className={cn(
                        "cursor-pointer px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                        activeTab === 1
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                >
                    <Inbox className="w-4 h-4" />
                    Inbox
                </button>
                <button
                    onClick={() => setActiveTab(2)}
                    className={cn(
                        "cursor-pointer px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                        activeTab === 2
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                >
                    <Send className="w-4 h-4" />
                    Outbox
                </button>
            </div>

            {/* Messages */}
            {currentMessages.length === 0 ? (
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-12 text-center">
                    {activeTab === 1 ? (
                        <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    ) : (
                        <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    )}
                    <p className="text-muted-foreground">Your {activeTab === 1 ? 'inbox' : 'outbox'} is empty</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentMessages.map((msg: any, i: number) => (
                        <div
                            key={i}
                            className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-start gap-4 group hover:border-violet-500/30 transition-all"
                        >
                            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm">{msg.Phone}</p>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {msg.Date}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{msg.Content}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(msg.Index)}
                                disabled={deleteLoading === msg.Index}
                                className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            >
                                {deleteLoading === msg.Index ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Compose Modal */}
            {showSendModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0f] border border-white/10 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Send className="w-5 h-5 text-violet-400" />
                                <h3 className="text-lg font-bold">Compose SMS</h3>
                            </div>
                            <button
                                onClick={() => setShowSendModal(false)}
                                className="cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient</label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl py-3 px-4 outline-none transition-all text-sm"
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl py-3 px-4 outline-none transition-all text-sm h-28 resize-none"
                                    placeholder="Type your message..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sending || !recipient || !content}
                            className="cursor-pointer w-full py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
