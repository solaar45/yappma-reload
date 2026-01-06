import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/lib/api/types';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  userId: number | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return (
    <UserContext.Provider value={{ user, setUser: () => { }, userId }}>
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
