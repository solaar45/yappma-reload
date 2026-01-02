defmodule WealthBackend.FinTS.Client do
  @moduledoc """
  Client for communicating with Python FinTS wrapper.
  Manages a Port to the Python subprocess and handles JSON communication.
  """

  require Logger

  @python_dir Path.join([
    :code.priv_dir(:wealth_backend),
    "python"
  ])

  @python_script_path Path.join(@python_dir, "fints_wrapper.py")
  @python_venv_path Path.join([@python_dir, "venv", "bin", "python3"])

  @doc """
  Test FinTS connection.
  """
  def test_connection(blz, user_id, pin, fints_url) do
    command = %{
      action: "test_connection",
      blz: blz,
      user_id: user_id,
      pin: pin,
      fints_url: fints_url
    }

    case execute_command(command) do
      {:ok, result} -> {:ok, result}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Fetch accounts from FinTS server.
  """
  def fetch_accounts(blz, user_id, pin, fints_url) do
    command = %{
      action: "fetch_accounts",
      blz: blz,
      user_id: user_id,
      pin: pin,
      fints_url: fints_url
    }

    case execute_command(command) do
      {:ok, %{"success" => true, "accounts" => accounts}} ->
        {:ok, accounts}
      {:ok, %{"success" => false, "error" => error}} ->
        {:error, error}
      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Fetch balances from FinTS server.
  """
  def fetch_balances(blz, user_id, pin, fints_url) do
    command = %{
      action: "fetch_balances",
      blz: blz,
      user_id: user_id,
      pin: pin,
      fints_url: fints_url
    }

    case execute_command(command) do
      {:ok, %{"success" => true, "balances" => balances}} ->
        {:ok, balances}
      {:ok, %{"success" => false, "error" => error}} ->
        {:error, error}
      {:error, reason} ->
        {:error, reason}
    end
  end

  # Private functions

  defp execute_command(command) do
    Logger.debug("Executing FinTS command: #{inspect(command)}")

    # Use venv Python if available, otherwise fallback to system Python
    python_exec = if File.exists?(@python_venv_path) do
      Logger.debug("Using Python venv: #{@python_venv_path}")
      @python_venv_path
    else
      Logger.warning("Python venv not found at #{@python_venv_path}, using system Python")
      python_executable()
    end

    # Start Python process
    port = Port.open(
      {:spawn_executable, python_exec},
      [
        :binary,
        :exit_status,
        args: [@python_script_path],
        line: 1024 * 1024  # 1MB line buffer
      ]
    )

    # Send command as JSON
    command_json = Jason.encode!(command) <> "\n"
    Port.command(port, command_json)

    # Wait for response
    result = receive_response(port)

    # Close port
    Port.close(port)

    result
  end

  defp receive_response(port, timeout \\ 30_000) do
    receive do
      {^port, {:data, {:eol, line}}} ->
        Logger.debug("Received response: #{line}")
        
        case Jason.decode(line) do
          {:ok, result} -> {:ok, result}
          {:error, reason} -> {:error, "JSON decode error: #{inspect(reason)}"}
        end

      {^port, {:exit_status, status}} when status != 0 ->
        Logger.error("Python process exited with status: #{status}")
        {:error, "Python process failed with exit code #{status}"}

      {^port, {:exit_status, 0}} ->
        {:error, "Python process exited without sending response"}

    after
      timeout ->
        Logger.error("FinTS operation timed out after #{timeout}ms")
        {:error, "Operation timed out"}
    end
  end

  defp python_executable do
    # Try to find python3
    case System.find_executable("python3") do
      nil ->
        # Fallback to python
        case System.find_executable("python") do
          nil ->
            Logger.error("Python executable not found")
            raise "Python executable not found. Please install Python 3."
          python -> python
        end
      python3 -> python3
    end
  end
end
