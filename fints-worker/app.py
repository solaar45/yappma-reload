from flask import Flask, request, jsonify
from fints.client import FinTS3PinTanClient
import os
from datetime import datetime, date
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Key for authentication
API_KEY = os.getenv('FINTS_API_KEY', 'dev-test-key-12345')
MOCK_MODE = os.getenv('MOCK_MODE', 'false').lower() == 'true'

if MOCK_MODE:
    logger.info("🎭 MOCK MODE ENABLED - Using fake data for testing")

def verify_api_key():
    """Verify API key from request headers"""
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key != API_KEY:
        return False
    return True

@app.route('/api/fints/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'fints-worker',
        'version': '1.0.0',
        'mock_mode': MOCK_MODE
    })

@app.route('/api/fints/test-connection', methods=['POST'])
def test_connection():
    """Test FinTS connection"""
    if not verify_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    data = request.json
    blz = data.get('blz')
    user_id = data.get('user_id')
    pin = data.get('pin')
    fints_url = data.get('fints_url')

    if not all([blz, user_id, pin, fints_url]):
        return jsonify({
            'success': False,
            'error': 'Missing required parameters: blz, user_id, pin, fints_url'
        }), 400

    # Mock mode: return fake success
    if MOCK_MODE:
        logger.info(f"🎭 Mock connection test for BLZ: {blz}")
        return jsonify({
            'success': True,
            'message': 'Mock connection successful',
            'account_count': 2
        })

    try:
        # Real FinTS connection
        client = FinTS3PinTanClient(
            blz=blz,
            user=user_id,
            pin=pin,
            endpoint=fints_url
        )
        
        # Get accounts to verify connection
        accounts = client.get_sepa_accounts()
        
        return jsonify({
            'success': True,
            'message': 'Connection successful',
            'account_count': len(accounts)
        })
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/fints/accounts', methods=['POST'])
def get_accounts():
    """Fetch bank accounts from FinTS"""
    if not verify_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    data = request.json
    blz = data.get('blz')
    user_id = data.get('user_id')
    pin = data.get('pin')
    fints_url = data.get('fints_url')

    if not all([blz, user_id, pin, fints_url]):
        return jsonify({
            'success': False,
            'error': 'Missing required parameters'
        }), 400

    # Mock mode: return fake accounts
    if MOCK_MODE:
        logger.info(f"🎭 Mock accounts fetch for BLZ: {blz}")
        mock_accounts = [
            {
                'iban': 'DE89370400440532013000',
                'account_number': '532013000',
                'account_name': 'Mock Girokonto',
                'bic': 'COBADEFFXXX',
                'bank_name': 'Mock Bank',
                'currency': 'EUR',
                'type': 'checking'
            },
            {
                'iban': 'DE89370400440532013001',
                'account_number': '532013001',
                'account_name': 'Mock Sparkonto',
                'bic': 'COBADEFFXXX',
                'bank_name': 'Mock Bank',
                'currency': 'EUR',
                'type': 'savings'
            }
        ]
        return jsonify({
            'success': True,
            'accounts': mock_accounts
        })

    try:
        client = FinTS3PinTanClient(
            blz=blz,
            user=user_id,
            pin=pin,
            endpoint=fints_url
        )
        
        accounts = client.get_sepa_accounts()
        
        # Convert to serializable format
        account_list = []
        for account in accounts:
            account_list.append({
                'iban': account.iban,
                'account_number': account.accountnumber,
                'account_name': getattr(account, 'name', ''),
                'bic': account.bic if hasattr(account, 'bic') else '',
                'bank_name': getattr(account, 'bank_name', ''),
                'currency': 'EUR',
                'type': getattr(account, 'type', 'checking')
            })
        
        return jsonify({
            'success': True,
            'accounts': account_list
        })
    except Exception as e:
        logger.error(f"Failed to fetch accounts: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/fints/balances', methods=['POST'])
def get_balances():
    """Fetch account balances from FinTS"""
    if not verify_api_key():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    data = request.json
    blz = data.get('blz')
    user_id = data.get('user_id')
    pin = data.get('pin')
    fints_url = data.get('fints_url')

    if not all([blz, user_id, pin, fints_url]):
        return jsonify({
            'success': False,
            'error': 'Missing required parameters'
        }), 400

    # Mock mode: return fake balances
    if MOCK_MODE:
        logger.info(f"🎭 Mock balances fetch for BLZ: {blz}")
        mock_balances = [
            {
                'iban': 'DE89370400440532013000',
                'balance': 1250.50,
                'currency': 'EUR',
                'date': date.today().isoformat()
            },
            {
                'iban': 'DE89370400440532013001',
                'balance': 5000.00,
                'currency': 'EUR',
                'date': date.today().isoformat()
            }
        ]
        return jsonify({
            'success': True,
            'balances': mock_balances
        })

    try:
        client = FinTS3PinTanClient(
            blz=blz,
            user=user_id,
            pin=pin,
            endpoint=fints_url
        )
        
        accounts = client.get_sepa_accounts()
        balances = []
        
        for account in accounts:
            try:
                balance_data = client.get_balance(account)
                balances.append({
                    'iban': account.iban,
                    'balance': float(balance_data.amount.amount),
                    'currency': balance_data.amount.currency,
                    'date': balance_data.date.isoformat() if hasattr(balance_data.date, 'isoformat') else str(balance_data.date)
                })
            except Exception as e:
                logger.error(f"Failed to fetch balance for {account.iban}: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'balances': balances
        })
    except Exception as e:
        logger.error(f"Failed to fetch balances: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
