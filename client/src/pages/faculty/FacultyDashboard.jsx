import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, BookOpen, Users, Loader } from 'lucide-react';

export default function FacultyDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [processing, setProcessing] = useState('');

  const load = async () => {
    try {
      const [regRes, statRes] = await Promise.all([
        api.get('/faculty/students'),
        api.get('/faculty/stats')
      ]);
      setRegistrations(regRes.data);
      setStats(statRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (regId, action) => {
    setProcessing(regId + action);
    try {
      await api.post(`/faculty/approve/${regId}`, { action, remarks: remarks[regId] || '' });
      toast.success(`Registration ${action === 'approve' ? 'approved' : 'rejected'}!`);
      await load();
    } catch (err) { toast.error('Action failed'); }
    finally { setProcessing(''); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;

  const pending = registrations.filter(r => r.verificationStatus === 'approved' && r.facultyApprovalStatus === 'pending');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval', value: stats.pending || pending.length, color: '#f59e0b' },
          { label: 'Approved', value: stats.approved || 0, color: '#10b981' },
          { label: 'Rejected', value: stats.rejected || 0, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="font-bold text-3xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Users size={18} className="text-purple-400" /> Pending Academic Approvals
        </h3>
        {pending.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3 opacity-50" />
            <p className="text-slate-400">No pending approvals. All up to date!</p>
          </div>
        ) : pending.map(reg => (
          <div key={reg._id} className="mb-5 p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-bold">{reg.studentId?.name}</p>
                <p className="text-slate-400 text-sm">{reg.studentId?.rollNo} · {reg.studentId?.program} · Sem {reg.studentId?.semester}</p>
                <p className="text-blue-300 text-xs mt-1">Credits: {reg.totalCredits} / 32</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium status-${reg.overallStatus}`}>{reg.overallStatus?.replace(/_/g, ' ')}</span>
            </div>

            {/* Subjects */}
            <div className="mb-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Selected Subjects</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {reg.selectedSubjects?.map(sub => (
                  <div key={sub._id} className="p-2 rounded-lg text-xs" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>
                    <span className="text-blue-300 font-mono">{sub.code}</span> — <span className="text-white">{sub.name}</span>
                    <span className="text-slate-400 ml-1">({sub.credits}cr)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="text" placeholder="Add remarks (optional)..." className="form-input text-sm flex-1"
                value={remarks[reg._id] || ''} onChange={e => setRemarks(r => ({ ...r, [reg._id]: e.target.value }))} />
              <button onClick={() => handleApprove(reg._id, 'approve')} disabled={!!processing} className="btn-success flex items-center gap-2 py-2 px-4 text-sm whitespace-nowrap">
                {processing === reg._id + 'approve' ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
              </button>
              <button onClick={() => handleApprove(reg._id, 'reject')} disabled={!!processing} className="btn-danger flex items-center gap-2 py-2 px-4 text-sm whitespace-nowrap">
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
