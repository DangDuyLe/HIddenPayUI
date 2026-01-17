import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  const isSmallScreen = window.innerWidth <= 768;
  return mobileRegex.test(userAgent.toLowerCase()) || isSmallScreen;
};

const isInSlushBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('slush') || userAgent.includes('suiwallet');
};

const Login = () => {
  const navigate = useNavigate();
  const { connectWallet, isConnected, username } = useWallet();
  const currentAccount = useCurrentAccount();
  const [hasClickedConnect, setHasClickedConnect] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInWalletBrowser, setIsInWalletBrowser] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsInWalletBrowser(isInSlushBrowser());
  }, []);

  useEffect(() => {
    if (currentAccount && hasClickedConnect) {
      connectWallet(currentAccount.address);
      if (username) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [currentAccount, hasClickedConnect, connectWallet, navigate, username]);

  useEffect(() => {
    if (isConnected && username) {
      navigate('/dashboard');
    }
  }, [isConnected, username, navigate]);

  const handleConnectClick = () => {
    setHasClickedConnect(true);
  };

  const copyAppLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const showMobileInstructions = isMobile && !isInWalletBrowser;

  return (
    <div className="app-container">
      <div className="page-wrapper justify-between">
        {/* Top spacer */}
        <div className="pt-16" />

        {/* Center content */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">PayPath</h1>
          <p className="text-muted-foreground">
            Send money instantly with Sui
          </p>
        </div>

        {/* Bottom section */}
        <div className="space-y-4 animate-slide-up pb-6">
          {showMobileInstructions ? (
            <>
              <div className="card-modern p-5 space-y-4">
                <p className="text-sm font-medium text-center">
                  Open in Slush Wallet to connect
                </p>

                <button
                  onClick={copyAppLink}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy App Link
                    </>
                  )}
                </button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <span>Open <strong className="text-foreground">Slush Wallet</strong></span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <span>Go to <strong className="text-foreground">Apps</strong> tab</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    <span>Paste link & tap <strong className="text-foreground">Connect</strong></span>
                  </div>
                </div>
              </div>

              <div onClick={handleConnectClick}>
                <div className="sui-connect-wrapper">
                  <ConnectButton />
                </div>
              </div>
            </>
          ) : (
            <div onClick={handleConnectClick}>
              <div className="sui-connect-wrapper">
                <ConnectButton />
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Powered by Sui Blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
