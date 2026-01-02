defmodule WealthBackend.Vault do
  @moduledoc """
  Cloak Vault for encrypting sensitive data at rest.
  Uses AES-GCM encryption with 256-bit keys.
  """
  use Cloak.Vault, otp_app: :wealth_backend
end
