import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { BankCallbackPage } from './pages/BankCallbackPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Bank OAuth Callback - No Layout */}
        <Route path="/bank-callback" element={<BankCallbackPage />} />

        {/* Main App Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          {/* Add more routes as needed */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
