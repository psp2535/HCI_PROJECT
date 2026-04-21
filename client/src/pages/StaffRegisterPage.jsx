import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, Loader, ArrowLeft } from 'lucide-react';

export default function StaffRegisterPage() {
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: 'verification_staff',
    department: 'Computer Science'
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setForm({ employeeId: '', name: '', email: '', password: '', role: 'verification_staff', department: 'Computer Science' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/staff/register', form);
      login(res.data.user, res.data.token);
      toast.success('Staff account created! Welcome to ABV-IIITM Portal.');
      const role = res.data.user.role;
      if (role === 'verification_staff') navigate('/verification/dashboard');
      else if (role === 'faculty') navigate('/faculty/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const roleColor = {
    verification_staff: '#10b981',
    faculty: '#8b5cf6',
    admin: '#ef4444'
  }[form.role] || '#8b5cf6';

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-10">
      {/* Campus Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/campus.jpg')" }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,20,50,0.88) 0%, rgba(15,30,70,0.80) 50%, rgba(20,10,40,0.85) 100%)' }} />

      {/* Glowing orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

      <div className="relative z-10 w-full max-w-xl mx-auto px-4 animate-fade-in-up">

        {/* Header */}
        <div className="text-center mb-7">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: 'white', padding: '5px', boxShadow: `0 0 30px ${roleColor}55` }}
          >
            <img src="/iiitm-logo.png" alt="ABV-IIITM" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight">ABV-IIITM Gwalior</h1>
          <p className="text-violet-200 text-xs mt-1 font-medium tracking-widest uppercase opacity-80">Staff Registration</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10, 18, 40, 0.78)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
          }}
        >
          <div className="px-8 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)` }}
              >
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Create Staff Account</h2>
                <p className="text-slate-400 text-xs">For faculty, verification staff & administrators</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Employee ID *</label>
                  <input className="form-input" placeholder="FAC001 / ADM001" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required autoComplete="off" />
                </div>
                <div>
                  <label className="form-label">Role *</label>
                  <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="verification_staff">Verification Staff</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} required autoComplete="off" />
              </div>

              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" placeholder="yourname@iiitm.ac.in" value={form.email} onChange={e => set('email', e.target.value)} required autoComplete="off" />
              </div>

              <div>
                <label className="form-label">Department *</label>
                <select className="form-input" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Management">Management</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              <div>
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}aa)`, boxShadow: `0 4px 20px ${roleColor}40` }}
              >
                {loading && <Loader size={20} className="animate-spin" />}
                {loading ? 'Creating account...' : 'Create Staff Account'}
              </button>
            </form>

            <div className="mt-5 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Link to="/login" className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors">
                <ArrowLeft size={15} /> Back to Login
              </Link>
              <Link to="/register" className="text-blue-400 text-sm hover:text-blue-300 font-semibold transition-colors">
                Student Registration →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">ABV-IIITM Gwalior · Academic Year 2025-26</p>
      </div>
    </div>
  );
}
