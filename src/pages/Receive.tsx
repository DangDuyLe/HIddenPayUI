import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Copy, Check, X, Share2 } from 'lucide-react';
import { getDefaultPaymentMethod } from '@/services/api';
import { toast } from 'sonner';

// VietQR Bank BIN mapping - map bankName to bank BIN code
// Source: https://api.vietqr.io/v2/banks
const BANK_BIN_MAP: Record<string, string> = {
  'Vietcombank': '970436',
  'VietinBank': '970415',
  'BIDV': '970418',
  'Agribank': '970405',
  'Techcombank': '970407',
  'MBBank': '970422',
  'MB': '970422',
  'ACB': '970416',
  'VPBank': '970432',
  'TPBank': '970423',
  'Sacombank': '970403',
  'HDBank': '970437',
  'VIB': '970441',
  'SHB': '970443',
  'Eximbank': '970431',
  'MSB': '970426',
  'SeABank': '970440',
  'OCB': '970448',
  'Nam A Bank': '970428',
  'PVcomBank': '970412',
  'LienVietPostBank': '970449',
  'BacABank': '970409',
  'VietABank': '970427',
  'ABBank': '970425',
  'Kienlongbank': '970452',
  'SCB': '970429',
  'NCB': '970419',
  'SaigonBank': '970400',
  'PGBank': '970430',
  'BaoVietBank': '970438',
  'VietBank': '970433',
  'PublicBank': '970439',
  'GPBank': '970408',
  'CBBank': '970444',
  'UOB': '970458',
  'HSBC': '458761',
  'Woori Bank': '970457',
  'Shinhan Bank': '970424',
  'CIMB': '422589',
  'Standard Chartered': '970410',
};

interface DefaultWalletInfo {
  type: 'onchain' | 'offchain';
  address?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

const Receive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { username: walletUsername, isConnected } = useWallet();

  const username = (() => {
    const u = user as { username?: unknown } | null;
    return typeof u?.username === 'string' ? u.username : walletUsername;
  })();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [defaultWallet, setDefaultWallet] = useState<DefaultWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const res = await getDefaultPaymentMethod();
        if (res.data?.walletType === 'offchain') {
          setDefaultWallet({
            type: 'offchain',
            bankName: res.data.bankName || '',
            accountNumber: res.data.accountNumber || '',
            accountName: res.data.accountName || '',
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = async () => {
    const shareText = defaultWallet?.type === 'offchain'
      ? `Pay me via bank transfer:\n${defaultWallet.bankName}\nAccount: ${defaultWallet.accountNumber}\nName: ${defaultWallet.accountName}`
      : `Send me crypto:\nUsername: @${username}\nAddress: ${defaultWallet?.address}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        copyToClipboard(shareText, 'share');
      }
    } else {
      copyToClipboard(shareText, 'share');
    }
  };

  if (!isConnected || !username) {
    return (
      <div className="app-container">
        <div className="page-wrapper">
          <div className="card-modern py-8 text-center text-muted-foreground text-sm">
            {!isConnected ? 'Wallet not connected.' : 'Loading profile...'}
          </div>
        </div>
      </div>
    );
  }

  const shortAddress = defaultWallet?.address
    ? `${defaultWallet.address.slice(0, 8)}...${defaultWallet.address.slice(-6)}`
    : '';

  const getVietQRImageUrl = () => {
    if (!defaultWallet || defaultWallet.type !== 'offchain') return null;
    const bankBin = BANK_BIN_MAP[defaultWallet.bankName || ''];
    if (!bankBin || !defaultWallet.accountNumber) return null;
    const accountNameEncoded = encodeURIComponent(defaultWallet.accountName || '');
    return `https://img.vietqr.io/image/${bankBin}-${defaultWallet.accountNumber}-compact.png?accountName=${accountNameEncoded}`;
  };

  const vietQRUrl = getVietQRImageUrl();

  return (
    <div className="app-container">
      <div className="page-wrapper">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <h1 className="text-xl font-bold">Receive Payment</h1>
          <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="card-modern py-12 text-center text-muted-foreground text-sm animate-pulse">
            Loading...
          </div>
        ) : !defaultWallet ? (
          <div className="card-modern p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Payment Method Set</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Set a default wallet or bank account to receive payments
            </p>
            <button onClick={() => navigate('/settings')} className="btn-primary">
              Go to Settings
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {/* Hero Banner - Only show for crypto wallets */}
            {defaultWallet.type === 'onchain' && (
              <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-5">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="font-semibold">Share & Get Paid</p>
                    <p className="text-sm text-muted-foreground">
                      Share your username or wallet address
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code for Bank */}
            {defaultWallet.type === 'offchain' && vietQRUrl && (
              <div className="card-modern p-6 text-center">
                <img
                  src={vietQRUrl}
                  alt="VietQR Code"
                  className="w-56 h-auto mx-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Payment Info Card */}
            <div className="card-modern divide-y divide-border">
              {/* Username - Always shown */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => copyToClipboard(`@${username}`, 'username')}
              >
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Username</p>
                  <p className="font-semibold text-lg mt-0.5">@{username}</p>
                </div>
                {copiedField === 'username' ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {defaultWallet.type === 'onchain' ? (
                /* Wallet Address */
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => defaultWallet.address && copyToClipboard(defaultWallet.address, 'address')}
                >
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Wallet Address</p>
                    <p className="font-mono text-sm mt-0.5">{shortAddress}</p>
                  </div>
                  {copiedField === 'address' ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              ) : (
                /* Bank Details */
                <>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Bank</p>
                      <p className="font-medium mt-0.5">{defaultWallet.bankName}</p>
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => defaultWallet.accountNumber && copyToClipboard(defaultWallet.accountNumber, 'account')}
                  >
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Account Number</p>
                      <p className="font-mono font-semibold text-lg mt-0.5">{defaultWallet.accountNumber}</p>
                    </div>
                    {copiedField === 'account' ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full py-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Share2 className="w-5 h-5" />
              Share Payment Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Receive;
