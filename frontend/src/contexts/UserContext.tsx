import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, BankConsent } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface BankConnectionStatus {
  hasConnections: boolean;
  activeConsents: number;
  syncedAccounts: number;
  isLoading: boolean;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  userId: number | null;
  bankConnectionStatus: BankConnectionStatus;
  refreshBankStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // TODO: Replace with actual auth logic
  // For now, we use a mock user with ID 1
  const [user, setUser] = useState<User | null>({
    id: 1,
    email: 'demo@yappma.local',
    name: 'Demo User',
    currency_default: 'EUR',
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [bankConnectionStatus, setBankConnectionStatus] = useState<BankConnectionStatus>({
    hasConnections: false,
    activeConsents: 0,
    syncedAccounts: 0,
    isLoading: false,
  });

  const userId = user?.id ?? null;

  /**
   * Fetch bank connection status
   */
  const refreshBankStatus = async () => {
    if (!userId) {
      return;
    }

    setBankConnectionStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      // Fetch consents
      const consents = await apiClient.bankConnections.listConsents();
      
      // Count active consents (valid or authorized)
      const activeConsents = consents.filter(
        (c) => c.status === 'valid' || c.status === 'authorized'
      ).length;

      setBankConnectionStatus({
        hasConnections: consents.length > 0,
        activeConsents,
        syncedAccounts: 0, // TODO: Could fetch accounts count if needed
        isLoading: false,
      });

      logger.debug('Bank connection status updated', {
        hasConnections: consents.length > 0,
        activeConsents,
      });
    } catch (error) {
      logger.error('Failed to fetch bank connection status', error);
      setBankConnectionStatus((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Load bank status on mount
  useEffect(() => {
    if (userId) {
      refreshBankStatus();
    }
  }, [userId]);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        setUser, 
        userId,
        bankConnectionStatus,
        refreshBankStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
