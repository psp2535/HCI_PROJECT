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
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)' }}>
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ABV-IIITM Gwalior</h1>
          <p className="text-slate-400 text-base mt-2">Create your student account</p>
        </div>

        <div className="glass-card p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="form-label text-base">Roll Number *</label>
                <input className="form-input text-base" placeholder="2025IMT-001" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} required />
              </div>
              <div>
                <label className="form-label text-base">Program *</label>
                <select className="form-input text-base" value={form.program} onChange={e => set('program', e.target.value)}>
                  {['BCS', 'IMT', 'BEE', 'IMG', 'BMS', 'MBA', 'MTECH'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label text-base">Full Name *</label>
              <input className="form-input text-base" placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div>
              <label className="form-label text-base">Email *</label>
              <input type="email" className="form-input text-base" placeholder="yourname@iiitm.ac.in" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="form-label text-base">Batch Year</label>
                <select className="form-input text-base" value={form.batch} onChange={e => set('batch', e.target.value)}>
                  {['2025', '2024', '2023', '2022', '2021'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label text-base">Current Semester</label>
                <select className="form-input text-base" value={form.semester} onChange={e => set('semester', e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label text-base">Password *</label>
              <input type="password" className="form-input text-base" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold">
              {loading && <Loader size={22} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-base mt-6">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
