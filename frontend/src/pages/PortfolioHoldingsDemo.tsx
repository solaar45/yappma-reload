import { PortfolioHoldingsTable } from '@/components/PortfolioHoldingsTable';

export default function PortfolioHoldingsDemo() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Übersicht</h1>
          <p className="text-muted-foreground mt-1">
            Detaillierte Ansicht aller Assets und Accounts mit Performance und FSA-Tracking
          </p>
        </div>
      </div>
      <PortfolioHoldingsTable />
    </div>
  );
}
