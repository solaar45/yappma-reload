import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BankConnectionWizard } from '../components/BankConnections';
import { CheckCircle } from 'lucide-react';

export function BankConnectionsPage() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(true);
  const [completed, setCompleted] = useState(false);

  const handleClose = () => {
    setShowWizard(false);
    navigate('/accounts');
  };

  const handleComplete = () => {
    setCompleted(true);
    // Show success message briefly, then redirect
    setTimeout(() => {
      navigate('/accounts');
    }, 2000);
  };

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Konten erfolgreich verbunden!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sie werden zur Kontenübersicht weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {showWizard && (
        <BankConnectionWizard onClose={handleClose} onComplete={handleComplete} />
      )}
    </div>
  );
}
