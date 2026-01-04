defmodule Yappma.Accounts.AccountSnapshot do
  use Ecto.Schema
  import Ecto.Changeset

  schema "account_snapshots" do
    field :balance, :decimal
    field :currency, :string
    field :recorded_at, :utc_datetime
    field :notes, :string

    belongs_to :account, Yappma.Accounts.Account

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(snapshot, attrs) do
    snapshot
    |> cast(attrs, [:balance, :currency, :recorded_at, :notes, :account_id])
    |> validate_required([:balance, :currency, :recorded_at, :account_id])
    |> validate_length(:currency, is: 3)
    |> foreign_key_constraint(:account_id)
  end
end
