defmodule WealthBackend.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      WealthBackend.Repo,
      WealthBackendWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:wealth_backend, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: WealthBackend.PubSub},
      WealthBackendWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: WealthBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    WealthBackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
