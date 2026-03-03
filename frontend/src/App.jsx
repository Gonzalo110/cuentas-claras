import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Groups from './pages/Groups';
import NewGroup from './pages/NewGroup';
import GroupDetail from './pages/GroupDetail';
import NewExpense from './pages/NewExpense';
import History from './pages/History';
import InvitePage from './pages/InvitePage';
import PaymentResult from './pages/PaymentResult';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/invite/:code" element={<InvitePage />} />
      <Route path="/payment/:status/:paymentId" element={<PaymentResult />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/new" element={<NewGroup />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/groups/:groupId/new-expense" element={<NewExpense />} />
        <Route path="/new-expense" element={<NewExpense />} />
        <Route path="/history" element={<History />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
