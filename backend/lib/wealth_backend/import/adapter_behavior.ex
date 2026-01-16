defmodule WealthBackend.Import.AdapterBehavior do
  @callback name() :: String.t()
  @callback matches?(content :: String.t()) :: boolean()
  @callback parse_rows(rows :: [list(String.t())]) :: [map()]
end
