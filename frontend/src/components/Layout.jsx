import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Building2,
  CreditCard,
  ArrowDownCircle,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Residents', href: '/residents', icon: Users },
  { name: 'Houses', href: '/houses', icon: Building2 },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Expenses', href: '/expenses', icon: ArrowDownCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Neighborhood Admin</h1>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-4 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200">
          {user && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User size={16} className="text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <div className="px-3 pb-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut size={20} />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400 text-center">
              Neighborhood Administration System
            </p>
            <p className="text-xs text-gray-400 text-center">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              Neighborhood Administration System
            </h2>
          </div>
          {/* Desktop logout */}
          {user && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
