import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Save, User, Loader } from 'lucide-react';

const FIELDS = [
  { section: 'Basic Information', fields: [
    { key: 'name', label: 'Full Name (English)', type: 'text', required: true },
    { key: 'nameHindi', label: 'Full Name (Hindi)', type: 'text' },
    { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    { key: 'religion', label: 'Religion', type: 'text' },
    { key: 'category', label: 'Category', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
    { key: 'income', label: 'Annual Family Income (₹)', type: 'number' },
  ]},
  { section: 'Contact Information', fields: [
    { key: 'mobile', label: 'Student Mobile No.', type: 'tel', required: true },
    { key: 'parentsMobile', label: 'Parents\' Mobile No.', type: 'tel' },
    { key: 'emergencyContact', label: 'Emergency Contact', type: 'tel' },
    { key: 'homeAddress', label: 'Home Address', type: 'textarea' },
  ]},
  { section: 'Institutional Details', fields: [
    { key: 'hostel', label: 'Hostel', type: 'select', options: ['BH-1', 'BH-2', 'BH-3', 'GH', 'Day Scholar'] },
    { key: 'roomNo', label: 'Room Number', type: 'text' },
    { key: 'abcId', label: 'ABC ID', type: 'text' },
    { key: 'samagraId', label: 'Samagra ID', type: 'text' },
    { key: 'aadharNo', label: 'Aadhar Number', type: 'text' },
  ]},
  { section: 'Bank Details', fields: [
    { key: 'bankName', label: 'Bank Name', type: 'text' },
    { key: 'bankAddress', label: 'Bank Branch / Address', type: 'text' },
    { key: 'accountNo', label: 'Account Number', type: 'text' },
  ]},
];

export default function StudentProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/student/profile').then(res => { setForm(res.data || {}); setLoading(false); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/student/profile', form);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="spinner" /></div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.2)' }}>
          <User size={20} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Personal Information</h2>
          <p className="text-slate-400 text-sm">Fill all details as per your official documents</p>
        </div>
      </div>

      {/* Read-only info */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Academic Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Roll Number', user?.rollNo], ['Program', user?.program], ['Semester', user?.semester], ['Email', user?.email]].map(([label, value]) => (
            <div key={label}>
              <p className="text-slate-500 text-xs mb-1">{label}</p>
              <p className="text-white font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {FIELDS.map(({ section, fields }) => (
          <div key={section} className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-blue-500 block" />
              {section}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, label, type, options, required }) => (
                <div key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="form-label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
                  {type === 'select' ? (
                    <select className="form-input" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                      <option value="">Select {label}</option>
                      {options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea className="form-input" rows={3} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={`Enter ${label}`} />
                  ) : (
                    <input type={type} className="form-input" value={type === 'date' ? (form[key] ? new Date(form[key]).toISOString().split('T')[0] : '') : (form[key] || '')} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={`Enter ${label}`} required={required} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8 py-3">
          {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Personal Information'}
        </button>
      </form>
    </div>
  );
}
