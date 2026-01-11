defmodule Yappma.Services.SecurityValidator do
  @moduledoc """
  Validates securities using FMP API with caching to reduce API calls.
  Caches successful validations for 24 hours, failed validations for 1 hour.
  """

  alias Yappma.Services.FMPClient
  require Logger

  @cache_name :security_validation_cache
  @success_ttl :timer.hours(24)
  @failure_ttl :timer.hours(1)

  @doc """
  Validates a security identifier (ticker or ISIN).
  Returns {:ok, :skip_validation} if identifier is nil or empty.
  Returns {:ok, security_data} if valid.
  Returns {:error, reason} if invalid or API error.
  """
  def validate(nil), do: {:ok, :skip_validation}
  def validate(""), do: {:ok, :skip_validation}

  def validate(identifier) when is_binary(identifier) do
    identifier = String.trim(identifier) |> String.upcase()
    cache_key = "security:#{identifier}"

    case get_from_cache(cache_key) do
      {:ok, cached_result} ->
        Logger.debug("Security validation cache hit for #{identifier}")
        cached_result

      :miss ->
        Logger.debug("Security validation cache miss for #{identifier}")
        result = FMPClient.validate_security(identifier)
        cache_result(cache_key, result)
        result
    end
  end

  @doc """
  Clears the validation cache for a specific identifier.
  """
  def clear_cache(identifier) when is_binary(identifier) do
    identifier = String.trim(identifier) |> String.upcase()
    cache_key = "security:#{identifier}"
    Cachex.del(@cache_name, cache_key)
  end

  @doc """
  Clears the entire validation cache.
  """
  def clear_all_cache do
    Cachex.clear(@cache_name)
  end

  # Get from cache
  defp get_from_cache(key) do
    case Cachex.get(@cache_name, key) do
      {:ok, nil} -> :miss
      {:ok, value} -> {:ok, value}
      {:error, _} -> :miss
    end
  end

  # Cache the validation result
  defp cache_result(key, result) do
    ttl =
      case result do
        {:ok, _data} -> @success_ttl
        {:error, :not_found} -> @failure_ttl
        _ -> @failure_ttl
      end

    Cachex.put(@cache_name, key, result, ttl: ttl)
  end
end
