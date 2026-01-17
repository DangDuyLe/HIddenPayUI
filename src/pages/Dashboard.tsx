import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, QrCode, RefreshCw, ChevronRight, Eye, EyeOff } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        username,
        usdcBalance,
        transactions,
        isConnected,
        isLoadingBalance,
        refreshBalance,
    } = useWallet();

    const [showBalance, setShowBalance] = useState(true);

    useEffect(() => {
        if (!isConnected || !username) {
            navigate('/');
        }
    }, [isConnected, username, navigate]);

    if (!isConnected || !username) {
        return null;
    }

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Now';
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    // Split balance into whole and decimal
    const balanceWhole = Math.floor(usdcBalance);
    const balanceDecimal = (usdcBalance - balanceWhole).toFixed(6).slice(1); // .000000

    const recentTransactions = transactions.slice(0, 3);

    return (
        <div className="app-container">
            <div className="page-wrapper">
                {/* Header - User Pill */}
                <div className="flex justify-center animate-fade-in pt-2">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="user-pill"
                    >
                        <div className="user-avatar">
                            <span className="text-xs font-semibold">{username[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-sm">{username}</span>
                    </button>
                </div>

                {/* Balance Section */}
                <div className="py-8 text-center animate-slide-up">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <button
                            onClick={refreshBalance}
                            disabled={isLoadingBalance}
                            className="p-1.5 hover:bg-secondary rounded-full transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoadingBalance ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-baseline justify-center">
                        {showBalance ? (
                            <>
                                <span className="balance-display">
                                    ${isLoadingBalance ? '...' : balanceWhole}
                                </span>
                                <span className="balance-decimal">
                                    {isLoadingBalance ? '' : balanceDecimal}
                                </span>
                            </>
                        ) : (
                            <span className="balance-display">$•••••</span>
                        )}
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="ml-2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 animate-slide-up stagger-1">
                    <button
                        onClick={() => navigate('/send')}
                        className="btn-pill-primary"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Pay
                    </button>
                    <button
                        onClick={() => navigate('/receive')}
                        className="btn-pill-secondary"
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        Receive
                    </button>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 animate-slide-up stagger-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="section-title mb-0">Recent Activity</h3>
                        {transactions.length > 3 && (
                            <button
                                onClick={() => navigate('/history')}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                See all
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="card-modern space-y-1">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`icon-circle ${tx.type === 'sent' ? 'bg-secondary' : 'bg-success/10'}`}>
                                            {tx.type === 'sent'
                                                ? <ArrowUpRight className="w-4 h-4" />
                                                : <ArrowDownLeft className="w-4 h-4 text-success" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {tx.type === 'sent' ? `To ${tx.to}` : `From ${tx.from}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{formatTime(tx.timestamp)}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold text-sm ${tx.type === 'sent' ? '' : 'text-success'}`}>
                                        {tx.type === 'sent' ? '−' : '+'}{tx.amount.toFixed(2)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                No transactions yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 animate-slide-up stagger-3">
                    <button
                        onClick={() => navigate('/receive')}
                        className="w-full card-modern flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="icon-circle-secondary">
                                <QrCode className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-sm">Show My QR Code</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
