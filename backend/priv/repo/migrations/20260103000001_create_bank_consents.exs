defmodule Yappma.Repo.Migrations.CreateBankConsents do
  use Ecto.Migration

  def change do
    create table(:bank_consents, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      # Bank/ASPSP identification
      add :aspsp_id, :string, null: false
      add :aspsp_name, :string
      add :aspsp_bic, :string
      
      # Consent data from Styx/PSD2
      add :consent_id, :string, null: false
      add :status, :string, null: false, default: "pending"
      # Status: pending, valid, expired, revoked, rejected
      
      # OAuth-like authorization flow
      add :authorization_url, :text
      add :redirect_url, :text
      
      # Consent validity
      add :valid_until, :utc_datetime
      add :last_used_at, :utc_datetime
      
      # Metadata
      add :access_scope, :map  # Which accounts/services are accessible
      add :frequency_per_day, :integer, default: 4
      add :recurring_indicator, :boolean, default: true
      
      timestamps(type: :utc_datetime)
    end

    create unique_index(:bank_consents, [:consent_id])
    create index(:bank_consents, [:user_id])
    create index(:bank_consents, [:status])
    create index(:bank_consents, [:aspsp_id])
    create index(:bank_consents, [:valid_until])
  end
end
