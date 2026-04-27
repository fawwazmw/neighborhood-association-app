import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResidentList from './pages/ResidentList';
import ResidentForm from './pages/ResidentForm';
import HouseList from './pages/HouseList';
import HouseDetail from './pages/HouseDetail';
import HouseForm from './pages/HouseForm';
import PaymentList from './pages/PaymentList';
import PaymentForm from './pages/PaymentForm';
import ExpenseList from './pages/ExpenseList';
import Report from './pages/Report';
import NotFound from './pages/NotFound';

/**
 * Route guard — redirects to /login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* Resident Routes */}
                <Route path="/residents" element={<ResidentList />} />
                <Route path="/residents/create" element={<ResidentForm />} />
                <Route path="/residents/:id/edit" element={<ResidentForm />} />
                {/* House Routes */}
                <Route path="/houses" element={<HouseList />} />
                <Route path="/houses/:id" element={<HouseDetail />} />
                <Route path="/houses/:id/edit" element={<HouseForm />} />
                {/* Payment Routes */}
                <Route path="/payments" element={<PaymentList />} />
                <Route path="/payments/create" element={<PaymentForm />} />
                {/* Expense Routes */}
                <Route path="/expenses" element={<ExpenseList />} />
                {/* Report Routes */}
                <Route path="/reports" element={<Report />} />
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
