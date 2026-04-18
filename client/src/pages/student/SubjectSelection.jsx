import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle, AlertCircle, Loader, Info } from 'lucide-react';

export default function SubjectSelection() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [selected, setSelected] = useState([]);
  const [backlogs, setBacklogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalCredits = [...subjects.filter(s => selected.includes(s._id)), ...subjects.filter(s => backlogs.includes(s._id))].reduce((sum, s) => sum + s.credits, 0);

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, regRes] = await Promise.all([
          api.get(`/subjects?program=${user?.program}&semester=${user?.semester}`),
          api.get('/student/registration-status')
        ]);
        setSubjects(subRes.data);
        setRegistration(regRes.data);
        if (regRes.data?.selectedSubjects) setSelected(regRes.data.selectedSubjects.map(s => s._id || s));
        if (regRes.data?.backlogSubjects) setBacklogs(regRes.data.backlogSubjects.map(s => s._id || s));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleSubject = (id, type) => {
    if (type === 'backlog') {
      setBacklogs(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id]);
    } else {
      // Core subjects are auto-selected, can't be removed
    }
  };

  const handleSubmit = async () => {
    if (totalCredits > 32) { toast.error('Total credits exceed 32!'); return; }
    setSaving(true);
    try {
      await api.post('/subjects/select', { subjectIds: selected, backlogSubjectIds: backlogs });
      toast.success('Subjects saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subjects');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;

  const coreSubjects = subjects.filter(s => s.type === 'core');
  const electiveSubjects = subjects.filter(s => s.type === 'elective');

  // Auto-select core subjects
  const allSelected = [...new Set([...coreSubjects.map(s => s._id), ...selected])];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <BookOpen size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Subject Selection</h2>
          <p className="text-slate-400 text-sm">Semester {user?.semester} · Academic Year 2025-26</p>
        </div>
      </div>

      {/* Credit counter */}
      <div className={`glass-card p-4 flex items-center justify-between ${totalCredits > 32 ? 'border border-red-500/30' : 'border border-emerald-500/20'}`}>
        <div className="flex items-center gap-3">
          <Info size={18} className={totalCredits > 32 ? 'text-red-400' : 'text-emerald-400'} />
          <span className="text-white font-medium text-sm">Total Credits Selected</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-36 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((totalCredits / 32) * 100, 100)}%`, background: totalCredits > 32 ? '#ef4444' : 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
          </div>
          <span className={`font-bold text-lg ${totalCredits > 32 ? 'text-red-400' : 'text-emerald-400'}`}>{totalCredits} / 32</span>
          {totalCredits > 32 && <AlertCircle size={18} className="text-red-400" />}
        </div>
      </div>

      {/* Core Subjects */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Core Subjects <span className="text-slate-500 text-sm font-normal">(Auto-enrolled)</span>
        </h3>
        {coreSubjects.length === 0 ? (
          <p className="text-slate-500 text-sm">No core subjects found for this semester/program. Please contact admin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['S.No', 'Code', 'Subject Name', 'L-T-P', 'Credits', 'Status'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-slate-400 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coreSubjects.map((sub, i) => (
                  <tr key={sub._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                    <td className="py-3 px-3 font-mono text-blue-300 text-xs">{sub.code}</td>
                    <td className="py-3 px-3 text-white font-medium">{sub.name}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-xs">{sub.ltp}</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(37,99,235,0.2)', color: '#93c5fd' }}>{sub.credits}</span></td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle size={13} /> Enrolled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Elective Subjects */}
      {electiveSubjects.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Elective Subjects
          </h3>
          <div className="space-y-2">
            {electiveSubjects.map((sub) => {
              const isSelected = selected.includes(sub._id);
              return (
                <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer"
                  style={{ background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}` }}
                  onClick={() => setSelected(sel => sel.includes(sub._id) ? sel.filter(x => x !== sub._id) : [...sel, sub._id])}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                      {isSelected && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <span className="font-mono text-purple-300 text-xs">{sub.code}</span>
                    <span className="text-white text-sm font-medium">{sub.name}</span>
                    <span className="text-slate-500 text-xs">{sub.ltp}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd' }}>{sub.credits} cr</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backlog section */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Backlog Courses
        </h3>
        <p className="text-slate-400 text-xs mb-4">Select backlog subjects if applicable. Total credits including backlogs must not exceed 32.</p>
        <p className="text-slate-500 text-sm">No backlog subjects configured. Contact academic section if you have backlogs.</p>
      </div>

      <button onClick={handleSubmit} disabled={saving || totalCredits > 32} className="btn-primary flex items-center gap-2 px-8 py-3">
        {saving ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
        {saving ? 'Saving...' : 'Save Subject Selection'}
      </button>
    </div>
  );
}
