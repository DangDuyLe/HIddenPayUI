import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { useEffect } from 'react';
import { Send, QrCode, ArrowDownLeft, ArrowUpRight, Settings, RefreshCw, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    username,
    suiBalance,
    usdcBalance,
    balanceVnd,
    transactions,
    isConnected,
    isLoadingBalance,
    refreshBalance,
  } = useWallet();

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

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Show only 3 recent transactions on Dashboard
  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="app-container">
      <div className="page-wrapper">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <p className="label-caps mb-1">Welcome back</p>
            <h2 className="text-xl font-bold">@{username}</h2>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-3 border border-border hover:bg-secondary transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="py-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <p className="label-caps">USDC Balance</p>
            <button
              onClick={refreshBalance}
              disabled={isLoadingBalance}
              className="p-1 hover:bg-secondary rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="display-large">
            {isLoadingBalance ? '...' : usdcBalance.toFixed(2)}
            <span className="text-3xl text-muted-foreground ml-2">USDC</span>
          </p>
          <p className="text-muted-foreground text-lg mt-2">≈ {formatVnd(balanceVnd)} ₫</p>

          {/* SUI Balance for gas */}
          <p className="text-sm text-muted-foreground mt-4">
            Gas: {suiBalance.toFixed(4)} SUI
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 animate-slide-up stagger-1">
          <button
            onClick={() => navigate('/send')}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
          <button
            onClick={() => navigate('/receive')}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Receive
          </button>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Activity - Only 3 items */}
        <div className="flex-1 animate-slide-up stagger-2">
          <div className="flex justify-between items-center mb-4">
            <p className="section-title mb-0">Recent Activity</p>
            {/* See All - hidden on mobile (use bottom nav instead) */}
            {transactions.length > 3 && (
              <button
                onClick={() => navigate('/history')}
                className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                See all
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="border border-border">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="row-item px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center ${tx.type === 'sent' ? 'bg-secondary' : 'bg-success/10'
                    }`}>
                    {tx.type === 'sent'
                      ? <ArrowUpRight className="w-5 h-5" />
                      : <ArrowDownLeft className="w-5 h-5 text-success" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {tx.type === 'sent' ? `To ${tx.to}` : `From ${tx.from}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatTime(tx.timestamp)}</p>
                  </div>
                </div>
                <p className={`font-semibold flex-shrink-0 ${tx.type === 'sent' ? 'text-foreground' : 'text-success'}`}>
                  {tx.type === 'sent' ? '−' : '+'}{tx.amount.toFixed(2)} USDC
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
