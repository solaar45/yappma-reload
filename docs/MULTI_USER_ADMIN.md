# Multi-User Admin System

This document describes the multi-user system with admin functionality for YAPPMA.

## Overview

YAPPMA now supports multiple users with role-based access control. The system is designed for self-hosted environments where one primary user (admin) manages the application and can create accounts for family members or other users.

## Features

### User Roles

- **Super Admin**: The first registered user. Has full control over the system, cannot be deleted or modified by other admins.
- **Admin**: Can manage other users (create, edit, deactivate, delete), but cannot modify super admin.
- **User**: Standard user with full access to their own portfolio data.
- **Read-Only**: Can view but not edit their own data (optional, for future use).

### Admin Capabilities

- List all users with statistics
- Create new user accounts
- Edit user information (name, email, role, status)
- Reset user passwords
- Deactivate/reactivate user accounts (soft delete)
- Permanently delete users and all their data
- View audit log of all admin actions
- Promote users to admin (super admin only)
- Demote admins to regular users (super admin only)

### Security Features

- **Password Requirements**: 16+ characters with uppercase, lowercase, numbers, and special characters
- **Login Tracking**: Last login time and login count
- **Force Password Change**: After admin reset, user must change password on next login
- **Active User Check**: Deactivated users cannot log in
- **Audit Logging**: All admin actions are logged with IP address and user agent
- **Role Protection**: Super admin cannot be modified or deleted
- **Self-Protection**: Admins cannot modify or delete their own accounts through admin endpoints

## Database Schema

### New User Fields

```elixir
field :role, :string, default: "user"  # user, admin, super_admin, read_only
field :is_active, :boolean, default: true
field :last_login_at, :utc_datetime
field :login_count, :integer, default: 0
field :deactivated_at, :utc_datetime
field :force_password_change, :boolean, default: false

belongs_to :created_by_user, User
belongs_to :deactivated_by_user, User
```

### Audit Log Table

```elixir
schema "audit_logs" do
  belongs_to :admin_user, User
  belongs_to :target_user, User
  field :action, :string
  field :details, :map
  field :ip_address, :string
  field :user_agent, :string
  timestamps(updated_at: false)
end
```

## API Endpoints

### Admin User Management

All admin endpoints require authentication and admin role.

#### List Users
```
GET /api/admin/users
Query params: ?role=admin&active=true
Response: { data: [{ id, email, name, role, is_active, stats, ... }] }
```

#### Get User Details
```
GET /api/admin/users/:id
Response: { data: { id, email, name, role, stats: { accounts_count, ... } } }
```

#### Create User
```
POST /api/admin/users
Body: { user: { email, password, name, role } }
Response: { data: { id, email, ... } }
```

#### Update User
```
PATCH /api/admin/users/:id
Body: { user: { name, email, role, is_active } }
Response: { data: { id, email, ... } }
```

#### Reset Password
```
POST /api/admin/users/:id/reset-password
Body: { password: "new_secure_password" }
Response: { message: "Password successfully reset", force_change: true }
```

#### Deactivate User
```
POST /api/admin/users/:id/deactivate
Response: { data: { id, is_active: false, deactivated_at, ... } }
```

#### Reactivate User
```
POST /api/admin/users/:id/reactivate
Response: { data: { id, is_active: true, ... } }
```

#### Delete User (Permanent)
```
DELETE /api/admin/users/:id
Response: 204 No Content
```

#### Promote to Admin (Super Admin Only)
```
POST /api/admin/users/:id/promote-to-admin
Response: { data: { id, role: "admin", ... } }
```

#### Demote to User (Super Admin Only)
```
POST /api/admin/users/:id/demote-to-user
Response: { data: { id, role: "user", ... } }
```

### Admin Dashboard

#### System Statistics
```
GET /api/admin/dashboard/stats
Response: {
  data: {
    total_users: 5,
    active_users: 4,
    inactive_users: 1,
    admin_users: 2,
    recent_logins: 3
  }
}
```

#### Audit Log
```
GET /api/admin/audit-log?limit=50&admin_user_id=1&action=delete_user
Response: {
  data: [{
    id: 1,
    admin_user: { id, email, name },
    target_user: { id, email, name },
    action: "delete_user",
    details: { email: "user@example.com" },
    ip_address: "192.168.1.1",
    inserted_at: "2026-01-24T..."
  }]
}
```

## Migration

To apply the multi-user admin system to your existing YAPPMA installation:

1. **Run the migration**:
   ```bash
   cd backend
   mix ecto.migrate
   ```

2. **First user becomes super admin**:
   The migration automatically promotes the first user (oldest by creation date) to super admin.

3. **New users default to "user" role**:
   All newly registered users will have the "user" role unless created by an admin with a different role.

## Usage Examples

### Creating a Family Account Setup

1. **Existing user becomes super admin** (automatic after migration)
2. **Super admin creates accounts for family members**:
   ```bash
   curl -X POST http://localhost:4000/api/admin/users \
     -H "Content-Type: application/json" \
     -H "Cookie: _wealth_backend_web_user_remember_me=..." \
     -d '{
       "user": {
         "email": "spouse@example.com",
         "password": "SecurePassword123!",
         "name": "Spouse Name",
         "role": "user"
       }
     }'
   ```

3. **Promote spouse to admin** (if desired):
   ```bash
   curl -X POST http://localhost:4000/api/admin/users/2/promote-to-admin \
     -H "Cookie: _wealth_backend_web_user_remember_me=..."
   ```

### Handling User Offboarding

1. **Deactivate account** (soft delete, data preserved):
   ```bash
   curl -X POST http://localhost:4000/api/admin/users/3/deactivate \
     -H "Cookie: _wealth_backend_web_user_remember_me=..."
   ```

2. **Permanent deletion** (after confirmation period):
   ```bash
   curl -X DELETE http://localhost:4000/api/admin/users/3 \
     -H "Cookie: _wealth_backend_web_user_remember_me=..."
   ```

### Password Reset Flow

1. **Admin resets password**:
   ```bash
   curl -X POST http://localhost:4000/api/admin/users/2/reset-password \
     -H "Content-Type: application/json" \
     -H "Cookie: _wealth_backend_web_user_remember_me=..." \
     -d '{ "password": "TemporaryPass123!" }'
   ```

2. **User logs in with temporary password**
3. **User is forced to change password** (via `force_password_change` flag)
4. **User changes password** at `/api/users/settings/update_password`

## Authorization Rules

### Admin Can:
- View all users
- Create new users
- Edit regular users
- Edit other admins (if super admin)
- Reset passwords for other users
- Deactivate/reactivate users
- Delete regular users

### Admin Cannot:
- Modify super admin
- Delete super admin
- Modify their own account through admin endpoints (must use regular user endpoints)
- Delete their own account
- Promote/demote users (unless super admin)

### Super Admin Can:
- Everything an admin can do
- Promote users to admin
- Demote admins to users
- Edit other admins

### Super Admin Cannot:
- Be deleted
- Have role changed
- Be deactivated

## GDPR Compliance

### User Data Deletion

When a user is permanently deleted:
1. All portfolio data is removed (accounts, assets, transactions, institutions, snapshots)
2. User record is deleted
3. Audit log entry is created with anonymized data
4. CASCADE deletes ensure complete data removal

### Audit Trail

All admin actions are logged:
- Who performed the action (admin_user_id)
- What action was performed (action)
- Which user was affected (target_user_id)
- When it happened (inserted_at)
- Additional details (details JSON)
- From where (ip_address, user_agent)

Audit logs are retained for 7 years and user_ids are preserved even after user deletion for compliance.

## Security Considerations

1. **Strong Passwords**: 16+ character requirement ensures security
2. **Login Tracking**: Helps identify suspicious activity
3. **Forced Password Change**: After admin reset, ensures user sets their own password
4. **Audit Logging**: Complete trail of all administrative actions
5. **Role Protection**: Prevents accidental privilege escalation or super admin deletion
6. **Active Status**: Immediate revocation of access for deactivated users

## Future Enhancements

- Rate limiting for login attempts
- Two-factor authentication (2FA)
- Email notifications for admin actions
- User session management (force logout)
- IP-based access control
- Read-only role implementation
- Bulk user operations
- Export user data (GDPR compliance)
- User activity dashboard

## Testing

To test the admin functionality:

1. **Create test users**:
   ```bash
   mix run priv/repo/seeds_admin.exs
   ```

2. **Run tests**:
   ```bash
   mix test test/wealth_backend/admin_test.exs
   mix test test/wealth_backend_web/controllers/admin_test.exs
   ```

## Troubleshooting

### "Admin access required" error
- Ensure your user has "admin" or "super_admin" role
- Check that you're authenticated (valid session cookie)
- Verify the role in the database: `SELECT id, email, role FROM users;`

### "Account has been deactivated" error
- User account is deactivated (is_active = false)
- Contact super admin to reactivate
- Check deactivation details: `SELECT deactivated_at, deactivated_by_user_id FROM users WHERE id = ?;`

### "Cannot modify super admin" error
- Super admin account is protected
- Only super admin can modify other admins
- Use regular user endpoints for self-service changes

## Migration Rollback

If you need to rollback the multi-user admin system:

```bash
cd backend
mix ecto.rollback
```

**Warning**: This will remove all admin-related fields and audit logs. User accounts will remain but role/status information will be lost.
