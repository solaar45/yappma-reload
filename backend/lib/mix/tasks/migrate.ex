defmodule Mix.Tasks.App.Migrate do
  @moduledoc "Run database migrations"
  @shortdoc "Run database migrations"

  use Mix.Task

  @requirements ["app.config"]

  def run(_args) do
    WealthBackend.Release.migrate()
  end
end
