defmodule WealthBackend.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Accounts.{User, Institution, Account}

  ## Users

  def list_users do
    Repo.all(User)
  end

  def get_user!(id), do: Repo.get!(User, id)

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
    Account
    |> where([a], a.user_id == ^user_id)
    |> preload(:institution)
    |> Repo.all()
  end

  def get_account!(id) do
    Account
    |> preload(:institution)
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
end
