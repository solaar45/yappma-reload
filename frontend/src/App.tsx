import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import AccountsPage from '@/pages/AccountsPage';
import AssetsPage from '@/pages/AssetsPage';
import './App.css';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
