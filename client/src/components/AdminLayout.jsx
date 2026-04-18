import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserPlus, ClipboardList, BarChart2, LogOut, ChevronRight, Settings } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students', icon: Users, label: 'Manage Students' },
    { to: '/admin/staff', icon: UserPlus, label: 'Manage Staff' },
    { to: '/admin/registrations', icon: ClipboardList, label: 'All Registrations' },
    { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex flex-col" style={{ background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
              <Settings size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Admin Portal</p>
              <p className="text-slate-500 text-[10px]">System Administration</p>
            </div>
          </div>
        </div>
        <div className="p-4 mx-3 mt-3 rounded-xl" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <p className="text-white font-semibold text-sm">{user?.name}</p>
          <p className="text-red-300 text-xs mt-0.5">{user?.employeeId}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.25)', color: '#fca5a5' }}>Administrator</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={17} /><span className="flex-1">{label}</span><ChevronRight size={14} className="opacity-40" />
            </NavLink>
          ))}
        </nav>
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { logout(); navigate('/login'); }} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4" style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <h1 className="text-white font-semibold text-lg">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm">Academic Year 2025-26</p>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
