defmodule Yappma.Accounts.AccountSnapshot do
  use Ecto.Schema
  import Ecto.Changeset

  schema "account_snapshots" do
    field :balance, :decimal
    field :currency, :string
    field :snapshot_date, :date
    field :notes, :string

    belongs_to :account, Yappma.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account_snapshot, attrs) do
    account_snapshot
    |> cast(attrs, [
      :account_id,
      :balance,
      :currency,
      :snapshot_date,
      :notes
    ])
    |> validate_required([:account_id, :balance, :currency, :snapshot_date])
    |> validate_length(:currency, is: 3)
    |> foreign_key_constraint(:account_id)
    |> unique_constraint([:account_id, :snapshot_date],
      name: :account_snapshots_account_id_snapshot_date_index
    )
  end
end
