import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BankSelectionStep } from './BankSelectionStep';
import { ConsentAuthStep } from './ConsentAuthStep';
import { AccountSelectionStep } from './AccountSelectionStep';
import type { Bank } from '../../lib/api/bankConnections';

interface BankConnectionWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'bank-selection' | 'consent-auth' | 'account-selection';

export function BankConnectionWizard({
  onClose,
  onComplete,
}: BankConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('bank-selection');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [consentId, setConsentId] = useState<string | null>(null);

  const handleBankSelected = (bank: Bank) => {
    setSelectedBank(bank);
    setCurrentStep('consent-auth');
  };

  const handleConsentAuthorized = (newConsentId: string) => {
    setConsentId(newConsentId);
    setCurrentStep('account-selection');
  };

  const handleAccountsSelected = () => {
    onComplete();
  };

  const handleBack = () => {
    if (currentStep === 'consent-auth') {
      setCurrentStep('bank-selection');
      setSelectedBank(null);
    } else if (currentStep === 'account-selection') {
      setCurrentStep('consent-auth');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bank verbinden
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentStep === 'bank-selection' && 'Wählen Sie Ihre Bank aus'}
              {currentStep === 'consent-auth' &&
                'Autorisieren Sie den Zugriff'}
              {currentStep === 'account-selection' &&
                'Wählen Sie Konten zum Synchronisieren'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
          <StepIndicator
            number={1}
            label="Bank wählen"
            active={currentStep === 'bank-selection'}
            completed={
              currentStep === 'consent-auth' ||
              currentStep === 'account-selection'
            }
          />
          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2" />
          <StepIndicator
            number={2}
            label="Autorisieren"
            active={currentStep === 'consent-auth'}
            completed={currentStep === 'account-selection'}
          />
          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2" />
          <StepIndicator
            number={3}
            label="Konten"
            active={currentStep === 'account-selection'}
            completed={false}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'bank-selection' && (
            <BankSelectionStep onBankSelected={handleBankSelected} />
          )}
          {currentStep === 'consent-auth' && selectedBank && (
            <ConsentAuthStep
              bank={selectedBank}
              onAuthorized={handleConsentAuthorized}
              onBack={handleBack}
            />
          )}
          {currentStep === 'account-selection' && consentId && (
            <AccountSelectionStep
              consentId={consentId}
              onComplete={handleAccountsSelected}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
          ${completed ? 'bg-green-500 text-white' : ''}
          ${active && !completed ? 'bg-blue-500 text-white' : ''}
          ${!active && !completed ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : ''}
        `}
      >
        {completed ? '✓' : number}
      </div>
      <span
        className={`text-xs ${
          active || completed
            ? 'text-gray-900 dark:text-white font-medium'
            : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
