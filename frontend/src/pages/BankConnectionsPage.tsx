import { BankConnectionWizard } from '../components/BankConnections';

export function BankConnectionsPage() {
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Bank Connections
      </h1>
      
      <BankConnectionWizard />
    </div>
  );
}
