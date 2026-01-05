alias WealthBackend.Repo
alias WealthBackend.Institutions.Institution

IO.puts("✅ Seeding System Institutions...")

system_institutions = [
  # Banken
  %{name: "Deutsche Bank", type: "bank", category: "bank", country: "DE"},
  %{name: "Commerzbank", type: "bank", category: "bank", country: "DE"},
  %{name: "DKB", type: "bank", category: "bank", country: "DE"},
  %{name: "ING", type: "bank", category: "bank", country: "DE"},
  %{name: "Postbank", type: "bank", category: "bank", country: "DE"},
  %{name: "Santander", type: "bank", category: "bank", country: "DE"},
  %{name: "Targobank", type: "bank", category: "bank", country: "DE"},
  %{name: "Sparkasse", type: "bank", category: "bank", country: "DE"},
  %{name: "Volksbank", type: "bank", category: "bank", country: "DE"},
  %{name: "PSD Bank", type: "bank", category: "bank", country: "DE"},
  %{name: "HypoVereinsbank", type: "bank", category: "bank", country: "DE"},
  %{name: "Sparda-Bank", type: "bank", category: "bank", country: "DE"},

  # Neobanken
  %{name: "N26", type: "bank", category: "neobank", country: "DE"},
  %{name: "Comdirect", type: "bank", category: "neobank", country: "DE"},
  %{name: "Consorsbank", type: "bank", category: "neobank", country: "DE"},
  %{name: "1822direkt", type: "bank", category: "neobank", country: "DE"},
  %{name: "Openbank", type: "bank", category: "neobank", country: "ES"},

  # Broker
  %{name: "Trade Republic", type: "broker", category: "broker", country: "DE"},
  %{name: "Scalable Capital", type: "broker", category: "broker", country: "DE"},
  %{name: "Smartbroker", type: "broker", category: "broker", country: "DE"},
  %{name: "Flatex", type: "broker", category: "broker", country: "DE"},
  %{name: "OnVista Bank", type: "broker", category: "broker", country: "DE"},
  %{name: "S Broker", type: "broker", category: "broker", country: "DE"},
  %{name: "maxblue", type: "broker", category: "broker", country: "DE"},
  %{name: "DEGIRO", type: "broker", category: "broker", country: "NL"},
  %{name: "Interactive Brokers", type: "broker", category: "broker", country: "US"},
  %{name: "CapTrader", type: "broker", category: "broker", country: "DE"},
  %{name: "Lynx Broker", type: "broker", category: "broker", country: "DE"},
  %{name: "Union Investment", type: "broker", category: "broker", country: "DE"},
  %{name: "DWS", type: "broker", category: "broker", country: "DE"},
  %{name: "Deka", type: "broker", category: "broker", country: "DE"},
  %{name: "quirion", type: "broker", category: "broker", country: "DE"},
  %{name: "growney", type: "broker", category: "broker", country: "DE"},

  # Versicherungen
  %{name: "Allianz", type: "insurance", category: "insurance", country: "DE"},
  %{name: "AXA", type: "insurance", category: "insurance", country: "FR"},
  %{name: "R+V", type: "insurance", category: "insurance", country: "DE"},
  %{name: "ERGO", type: "insurance", category: "insurance", country: "DE"},
  %{name: "HUK-COBURG", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Sparkassenversicherung", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Debeka", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Provinzial", type: "insurance", category: "insurance", country: "DE"},
  %{name: "VGH", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Gothaer", type: "insurance", category: "insurance", country: "DE"},
  %{name: "Zurich", type: "insurance", category: "insurance", country: "CH"},

  # Krypto
  %{name: "Binance", type: "other", category: "crypto", country: "KY"},
  %{name: "Kraken", type: "other", category: "crypto", country: "US"},
  %{name: "Coinbase", type: "other", category: "crypto", country: "US"},
  %{name: "Bitpanda", type: "other", category: "crypto", country: "AT"},
  %{name: "Bitvavo", type: "other", category: "crypto", country: "NL"},
  %{name: "BSDEX", type: "other", category: "crypto", country: "DE"}
]

Enum.each(system_institutions, fn attrs ->
  attrs = Map.put(attrs, :is_system_provided, true)
  
  case Repo.get_by(Institution, name: attrs.name, is_system_provided: true) do
    nil ->
      %Institution{}
      |> Institution.changeset(attrs)
      |> Repo.insert!()
    _institution ->
      # Already exists, skip
      :ok
  end
end)
