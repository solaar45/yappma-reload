defmodule WealthBackend.SystemData do
  @moduledoc """
  Provides master data for the system, such as global institutions and asset types.
  """

  @asset_types [
    %{code: "cash", description: "Cash & Accounts"},
    %{code: "security", description: "Securities"},
    %{code: "real_estate", description: "Real Estate"},
    %{code: "collectible", description: "Valuables"},
    %{code: "insurance", description: "Insurance"},
    %{code: "other", description: "Other Assets"}
  ]

  @institutions [
    # Banken
    %{name: "Deutsche Bank", website: "deutsche-bank.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Commerzbank", website: "commerzbank.de", type: "bank", category: "bank", country: "DE"},
    %{name: "DKB", website: "dkb.de", type: "bank", category: "bank", country: "DE"},
    %{name: "ING", website: "ing.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Postbank", website: "postbank.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Santander", website: "santander.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Targobank", website: "targobank.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Sparkasse", website: "sparkasse.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Volksbank", website: "vr.de", type: "bank", category: "bank", country: "DE"},
    %{name: "PSD Bank", website: "psd-bank.de", type: "bank", category: "bank", country: "DE"},
    %{name: "HypoVereinsbank", website: "hvb.de", type: "bank", category: "bank", country: "DE"},
    %{name: "Sparda-Bank", website: "sparda.de", type: "bank", category: "bank", country: "DE"},

    # Neobanken
    %{name: "N26", website: "n26.com", type: "bank", category: "neobank", country: "DE"},
    %{name: "Comdirect", website: "comdirect.de", type: "bank", category: "neobank", country: "DE"},
    %{name: "Consorsbank", website: "consorsbank.de", type: "bank", category: "neobank", country: "DE"},
    %{name: "1822direkt", website: "1822direkt.de", type: "bank", category: "neobank", country: "DE"},
    %{name: "Openbank", website: "openbank.de", type: "bank", category: "neobank", country: "ES"},

    # Broker
    %{name: "Trade Republic", website: "traderepublic.com", type: "broker", category: "broker", country: "DE"},
    %{name: "Scalable Capital", website: "scalable.capital", type: "broker", category: "broker", country: "DE"},
    %{name: "Smartbroker", website: "smartbroker.de", type: "broker", category: "broker", country: "DE"},
    %{name: "Flatex", website: "flatex.de", type: "broker", category: "broker", country: "DE"},
    %{name: "OnVista Bank", website: "onvista-bank.de", type: "broker", category: "broker", country: "DE"},
    %{name: "S Broker", website: "sbroker.de", type: "broker", category: "broker", country: "DE"},
    %{name: "maxblue", website: "maxblue.de", type: "broker", category: "broker", country: "DE"},
    %{name: "DEGIRO", website: "degiro.de", type: "broker", category: "broker", country: "NL"},
    %{name: "Interactive Brokers", website: "interactivebrokers.com", type: "broker", category: "broker", country: "US"},
    %{name: "CapTrader", website: "captrader.com", type: "broker", category: "broker", country: "DE"},
    %{name: "Lynx Broker", website: "lynxbroker.de", type: "broker", category: "broker", country: "DE"},
    %{name: "Union Investment", website: "union-investment.de", type: "broker", category: "broker", country: "DE"},
    %{name: "DWS", website: "dws.de", type: "broker", category: "broker", country: "DE"},
    %{name: "Deka", website: "deka.de", type: "broker", category: "broker", country: "DE"},
    %{name: "quirion", website: "quirion.de", type: "broker", category: "broker", country: "DE"},
    %{name: "growney", website: "growney.de", type: "broker", category: "broker", country: "DE"},

    # Versicherungen
    %{name: "Allianz", website: "allianz.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "AXA", website: "axa.de", type: "insurance", category: "insurance", country: "FR"},
    %{name: "R+V", website: "ruv.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "ERGO", website: "ergo.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "HUK-COBURG", website: "huk.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "Sparkassenversicherung", website: "sparkassenversicherung.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "Debeka", website: "debeka.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "Provinzial", website: "provinzial.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "VGH", website: "vgh.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "Gothaer", website: "gothaer.de", type: "insurance", category: "insurance", country: "DE"},
    %{name: "Zurich", website: "zurich.de", type: "insurance", category: "insurance", country: "CH"},

    # Krypto
    %{name: "Binance", website: "binance.com", type: "other", category: "crypto", country: "KY"},
    %{name: "Kraken", website: "kraken.com", type: "other", category: "crypto", country: "US"},
    %{name: "Coinbase", website: "coinbase.com", type: "other", category: "crypto", country: "US"},
    %{name: "Bitpanda", website: "bitpanda.com", type: "other", category: "crypto", country: "AT"},
    %{name: "Bitvavo", website: "bitvavo.com", type: "other", category: "crypto", country: "NL"},
    %{name: "BSDEX", website: "bsdex.de", type: "other", category: "crypto", country: "DE"}
  ]

  def institutions, do: @institutions
  def asset_types, do: @asset_types
end
