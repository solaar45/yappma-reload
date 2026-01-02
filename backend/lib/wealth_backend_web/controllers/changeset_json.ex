defmodule WealthBackendWeb.ChangesetJSON do
  @doc """
  Renders changeset errors.
  """
  def error(%{changeset: changeset}) do
    # When encoded, the changeset returns its errors
    # as a JSON object. So we just pass it forward.
    errors = translate_errors(changeset)
    
    # Add constraint error info for better error detection
    constraint_info = extract_constraint_info(changeset)
    
    %{errors: errors}
    |> maybe_add_constraint_info(constraint_info)
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
  
  defp extract_constraint_info(changeset) do
    changeset.errors
    |> Enum.find_value(fn
      {_field, {_msg, [constraint: :unique, constraint_name: name]}} -> 
        {:unique, name}
      {_field, {_msg, opts}} -> 
        case Keyword.get(opts, :constraint) do
          :unique -> {:unique, Keyword.get(opts, :constraint_name)}
          _ -> nil
        end
      _ -> nil
    end)
  end
  
  defp maybe_add_constraint_info(response, nil), do: response
  defp maybe_add_constraint_info(response, {:unique, constraint_name}) do
    Map.put(response, :error_type, "duplicate")
    |> Map.put(:constraint, constraint_name)
  end
end
