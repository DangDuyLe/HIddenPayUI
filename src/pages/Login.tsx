import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const Login = () => {
  const navigate = useNavigate();
  const { connectWallet, username } = useWallet();
  const { accessToken, isAuthenticating, error, loginWithWallet } = useAuth();
  const currentAccount = useCurrentAccount();
  const [hasClickedConnect, setHasClickedConnect] = useState(false);
  const [didAttemptAuth, setDidAttemptAuth] = useState(false);

  useEffect(() => {
    if (currentAccount && hasClickedConnect) {
      connectWallet(currentAccount.address);
    }
  }, [currentAccount, hasClickedConnect, connectWallet]);

  useEffect(() => {
    const run = async () => {
      if (
        currentAccount?.address &&
        hasClickedConnect &&
        !accessToken &&
        !isAuthenticating &&
        !didAttemptAuth
      ) {
        setDidAttemptAuth(true);
        try {
          await loginWithWallet();
        } catch {
          // error is exposed via AuthContext
        }
      }
    };

    run();
  }, [
    currentAccount?.address,
    hasClickedConnect,
    accessToken,
    isAuthenticating,
    didAttemptAuth,
    loginWithWallet,
  ]);

  useEffect(() => {
    if (accessToken) {
      if (username) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [accessToken, username, navigate]);

  const handleConnectClick = () => {
    setHasClickedConnect(true);
  };

  const handleRetryAuth = async () => {
    setDidAttemptAuth(false);
  };

  return (
    <div className="app-container">
      <div className="page-wrapper justify-between">
        <div className="pt-20" />

        <div className="text-center animate-fade-in">
          <h1 className="display-large mb-4">PayPath</h1>
          <p className="text-muted-foreground text-lg">Send money instantly</p>
        </div>

        <div className="space-y-4 animate-slide-up pb-8">
          <div onClick={handleConnectClick}>
            <div className="sui-connect-wrapper">
              <ConnectButton />
            </div>
          </div>

          {hasClickedConnect && (isAuthenticating || error) && (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                {isAuthenticating ? 'Authenticating…' : error}
              </p>

              {!isAuthenticating && error && (
                <div className="flex justify-center">
                  <Button variant="secondary" size="sm" onClick={handleRetryAuth}>
                    Authenticate again
                  </Button>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">Powered by Sui Blockchain</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
