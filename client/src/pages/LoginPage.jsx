import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { GraduationCap, Users, Lock, Eye, EyeOff, Loader, UserCheck, BookOpen, Shield } from 'lucide-react';

export default function LoginPage() {
  const [loginType, setLoginType] = useState('student');
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'staff') setLoginType('staff');
  }, [searchParams]);

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
    if (type === 'student') { setLoginType('student'); setFormData({ id: '2023IMT-001', password: 'Student@123' }); }
    else if (type === 'staff')   { setLoginType('staff');   setFormData({ id: 'STAFF001',    password: 'Staff@123' }); }
    else if (type === 'faculty') { setLoginType('staff');   setFormData({ id: 'FAC001',      password: 'Faculty@123' }); }
    else if (type === 'admin')   { setLoginType('staff');   setFormData({ id: 'ADMIN001',    password: 'Admin@123' }); }
  };

  const isStudent = loginType === 'student';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

      {/* ── Background ── */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/campus.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(4, 8, 24, 0.80)' }} />

      {/* Glow blobs */}
      <div style={{ position: 'absolute', top: '-80px', left: '10%', width: '480px', height: '480px', borderRadius: '50%', background: '#1d4ed8', opacity: 0.08, filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '10%', width: '380px', height: '380px', borderRadius: '50%', background: '#7c3aed', opacity: 0.08, filter: 'blur(90px)', pointerEvents: 'none' }} />

      {/* ── Content ── */}
      <div className="animate-fade-in-up" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px' }}>

        {/* Logo + Institute Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%',
            background: 'white', padding: '7px', marginBottom: '18px',
            boxShadow: '0 0 0 4px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.5), 0 0 50px rgba(59,130,246,0.25)',
          }}>
            <img src="/iiitm-logo.png" alt="ABV-IIITM" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            ABV-IIITM Gwalior
          </h1>
          <p style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '8px', opacity: 0.85 }}>
            Semester Registration Portal
          </p>
        </div>

        {/* ── Main Card ── */}
        <div style={{
          background: 'rgba(6, 12, 30, 0.90)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { key: 'student', label: 'Student', Icon: GraduationCap },
              { key: 'staff',   label: 'Staff / Faculty', Icon: Users },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => { setLoginType(key); setFormData({ id: '', password: '' }); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '16px 12px', fontSize: '14px', fontWeight: 600,
                  color: loginType === key ? '#fff' : '#4b637a',
                  borderBottom: `2px solid ${loginType === key ? (key === 'student' ? '#3b82f6' : '#8b5cf6') : 'transparent'}`,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottomStyle: 'solid',
                  transition: 'color 0.2s',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div style={{ padding: '32px' }}>
            <h2 style={{ color: '#e8f0fe', fontWeight: 700, fontSize: '20px', marginBottom: '24px' }}>
              Sign in to your account
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label">
                  {isStudent ? 'Roll Number' : 'Employee ID'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isStudent ? 'e.g. 2023IMT-001' : 'e.g. FAC001'}
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '50px' }}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4b637a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-lg ${isStudent ? 'btn-primary' : ''}`}
                style={{
                  width: '100%', marginTop: '4px',
                  background: isStudent
                    ? 'linear-gradient(135deg, #1d4ed8, #4f46e5)'
                    : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  boxShadow: isStudent
                    ? '0 6px 24px rgba(29,78,216,0.45)'
                    : '0 6px 24px rgba(124,58,237,0.45)',
                  color: '#fff',
                }}
              >
                {loading ? <Loader size={20} className="animate-spin" /> : <Lock size={20} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Register links */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '24px', paddingTop: '24px' }}>
              <p style={{ textAlign: 'center', color: '#3d5475', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
                New here?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                  to="/register"
                  style={{
                    flex: 1, textAlign: 'center', padding: '12px 16px',
                    borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
                    color: '#93c5fd', textDecoration: 'none', transition: 'all 0.2s',
                    display: 'block',
                  }}
                >
                  Student Registration
                </Link>
                <Link
                  to="/staff-register?type=staff"
                  style={{
                    flex: 1, textAlign: 'center', padding: '12px 16px',
                    borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                    background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)',
                    color: '#c4b5fd', textDecoration: 'none', transition: 'all 0.2s',
                    display: 'block',
                  }}
                >
                  Staff Registration
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Demo ── */}
        <div style={{ marginTop: '22px' }}>
          <p style={{ textAlign: 'center', color: '#4b637a', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Quick Demo Access
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'Student',   type: 'student', color: '#60a5fa', bg: 'rgba(59,130,246,0.16)',  border: 'rgba(59,130,246,0.4)',  Icon: GraduationCap },
              { label: 'Accounts',  type: 'staff',   color: '#34d399', bg: 'rgba(16,185,129,0.16)',  border: 'rgba(16,185,129,0.4)',  Icon: UserCheck },
              { label: 'Faculty',   type: 'faculty', color: '#c4b5fd', bg: 'rgba(139,92,246,0.16)',  border: 'rgba(139,92,246,0.4)',  Icon: BookOpen },
              { label: 'Admin',     type: 'admin',   color: '#fca5a5', bg: 'rgba(239,68,68,0.16)',   border: 'rgba(239,68,68,0.4)',   Icon: Shield },
            ].map(({ label, type, color, bg, border, Icon }) => (
              <button
                key={type}
                onClick={() => fillDemo(type)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
                  padding: '14px 8px', borderRadius: '14px', fontSize: '12px', fontWeight: 700,
                  color, background: bg, border: `1.5px solid ${border}`,
                  cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${border}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#22334d', fontSize: '11px', marginTop: '20px' }}>
          ABV-IIITM Gwalior · Academic Year 2025–26
        </p>
      </div>
    </div>
  );
}
