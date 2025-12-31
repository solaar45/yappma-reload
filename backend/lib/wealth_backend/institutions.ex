defmodule WealthBackend.Institutions do
  @moduledoc """
  The Institutions context.
  """

  import Ecto.Query, warn: false
  alias WealthBackend.Repo
  alias WealthBackend.Institutions.Institution

  @doc """
  Returns the list of institutions for a given user.

  ## Examples

      iex> list_institutions(user_id)
      [%Institution{}, ...]

  """
  def list_institutions(user_id) do
    Institution
    |> where([i], i.user_id == ^user_id)
    |> order_by([i], i.name)
    |> Repo.all()
  end

  @doc """
  Gets a single institution.

  Raises `Ecto.NoResultsError` if the Institution does not exist.

  ## Examples

      iex> get_institution!(123)
      %Institution{}

      iex> get_institution!(456)
      ** (Ecto.NoResultsError)

  """
  def get_institution!(id), do: Repo.get!(Institution, id)

  @doc """
  Gets a single institution for a specific user.

  Returns nil if the Institution does not exist or doesn't belong to user.

  ## Examples

      iex> get_institution_by_user(123, 1)
      %Institution{}

      iex> get_institution_by_user(456, 1)
      nil

  """
  def get_institution_by_user(id, user_id) do
    Institution
    |> where([i], i.id == ^id and i.user_id == ^user_id)
    |> Repo.one()
  end

  @doc """
  Creates a institution.

  ## Examples

      iex> create_institution(%{field: value})
      {:ok, %Institution{}}

      iex> create_institution(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_institution(attrs \\ %{}) do
    %Institution{}
    |> Institution.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a institution.

  ## Examples

      iex> update_institution(institution, %{field: new_value})
      {:ok, %Institution{}}

      iex> update_institution(institution, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_institution(%Institution{} = institution, attrs) do
    institution
    |> Institution.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a institution.

  ## Examples

      iex> delete_institution(institution)
      {:ok, %Institution{}}

      iex> delete_institution(institution)
      {:error, %Ecto.Changeset{}}

  """
  def delete_institution(%Institution{} = institution) do
    Repo.delete(institution)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking institution changes.

  ## Examples

      iex> change_institution(institution)
      %Ecto.Changeset{data: %Institution{}}

  """
  def change_institution(%Institution{} = institution, attrs \\ %{}) do
    Institution.changeset(institution, attrs)
  end
end
