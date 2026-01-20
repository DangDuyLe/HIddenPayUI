import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { getDefaultPaymentMethod } from '@/services/api';

interface DefaultWalletInfo {
  type: 'onchain' | 'offchain';
  // For onchain
  address?: string;
  // For offchain (bank)
  bankName?: string;
  accountNumber?: string;
}

const Receive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { username: walletUsername, isConnected } = useWallet();

  const username = (() => {
    const u = user as { username?: unknown } | null;
    return typeof u?.username === 'string' ? u.username : walletUsername;
  })();

  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);

  // Default wallet info from API
  const [defaultWallet, setDefaultWallet] = useState<DefaultWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch default payment method on mount
  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const res = await getDefaultPaymentMethod();
        if (res.data?.walletType === 'offchain') {
          setDefaultWallet({
            type: 'offchain',
            bankName: res.data.bankName || '',
            accountNumber: res.data.accountNumber || '',
          });
        } else if (res.data?.walletType === 'onchain') {
          setDefaultWallet({
            type: 'onchain',
            address: res.data.address || '',
          });
        } else {
          setDefaultWallet(null);
        }
      } catch {
        setDefaultWallet(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefault();
  }, []);

  if (!isConnected) {
    return (
      <div className="app-container">
        <div className="page-wrapper">
          <div className="card-modern py-8 text-center text-muted-foreground text-sm">Wallet not connected.</div>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <div className="app-container">
        <div className="page-wrapper">
          <div className="card-modern py-8 text-center text-muted-foreground text-sm">Loading profile...</div>
        </div>
      </div>
    );
  }

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${username}`);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleCopyAddress = () => {
    if (defaultWallet?.address) {
      navigator.clipboard.writeText(defaultWallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleCopyAccountNumber = () => {
    if (defaultWallet?.accountNumber) {
      navigator.clipboard.writeText(defaultWallet.accountNumber);
      setCopiedAccountNumber(true);
      setTimeout(() => setCopiedAccountNumber(false), 2000);
    }
  };

  const shortAddress = defaultWallet?.address
    ? `${defaultWallet.address.slice(0, 8)}...${defaultWallet.address.slice(-6)}`
    : '';

  return (
    <div className="app-container">
      <div className="page-wrapper">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <h1 className="text-xl font-bold">Receive</h1>
          <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="card-modern py-12 text-center text-muted-foreground text-sm animate-pulse">
            Loading...
          </div>
        ) : !defaultWallet ? (
          /* No default wallet set */
          <div className="card-modern p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Default Wallet Set</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Set a default wallet or bank account to receive payments
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="btn-primary"
            >
              Go to Settings
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {/* Username - Always shown, copyable */}
            <button
              onClick={handleCopyUsername}
              className="card-modern w-full flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Username</p>
                <p className="font-medium text-lg">@{username}</p>
              </div>
              {copiedUsername ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {defaultWallet.type === 'onchain' ? (
              /* Crypto Wallet: Wallet Address - copyable */
              <button
                onClick={handleCopyAddress}
                className="card-modern w-full flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Wallet Address</p>
                  <p className="font-mono text-sm">{shortAddress}</p>
                </div>
                {copiedAddress ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ) : (
              /* Bank Account: Bank Name + Account Number */
              <>
                {/* Bank Name - display only */}
                <div className="card-modern w-full">
                  <p className="text-xs text-muted-foreground mb-0.5">Bank</p>
                  <p className="font-medium">{defaultWallet.bankName}</p>
                </div>

                {/* Account Number - copyable */}
                <button
                  onClick={handleCopyAccountNumber}
                  className="card-modern w-full flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Account Number</p>
                    <p className="font-mono text-sm">{defaultWallet.accountNumber}</p>
                  </div>
                  {copiedAccountNumber ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Receive;
