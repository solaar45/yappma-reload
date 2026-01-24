defmodule WealthBackend.Admin.AuditLog do
  @moduledoc """
  Schema for tracking admin actions for GDPR compliance and security auditing.
  """
  use Ecto.Schema
  import Ecto.Changeset

  schema "audit_logs" do
    belongs_to :admin_user, WealthBackend.Accounts.User
    belongs_to :target_user, WealthBackend.Accounts.User
    
    field :action, :string
    field :details, :map
    field :ip_address, :string
    field :user_agent, :string

    timestamps(updated_at: false)
  end

  @valid_actions ~w(
    create_user
    update_user
    delete_user
    reset_password
    change_role
    deactivate_user
    reactivate_user
    promote_to_admin
    demote_to_user
  )

  @doc false
  def changeset(audit_log, attrs) do
    audit_log
    |> cast(attrs, [:admin_user_id, :target_user_id, :action, :details, :ip_address, :user_agent])
    |> validate_required([:admin_user_id, :action])
    |> validate_inclusion(:action, @valid_actions)
    |> foreign_key_constraint(:admin_user_id)
    |> foreign_key_constraint(:target_user_id)
  end

  def valid_actions, do: @valid_actions
end
