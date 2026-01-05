defmodule Yappma.Repo.Migrations.AddPsd2FieldsToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      # Only add fields that don't exist yet
      add_if_not_exists :bic, :string
      add_if_not_exists :bank_name, :string
      add_if_not_exists :account_product, :string
    end
  end
end
