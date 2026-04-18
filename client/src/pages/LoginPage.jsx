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
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(37,99,235,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 50%)' }} />
        
        {/* Logo */}
        <div className="relative z-10 text-center mb-12">
          <div className="w-28 h-28 mx-auto mb-8 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
            <GraduationCap size={56} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">ABV-IIITM</h1>
          <p className="text-blue-300 text-xl font-semibold">Gwalior</p>
          <p className="text-slate-400 mt-3 text-base leading-relaxed">ABV - Indian Institute of Information Technology<br/>and Management</p>
        </div>

        <div className="relative z-10 glass-card p-8 w-full max-w-md">
          <h2 className="text-white font-bold text-xl mb-6">Online Semester Registration</h2>
          <div className="space-y-4">
            {[
              ['📋', 'Personal Info & Documents'],
              ['📚', 'Subject Selection & Credit Management'],
              ['💳', 'Fee Payment & Receipt Generation'],
              ['✅', 'Multi-level Approval Workflow'],
              ['📊', 'Real-time Status Tracking'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-slate-300 text-base">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Demo Buttons */}
        <div className="relative z-10 mt-8 w-full max-w-md">
          <p className="text-slate-500 text-sm font-semibold mb-4 text-center tracking-wide">QUICK DEMO ACCESS</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Student', 'student', '#2563eb'],
              ['Accounts', 'staff', '#059669'],
              ['Faculty', 'faculty', '#7c3aed'],
              ['Admin', 'admin', '#dc2626'],
            ].map(([label, type, color]) => (
              <button key={type} onClick={() => { setLoginType(type === 'student' ? 'student' : 'staff'); fillDemo(type); }}
                className="text-sm py-3 px-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg"
                style={{ background: `${color}22`, border: `1px solid ${color}44`, color: '#e2e8f0' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ABV-IIITM Gwalior</h1>
          </div>

          <div className="glass-card p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
              <p className="text-slate-400 text-base mt-2">Sign in to your account</p>
            </div>

            {/* Login Type Toggle */}
            <div className="flex gap-3 mb-8 p-1.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <button onClick={() => { setLoginType('student'); setFormData({ id: '', password: '' }); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold transition-all ${loginType === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <GraduationCap size={20} /> Student
              </button>
              <button onClick={() => { setLoginType('staff'); setFormData({ id: '', password: '' }); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold transition-all ${loginType === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <Users size={20} /> Staff / Faculty
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label text-base">
                  {loginType === 'student' ? 'Roll Number' : 'Employee ID'}
                </label>
                <input
                  type="text"
                  className="form-input text-base"
                  placeholder={loginType === 'student' ? 'e.g. 2023IMT-001' : 'e.g. STAFF001'}
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label text-base">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-12 text-base"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold">
                {loading ? <Loader size={22} className="animate-spin" /> : <Lock size={22} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-center text-slate-500 text-sm mb-4">New student? Register here</p>
              <Link to="/register" className="block text-center text-blue-400 text-base font-semibold hover:text-blue-300 transition-colors">
                Create Account →
              </Link>
            </div>

            {/* Mobile demo buttons */}
            <div className="lg:hidden mt-6">
              <p className="text-slate-500 text-xs font-semibold mb-3 text-center tracking-wide">QUICK DEMO</p>
              <div className="grid grid-cols-2 gap-2">
                {[['Student', 'student'], ['Accounts', 'staff'], ['Faculty', 'faculty'], ['Admin', 'admin']].map(([label, type]) => (
                  <button key={type} onClick={() => { setLoginType(type === 'student' ? 'student' : 'staff'); fillDemo(type); }}
                    className="text-sm py-2 px-3 rounded-lg font-medium text-slate-300 transition-all hover:scale-105"
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
