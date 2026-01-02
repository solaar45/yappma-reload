defmodule WealthBackend.Analytics.AccountSnapshot do
  use Ecto.Schema
  import Ecto.Changeset

  @source_values [:manual, :fints_auto]

  schema "account_snapshots" do
    field :balance, :decimal
    field :snapshot_date, :date
    field :source, Ecto.Enum, values: @source_values, default: :manual
    field :external_reference, :string

    belongs_to :account, WealthBackend.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account_snapshot, attrs) do
    account_snapshot
    |> cast(attrs, [:balance, :snapshot_date, :account_id, :source, :external_reference])
    |> validate_required([:balance, :snapshot_date, :account_id])
    |> validate_inclusion(:source, @source_values)
    |> foreign_key_constraint(:account_id)
    |> unique_constraint([:account_id, :snapshot_date],
      name: :account_snapshots_account_id_snapshot_date_index,
      message: "Snapshot for this account and date already exists"
    )
  end

  def source_values, do: @source_values
end
