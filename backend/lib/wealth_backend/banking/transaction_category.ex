defmodule WealthBackend.Banking.TransactionCategory do
  use Ecto.Schema
  import Ecto.Changeset

  alias Yappma.Accounts.User
  alias WealthBackend.Banking.Transaction

  schema "transaction_categories" do
    field :name, :string
    field :icon, :string
    field :color, :string
    field :type, :string  # "income" or "expense"
    field :is_system, :boolean, default: false

    belongs_to :user, User
    has_many :transactions, Transaction

    timestamps(type: :utc_datetime)
  end

  @required_fields [:name, :type]
  @optional_fields [:icon, :color, :is_system, :user_id]
  @valid_types ["income", "expense"]

  def changeset(category, attrs) do
    category
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, @valid_types)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:icon, max: 10)
    |> validate_length(:color, max: 20)
    |> unique_constraint([:name, :user_id], name: :transaction_categories_name_user_id_index)
  end
end
