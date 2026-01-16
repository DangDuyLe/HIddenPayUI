import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { AUTH_STATEMENT } from '@/lib/config';
import { buildAuthMessage, getChallenge, verifySignature } from '@/services/auth';

interface AuthState {
  accessToken: string | null;
  tokenType: string | null;
  isAuthenticating: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  loginWithWallet: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'paypath.accessToken';
const STORAGE_TOKEN_TYPE_KEY = 'paypath.tokenType';

export function AuthProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessageAsync } = useSignPersonalMessage();

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [tokenType, setTokenType] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_TOKEN_TYPE_KEY)
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setAccessToken(null);
    setTokenType(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TOKEN_TYPE_KEY);
  }, []);

  const loginWithWallet = useCallback(async () => {
    if (!currentAccount?.address) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const { nonce, domain } = await getChallenge(currentAccount.address);

      const issuedAt = new Date().toISOString();
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const message = buildAuthMessage({
        domain,
        address: currentAccount.address,
        nonce,
        issuedAt,
        expirationTime,
        statement: AUTH_STATEMENT,
      });

      const bytes = new TextEncoder().encode(message);
      const signed = await signPersonalMessageAsync({ message: bytes });

      const signature = (signed as any)?.signature;
      if (typeof signature !== 'string') {
        throw new Error('Wallet returned invalid signature format');
      }

      const verifyRes = await verifySignature({
        address: currentAccount.address,
        nonce,
        issuedAt,
        expirationTime,
        statement: AUTH_STATEMENT,
        message,
        signature,
      });

      setAccessToken(verifyRes.accessToken);
      setTokenType(verifyRes.tokenType);
      localStorage.setItem(STORAGE_KEY, verifyRes.accessToken);
      localStorage.setItem(STORAGE_TOKEN_TYPE_KEY, verifyRes.tokenType);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      setError(msg);
      throw e;
    } finally {
      setIsAuthenticating(false);
    }
  }, [currentAccount?.address, signPersonalMessageAsync]);

  const value = useMemo(
    () => ({
      accessToken,
      tokenType,
      isAuthenticating,
      error,
      loginWithWallet,
      logout,
    }),
    [accessToken, tokenType, isAuthenticating, error, loginWithWallet, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export function getAuthHeader(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  const type = localStorage.getItem(STORAGE_TOKEN_TYPE_KEY) || 'Bearer';
  if (!token) return null;
  return `${type} ${token}`;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

