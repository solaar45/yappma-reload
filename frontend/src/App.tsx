import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { BankCallbackPage } from './pages/BankCallbackPage';
import { BankConnectionsPage } from './pages/BankConnectionsPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Bank callback doesn't need layout */}
        <Route path="/bank-callback" element={<BankCallbackPage />} />
        
        {/* Main app routes with layout */}
        <Route path="/" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/accounts" element={<Layout><AccountsPage /></Layout>} />
        <Route path="/bank-connections" element={<Layout><BankConnectionsPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
