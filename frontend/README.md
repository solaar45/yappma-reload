# YAPPMA Frontend

## Development Setup

### Prerequisites
- Node.js 18+
- Backend running on `localhost:4000`

### Installation
```bash
npm install
```

### Required Dependencies

If you encounter missing dependencies errors, install these packages:

```bash
# React Query for data fetching and caching
npm install @tanstack/react-query

# Shadcn/UI components (if not already installed)
npx shadcn@latest add scroll-area
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add button
```

### Environment Variables

Create `.env.development` (already included):
```
VITE_API_BASE_URL=http://localhost:4000/api
```

For production, `.env.production`:
```
VITE_API_BASE_URL=/api
```

### Run Development Server
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Integration

The frontend connects to the Elixir/Phoenix backend via REST API.

#### API Client
Location: `src/lib/api/client.ts`

Base URL configured via `VITE_API_BASE_URL` environment variable.

#### TypeScript Types
Location: `src/lib/api/types.ts`

All backend API types are defined (User, Account, Asset, Snapshots, etc.)

#### React Hooks
Location: `src/lib/api/hooks/`

- `useDashboard(userId, date?)` - Fetch net worth + snapshots
- `useAccounts(userId)` - Fetch user accounts
- `useAssets(userId)` - Fetch user assets
- `useBankConnections()` - PSD2 bank connection hooks

#### Usage Example

```tsx
import { useDashboard } from '@/lib/api/hooks';
import { formatCurrency } from '@/lib/formatters';

function Dashboard() {
  const { netWorth, loading, error } = useDashboard({ userId: 1 });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Net Worth: {formatCurrency(netWorth.total)}</h1>
    </div>
  );
}
```

### PSD2 Bank Connections

The frontend includes full support for PSD2 bank integrations via Styx API.

#### Bank Connection Features

- **Bank Selection**: Browse and search available banks (ASPSPs)
- **Consent Management**: Create, authorize, and manage bank consents
- **Account Sync**: Fetch and sync bank accounts and transactions
- **OAuth Flow**: Handle OAuth2 authorization callbacks

#### Bank Connections API

The `apiClient` includes a `bankConnections` namespace with methods:

```typescript
import { apiClient } from '@/lib/api/client';

// List all available banks
const banks = await apiClient.bankConnections.listBanks();

// Create a new consent
const consent = await apiClient.bankConnections.createConsent({
  aspspId: 'BANK_ID',
  redirectUrl: 'http://localhost:5173/bank-callback'
});

// Complete consent after authorization
await apiClient.bankConnections.completeConsent({
  consentId: consent.consent_id,
  authorizationCode: 'AUTH_CODE'
});

// List user's consents
const consents = await apiClient.bankConnections.listConsents();

// Sync accounts
await apiClient.bankConnections.syncAccounts(consentId);
```

#### React Hooks for Bank Connections

Location: `src/lib/api/hooks/useBankConnections.ts`

```typescript
import { useBanks, useConsents, useCreateConsent } from '@/lib/api/hooks/useBankConnections';

function BankConnectionsPage() {
  const { data: banks, isLoading } = useBanks();
  const { data: consents } = useConsents();
  const createConsent = useCreateConsent();

  // Use the hooks...
}
```

#### Bank Callback Page

The `BankCallback` component (`src/pages/BankCallback.tsx`) handles OAuth2 callbacks:

- Processes authorization codes from bank redirects
- Completes consent flow
- Handles mock mode for testing without Styx
- Notifies parent window via `postMessage`

### CORS Setup (Backend)

Make sure your Phoenix backend allows CORS from `localhost:5173`.

In `backend/config/dev.exs`, add:
```elixir
config :cors_plug,
  origin: ["http://localhost:5173"],
  max_age: 86400,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
```

And in `backend/lib/yappma_web/endpoint.ex`:
```elixir
plug CORSPlug
```

### Build for Production
```bash
npm run build
```

Output: `dist/` folder

### Tech Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui components
- Recharts (for charts)
- TanStack Query (React Query) for data fetching

## Project Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # API client with bank connections
│   │   ├── types.ts           # TypeScript types for API
│   │   └── hooks/             # React hooks for data fetching
│   │       ├── useDashboard.ts
│   │       ├── useAccounts.ts
│   │       ├── useAssets.ts
│   │       └── useBankConnections.ts  # PSD2 hooks
│   ├── formatters.ts          # Utility functions (currency, dates)
│   └── utils.ts               # cn() helper
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── bank-connections/      # PSD2 components
│   │   ├── BankSelectionDialog.tsx
│   │   ├── ConsentsList.tsx
│   │   └── BankAccountsList.tsx
│   ├── theme-provider.tsx     # Dark mode provider
│   └── theme-toggle.tsx       # Theme toggle button
├── pages/
│   ├── BankCallback.tsx       # OAuth callback handler
│   └── BankConnectionsPage.tsx # Main bank connections page
├── App.tsx                    # Main app component
├── main.tsx                   # Entry point
└── index.css                  # Tailwind + Theme variables
```

## API Integration Status

✅ API Client implemented  
✅ TypeScript types defined  
✅ React hooks created  
✅ Environment config setup  
✅ PSD2 Bank Connections integrated  
✅ OAuth callback flow  
⏳ Dashboard integration (next step)  
⏳ Accounts page (next step)  
⏳ Assets page (next step)  

## Common Issues

### Missing Dependencies Error

If you see errors about `@tanstack/react-query` or UI components:

```bash
npm install @tanstack/react-query
npx shadcn@latest add scroll-area
```

### Import Errors

Make sure all imports use the consolidated `apiClient`:

```typescript
// ✅ Correct
import { apiClient } from '@/lib/api/client';
await apiClient.bankConnections.completeConsent({...});

// ❌ Wrong (deprecated)
import { completeConsent } from '@/lib/api/bankConnections';
```

## Notes

- `index.css` and `App.tsx` structure remain unchanged as per requirements
- API layer is modular and can be extended easily
- All API calls use proper TypeScript types
- Error handling included in all hooks
- Bank connections use OAuth2 flow with popup windows
- Mock mode available for testing without Styx backend