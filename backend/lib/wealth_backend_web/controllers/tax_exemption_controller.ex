defmodule WealthBackendWeb.TaxExemptionController do
  use WealthBackendWeb, :controller

  alias WealthBackend.Taxes
  alias WealthBackend.Taxes.TaxExemption

  action_fallback WealthBackendWeb.FallbackController

  def index(conn, %{"year" => year}) do
    user = conn.assigns.current_user
    tax_exemptions = Taxes.list_user_tax_exemptions(user.id, year)
    render(conn, :index, tax_exemptions: tax_exemptions)
  end

  def create(conn, %{"tax_exemption" => te_params}) do
    user = conn.assigns.current_user
    te_params = Map.put(te_params, "user_id", user.id)

    with {:ok, %TaxExemption{} = te} <- Taxes.create_tax_exemption(te_params) do
      # Preload institution for the response
      te = Taxes.get_tax_exemption!(te.id, user.id) |> WealthBackend.Repo.preload(:institution)
      
      conn
      |> put_status(:created)
      |> render(:show, tax_exemption: te)
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    te = Taxes.get_tax_exemption!(id, user.id) |> WealthBackend.Repo.preload(:institution)
    render(conn, :show, tax_exemption: te)
  end

  def update(conn, %{"id" => id, "tax_exemption" => te_params}) do
    user = conn.assigns.current_user
    te = Taxes.get_tax_exemption!(id, user.id)

    with {:ok, %TaxExemption{} = te} <- Taxes.update_tax_exemption(te, te_params) do
      te = WealthBackend.Repo.preload(te, :institution)
      render(conn, :show, tax_exemption: te)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    te = Taxes.get_tax_exemption!(id, user.id)

    with {:ok, %TaxExemption{}} <- Taxes.delete_tax_exemption(te) do
      send_resp(conn, :no_content, "")
    end
  end
end
