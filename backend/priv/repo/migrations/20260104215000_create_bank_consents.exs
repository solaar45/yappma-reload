defmodule WealthBackend.Repo.Migrations.CreateBankConsents do
  use Ecto.Migration

  def change do
    create table(:bank_consents) do
      add :aspsp_id, :string, null: false
      add :aspsp_name, :string
      add :aspsp_bic, :string
      
      # External consent ID from Styx/Bank
      add :external_id, :string
      add :status, :string, null: false, default: "pending"
      
      add :authorization_url, :text
      add :redirect_url, :string
      
      add :valid_until, :utc_datetime
      add :last_used_at, :utc_datetime
      
      add :access_scope, :map
      add :frequency_per_day, :integer, default: 4
      add :recurring_indicator, :boolean, default: true

      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:bank_consents, [:user_id])
    create unique_index(:bank_consents, [:external_id])
    create index(:bank_consents, [:status])
    create index(:bank_consents, [:aspsp_id])
    create index(:bank_consents, [:valid_until])
  end
end
