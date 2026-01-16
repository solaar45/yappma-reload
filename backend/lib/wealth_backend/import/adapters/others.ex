defmodule WealthBackend.Import.Adapters.TradeRepublic do
  @behaviour WealthBackend.Import.AdapterBehavior
  def name, do: "Trade Republic"
  def matches?(_), do: false # Implement proper detection later
  def parse_rows(_), do: []
end

defmodule WealthBackend.Import.Adapters.DKB do
  @behaviour WealthBackend.Import.AdapterBehavior
  def name, do: "DKB"
  def matches?(_), do: false
  def parse_rows(_), do: []
end

defmodule WealthBackend.Import.Adapters.Comdirect do
  @behaviour WealthBackend.Import.AdapterBehavior
  def name, do: "Comdirect"
  def matches?(_), do: false
  def parse_rows(_), do: []
end

defmodule WealthBackend.Import.Adapters.DeutscheBank do
  @behaviour WealthBackend.Import.AdapterBehavior
  def name, do: "Deutsche Bank"
  def matches?(_), do: false
  def parse_rows(_), do: []
end
