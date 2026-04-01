import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import HospitalsPage from "./pages/HospitalsPage";
import HospitalDetail from "./pages/HospitalDetail";
import MarketplacePage from "./pages/MarketplacePage";
import AdminDashboard from "./pages/AdminDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import UserDashboard from "./pages/UserDashboard";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/hospitals/:id" element={<HospitalDetail />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/management" element={<ManagementDashboard />} />
          <Route path="/dashboard/user" element={<UserDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
