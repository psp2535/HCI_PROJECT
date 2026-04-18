import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, Loader } from 'lucide-react';

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
    // Reset form to ensure no cached data
    setForm({ 
      employeeId: '', 
      name: '', 
      email: '', 
      password: '', 
      role: 'verification_staff', 
      department: 'Computer Science' 
    });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)' }}>
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ABV-IIITM Gwalior</h1>
          <p className="text-slate-400 text-base mt-2">Create your staff account</p>
        </div>

        <div className="glass-card p-10">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="form-label text-base">Employee ID *</label>
                <input className="form-input text-base" placeholder="STAFF001" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required autoComplete="off" />
              </div>
              <div>
                <label className="form-label text-base">Role *</label>
                <select className="form-input text-base" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="verification_staff">Verification Staff</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label text-base">Full Name *</label>
              <input className="form-input text-base" placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} required autoComplete="off" />
            </div>

            <div>
              <label className="form-label text-base">Email *</label>
              <input type="email" className="form-input text-base" placeholder="yourname@iiitm.ac.in" value={form.email} onChange={e => set('email', e.target.value)} required autoComplete="off" />
            </div>

            <div>
              <label className="form-label text-base">Department *</label>
              <select className="form-input text-base" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Management">Management</option>
              </select>
            </div>

            <div>
              <label className="form-label text-base">Password *</label>
              <input type="password" className="form-input text-base" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold">
              {loading && <Loader size={22} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create Staff Account'}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-center text-slate-400 text-base mb-3">
              Student registration? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">Register here</Link>
            </p>
            <p className="text-center text-slate-400 text-base">
              Already have an account? <Link to="/login?type=staff" className="text-green-400 hover:text-green-300 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
