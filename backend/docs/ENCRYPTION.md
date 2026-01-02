# Encryption Setup

YAPPMA uses [Cloak](https://github.com/danielberkompas/cloak_ecto) for field-level encryption of sensitive data.

## Architecture

### Encrypted Fields

- `bank_connections.pin_encrypted` - FinTS PIN codes

### How It Works

1. **Vault Module** (`WealthBackend.Vault`)
   - Manages encryption/decryption
   - Uses AES-GCM cipher (256-bit)
   - Started in Application supervisor

2. **Ecto Type** (`WealthBackend.Encrypted.Binary`)
   - Custom Ecto type for encrypted fields
   - Automatically encrypts on write
   - Automatically decrypts on read

3. **Database Storage**
   - Stored as `:binary` in Postgres
   - Encrypted data is opaque to database

## Configuration

### Development

Static key in `config/dev.exs` (safe to commit):

```elixir
config :wealth_backend, WealthBackend.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1",
      key: Base.decode64!("rqHF3SbCbmD3sL3oHxVbBRJNq4BhVQ2w5yLXUgT6pqM=")
    }
  ]
```

### Test

Static key in `config/test.exs` (safe to commit):

```elixir
config :wealth_backend, WealthBackend.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1",
      key: Base.decode64!("qsL3oHxVbBRJNq4BhVQ2w5yLXUgT6pqMrqHF3SbCbmE=")
    }
  ]
```

### Production

**CRITICAL**: Production key must be loaded from environment variable!

1. **Generate a secure key**:

   ```bash
   # In backend directory
   mix cloak.gen.secret
   ```

   This outputs a base64-encoded 32-byte key.

2. **Set environment variable**:

   ```bash
   export CLOAK_KEY="your-generated-key-here"
   ```

3. **Runtime config** (`config/runtime.exs`):

   ```elixir
   cloak_key =
     System.get_env("CLOAK_KEY") ||
       raise """
       environment variable CLOAK_KEY is missing.
       You can generate one by running:
       
         mix cloak.gen.secret
       
       Then set it as an environment variable.
       """

   config :wealth_backend, WealthBackend.Vault,
     ciphers: [
       default: {Cloak.Ciphers.AES.GCM, tag: "AES.GCM.V1", key: Base.decode64!(cloak_key)}
     ]
   ```

## Usage

### In Schema

```elixir
schema "bank_connections" do
  field :pin_encrypted, WealthBackend.Encrypted.Binary
  field :pin, :string, virtual: true  # For input only
end

def changeset(bank_connection, attrs) do
  bank_connection
  |> cast(attrs, [:pin])
  |> put_change(:pin_encrypted, get_change(changeset, :pin))
end
```

### Reading Encrypted Data

```elixir
# Automatic decryption
bank_connection = Repo.get!(BankConnection, id)
pin = bank_connection.pin_encrypted  # Returns decrypted string
```

## Security Best Practices

1. ✅ **Never commit production keys**
2. ✅ **Use different keys for dev/test/prod**
3. ✅ **Rotate keys periodically** (requires data re-encryption)
4. ✅ **Store keys in secure vault** (e.g., AWS Secrets Manager, Vault)
5. ✅ **Use strong random keys** (32 bytes minimum)

## Key Rotation

To rotate encryption keys:

1. Add new cipher to config with different tag:

   ```elixir
   ciphers: [
     default: {Cloak.Ciphers.AES.GCM, tag: "AES.GCM.V2", key: new_key},
     {Cloak.Ciphers.AES.GCM, tag: "AES.GCM.V1", key: old_key}
   ]
   ```

2. Run migration to re-encrypt data:

   ```elixir
   Cloak.Vault.migrate(WealthBackend.Vault)
   ```

3. Remove old cipher after all data migrated

## Troubleshooting

### "decryption failed" errors

- Key mismatch between encryption and decryption
- Verify `CLOAK_KEY` environment variable
- Check database contains encrypted data, not plaintext

### "vault not started" errors

- Ensure `WealthBackend.Vault` in Application supervisor
- Check config is loaded correctly

## References

- [Cloak Documentation](https://hexdocs.pm/cloak_ecto/readme.html)
- [AES-GCM Cipher](https://hexdocs.pm/cloak/Cloak.Ciphers.AES.GCM.html)
