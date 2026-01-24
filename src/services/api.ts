import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'https://sui-payment.onrender.com/api';

const api = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type ApiEnvelope<T> = T | { data: T } | { result: T };

const unwrap = <T>(payload: ApiEnvelope<T>): T => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload) return (payload as { data: T }).data;
    if ('result' in payload) return (payload as { result: T }).result;
  }
  return payload as T;
};

export const getData = async <T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> => {
  const res = await promise;
  return unwrap<T>(res.data);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error interceptor for better debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error Details:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        request: error.config?.data,
      });
    }
    return Promise.reject(error);
  }
);

export type WalletChallengeResponseDto = {
  nonce: string;
  expiresAt: string;
  domain: string;
};

export type WalletVerifyRequestDto = {
  address: string;
  domain?: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  statement?: string;
  message: string;
  signature: string;
};

export const getChallenge = (address: string) => api.get<WalletChallengeResponseDto>('/auth/challenge', {
  params: { address },
});

export const postVerify = (dto: WalletVerifyRequestDto) => api.post('/auth/verify', dto);

export const getZkLoginChallenge = () => api.get('/auth/zklogin/challenge');
export const postZkLoginSalt = (dto: { sub: string }) => api.post('/auth/zklogin/salt', dto);
export const postZkLoginRegister = (dto: { nonceBase64Url: string; maxEpoch: number }) =>
  api.post('/auth/zklogin/register', dto);
export const postZkLoginVerify = (dto: unknown) => api.post('/auth/zklogin/verify', dto);
export type RegisterRequestDto = {
  username: string;
  walletAddress: string;
  email?: string;
  referralUsername?: string;
};

export const postRegister = (dto: RegisterRequestDto) => {
  // CRITICAL: Validate username is not null/empty
  if (!dto.username || dto.username.trim().length === 0) {
    console.error('[API ERROR] Attempt to register with null/empty username:', {
      dto,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
    });
    throw new Error('Username cannot be null or empty');
  }

  // Validate wallet address
  if (!dto.walletAddress || dto.walletAddress.trim().length === 0) {
    console.error('[API ERROR] Attempt to register with null/empty wallet address:', {
      dto,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
    });
    throw new Error('Wallet address cannot be null or empty');
  }

  console.log('[API] Registering user:', {
    username: dto.username,
    walletAddress: dto.walletAddress,
    hasEmail: !!dto.email,
    hasReferral: !!dto.referralUsername,
    timestamp: new Date().toISOString(),
  });

  return api.post('/auth/register', dto);
};

export const getProfile = () => api.get('/users/profile');

export const updateProfile = (dto: { email?: string; firstName?: string; lastName?: string }) =>
  api.patch('/users/profile', dto);

// User lookup for transfers
export type LookupUserDefaultWallet =
  | { id: string; type: 'onchain'; address: string; chain: string }
  | { id: string; type: 'offchain'; bankName: string; accountNumber: string; accountName: string; qrString: string };

export type LookupUserResponseDto = {
  userId: string;
  username: string;
  walletAddress: string;
  kycStatus: string;
  canReceiveTransfer: boolean;
  defaultWallet: LookupUserDefaultWallet | null;
};

export const lookupUser = (username: string) => {
  if (!username || username.trim().length === 0) {
    throw new Error('Username cannot be null or empty');
  }
  return api.get<LookupUserResponseDto>(`/users/lookup?username=${username}`);
};

export type CheckUsernameResponseDto = {
  available: boolean;
};

export const checkUsername = (username: string) => {
  if (!username || username.trim().length === 0) {
    throw new Error('Username cannot be null or empty');
  }
  return api.get<CheckUsernameResponseDto>('/users/check-username', { params: { username } });
};

export const changeUsername = (newUsername: string) => {
  if (!newUsername || newUsername.trim().length === 0) {
    throw new Error('New username cannot be null or empty');
  }
  return api.patch('/users/profile/username', { newUsername });
};


export const scanQr = async (qrString: string) => {
  const data = await getData(api.post('/transfer/scan', { qrString }));
  return { data };
};

export type OnchainWalletDto = {
  id: string;
  address: string;
  label?: string | null;
  createdAt?: string;
};

export type OffchainBankDto = {
  id: string;
  bankName: string;
  accountNumber: string;
  beneficiaryName: string;
  label?: string | null;
  createdAt?: string;
};

export type PaymentMethodDefaultResponseDto = {
  walletId: string | null;
  walletType: 'onchain' | 'offchain' | null;
  address?: string; // For onchain wallets
  accountNumber?: string; // For offchain banks
  bankName?: string; // For offchain banks
  accountName?: string; // For offchain banks
};

export const listOnchainWallets = async () => {
  const data = await getData<OnchainWalletDto[]>(api.get('/wallet/onchain'));
  return { data };
};
export const addOnchainWallet = (dto: { address: string; chain: string; label?: string; walletProvider?: string; publicKey?: string }) =>
  api.post('/wallet/onchain/add', dto);
export const deleteOnchainWallet = (id: string) => api.delete(`/wallet/onchain/${id}`);

export const listOffchainBanks = async () => {
  const data = await getData<{ total: number; banks: OffchainBankDto[] }>(api.get('/wallet/offchain'));
  return { data };
};
export const addOffchainBankByQr = (dto: { qrString: string; label?: string }) => api.post('/wallet/offchain/add', dto);
export const deleteOffchainBank = (id: string) => api.delete(`/wallet/offchain/${id}`);

export const getDefaultPaymentMethod = async () => {
  const data = await getData<PaymentMethodDefaultResponseDto>(api.get('/payment-methods/default'));
  return { data };
};
export const setDefaultPaymentMethod = (dto: { walletId: string; walletType: 'onchain' | 'offchain' }) =>
  api.post('/payment-methods/default', dto);

export type KycLinkResponseDto = {
  url?: string;
  kycLink?: string;
};

export type KycStatusResponseDto = {
  kycStatus: 'unverified' | 'pending' | 'verified' | 'approved' | string;
  userId?: string;
  username?: string;
  walletAddress?: string;
  firstName?: string;
  lastName?: string;
  canTransfer?: boolean;
};

export const getKycLink = (dto: { walletAddress: string }) => api.post<KycLinkResponseDto>('/kyc/get-link', dto);
export const getKycStatus = (walletAddress: string) =>
  api.get<KycStatusResponseDto>('/kyc/status', { params: { walletAddress } });

// ============================================
// PAYMENT ORDER API (Bank Transfers)
// ============================================

export type CreatePaymentOrderDto = {
  qrString: string;
  usdcAmount: number;
  payerWalletAddress: string;
  fiatCurrency?: string;
  country?: string;
  recipientCountry?: string;
  clientRequestId?: string;
};

export type PaymentInstructionDto = {
  toAddress: string;
  coinType: string;
  totalCrypto: string;
  totalCryptoRaw: string;
  totalPayout: number;
};

export type CreatePaymentOrderResponseDto = {
  id: string;
  status: string;
  exchangeInfo: {
    cryptoAmount: number;
    fiatAmount: number;
    fiatCurrency: string;
    cryptoCurrency: string;
    exchangeRate: number;
    feeAmount: number;
  };
  platformFee?: {
    feePercent: string;
    feeRate: number;
    feeAmount: number;
    baseFiatAmount: number;
    finalFiatAmount: number;
  };
  paymentInstruction: PaymentInstructionDto;
  payout: {
    username?: string;
    fiatCurrency: string;
  };
};

export const createPaymentOrder = (dto: CreatePaymentOrderDto) =>
  api.post<CreatePaymentOrderResponseDto>('/payments/orders', dto);

export type PaymentsQuoteDto = {
  direction: 'USDC_TO_FIAT';
  usdcAmount: string;
  country: string;
  token: string;
};

export type PaymentsQuoteResponseDto = {
  success: boolean;
  direction: string;
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: string;
  usdcAmount: string;
  exchangeRate: string | number;
  feeAmount: number;
  feeRate: number;
  timestamp: string;
};

export const paymentsQuote = (dto: PaymentsQuoteDto) =>
  api.post<PaymentsQuoteResponseDto>('/payments/quote', dto);
export const confirmPaymentOrder = (orderId: string, userPaymentTxDigest: string) =>
  api.post(`/payments/orders/${orderId}/confirm-user-payment`, { userPaymentTxDigest });

export const getPaymentOrder = (orderId: string) =>
  api.get(`/payments/orders/${orderId}`);

export const syncPaymentOrder = (orderId: string) =>
  api.post(`/payments/orders/${orderId}/sync`);

export default api;
