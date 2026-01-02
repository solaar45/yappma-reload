import React, { useEffect, useState } from 'react';
import { Search, Building2, ChevronRight } from 'lucide-react';
import { listBanks, type Bank } from '../../lib/api/bankConnections';

interface BankSelectionStepProps {
  onBankSelected: (bank: Bank) => void;
}

export function BankSelectionStep({ onBankSelected }: BankSelectionStepProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const data = await listBanks();
      setBanks(data);
      setError(null);
    } catch (err) {
      setError('Banken konnten nicht geladen werden');
      console.error('Failed to load banks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={loadBanks}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Bank suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Bank List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredBanks.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Keine Banken gefunden
          </p>
        ) : (
          filteredBanks.map((bank) => (
            <button
              key={bank.aspsp_id}
              onClick={() => onBankSelected(bank)}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              {bank.logo_url ? (
                <img
                  src={bank.logo_url}
                  alt={bank.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {bank.name}
                </h3>
                {bank.bic && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    BIC: {bank.bic}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
