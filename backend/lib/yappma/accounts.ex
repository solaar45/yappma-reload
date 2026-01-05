defmodule Yappma.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Yappma.Repo
  alias Yappma.Accounts.{User, Institution, Account, BankConsent}
  alias Yappma.Analytics.AccountSnapshot

  ## Users

  def list_users do
    Repo.all(User)
  end

  def get_user!(id), do: Repo.get!(User, id)

  # Added authentication stub (from Auth TODO suggestion, useful to have)
  def get_user(id), do: Repo.get(User, id)

  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  # Added helper for Auth
  def authenticate_user(_email, _password) do
    # TODO: Implement real auth
    {:error, :not_implemented}
  end

  ## Institutions

  def list_institutions(user_id) do
    Institution
    |> where([i], i.user_id == ^user_id)
    |> Repo.all()
  end

  def get_institution!(id), do: Repo.get!(Institution, id)

  def create_institution(attrs \\ %{}) do
    %Institution{}
    |> Institution.changeset(attrs)
    |> Repo.insert()
  end

  def update_institution(%Institution{} = institution, attrs) do
    institution
    |> Institution.changeset(attrs)
    |> Repo.update()
  end

  def delete_institution(%Institution{} = institution) do
    Repo.delete(institution)
  end

  ## Accounts

  def list_accounts(user_id) do
    snapshots_query = from s in AccountSnapshot, order_by: [desc: s.snapshot_date]

    Account
    |> where([a], a.user_id == ^user_id)
    |> preload([:institution, :bank_consent, snapshots: ^snapshots_query])
    |> Repo.all()
  end

  def get_account!(id) do
    snapshots_query = from s in AccountSnapshot, order_by: [desc: s.snapshot_date]

    Account
    |> preload([:institution, :bank_consent, snapshots: ^snapshots_query])
    |> Repo.get!(id)
  end

  def create_account(attrs \\ %{}) do
    %Account{}
    |> Account.changeset(attrs)
    |> Repo.insert()
  end

  def update_account(%Account{} = account, attrs) do
    account
    |> Account.changeset(attrs)
    |> Repo.update()
  end

  def delete_account(%Account{} = account) do
    Repo.delete(account)
  end
  
  ## Bank Consents (delegated or direct access if needed, but mostly handled by BankConnections context)
  
  def get_bank_consent!(id), do: Repo.get!(BankConsent, id)
end
