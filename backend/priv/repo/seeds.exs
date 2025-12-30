# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#

alias WealthBackend.Repo
alias WealthBackend.Accounts.{User, Institution, Account}
alias WealthBackend.Portfolio.AssetType

# Clear existing data (only for development!)
Repo.delete_all(Account)
Repo.delete_all(Institution)
Repo.delete_all(AssetType)
Repo.delete_all(User)

# Create Asset Types
asset_types = [
  %{code: "cash", description: "Cash and equivalents"},
  %{code: "security", description: "Securities (stocks, ETFs, bonds)"},
  %{code: "insurance", description: "Insurance policies"},
  %{code: "loan", description: "Loans and debts"},
  %{code: "real_estate", description: "Real estate properties"},
  %{code: "other", description: "Other assets"}
]

IO.puts("Creating asset types...")
Enum.each(asset_types, fn attrs ->
  %AssetType{}
  |> AssetType.changeset(attrs)
  |> Repo.insert!()
end)

# Create test user
IO.puts("Creating test user...")
user = %User{}
  |> User.changeset(%{
    name: "Test User",
    email: "test@example.com",
    currency_default: "EUR"
  })
  |> Repo.insert!()

# Create test institution
IO.puts("Creating test institution...")
institution = %Institution{}
  |> Institution.changeset(%{
    name: "Deutsche Bank",
    type: :bank,
    country: "DE",
    user_id: user.id
  })
  |> Repo.insert!()

# Create test accounts
IO.puts("Creating test accounts...")
%Account{}
  |> Account.changeset(%{
    name: "Girokonto",
    type: :checking,
    currency: "EUR",
    is_active: true,
    user_id: user.id,
    institution_id: institution.id
  })
  |> Repo.insert!()

%Account{}
  |> Account.changeset(%{
    name: "Depot",
    type: :brokerage,
    currency: "EUR",
    is_active: true,
    user_id: user.id,
    institution_id: institution.id
  })
  |> Repo.insert!()

IO.puts("Seeds completed!")
IO.puts("Test user: #{user.email} (ID: #{user.id})")
