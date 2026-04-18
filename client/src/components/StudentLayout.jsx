import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LayoutDashboard, User, BookOpen, CreditCard, Receipt, LogOut, Bell, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/profile', icon: User, label: 'Personal Info' },
  { to: '/student/subjects', icon: BookOpen, label: 'Subject Selection' },
  { to: '/student/payment', icon: CreditCard, label: 'Fee Payment' },
  { to: '/student/fee-receipts', icon: Receipt, label: 'Fee Receipts' },
  { to: '/student/receipts', icon: Receipt, label: 'Receipts' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        {/* Brand */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">ABV-IIITM</p>
              <p className="text-slate-500 text-[10px]">Student Portal</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 mx-3 mt-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            {user?.name?.charAt(0)}
          </div>
          <p className="text-white font-semibold text-sm leading-tight">{user?.name}</p>
          <p className="text-blue-300 text-xs mt-0.5">{user?.rollNo}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(37,99,235,0.25)', color: '#93c5fd' }}>{user?.program} · Sem {user?.semester}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={14} className="opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4" style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <h1 className="text-white font-semibold text-lg">Semester Registration Portal</h1>
          <div className="flex items-center gap-3">
            <p className="text-slate-400 text-sm">Academic Year 2025-26</p>
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
