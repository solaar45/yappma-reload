defmodule Yappma.BankConnections.ConsentManager do
  @moduledoc """
  Manages bank consents - creation, storage, and lifecycle.
  """

  alias Yappma.Repo
  alias Yappma.Accounts.{BankConsent, User}
  import Ecto.Query
  require Logger

  @doc """
  Creates or updates a consent in the database.
  """
  def upsert_consent(attrs) do
    external_id = attrs[:external_id] || attrs["external_id"]

    # Try to find existing consent by external_id
    existing_consent =
      if external_id do
        Repo.one(from c in BankConsent, where: c.external_id == ^external_id)
      else
        nil
      end

    if existing_consent do
      # Update existing
      existing_consent
      |> BankConsent.changeset(attrs)
      |> Repo.update()
    else
      # Create new
      %BankConsent{}
      |> BankConsent.changeset(attrs)
      |> Repo.insert()
    end
  end

  @doc """
  Gets a consent by external_id (Styx consent ID) or internal DB id.
  """
  def get_consent(id) when is_binary(id) do
    # Try as external_id first
    case Repo.one(from c in BankConsent, where: c.external_id == ^id) do
      nil ->
        # Try as integer ID
        case Integer.parse(id) do
          {int_id, ""} -> Repo.get(BankConsent, int_id)
          _ -> nil
        end

      consent ->
        consent
    end
  end

  def get_consent(id) when is_integer(id) do
    Repo.get(BankConsent, id)
  end

  @doc """
  Gets consent ID (internal DB ID) from external_id or creates a mock consent.
  """
  def get_or_create_consent_id(external_id, user_id, attrs \\ %{}) when is_binary(external_id) do
    # Ensure user_id is an integer - create test user if needed
    real_user_id = ensure_user_id(user_id)

    case get_consent(external_id) do
      nil ->
        # Create mock consent for development
        consent_attrs =
          attrs
          |> Map.put(:external_id, external_id)
          |> Map.put(:user_id, real_user_id)
          |> Map.put_new(:aspsp_id, "MOCK_BANK")
          |> Map.put_new(:status, "authorized")
          |> Map.put_new(:valid_until, DateTime.add(DateTime.utc_now(), 90, :day))

        Logger.debug("Creating mock consent with attrs: #{inspect(consent_attrs)}")

        case upsert_consent(consent_attrs) do
          {:ok, consent} ->
            {:ok, consent.id}

          {:error, changeset} ->
            Logger.error("Failed to create consent: #{inspect(changeset.errors)}")
            {:error, changeset}
        end

      consent ->
        {:ok, consent.id}
    end
  end

  # Ensures we have a valid user_id (integer)
  defp ensure_user_id(user_id) when is_integer(user_id), do: user_id

  defp ensure_user_id(user_id) when is_binary(user_id) do
    # Try to parse as integer
    case Integer.parse(user_id) do
      {int_id, ""} ->
        int_id

      _ ->
        # Create or get test user
        get_or_create_test_user(user_id)
    end
  end

  defp get_or_create_test_user(external_id) do
    case Repo.one(from u in User, where: u.email == ^"test@example.com") do
      nil ->
        # Create test user
        {:ok, user} =
          %User{}
          |> User.changeset(%{
            email: "test@example.com",
            username: "testuser",
            password: "test123456"
          })
          |> Repo.insert()

        Logger.info("Created test user with ID: #{user.id}")
        user.id

      user ->
        user.id
    end
  end

  @doc """
  Lists all consents for a user.
  """
  def list_user_consents(user_id) do
    Repo.all(
      from c in BankConsent,
        where: c.user_id == ^user_id,
        order_by: [desc: c.inserted_at]
    )
  end

  @doc """
  Updates consent status.
  """
  def update_consent_status(consent_id, status)
      when status in ["pending", "authorized", "expired", "revoked"] do
    case get_consent(consent_id) do
      nil ->
        {:error, :not_found}

      consent ->
        consent
        |> BankConsent.changeset(%{status: status})
        |> Repo.update()
    end
  end

  @doc """
  Marks consent as revoked.
  """
  def revoke_consent(consent_id) do
    update_consent_status(consent_id, "revoked")
  end
end
