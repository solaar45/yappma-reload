const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8093;

// Middleware
app.use(cors());
app.use(express.json());

// Load ASPSP config
let aspsps = [];
try {
  const configPath = path.join('/config', 'aspsp-config.json');
  if (fs.existsSync(configPath)) {
    aspsps = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`Loaded ${aspsps.length} banks from config`);
  }
} catch (err) {
  console.warn('Could not load ASPSP config, using defaults:', err.message);
  // Fallback mock data
  aspsps = [
    {
      id: 'TESTBANK001',
      name: 'Test Bank',
      bic: 'TESTDE88XXX',
      logo: 'https://via.placeholder.com/150?text=Test+Bank',
      countries: ['DE']
    },
    {
      id: 'SPARKASSE',
      name: 'Sparkasse',
      bic: 'SPARKASSEXX',
      logo: 'https://via.placeholder.com/150?text=Sparkasse',
      countries: ['DE']
    }
  ];
}

// In-memory consent storage
const consents = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-psd2-server' });
});

// List ASPSPs (banks)
app.get('/aspsps', (req, res) => {
  console.log('GET /aspsps');
  res.json(aspsps);
});

// Get specific ASPSP
app.get('/aspsps/:id', (req, res) => {
  console.log(`GET /aspsps/${req.params.id}`);
  const aspsp = aspsps.find(a => a.id === req.params.id);
  if (!aspsp) {
    return res.status(404).json({ error: 'ASPSP not found' });
  }
  res.json(aspsp);
});

// Create consent
app.post('/consents', (req, res) => {
  console.log('POST /consents', req.body);
  
  const consentId = uuidv4();
  const authUrl = `http://localhost:8093/auth/${consentId}`;
  
  const consent = {
    id: consentId,
    aspsp_id: req.body.aspsp_id,
    status: 'received',
    authorization_url: authUrl,
    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    access: req.body.access || {},
    recurring_indicator: req.body.recurring_indicator || false,
    frequency_per_day: req.body.frequency_per_day || 4,
    created_at: new Date().toISOString()
  };
  
  consents.set(consentId, consent);
  
  res.status(201).json({
    consent_id: consentId,
    status: 'received',
    authorization_url: authUrl,
    _links: {
      authorization: { href: authUrl }
    }
  });
});

// Get consent
app.get('/consents/:id', (req, res) => {
  console.log(`GET /consents/${req.params.id}`);
  
  const consent = consents.get(req.params.id);
  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }
  
  res.json(consent);
});

// Complete authorization (mock)
app.post('/consents/:id/authorizations', (req, res) => {
  console.log(`POST /consents/${req.params.id}/authorizations`);
  
  const consent = consents.get(req.params.id);
  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }
  
  // Update consent status
  consent.status = 'valid';
  consent.authorized_at = new Date().toISOString();
  
  res.json({
    consent_id: req.params.id,
    status: 'valid',
    sca_status: 'finalised'
  });
});

// Mock authorization page (for redirect testing)
app.get('/auth/:id', (req, res) => {
  const consentId = req.params.id;
  const redirectUrl = req.query.redirect_uri || 'http://localhost:5173/bank-callback';
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Bank Authorization</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #45a049; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🏦 Mock Bank Authorization</h1>
        <p>Consent ID: <code>${consentId}</code></p>
        <p>This is a mock authorization page. In production, this would be your bank's login.</p>
        <button onclick="authorize()">✓ Authorize Access</button>
      </div>
      <script>
        function authorize() {
          // Auto-approve and redirect back
          const url = '${redirectUrl}?consent_id=${consentId}&status=success';
          window.location.href = url;
        }
      </script>
    </body>
    </html>
  `);
});

// Get accounts for consent (mock)
app.get('/consents/:id/accounts', (req, res) => {
  console.log(`GET /consents/${req.params.id}/accounts`);
  
  const consent = consents.get(req.params.id);
  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }
  
  // Return mock accounts
  res.json({
    accounts: [
      {
        resourceId: 'ACC001',
        iban: 'DE89370400440532013000',
        name: 'Main Account',
        product: 'Girokonto',
        currency: 'EUR',
        balance: {
          balanceAmount: { amount: '5432.10', currency: 'EUR' },
          balanceType: 'interimAvailable'
        }
      },
      {
        resourceId: 'ACC002',
        iban: 'DE89370400440532013001',
        name: 'Savings Account',
        product: 'Sparkonto',
        currency: 'EUR',
        balance: {
          balanceAmount: { amount: '12500.50', currency: 'EUR' },
          balanceType: 'interimAvailable'
        }
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock PSD2 Server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${aspsps.length} banks`);
});
