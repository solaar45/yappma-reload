defmodule WealthBackend.Encrypted.Binary do
  @moduledoc """
  Custom Ecto type for encrypting binary data using Cloak.
  """
  use Cloak.Ecto.Binary, vault: WealthBackend.Vault
end
