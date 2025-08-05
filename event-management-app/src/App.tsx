import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Auth from './pages/Auth';
import CreateEvent from './pages/CreateEvent';
import Subscriptions from './pages/Subscriptions';
import MyTickets from './pages/MyTickets';
import PricingPlans from './components/PricingPlans';
import Analytics from './components/Analytics';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { useSession } from './SessionContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSession();
  return session ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSession();
  return !session ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <main className="transition-all duration-300">
          <Routes>
            <Route path="/" element={<ProtectedRouteWrapper><Home /></ProtectedRouteWrapper>} />
            <Route path="/event/:id" element={<ProtectedRouteWrapper><EventDetails /></ProtectedRouteWrapper>} />
            <Route path="/login" element={<PublicRouteWrapper><Auth /></PublicRouteWrapper>} />
            <Route path="/analytics" element={<ProtectedRouteWrapper><Analytics /></ProtectedRouteWrapper>} />
            <Route path="/subscriptions" element={<ProtectedRouteWrapper><Subscriptions /></ProtectedRouteWrapper>} />
            <Route path="/my-tickets" element={<ProtectedRouteWrapper><MyTickets /></ProtectedRouteWrapper>} />
            <Route path="/pricing" element={<ProtectedRouteWrapper><PricingPlans /></ProtectedRouteWrapper>} />
            <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb'
            }
          }}
        />
      </div>
    </Router>
  );
}

export default App;

