# YAPPMA Frontend

## Development Setup

### Prerequisites
- Node.js 18+
- Backend running on `localhost:4000`

### Installation
```bash
npm install
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

## Project Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # API client (fetch wrapper)
│   │   ├── types.ts           # TypeScript types for API
│   │   └── hooks/             # React hooks for data fetching
│   │       ├── useDashboard.ts
│   │       ├── useAccounts.ts
│   │       └── useAssets.ts
│   ├── formatters.ts          # Utility functions (currency, dates)
│   └── utils.ts               # cn() helper
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── theme-provider.tsx     # Dark mode provider
│   └── theme-toggle.tsx       # Theme toggle button
├── App.tsx                    # Main app component
├── main.tsx                   # Entry point
└── index.css                  # Tailwind + Theme variables
```

## API Integration Status

✅ API Client implemented  
✅ TypeScript types defined  
✅ React hooks created  
✅ Environment config setup  
⏳ Dashboard integration (next step)  
⏳ Accounts page (next step)  
⏳ Assets page (next step)  

## Notes

- `index.css` and `App.tsx` structure remain unchanged as per requirements
- API layer is modular and can be extended easily
- All API calls use proper TypeScript types
- Error handling included in all hooks