import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { AssetsPage } from './pages/AssetsPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { SnapshotsPage } from './pages/SnapshotsPage';
import { BankConnectionsPage } from './pages/BankConnectionsPage';
import { BankCallback } from './pages/BankCallback';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Bank callback doesn't need layout */}
        <Route path="/bank-callback" element={<BankCallback />} />
        
        {/* Main app routes with layout */}
        <Route path="/" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/accounts" element={<Layout><AccountsPage /></Layout>} />
        <Route path="/assets" element={<Layout><AssetsPage /></Layout>} />
        <Route path="/institutions" element={<Layout><InstitutionsPage /></Layout>} />
        <Route path="/snapshots" element={<Layout><SnapshotsPage /></Layout>} />
        <Route path="/bank-connections" element={<Layout><BankConnectionsPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
