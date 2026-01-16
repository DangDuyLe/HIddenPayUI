import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { Scan, Check, AlertTriangle, User, Building2, ChevronRight } from 'lucide-react';
import QRScanner from '@/components/QRScanner';

type SendStep = 'input' | 'scan-result' | 'review' | 'success';

type ScanResultType = 'paypath-user' | 'external-bank';

interface ScannedBank {
  bankName: string;
  accountNumber: string;
  beneficiaryName: string;
}

interface ScannedPayPathUser {
  username: string;
  avatar: string;
}

const Send = () => {
  const navigate = useNavigate();
  const { sendSui, balance, isConnected, username, lookupBankAccount, lookupUsername, addContact } = useWallet();

  const [step, setStep] = useState<SendStep>('input');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // QR Scanner state
  const [showScanner, setShowScanner] = useState(false);

  // Scan result state - simplified
  const [scanResultType, setScanResultType] = useState<ScanResultType | null>(null);
  const [scannedUser, setScannedUser] = useState<ScannedPayPathUser | null>(null);
  const [scannedBank, setScannedBank] = useState<ScannedBank | null>(null);
  const [saveToContacts, setSaveToContacts] = useState(false);

  if (!isConnected || !username) {
    navigate('/');
    return null;
  }

  const fee = 0.01;

  const handleScanQR = () => {
    setShowScanner(true);
  };

  // Called when QR is scanned - backend team will implement actual parsing
  const handleQRScanned = (rawData: string) => {
    setShowScanner(false);
    console.log('QR Data received:', rawData);

    // TODO: Backend team will parse rawData here
    // Check if it's a PayPath QR (paypath:@username) or a VietQR (bank)

    // Simulate detection - in production, parse rawData format
    const isPayPathQR = Math.random() > 0.5;

    if (isPayPathQR) {
      // PayPath QR - just show username, system handles routing
      const mockUsername = 'duy3000';
      const user = lookupUsername(mockUsername);

      setScannedUser({
        username: mockUsername,
        avatar: user?.avatar || mockUsername.charAt(0).toUpperCase(),
      });
      setScanResultType('paypath-user');
      setScannedBank(null);
      setStep('scan-result');
    } else {
      // VietQR (Bank QR) - external transfer
      const mockBank: ScannedBank = {
        bankName: 'Sacombank',
        accountNumber: '5555666677778888',
        beneficiaryName: 'LE VAN C',
      };

      // Check if this bank account belongs to a PayPath user
      const registeredUser = lookupBankAccount(mockBank.accountNumber);

      if (registeredUser) {
        // Bank belongs to a PayPath user - treat as PayPath transfer
        setScannedUser({
          username: registeredUser.username,
          avatar: registeredUser.avatar || registeredUser.username.charAt(0).toUpperCase(),
        });
        setScanResultType('paypath-user');
        setScannedBank(null);
      } else {
        // Unregistered bank - external transfer
        setScannedBank(mockBank);
        setScanResultType('external-bank');
        setScannedUser(null);
      }
      setStep('scan-result');
    }
  };

  const proceedFromScanResult = () => {
    if (scanResultType === 'paypath-user' && scannedUser) {
      setRecipient(`@${scannedUser.username}`);
    } else if (scanResultType === 'external-bank' && scannedBank) {
      setRecipient(`Bank: ${scannedBank.beneficiaryName}`);
    }
    setStep('input');
  };

  const validateAndProceed = () => {
    const amountNum = parseFloat(amount);

    if (!recipient) {
      setError('Enter a recipient or scan a QR code');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (amountNum + fee > balance) {
      setError('Insufficient balance');
      return;
    }

    setStep('review');
  };

  const handleConfirm = () => {
    if (saveToContacts && scannedUser) {
      addContact(`@${scannedUser.username}`);
    }
    sendSui(recipient, parseFloat(amount));
    setStep('success');
  };

  // Scan Result Screen - SIMPLIFIED
  if (step === 'scan-result') {
    return (
      <div className="app-container">
        <div className="page-wrapper">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <h1 className="text-xl font-bold">QR Scanned</h1>
            <button
              onClick={() => setStep('input')}
              className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Result Card */}
          <div className="flex-1 animate-slide-up">
            {/* PayPath User - Simple display */}
            {scanResultType === 'paypath-user' && scannedUser && (
              <div className="card-container">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="badge-success mb-1">
                      <Check className="w-3.5 h-3.5" />
                      PayPath User
                    </div>
                    <p className="text-xl font-bold">@{scannedUser.username}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">You send SUI</span> → System routes to recipient's preferred destination (Wallet or Bank)
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToContacts}
                      onChange={(e) => setSaveToContacts(e.target.checked)}
                      className="w-5 h-5 rounded border-border"
                    />
                    <span className="text-sm font-medium">Save to Contacts</span>
                  </label>
                </div>
              </div>
            )}

            {/* External Bank - Warning */}
            {scanResultType === 'external-bank' && scannedBank && (
              <div className="card-container">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-14 h-14 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="badge-warning mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      External Transfer
                    </div>
                    <p className="text-lg font-semibold">{scannedBank.beneficiaryName}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{scannedBank.bankName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Account: </span>
                    <span className="font-mono">{scannedBank.accountNumber.slice(0, 4)}...{scannedBank.accountNumber.slice(-4)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-warning/5 rounded-xl border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-warning">Not on PayPath</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your SUI will be converted to VND and sent to their bank account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={proceedFromScanResult}
            className="btn-primary mt-6 flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="app-container">
        <div className="page-wrapper justify-between">
          <div />

          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" />
            </div>
            <p className="text-3xl font-bold mb-2">Sent!</p>
            <p className="text-muted-foreground">
              {amount} SUI to {recipient}
            </p>
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn-primary animate-slide-up">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    const isExternalTransfer = scanResultType === 'external-bank';

    return (
      <div className="app-container">
        <div className="page-wrapper">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <h1 className="text-xl font-bold">Review</h1>
            <button
              onClick={() => setStep('input')}
              className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
            >
              Edit
            </button>
          </div>

          {/* Summary */}
          <div className="flex-1 animate-slide-up">
            <div className="card-container p-0 overflow-hidden">
              <div className="settings-row px-5">
                <span className="text-muted-foreground">To</span>
                <span className="font-semibold">{recipient}</span>
              </div>
              {isExternalTransfer && (
                <div className="settings-row px-5">
                  <span className="text-muted-foreground">Type</span>
                  <span className="badge-warning">
                    <AlertTriangle className="w-3 h-3" />
                    Off-ramp
                  </span>
                </div>
              )}
              <div className="settings-row px-5">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{amount} SUI</span>
              </div>
              <div className="settings-row px-5">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">{fee} SUI</span>
              </div>
              <div className="px-5 py-4 bg-secondary flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{(parseFloat(amount) + fee).toFixed(2)} SUI</span>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button onClick={handleConfirm} className="btn-primary mt-6 animate-slide-up">
            Confirm & Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScanned}
        title="Quét mã QR"
      />

      <div className="app-container">
        <div className="page-wrapper">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <h1 className="text-xl font-bold">Send SUI</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-4 flex-1 animate-slide-up">
            {/* Scan QR Button */}
            <button
              onClick={handleScanQR}
              className="w-full card-container flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Scan className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Scan QR Code</p>
                  <p className="text-xs text-muted-foreground">PayPath QR or VietQR</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or enter manually</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="card-container space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-2 block">
                  Recipient
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setError('');
                  }}
                  placeholder="@username"
                  className="input-modern"
                />
              </div>

              <div>
                <label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-2 block">
                  Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="0.00"
                    className="input-modern flex-1"
                    step="0.01"
                    min="0"
                  />
                  <div className="px-5 py-3.5 bg-secondary text-muted-foreground font-medium rounded-xl border border-border">
                    SUI
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Available: {balance.toFixed(2)} SUI
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={validateAndProceed}
            className="btn-primary mt-6"
            disabled={!recipient || !amount}
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
};

export default Send;
