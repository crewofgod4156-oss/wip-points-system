import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LiffProvider } from './contexts/LiffContext';
import HomePage from './pages/HomePage';
import RewardsPage from './pages/RewardsPage';
import HistoryPage from './pages/HistoryPage';
import RedemptionsPage from './pages/RedemptionsPage';
import LinkPhonePage from './pages/LinkPhonePage';
import RegisterPage from './pages/RegisterPage';
import RedeemPage from './pages/RedeemPage';
import RedemptionHistoryPage from './pages/RedemptionHistoryPage';

function App() {
  return (
    <LiffProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/redeem" element={<RedeemPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/redemptions" element={<RedemptionsPage />} />
          <Route path="/redemption-history" element={<RedemptionHistoryPage />} />
          <Route path="/link-phone" element={<LinkPhonePage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Router>
    </LiffProvider>
  );
}

export default App;
