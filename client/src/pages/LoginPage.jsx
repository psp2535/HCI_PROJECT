import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { GraduationCap, Users, Lock, Eye, EyeOff, Loader } from 'lucide-react';

export default function LoginPage() {
  const [loginType, setLoginType] = useState('student');
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (loginType === 'student') {
        res = await api.post('/auth/student/login', { rollNo: formData.id, password: formData.password });
      } else {
        res = await api.post('/auth/staff/login', { employeeId: formData.id, password: formData.password });
      }
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);

      const role = res.data.user.role;
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'verification_staff') navigate('/verification/dashboard');
      else if (role === 'faculty') navigate('/faculty/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'student') setFormData({ id: '2023IMT-001', password: 'Student@123' });
    else if (type === 'staff') setFormData({ id: 'STAFF001', password: 'Staff@123' });
    else if (type === 'faculty') setFormData({ id: 'FAC001', password: 'Faculty@123' });
    else if (type === 'admin') { setLoginType('staff'); setFormData({ id: 'ADMIN001', password: 'Admin@123' }); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(37,99,235,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 50%)' }} />
        
        {/* Logo */}
        <div className="relative z-10 text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
            <GraduationCap size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">ABV-IIITM</h1>
          <p className="text-blue-300 text-lg font-medium">Gwalior</p>
          <p className="text-slate-400 mt-1 text-sm">ABV - Indian Institute of Information Technology<br/>and Management</p>
        </div>

        <div className="relative z-10 glass-card p-6 w-full max-w-sm">
          <h2 className="text-white font-semibold text-lg mb-4">Online Semester Registration</h2>
          <div className="space-y-3">
            {[
              ['📋', 'Personal Info & Documents'],
              ['📚', 'Subject Selection & Credit Management'],
              ['💳', 'Fee Payment & Receipt Generation'],
              ['✅', 'Multi-level Approval Workflow'],
              ['📊', 'Real-time Status Tracking'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Demo Buttons */}
        <div className="relative z-10 mt-6 w-full max-w-sm">
          <p className="text-slate-500 text-xs font-medium mb-3 text-center">QUICK DEMO ACCESS</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Student', 'student', '#2563eb'],
              ['Accounts', 'staff', '#059669'],
              ['Faculty', 'faculty', '#7c3aed'],
              ['Admin', 'admin', '#dc2626'],
            ].map(([label, type, color]) => (
              <button key={type} onClick={() => { setLoginType(type === 'student' ? 'student' : 'staff'); fillDemo(type); }}
                className="text-xs py-2 px-3 rounded-lg font-medium transition-all hover:scale-105"
                style={{ background: `${color}22`, border: `1px solid ${color}44`, color: '#e2e8f0' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ABV-IIITM Gwalior</h1>
          </div>

          <div className="glass-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
            </div>

            {/* Login Type Toggle */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <button onClick={() => { setLoginType('student'); setFormData({ id: '', password: '' }); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${loginType === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <GraduationCap size={16} /> Student
              </button>
              <button onClick={() => { setLoginType('staff'); setFormData({ id: '', password: '' }); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${loginType === 'staff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Users size={16} /> Staff / Faculty
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">
                  {loginType === 'student' ? 'Roll Number' : 'Employee ID'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={loginType === 'student' ? 'e.g. 2023IMT-001' : 'e.g. STAFF001'}
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <Loader size={18} className="animate-spin" /> : <Lock size={18} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-center text-slate-500 text-xs mb-3">New student? Register here</p>
              <Link to="/register" className="block text-center text-blue-400 text-sm hover:text-blue-300 transition-colors">
                Create Account →
              </Link>
            </div>

            {/* Mobile demo buttons */}
            <div className="lg:hidden mt-4">
              <p className="text-slate-500 text-xs font-medium mb-2 text-center">QUICK DEMO</p>
              <div className="grid grid-cols-2 gap-2">
                {[['Student', 'student'], ['Accounts', 'staff'], ['Faculty', 'faculty'], ['Admin', 'admin']].map(([label, type]) => (
                  <button key={type} onClick={() => { setLoginType(type === 'student' ? 'student' : 'staff'); fillDemo(type); }}
                    className="text-xs py-1.5 px-2 rounded-lg font-medium text-slate-300 transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
