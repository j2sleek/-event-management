import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../SessionContext';
import { supabase } from '../supabase';
import NotificationCenter from './NotificationCenter';
import { BarChart3, Calendar, Ticket, Plus, Crown, LogOut, Menu, X } from 'lucide-react';

const Navigation = () => {
  const { session, user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error instanceof Error ? error.message : 'Unknown error');
      // Still navigate to login even if signOut fails
      navigate('/login');
      setIsMobileMenuOpen(false);
    }
  };

  if (!session) return null;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Calendar, label: 'Events' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/my-tickets', icon: Ticket, label: 'My Tickets' },
    { path: '/create-event', icon: Plus, label: 'Create Event', special: true }
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              EventHub
            </Link>
            
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map(({ path, icon: Icon, label, special }) => (
                <Link 
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    isActive(path)
                      ? special
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold shadow-md'
                        : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            
            <Link 
              to="/pricing" 
              className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5"
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade Pro</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">Welcome back!</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-all duration-200 transform hover:scale-105"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(({ path, icon: Icon, label, special }) => (
                <Link 
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(path)
                      ? special
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold'
                        : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
              
              <Link 
                to="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold"
              >
                <Crown className="h-5 w-5" />
                <span>Upgrade to Pro</span>
              </Link>
              
              <div className="px-4 py-3 border-t border-gray-200 mt-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;