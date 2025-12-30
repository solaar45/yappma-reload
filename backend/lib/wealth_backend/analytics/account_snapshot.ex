defmodule WealthBackend.Analytics.AccountSnapshot do
  use Ecto.Schema
  import Ecto.Changeset

  schema "account_snapshots" do
    field :snapshot_date, :date
    field :balance, :decimal
    field :currency, :string
    field :note, :string

    belongs_to :account, WealthBackend.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account_snapshot, attrs) do
    account_snapshot
    |> cast(attrs, [:snapshot_date, :balance, :currency, :note, :account_id])
    |> validate_required([:snapshot_date, :balance, :currency, :account_id])
    |> foreign_key_constraint(:account_id)
    |> unique_constraint(:snapshot_date, name: :account_snapshots_account_id_snapshot_date_index)
  end
end
