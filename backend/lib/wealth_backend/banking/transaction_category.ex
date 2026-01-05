defmodule WealthBackend.Banking.TransactionCategory do
  use Ecto.Schema
  import Ecto.Changeset

  schema "transaction_categories" do
    field :name, :string
    field :icon, :string
    field :color, :string
    field :type, :string
    
    belongs_to :parent, __MODULE__
    has_many :children, __MODULE__, foreign_key: :parent_id
    has_many :transactions, WealthBackend.Banking.Transaction

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(category, attrs) do
    category
    |> cast(attrs, [:name, :icon, :color, :type, :parent_id])
    |> validate_required([:name, :type])
    |> validate_inclusion(:type, ["income", "expense"])
  end
end
