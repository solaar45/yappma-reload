const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8093;

app.use(cors());
app.use(express.json());

// Mock data
const mockBanks = [
  {
    id: 'MOCKBANK_DE',
    name: 'Mock Bank Germany',
    bic: 'MOCKDEFF',
    logo: null,
    supports: ['accounts', 'transactions', 'balances']
  },
  {
    id: 'TESTBANK_DE',
    name: 'Test Bank Germany',
    bic: 'TESTDEFF',
    logo: null,
    supports: ['accounts', 'transactions', 'balances']
  }
];

const mockAccounts = {
  'ACC001': {
    id: 'ACC001',
    iban: 'DE89370400440532013000',
    currency: 'EUR',
    name: 'Main Account',
    product: 'Girokonto',
    cashAccountType: 'CACC',
    status: 'enabled',
    balances: [
      {
        balanceAmount: { amount: '2547.83', currency: 'EUR' },
        balanceType: 'interimBooked'
      }
    ]
  },
  'ACC002': {
    id: 'ACC002',
    iban: 'DE89370400440532013001',
    currency: 'EUR',
    name: 'Savings Account',
    product: 'Sparkonto',
    cashAccountType: 'SVGS',
    status: 'enabled',
    balances: [
      {
        balanceAmount: { amount: '15320.50', currency: 'EUR' },
        balanceType: 'interimBooked'
      }
    ]
  }
};

// Generate mock transactions for an account
function generateMockTransactions(accountId, dateFrom, dateTo) {
  const transactions = [];

  // Sample transactions
  const sampleTransactions = [
    {
      transactionId: 'TXN-2026-001',
      bookingDate: '2026-01-04',
      valueDate: '2026-01-04',
      transactionAmount: { amount: '1500.00', currency: 'EUR' },
      creditorName: 'Employer GmbH',
      debtorAccount: { iban: 'DE89370400440532013099' },
      remittanceInformationUnstructured: ['Salary January 2026'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2026-002',
      bookingDate: '2026-01-03',
      valueDate: '2026-01-03',
      transactionAmount: { amount: '-45.20', currency: 'EUR' },
      creditorName: 'REWE Markt GmbH',
      creditorAccount: { iban: 'DE89370400440532013088' },
      remittanceInformationUnstructured: ['Grocery shopping'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2026-003',
      bookingDate: '2026-01-02',
      valueDate: '2026-01-02',
      transactionAmount: { amount: '-120.50', currency: 'EUR' },
      creditorName: 'Amazon EU S.a.r.L',
      creditorAccount: { iban: 'LU123456789012345678' },
      remittanceInformationUnstructured: ['Online order'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2026-004',
      bookingDate: '2026-01-01',
      valueDate: '2026-01-01',
      transactionAmount: { amount: '-850.00', currency: 'EUR' },
      creditorName: 'Landlord Management',
      creditorAccount: { iban: 'DE89370400440532013077' },
      remittanceInformationUnstructured: ['Rent January 2026'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2025-099',
      bookingDate: '2025-12-31',
      valueDate: '2025-12-31',
      transactionAmount: { amount: '-29.99', currency: 'EUR' },
      creditorName: 'Netflix International B.V.',
      creditorAccount: { iban: 'NL12ABNA0123456789' },
      remittanceInformationUnstructured: ['Netflix subscription'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2025-098',
      bookingDate: '2025-12-30',
      valueDate: '2025-12-30',
      transactionAmount: { amount: '-65.30', currency: 'EUR' },
      creditorName: 'Shell Deutschland Oil GmbH',
      creditorAccount: { iban: 'DE89370400440532013066' },
      remittanceInformationUnstructured: ['Gas station'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2025-097',
      bookingDate: '2025-12-29',
      valueDate: '2025-12-29',
      transactionAmount: { amount: '250.00', currency: 'EUR' },
      debtorName: 'Parents',
      debtorAccount: { iban: 'DE89370400440532013055' },
      remittanceInformationUnstructured: ['Gift'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2025-096',
      bookingDate: '2025-12-28',
      valueDate: '2025-12-28',
      transactionAmount: { amount: '-89.95', currency: 'EUR' },
      creditorName: 'Restaurant La Bella Vita',
      creditorAccount: { iban: 'DE89370400440532013044' },
      remittanceInformationUnstructured: ['Restaurant dinner'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2025-095',
      bookingDate: '2025-12-27',
      valueDate: '2025-12-27',
      transactionAmount: { amount: '-35.00', currency: 'EUR' },
      creditorName: 'City Pharmacy',
      creditorAccount: { iban: 'DE89370400440532013033' },
      remittanceInformationUnstructured: ['Pharmacy'],
      bankTransactionCode: 'PMNT'
    },
    {
      transactionId: 'TXN-2025-094',
      bookingDate: '2025-12-26',
      valueDate: '2025-12-26',
      transactionAmount: { amount: '-180.00', currency: 'EUR' },
      creditorName: 'Electricity Provider',
      creditorAccount: { iban: 'DE89370400440532013022' },
      remittanceInformationUnstructured: ['Electricity bill December'],
      bankTransactionCode: 'PMNT'
    }
  ];

  return sampleTransactions;
}

// Routes

// List available banks (ASPSPs)
app.get('/aspsps', (req, res) => {
  console.log('[Styx Mock] GET /aspsps');
  res.json(mockBanks);
});

// Create consent
app.post('/consents', (req, res) => {
  console.log('[Styx Mock] POST /consents', req.body);
  const consentId = 'consent-' + Date.now();
  const authUrl = `http://localhost:5173/bank-callback?consent=${consentId}&status=authorized`;

  res.json({
    consentId,
    consent_id: consentId,
    authorization_url: authUrl,
    redirectUrl: authUrl,  // Legacy compatibility
    status: 'created'
  });
});

// Get accounts for consent
app.get('/consents/:consentId/accounts', (req, res) => {
  const { consentId } = req.params;
  console.log(`[Styx Mock] GET /consents/${consentId}/accounts`);

  res.json({
    accounts: Object.values(mockAccounts)
  });
});

// Get transactions for account
app.get('/consents/:consentId/accounts/:accountId/transactions', (req, res) => {
  const { consentId, accountId } = req.params;
  const { date_from, date_to } = req.query;

  console.log(`[Styx Mock] GET /consents/${consentId}/accounts/${accountId}/transactions`);
  console.log(`  date_from: ${date_from}, date_to: ${date_to}`);

  const transactions = generateMockTransactions(accountId, date_from, date_to);

  res.json({
    account: mockAccounts[accountId] || mockAccounts['ACC001'],
    transactions: {
      booked: transactions.filter(t => !t.pending),
      pending: [] // No pending transactions for now
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'styx-mock' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Styx PSD2 Mock Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /aspsps');
  console.log('  POST /consents/create');
  console.log('  GET  /consents/:id/accounts');
  console.log('  GET  /consents/:id/accounts/:accountId/transactions');
  console.log('\n');
});
