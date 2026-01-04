defmodule Yappma.Repo.Migrations.RenameConsentIdToExternalId do
  use Ecto.Migration

  def change do
    # Rename consent_id to external_id for clarity
    rename table(:bank_consents), :consent_id, to: :external_id
  end
end
