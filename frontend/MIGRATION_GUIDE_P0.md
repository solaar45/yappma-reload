# 🔄 P0 Migration Guide

## Überblick

Diese Anleitung zeigt dir, wie du die bestehenden Hooks und Components auf die neuen P0-Fixes migrierst.

---

## ✅ Was wurde implementiert?

### 1. ErrorBoundary Component
- Fängt React Errors ab
- Zeigt benutzerfreundliche Error UI
- Logging in Entwicklung und Produktion
- **Bereits integriert in App.tsx** ✅

### 2. API Client mit AbortController
- Automatische Request-Cancellation
- Rate Limiting
- Input Sanitization
- CSRF Token Support
- Request Deduplication

### 3. Logger Utility
- Ersetzt `console.log`
- Nur Errors/Warnings in Production
- Styled output in Development
- Log storage in memory

---

## 📝 Migration Steps

### Step 1: Aktualisiere alle Hooks mit AbortController

#### ❌ VORHER (Ohne Cleanup)
```typescript
import { useState, useEffect } from 'react';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data.data);
      setLoading(false);
    }
    fetchAccounts();
  }, []);

  return { accounts, loading };
}
```

#### ✅ NACHHER (Mit AbortController & Error Handling)
```typescript
import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account } from '@/lib/api/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchAccounts() {
      try {
        setIsLoading(true);
        setError(null);

        logger.debug('Fetching accounts...');
        
        const response = await apiClient.get<{ data: Account[] }>('accounts', {
          signal: controller.signal,
        });

        if (isMounted) {
          setAccounts(response.data);
          logger.info('Accounts loaded', { count: response.data.length });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Accounts fetch cancelled');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError 
            ? err 
            : new Error('Failed to fetch accounts');
          setError(error);
          logger.error('Failed to fetch accounts', { error });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAccounts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { accounts, isLoading, error };
}
```

---

### Step 2: Ersetze console.log mit Logger

#### ❌ VORHER
```typescript
console.log('User logged in:', user);
console.error('Failed to save:', error);
```

#### ✅ NACHHER
```typescript
import { logger } from '@/lib/logger';

logger.debug('User logged in:', user);  // Nur in Development
logger.info('Data saved successfully');  // Nur in Development
logger.warn('Deprecated API used');      // Immer angezeigt
logger.error('Failed to save:', error);  // Immer angezeigt
```

---

### Step 3: Komponenten mit Loading/Error States

#### ❌ VORHER (Keine States)
```typescript
function AccountsList() {
  const { accounts } = useAccounts();
  
  return (
    <div>
      {accounts.map(account => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
```

#### ✅ NACHHER (Mit Loading/Error/Empty States)
```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function AccountsList() {
  const { accounts, isLoading, error } = useAccounts();
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load accounts: {error.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  if (accounts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No accounts found. Create your first account to get started.
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {accounts.map(account => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
```

---

## 🔧 Alle bestehenden Hooks migrieren

### Hooks die angepasst werden müssen:

1. ✅ **useAccounts.ts** - Bereits aktualisiert!
2. ✅ **useCreateAccount.ts** - Bereits aktualisiert!
3. ⚠️ **useAssets.ts** - Muss migriert werden
4. ⚠️ **useSnapshots.ts** - Muss migriert werden
5. ⚠️ **useInstitutions.ts** - Muss migriert werden
6. ⚠️ **useDashboard.ts** - Muss migriert werden
7. ⚠️ **useUpdateAccount.ts** - Muss migriert werden
8. ⚠️ **useDeleteAccount.ts** - Muss migriert werden

### Template für alle GET Hooks:

```typescript
import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export function use[ResourceName]() {
  const [data, setData] = useState<YourType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiClient.get<ResponseType>('endpoint', {
          signal: controller.signal,
        });

        if (isMounted) {
          setData(response.data);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          setError(err instanceof ApiError ? err : new Error('Failed'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { data, isLoading, error };
}
```

### Template für alle Mutation Hooks (POST/PUT/DELETE):

```typescript
import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export function useMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: InputType): Promise<OutputType> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.post<ResponseType>('endpoint', data);
      return response.data;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}
```

---

## 🎯 Nächste Schritte

### Priorität 1 (Heute):
- [ ] Migriere alle verbleibenden Hooks (siehe Liste oben)
- [ ] Suche nach `console.log` und ersetze mit `logger`
- [ ] Teste alle Komponenten mit Loading/Error States

### Priorität 2 (Diese Woche):
- [ ] Füge Error Boundaries um kritische Komponenten hinzu
- [ ] Teste Request Cancellation (Navigation während Loading)
- [ ] Überprüfe alle API Calls auf Input Sanitization

### Priorität 3 (Nächste Woche):
- [ ] Integration mit Error Tracking Service (Sentry, etc.)
- [ ] Performance Testing mit vielen Requests
- [ ] E2E Tests für Error Scenarios

---

## 🔍 Testing

### Test 1: Request Cancellation
```typescript
// Schnell zwischen Seiten navigieren
// Requests sollten automatisch abgebrochen werden
// Keine Memory Leaks in React DevTools
```

### Test 2: Error Handling
```typescript
// Backend stoppen → Error State sollte angezeigt werden
// Network Tab sollte Failed Requests zeigen
// Console sollte strukturierte Errors loggen
```

### Test 3: Loading States
```typescript
// Network Throttling aktivieren (Slow 3G)
// Skeleton/Spinner sollten sichtbar sein
// UI sollte nicht "springen" beim Laden
```

---

## 🚨 Häufige Fehler vermeiden

### ❌ Vergessen: isMounted Check
```typescript
// BAD: setState nach unmount
const data = await fetch(...);
setData(data); // Component könnte bereits unmounted sein!
```

### ✅ Richtig: Mit isMounted Guard
```typescript
let isMounted = true;
const data = await fetch(...);
if (isMounted) {
  setData(data);
}
return () => { isMounted = false; };
```

### ❌ Vergessen: AbortController Cleanup
```typescript
// BAD: Keine Cleanup Function
useEffect(() => {
  fetchData();
}, []); // Request läuft weiter nach unmount!
```

### ✅ Richtig: Mit Cleanup
```typescript
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal });
  return () => controller.abort();
}, []);
```

---

## 📚 Resources

- [AbortController MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React useEffect Cleanup](https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed)

---

**Migration Guide Ende** | Erstellt am 2025-12-31
