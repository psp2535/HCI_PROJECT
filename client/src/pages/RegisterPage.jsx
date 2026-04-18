import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { GraduationCap, Loader } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ rollNo: '', name: '', email: '', password: '', program: 'IMT', batch: '2025', semester: '2' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)' }}>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ABV-IIITM Gwalior</h1>
          <p className="text-slate-400 text-sm mt-1">Create your student account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Roll Number *</label>
                <input className="form-input" placeholder="2025IMT-001" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} required />
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
              <input className="form-input" placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" placeholder="yourname@iiitm.ac.in" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading && <Loader size={18} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
