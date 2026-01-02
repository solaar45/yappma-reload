defmodule WealthBackend.Encrypted.Binary do
  @moduledoc """
  Encrypted binary field type using Cloak.
  Automatically encrypts data on write and decrypts on read.
  """

  use Cloak.Ecto.Binary, vault: WealthBackend.Vault
end
