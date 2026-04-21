import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { GraduationCap, Loader, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ rollNo: '', name: '', email: '', password: '', program: 'IMT', batch: '2025', semester: '1' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setForm({ rollNo: '', name: '', email: '', password: '', program: 'IMT', batch: '2025', semester: '1' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/student/register', form);
      login(res.data.user, res.data.token);
      toast.success('Account created! Welcome to ABV-IIITM Portal.');
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-10">
      {/* Campus Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/campus.jpg')" }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,20,50,0.88) 0%, rgba(15,30,70,0.80) 50%, rgba(20,10,40,0.85) 100%)' }} />

      {/* Glowing orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

      <div className="relative z-10 w-full max-w-xl mx-auto px-4 animate-fade-in-up">

        {/* Header */}
        <div className="text-center mb-7">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: 'white', padding: '5px', boxShadow: '0 0 30px rgba(59,130,246,0.35)' }}
          >
            <img src="/iiitm-logo.png" alt="ABV-IIITM" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight">ABV-IIITM Gwalior</h1>
          <p className="text-blue-200 text-xs mt-1 font-medium tracking-widest uppercase opacity-80">Student Registration</p>
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
          <div className="px-8 pt-7 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)' }}>
                <GraduationCap size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Create Student Account</h2>
                <p className="text-slate-400 text-xs">Fill in your details below</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Roll Number *</label>
                  <input className="form-input" placeholder="2025IMT-001" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} required autoComplete="off" />
                </div>
                <div>
                  <label className="form-label">Program *</label>
                  <select className="form-input" value={form.program} onChange={e => set('program', e.target.value)}>
                    {['BCS', 'IMT', 'BEE', 'IMG', 'BMS', 'MBA', 'MTECH'].map(p => <option key={p}>{p}</option>)}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Batch Year</label>
                  <select className="form-input" value={form.batch} onChange={e => set('batch', e.target.value)}>
                    {['2025', '2024', '2023', '2022', '2021'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Current Semester</label>
                  <select className="form-input" value={form.semester} onChange={e => set('semester', e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}
              >
                {loading && <Loader size={20} className="animate-spin" />}
                {loading ? 'Creating account...' : 'Create Student Account'}
              </button>
            </form>

            <div className="mt-5 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Link to="/login" className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors">
                <ArrowLeft size={15} /> Back to Login
              </Link>
              <Link to="/staff-register?type=staff" className="text-violet-400 text-sm hover:text-violet-300 font-semibold transition-colors">
                Staff Registration →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">ABV-IIITM Gwalior · Academic Year 2025-26</p>
      </div>
    </div>
  );
}
