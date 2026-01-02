from flask import Flask, request, jsonify
from fints.client import FinTS3PinTanClient
from datetime import datetime, date
import logging
import os

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API Key for basic authentication
API_KEY = os.getenv('FINTS_API_KEY', 'dev-key-change-in-production')


def verify_api_key():
    """Verify API key from request headers."""
    provided_key = request.headers.get('X-API-Key')
    if provided_key != API_KEY:
        return False
    return True


def create_fints_client(blz, user_id, pin, fints_url):
    """Create FinTS client instance."""
    try:
        client = FinTS3PinTanClient(
            blz=blz,
            user=user_id,
            pin=pin,
            endpoint=fints_url
        )
        return client
    except Exception as e:
        logger.error(f"Failed to create FinTS client: {str(e)}")
        raise


@app.route('/api/fints/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'fints-worker',
        'version': '1.0.0'
    }), 200


@app.route('/api/fints/test-connection', methods=['POST'])
def test_connection():
    """Test connection to bank."""
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    required_fields = ['blz', 'user_id', 'pin', 'fints_url']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        client = create_fints_client(
            data['blz'],
            data['user_id'],
            data['pin'],
            data['fints_url']
        )
        
        # Try to fetch accounts as a connection test
        accounts = client.get_sepa_accounts()
        
        return jsonify({
            'success': True,
            'message': 'Connection successful',
            'account_count': len(accounts)
        }), 200
        
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/fints/fetch-accounts', methods=['POST'])
def fetch_accounts():
    """Fetch list of accounts from bank."""
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    required_fields = ['blz', 'user_id', 'pin', 'fints_url']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        client = create_fints_client(
            data['blz'],
            data['user_id'],
            data['pin'],
            data['fints_url']
        )
        
        accounts = client.get_sepa_accounts()
        
        account_list = []
        for account in accounts:
            account_info = {
                'iban': account.iban,
                'account_number': account.accountnumber,
                'bic': getattr(account, 'bic', None),
                'account_name': getattr(account, 'account_name', f"Account {account.accountnumber}"),
                'currency': 'EUR'  # Default for German banks
            }
            account_list.append(account_info)
        
        return jsonify({
            'success': True,
            'accounts': account_list
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to fetch accounts: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/fints/fetch-balances', methods=['POST'])
def fetch_balances():
    """Fetch current balances for all accounts."""
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    required_fields = ['blz', 'user_id', 'pin', 'fints_url']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        client = create_fints_client(
            data['blz'],
            data['user_id'],
            data['pin'],
            data['fints_url']
        )
        
        accounts = client.get_sepa_accounts()
        
        balance_list = []
        for account in accounts:
            try:
                balance = client.get_balance(account)
                
                balance_info = {
                    'iban': account.iban,
                    'balance': str(balance.amount.amount),
                    'currency': balance.amount.currency,
                    'date': datetime.now().date().isoformat()
                }
                balance_list.append(balance_info)
                
            except Exception as e:
                logger.warning(f"Failed to get balance for {account.iban}: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'balances': balance_list
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to fetch balances: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
