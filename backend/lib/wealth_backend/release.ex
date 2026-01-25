defmodule WealthBackend.Release do
  @moduledoc """
  Used for executing DB release tasks when run in production without Mix installed.
  """
  @app :wealth_backend

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end

    seed_system_data()
  end

  def seed_system_data do
    load_app()

    for repo <- repos() do
      {:ok, _, _} =
        Ecto.Migrator.with_repo(repo, fn repo ->
          # 1. Seed Asset Types
          for attrs <- WealthBackend.SystemData.asset_types() do
            case repo.get_by(WealthBackend.Portfolio.AssetType, code: attrs.code) do
              nil ->
                %WealthBackend.Portfolio.AssetType{}
                |> WealthBackend.Portfolio.AssetType.changeset(attrs)
                |> repo.insert!()

              _type ->
                :ok
            end
          end

          # 2. Seed/Update Institutions
          for attrs <- WealthBackend.SystemData.institutions() do
            attrs = Map.put(attrs, :is_system_provided, true)

            case repo.get_by(WealthBackend.Institutions.Institution,
                   name: attrs.name,
                   is_system_provided: true
                 ) do
              nil ->
                %WealthBackend.Institutions.Institution{}
                |> WealthBackend.Institutions.Institution.changeset(attrs)
                |> repo.insert!()

              institution ->
                # Update existing institution to ensure website is present
                institution
                |> WealthBackend.Institutions.Institution.changeset(attrs)
                |> repo.update!()
            end
          end
        end)
    end
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end
end
