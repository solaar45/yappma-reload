import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/lib/api/types';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  userId: number | null;
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
    tax_allowance_limit: 1000,
    tax_status: 'single',
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const userId = user?.id ?? null;

  return (
    <UserContext.Provider value={{ user, setUser, userId }}>
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
