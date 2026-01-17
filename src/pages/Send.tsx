import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { Scan, Check, AlertTriangle, ChevronDown, Wallet, Building2, Loader2, Info, X, User } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import * as gaian from '@/services/gaian';

type SendStep = 'input' | 'review' | 'sending' | 'success' | 'error';
type ScanResult = 'none' | 'internal' | 'external' | 'error';
type RecipientType = 'none' | 'username' | 'address';

interface ExternalBankInfo {
  bankName: string;
  accountNumber: string;
  beneficiaryName: string;
  amount?: number;
}

const Send = () => {
  const navigate = useNavigate();
  const {
    sendUsdc,
    suiBalance,
    usdcBalance,
    isConnected,
    username,
    lookupUsername,
    linkedWallets,
    linkedBanks,
    defaultAccountId,
    defaultAccountType,
    isValidWalletAddress,
  } = useWallet();

  const [step, setStep] = useState<SendStep>('input');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [recipientValid, setRecipientValid] = useState<boolean | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<RecipientType>('none');
  const [recipientDisplayName, setRecipientDisplayName] = useState<string | null>(null);

  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(defaultAccountId);
  const [selectedSourceType, setSelectedSourceType] = useState<'wallet' | 'bank'>(defaultAccountType);

  const [scanResult, setScanResult] = useState<ScanResult>('none');
  const [isParsing, setIsParsing] = useState(false);
  const [externalBank, setExternalBank] = useState<ExternalBankInfo | null>(null);

  if (!isConnected || !username) {
    navigate('/');
    return null;
  }

  const allSources = [
    ...linkedWallets.map(w => ({ id: w.id, type: 'wallet' as const, name: w.name, address: w.address })),
    ...linkedBanks.map(b => ({ id: b.id, type: 'bank' as const, name: b.bankName, address: null })),
  ];

  const selectedSource = allSources.find(s => s.id === selectedSourceId && s.type === selectedSourceType) || allSources[0];
  const fee = 0.001;

  const checkRecipient = () => {
    const input = recipient.trim();
    if (!input || input.length < 2) return;

    setIsChecking(true);
    setError('');

    setTimeout(() => {
      if (input.startsWith('0x')) {
        if (isValidWalletAddress(input)) {
          setRecipientValid(true);
          setRecipientAddress(input);
          setRecipientType('address');
          setRecipientDisplayName(input.slice(0, 8) + '...' + input.slice(-4));
        } else {
          setRecipientValid(false);
          setRecipientAddress(null);
          setRecipientType('none');
          setError('Invalid wallet address format');
        }
      } else {
        const cleanUsername = input.replace('@', '').toLowerCase();
        const user = lookupUsername(cleanUsername);

        if (user && user.walletAddress) {
          setRecipientValid(true);
          setRecipientAddress(user.walletAddress);
          setRecipientType('username');
          setRecipientDisplayName(`@${user.username}`);
        } else if (user) {
          setRecipientValid(false);
          setRecipientAddress(null);
          setRecipientType('none');
          setError('User has no linked wallet');
        } else {
          setRecipientValid(false);
          setRecipientAddress(null);
          setRecipientType('none');
          setError('User not found');
        }
      }
      setIsChecking(false);
    }, 300);
  };

  const handleQRScanned = async (qrString: string) => {
    setShowScanner(false);
    setIsParsing(true);
    setError('');
    setScanResult('none');
    setExternalBank(null);

    try {
      if (gaian.isPayPathQr(qrString)) {
        const extractedUsername = gaian.extractPayPathUsername(qrString);
        const user = lookupUsername(extractedUsername);

        if (user && user.walletAddress) {
          setRecipient(`@${extractedUsername}`);
          setRecipientValid(true);
          setRecipientAddress(user.walletAddress);
          setRecipientType('username');
          setRecipientDisplayName(`@${user.username}`);
          setScanResult('internal');
        } else {
          setRecipient(`@${extractedUsername}`);
          setRecipientValid(false);
          setScanResult('error');
          setError(user ? 'User has no linked wallet' : `User @${extractedUsername} not found`);
        }
        setIsParsing(false);
        return;
      }

      if (qrString.startsWith('0x') && isValidWalletAddress(qrString)) {
        setRecipient(qrString);
        setRecipientValid(true);
        setRecipientAddress(qrString);
        setRecipientType('address');
        setRecipientDisplayName(qrString.slice(0, 8) + '...' + qrString.slice(-4));
        setScanResult('internal');
        setIsParsing(false);
        return;
      }

      const parsedBank = await gaian.parseQrString(qrString);

      if (parsedBank) {
        setExternalBank({
          bankName: parsedBank.bankName,
          accountNumber: parsedBank.accountNumber,
          beneficiaryName: parsedBank.beneficiaryName,
          amount: parsedBank.amount,
        });
        setRecipient(`${parsedBank.beneficiaryName}`);
        setRecipientDisplayName(`${parsedBank.beneficiaryName} (${parsedBank.bankName})`);
        setScanResult('external');

        if (parsedBank.amount) {
          setAmount(parsedBank.amount.toString());
        }
      } else {
        setScanResult('error');
        setError('Invalid QR Code');
      }
    } catch (err) {
      console.error('QR parsing error:', err);
      setScanResult('error');
      setError('Failed to parse QR code');
    } finally {
      setIsParsing(false);
    }
  };

  const validate = () => {
    const amountNum = parseFloat(amount);

    if (scanResult === 'external' && externalBank) {
      if (isNaN(amountNum) || amountNum <= 0) { setError('Invalid amount'); return; }
      if (amountNum > usdcBalance) { setError('Insufficient USDC balance'); return; }
      if (suiBalance < fee) { setError('Not enough SUI for gas fees'); return; }
      setStep('review');
      return;
    }

    if (!recipient) { setError('Enter recipient'); return; }
    if (!recipientValid || !recipientAddress) { setError('Verify recipient first'); return; }
    if (isNaN(amountNum) || amountNum <= 0) { setError('Invalid amount'); return; }
    if (amountNum > usdcBalance) { setError('Insufficient USDC balance'); return; }
    if (suiBalance < fee) { setError('Not enough SUI for gas fees'); return; }
    setStep('review');
  };

  const handleConfirm = async () => {
    if (!recipientAddress && scanResult !== 'external') {
      setError('No recipient address');
      return;
    }

    setStep('sending');

    try {
      const toAddress = recipientAddress || '0x0000000000000000000000000000000000000000000000000000000000000000';
      const success = await sendUsdc(toAddress, parseFloat(amount));

      if (success) {
        setStep('success');
      } else {
        setError('Transaction failed');
        setStep('error');
      }
    } catch (err) {
      console.error('Send error:', err);
      setError('Transaction failed');
      setStep('error');
    }
  };

  const clearRecipient = () => {
    setScanResult('none');
    setExternalBank(null);
    setRecipient('');
    setRecipientValid(null);
    setRecipientAddress(null);
    setRecipientType('none');
    setRecipientDisplayName(null);
    setError('');
  };

  // Sending state
  if (step === 'sending') {
    return (
      <div className="app-container">
        <div className="page-wrapper justify-center items-center text-center">
          <div className="animate-fade-in">
            <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-muted-foreground" />
            <p className="text-xl font-bold mb-2">Sending...</p>
            <p className="text-muted-foreground">{amount} USDC</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="app-container">
        <div className="page-wrapper justify-center items-center text-center">
          <div className="animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-destructive/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-xl font-bold mb-2">Failed</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
          <button onClick={() => setStep('input')} className="btn-primary mt-8 animate-slide-up">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className="app-container">
        <div className="page-wrapper justify-center items-center text-center">
          <div className="animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-success/10 rounded-full">
              <Check className="w-8 h-8 text-success" />
            </div>
            <p className="text-xl font-bold mb-2">Sent!</p>
            <p className="text-2xl font-bold">{amount} USDC</p>
            <p className="text-muted-foreground mt-1 text-sm">to {recipientDisplayName || recipient}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-8 animate-slide-up">
            Done
          </button>
        </div>
      </div>
    );
  }

  // Review
  if (step === 'review') {
    const isExternal = scanResult === 'external' && externalBank;

    return (
      <div className="app-container">
        <div className="page-wrapper">
          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <h1 className="text-xl font-bold">Review</h1>
            <button onClick={() => setStep('input')} className="btn-ghost">Edit</button>
          </div>

          <div className="flex-1 animate-slide-up">
            <div className="card-modern divide-y divide-border">
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground text-sm">From</span>
                <div className="flex items-center gap-2">
                  {selectedSource?.type === 'wallet' ? <Wallet className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  <span className="font-medium text-sm">{selectedSource?.name}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground text-sm">To</span>
                <span className="font-medium text-sm">{recipientDisplayName || recipient}</span>
              </div>
              {isExternal && externalBank && (
                <>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground text-sm">Bank</span>
                    <span className="font-medium text-sm">{externalBank.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-warning/10 -mx-4 px-4 rounded-xl">
                    <span className="text-warning text-sm font-medium">Type</span>
                    <span className="text-warning text-sm font-medium">Off-ramp</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="font-medium">{amount} USDC</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground text-sm">Fee (0.2%)</span>
                <span className="text-sm">{(parseFloat(amount) * 0.002).toFixed(4)} USDC</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-secondary -mx-4 px-4 rounded-xl">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-bold">{(parseFloat(amount) + parseFloat(amount) * 0.002).toFixed(2)} USDC</span>
              </div>
            </div>
          </div>

          <button onClick={handleConfirm} className="btn-primary mt-6 animate-slide-up">
            Confirm & Send
          </button>
        </div>
      </div>
    );
  }

  // Input
  return (
    <>
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScanned}
        title="Scan QR"
      />

      <div className="app-container">
        <div className="page-wrapper">
          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <h1 className="text-xl font-bold">Send</h1>
            <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 animate-slide-up">
            {/* Scan QR Button */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full card-modern flex items-center justify-center gap-3 py-4"
            >
              <div className="icon-circle-primary">
                <Scan className="w-4 h-4" />
              </div>
              <span className="font-semibold">Scan to Pay</span>
            </button>

            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex-1 h-px bg-border" />
              <span>or enter manually</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Recipient Input */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Recipient</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => {
                      setRecipient(e.target.value);
                      setRecipientValid(null);
                      setError('');
                    }}
                    onBlur={checkRecipient}
                    placeholder="@username or 0x..."
                    className="input-modern pl-10"
                    disabled={scanResult === 'external'}
                  />
                </div>
                {recipientValid === true && (
                  <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                )}
              </div>
              {recipientDisplayName && recipientValid && (
                <p className="text-sm text-success mt-2">Found: {recipientDisplayName}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <span className="text-sm text-muted-foreground">Balance: {usdcBalance.toFixed(2)} USDC</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="0.00"
                className="input-modern text-xl font-semibold"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-xl">{error}</p>
            )}
          </div>

          <button 
            onClick={validate} 
            disabled={!recipient || !amount}
            className="btn-primary mt-6"
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
};

export default Send;
