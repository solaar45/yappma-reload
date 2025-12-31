# WealthBackend

## Development Setup

### Install Dependencies
```bash
mix deps.get
```

### Database Setup
```bash
mix ecto.setup
```

### Start Phoenix Server
```bash
mix phx.server
```

Server runs on `http://localhost:4000`

### CORS Configuration

The backend is configured to accept requests from the frontend running on `http://localhost:5173`.

If you need to add more origins, edit `lib/wealth_backend_web/endpoint.ex`:

```elixir
plug CORSPlug,
  origin: ["http://localhost:5173", "http://other-origin.com"],
  max_age: 86400,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  headers: ["Authorization", "Content-Type", "Accept", "Origin"]
```

## API Documentation

See:
- `REST_API.md` - REST endpoints
- `API_REFERENCE.md` - Context API
- `BACKEND_DOCUMENTATION.md` - Architecture

## Frontend Integration

The React frontend connects to this backend via REST API.

Frontend repo: `../frontend`

### Running Full Stack

**Terminal 1 (Backend):**
```bash
cd backend
mix phx.server
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`