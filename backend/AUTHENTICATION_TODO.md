# 🔐 Authentication TODO

## Current State
Die Backend-Controller verwenden aktuell einen **Hardcoded Default User** (`user_id = 1`).

## Problem
Die `index/2` Funktionen in den Controllern haben von:
```elixir
def index(conn, %{"user_id" => user_id}) do
```

zu:
```elixir
def index(conn, params) do
  user_id = Map.get(params, "user_id", @default_user_id)
end
```

geändert, um die Frontend-Requests zu akzeptieren.

## ⚠️ Security Issue
Dies ist **NICHT production-ready**! Jeder kann auf alle Daten zugreifen.

---

## ✅ Proper Authentication Implementation

### Option 1: JWT Token Authentication (Empfohlen)

#### 1. Add Guardian Dependency
```elixir
# mix.exs
defp deps do
  [
    {:guardian, "~> 2.3"},
    {:bcrypt_elixir, "~> 3.0"}
  ]
end
```

#### 2. Create Guardian Implementation
```elixir
# lib/wealth_backend/guardian.ex
defmodule WealthBackend.Guardian do
  use Guardian, otp_app: :wealth_backend

  def subject_for_token(%{id: id}, _claims) do
    {:ok, to_string(id)}
  end

  def resource_from_claims(%{"sub" => id}) do
    case WealthBackend.Accounts.get_user(id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end
end
```

#### 3. Create Authentication Plug
```elixir
# lib/wealth_backend_web/plugs/auth_plug.ex
defmodule WealthBackendWeb.AuthPlug do
  import Plug.Conn
  
  def init(opts), do: opts
  
  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- WealthBackend.Guardian.decode_and_verify(token),
         {:ok, user} <- WealthBackend.Guardian.resource_from_claims(claims) do
      assign(conn, :current_user, user)
    else
      _ -> 
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "Unauthorized"})
        |> halt()
    end
  end
end
```

#### 4. Update Router
```elixir
# lib/wealth_backend_web/router.ex
pipeline :api do
  plug :accepts, ["json"]
  plug WealthBackendWeb.AuthPlug  # Add this
end

scope "/api", WealthBackendWeb do
  pipe_through :api
  
  # Public routes (no auth)
  post "/auth/login", AuthController, :login
  post "/auth/register", AuthController, :register
  
  # Protected routes (require auth)
  resources "/accounts", AccountController, except: [:new, :edit]
  resources "/assets", AssetController, except: [:new, :edit]
  resources "/institutions", InstitutionController, except: [:new, :edit]
end
```

#### 5. Update Controllers
```elixir
# Example: account_controller.ex
defmodule WealthBackendWeb.AccountController do
  use WealthBackendWeb, :controller
  
  def index(conn, _params) do
    # Get user_id from authenticated user
    user_id = conn.assigns.current_user.id
    accounts = Accounts.list_accounts(user_id)
    render(conn, :index, accounts: accounts)
  end
end
```

#### 6. Create Auth Controller
```elixir
# lib/wealth_backend_web/controllers/auth_controller.ex
defmodule WealthBackendWeb.AuthController do
  use WealthBackendWeb, :controller
  
  alias WealthBackend.Accounts
  alias WealthBackend.Guardian
  
  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)
        
        conn
        |> put_status(:ok)
        |> json(%{
          token: token,
          user: %{
            id: user.id,
            email: user.email,
            name: user.name
          }
        })
      
      {:error, :unauthorized} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
    end
  end
  
  def register(conn, %{"user" => user_params}) do
    case Accounts.create_user(user_params) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)
        
        conn
        |> put_status(:created)
        |> json(%{
          token: token,
          user: %{
            id: user.id,
            email: user.email,
            name: user.name
          }
        })
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: changeset})
    end
  end
end
```

---

### Option 2: Session-Based Authentication

#### 1. Configure Session
```elixir
# lib/wealth_backend_web/endpoint.ex
plug Plug.Session,
  store: :cookie,
  key: "_wealth_backend_key",
  signing_salt: "random_signing_salt"
```

#### 2. Create Session Plug
```elixir
defmodule WealthBackendWeb.RequireAuth do
  import Plug.Conn
  import Phoenix.Controller
  
  def init(opts), do: opts
  
  def call(conn, _opts) do
    if user_id = get_session(conn, :user_id) do
      user = WealthBackend.Accounts.get_user!(user_id)
      assign(conn, :current_user, user)
    else
      conn
      |> put_status(:unauthorized)
      |> json(%{error: "Authentication required"})
      |> halt()
    end
  end
end
```

---

## 🎯 Implementation Steps

### Phase 1: Basic Auth (This Week)
- [ ] Install Guardian
- [ ] Create Guardian module
- [ ] Create AuthPlug
- [ ] Create AuthController
- [ ] Update Router

### Phase 2: User Management (Next Week)
- [ ] Create User schema
- [ ] Create User context
- [ ] Add password hashing
- [ ] Add user registration

### Phase 3: Frontend Integration (Week After)
- [ ] Create login page
- [ ] Store JWT in localStorage
- [ ] Add Authorization header to API client
- [ ] Handle token expiry

---

## 📝 Frontend Changes Required

```typescript
// After login, store token
localStorage.setItem('auth_token', token);

// Update API client
class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeader(),
      ...options.headers
    };
    
    const response = await fetch(`${this.baseURL}/${endpoint}`, {
      ...options,
      headers
    });
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new ApiError(401, 'Unauthorized');
    }
    
    return response.json();
  }
}
```

---

## 🔒 Security Best Practices

1. **Token Storage**: Use httpOnly cookies statt localStorage (XSS protection)
2. **Token Expiry**: Set reasonable expiry times (15min access, 7d refresh)
3. **HTTPS Only**: Enforce HTTPS in production
4. **CORS**: Configure proper CORS headers
5. **Rate Limiting**: Add rate limiting to auth endpoints
6. **Password Policy**: Enforce strong passwords
7. **2FA**: Consider adding 2FA for sensitive accounts

---

## 📚 Resources

- [Guardian Documentation](https://hexdocs.pm/guardian/Guardian.html)
- [Phoenix Authentication Guide](https://hexdocs.pm/phoenix/authentication.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Status**: 🔴 Not Implemented  
**Priority**: 🔥 High (Required for Production)  
**Estimated Effort**: 2-3 days
