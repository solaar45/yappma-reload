defmodule Yappma.Portfolio.Asset do
  use Ecto.Schema
  import Ecto.Changeset

  schema "assets" do
    field :name, :string
    field :symbol, :string
    field :currency, :string
    field :is_active, :boolean, default: true
    field :created_at_date, :date
    field :closed_at, :date

    belongs_to :user, Yappma.Accounts.User
    belongs_to :account, Yappma.Accounts.Account
    belongs_to :asset_type, Yappma.Portfolio.AssetType

    # Polymorphic associations
    has_one :security_asset, Yappma.Portfolio.SecurityAsset
    has_one :insurance_asset, Yappma.Portfolio.InsuranceAsset
    has_one :loan_asset, Yappma.Portfolio.LoanAsset
    has_one :real_estate_asset, Yappma.Portfolio.RealEstateAsset
    has_many :snapshots, Yappma.Analytics.AssetSnapshot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(asset, attrs) do
    asset
    |> cast(attrs, [:name, :symbol, :currency, :is_active, :created_at_date, :closed_at, :user_id, :account_id, :asset_type_id])
    |> validate_required([:name, :currency, :user_id, :asset_type_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:account_id)
    |> foreign_key_constraint(:asset_type_id)
  end
end
