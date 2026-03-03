import { NavLink, Outlet } from 'react-router-dom';
import { Home, Users, PlusCircle, Receipt, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/groups', icon: Users, label: 'Grupos' },
  { to: '/new-expense', icon: PlusCircle, label: 'Gasto' },
  { to: '/history', icon: Receipt, label: 'Historial' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-600">Cuentas Claras</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">{user?.name}</span>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-danger rounded-lg hover:bg-slate-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
