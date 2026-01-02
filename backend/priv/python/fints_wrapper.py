#!/usr/bin/env python3
"""
FinTS wrapper for Elixir integration.
Communicates via JSON over stdin/stdout.
"""

import sys
import json
import logging
from datetime import date
from fints.client import FinTS3PinTanClient

# Configure logging to stderr (stdout is for JSON communication)
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

logger = logging.getLogger(__name__)


class TANHandler:
    """
    Handler for TAN input. Communicates with Elixir to request TAN from user.
    """
    def __init__(self):
        self.tan = None
    
    def __call__(self, tan_request):
        """
        Called by FinTS client when TAN is needed.
        Sends TAN request to Elixir and waits for response.
        """
        # Send TAN request to Elixir
        tan_request_data = {
            "type": "tan_request",
            "challenge": tan_request if isinstance(tan_request, str) else str(tan_request)
        }
        
        print(json.dumps(tan_request_data))
        sys.stdout.flush()
        
        # Wait for TAN from Elixir
        try:
            response_line = sys.stdin.readline().strip()
            response = json.loads(response_line)
            
            if response.get("action") == "provide_tan":
                return response.get("tan")
            else:
                logger.error(f"Unexpected response: {response}")
                return None
        except Exception as e:
            logger.error(f"Failed to receive TAN: {str(e)}")
            return None


def test_connection(blz, user_id, pin, fints_url):
    """
    Test FinTS connection.
    Returns: {"success": bool, "message": str}
    """
    try:
        tan_handler = TANHandler()
        
        client = FinTS3PinTanClient(
            blz,
            user_id,
            pin,
            fints_url,
            product_id='YAPPMA'
        )
        
        # Set TAN mechanism
        client.set_tan_mechanism(['942'])  # decoupled (DKB-App)
        
        # Try to get accounts to verify connection (may require TAN)
        with client:
            accounts = client.get_sepa_accounts()
        
        return {
            "success": True,
            "message": "Connection successful",
            "account_count": len(accounts)
        }
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return {
            "success": False,
            "message": str(e),
            "account_count": 0
        }


def fetch_accounts(blz, user_id, pin, fints_url):
    """
    Fetch bank accounts from FinTS server.
    Returns: {"success": bool, "accounts": list, "error": str}
    """
    try:
        tan_handler = TANHandler()
        
        client = FinTS3PinTanClient(
            blz,
            user_id,
            pin,
            fints_url,
            product_id='YAPPMA'
        )
        
        # Set TAN mechanism
        client.set_tan_mechanism(['942'])  # decoupled (DKB-App)
        
        with client:
            sepa_accounts = client.get_sepa_accounts()
        
        accounts = []
        for account in sepa_accounts:
            accounts.append({
                "iban": account.iban,
                "account_number": account.accountnumber,
                "account_name": getattr(account, 'name', 'Unknown'),
                "bic": account.bic,
                "bank_name": getattr(account, 'bank_name', 'DKB'),
                "currency": "EUR",
                "type": "checking"
            })
        
        return {
            "success": True,
            "accounts": accounts,
            "error": None
        }
    except Exception as e:
        logger.error(f"Fetch accounts failed: {str(e)}")
        return {
            "success": False,
            "accounts": [],
            "error": str(e)
        }


def fetch_balances(blz, user_id, pin, fints_url):
    """
    Fetch account balances from FinTS server.
    Returns: {"success": bool, "balances": list, "error": str}
    """
    try:
        tan_handler = TANHandler()
        
        client = FinTS3PinTanClient(
            blz,
            user_id,
            pin,
            fints_url,
            product_id='YAPPMA'
        )
        
        # Set TAN mechanism
        client.set_tan_mechanism(['942'])  # decoupled (DKB-App)
        
        with client:
            sepa_accounts = client.get_sepa_accounts()
            
            balances = []
            for account in sepa_accounts:
                # Get balance for each account
                balance_info = client.get_balance(account)
                
                balances.append({
                    "iban": account.iban,
                    "balance": float(balance_info.amount.amount),
                    "currency": balance_info.amount.currency,
                    "date": balance_info.date.isoformat() if balance_info.date else date.today().isoformat()
                })
        
        return {
            "success": True,
            "balances": balances,
            "error": None
        }
    except Exception as e:
        logger.error(f"Fetch balances failed: {str(e)}")
        return {
            "success": False,
            "balances": [],
            "error": str(e)
        }


def main():
    """
    Main loop: read JSON commands from stdin, execute, write JSON responses to stdout.
    """
    logger.info("FinTS wrapper started")
    
    for line in sys.stdin:
        try:
            command = json.loads(line.strip())
            action = command.get("action")
            
            logger.debug(f"Received command: {action}")
            
            if action == "test_connection":
                result = test_connection(
                    command["blz"],
                    command["user_id"],
                    command["pin"],
                    command["fints_url"]
                )
            elif action == "fetch_accounts":
                result = fetch_accounts(
                    command["blz"],
                    command["user_id"],
                    command["pin"],
                    command["fints_url"]
                )
            elif action == "fetch_balances":
                result = fetch_balances(
                    command["blz"],
                    command["user_id"],
                    command["pin"],
                    command["fints_url"]
                )
            else:
                result = {
                    "success": False,
                    "error": f"Unknown action: {action}"
                }
            
            # Write result as JSON to stdout
            print(json.dumps(result))
            sys.stdout.flush()
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {str(e)}")
            print(json.dumps({"success": False, "error": "Invalid JSON"}))
            sys.stdout.flush()
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            print(json.dumps({"success": False, "error": str(e)}))
            sys.stdout.flush()


if __name__ == "__main__":
    main()
