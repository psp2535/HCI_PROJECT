import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, User, BookOpen, CreditCard, Receipt, LogOut, Bell, ChevronRight, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/profile', icon: User, label: 'Personal Info' },
  { to: '/student/subjects', icon: BookOpen, label: 'Subject Selection' },
  { to: '/student/payment', icon: CreditCard, label: 'Fee Payment' },
  { to: '/student/receipts', icon: Receipt, label: 'Receipts' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed lg:static z-30 flex flex-col h-full min-h-screen transition-all duration-300"
        style={{
          width: sidebarOpen ? '240px' : '0px',
          minWidth: sidebarOpen ? '240px' : '0px',
          overflow: 'hidden',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--color-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ width: '240px', minWidth: '240px' }} className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <img
                src="/iiitm-logo.png"
                alt="ABV-IIITM"
                className="w-8 h-8 rounded-full object-contain shrink-0"
                style={{ background: 'white', padding: '2px' }}
              />
              <div>
                <p className="text-white font-bold text-sm leading-tight">ABV-IIITM</p>
                <p className="text-slate-500 text-[10px]">Student Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* User Info */}
          <div className="mx-3 mt-3 p-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight truncate">{user?.name}</p>
                <p className="text-blue-300 text-xs mt-0.5 truncate">{user?.rollNo}</p>
              </div>
            </div>
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(37,99,235,0.25)', color: '#93c5fd' }}>
              {user?.program} · Sem {user?.currentSemester || user?.semester}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 mt-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span className="flex-1 text-sm">{label}</span>
                <ChevronRight size={13} className="opacity-30" />
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 mt-3">
              <LogOut size={16} /> <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--color-border)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2 rounded-xl transition-all"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>Semester Registration Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>AY 2025-26</span>
            <ThemeToggle />
            <button className="p-2 rounded-xl transition-all relative" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
