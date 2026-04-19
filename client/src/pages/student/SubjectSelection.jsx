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
          api.get('/subjects/available'),
          api.get('/student/registration-status')
        ]);
        setSubjects(subRes.data.allSubjects || []);
        setRegistration(regRes.data);
        if (regRes.data?.selectedSubjects) setSelected(regRes.data.selectedSubjects.map(s => s._id || s.id || s));
        if (regRes.data?.backlogSubjects) setBacklogs(regRes.data.backlogSubjects.map(s => s._id || s.id || s));
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
    // Get all subjects (core + selected electives)
    const allSelectedSubjects = [...new Set([...coreSubjects.map(s => s._id), ...selected])];
    
    if (totalCredits > 32) { 
      toast.error(`Total credits (${totalCredits}) exceed maximum limit of 32!`); 
      return; 
    }
    
    if (allSelectedSubjects.length === 0) {
      toast.error('Please select at least one subject!');
      return;
    }
    
    setSaving(true);
    try {
      const response = await api.post('/subjects/select', { 
        subjectIds: allSelectedSubjects, 
        backlogSubjectIds: backlogs 
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Subjects saved successfully!');
        // Refresh registration status
        const regRes = await api.get('/student/registration-status');
        setRegistration(regRes.data);
      } else {
        toast.error(response.data.message || 'Failed to save subjects');
      }
    } catch (err) {
      console.error('Subject selection error:', err);
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
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <BookOpen size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-2xl">Subject Selection</h2>
          <p className="text-slate-300 text-base mt-1">Semester {user?.semester} · Academic Year 2025-26</p>
        </div>
      </div>

      {/* Credit counter */}
      <div className={`glass-card p-6 flex items-center justify-between ${totalCredits > 32 ? 'border-2 border-red-500/30' : 'border-2 border-emerald-500/20'}`}>
        <div className="flex items-center gap-4">
          <Info size={22} className={totalCredits > 32 ? 'text-red-400' : 'text-emerald-400'} />
          <span className="text-white font-semibold text-lg">Total Credits Selected</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-48 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((totalCredits / 32) * 100, 100)}%`, background: totalCredits > 32 ? '#ef4444' : 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
          </div>
          <span className={`font-bold text-2xl ${totalCredits > 32 ? 'text-red-400' : 'text-emerald-400'}`}>{totalCredits} / 32</span>
          {totalCredits > 32 && <AlertCircle size={22} className="text-red-400" />}
        </div>
      </div>

      {/* Core Subjects */}
      <div className="glass-card p-8">
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Core Subjects <span className="text-slate-500 text-base font-normal">(Auto-enrolled)</span>
        </h3>
        {coreSubjects.length === 0 ? (
          <p className="text-slate-500 text-base">No core subjects found for this semester/program. Please contact admin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  {['S.No', 'Code', 'Subject Name', 'L-T-P', 'Credits', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-slate-300 text-sm font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coreSubjects.map((sub, i) => (
                  <tr key={sub._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-4 px-4 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-4 px-4 font-mono text-blue-300 text-sm font-semibold">{sub.subjectCode}</td>
                    <td className="py-4 px-4 text-white font-medium">{sub.subjectName}</td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-sm">{sub.ltp || 'N/A'}</td>
                    <td className="py-4 px-4"><span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(37,99,235,0.2)', color: '#93c5fd' }}>{sub.credits}</span></td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                        <CheckCircle size={16} /> Enrolled
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
        <div className="glass-card p-8">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            Elective Subjects
          </h3>
          <div className="space-y-3">
            {electiveSubjects.map((sub) => {
              const isSelected = selected.includes(sub._id);
              return (
                <div key={sub._id} className="flex items-center justify-between p-5 rounded-2xl transition-all cursor-pointer hover:scale-[1.01]"
                  style={{ background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', border: `2px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}` }}
                  onClick={() => setSelected(sel => sel.includes(sub._id) ? sel.filter(x => x !== sub._id) : [...sel, sub._id])}>
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                      {isSelected && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="font-mono text-purple-300 text-sm font-semibold">{sub.subjectCode}</span>
                    <span className="text-white text-base font-medium">{sub.subjectName}</span>
                    <span className="text-slate-500 text-sm">{sub.ltp || 'N/A'}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd' }}>{sub.credits} cr</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backlog section */}
      <div className="glass-card p-8">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          Backlog Courses
        </h3>
        <p className="text-slate-400 text-sm mb-4">Select backlog subjects if applicable. Total credits including backlogs must not exceed 32.</p>
        <p className="text-slate-500 text-base">No backlog subjects configured. Contact academic section if you have backlogs.</p>
      </div>

      <button onClick={handleSubmit} disabled={saving || totalCredits > 32} className="btn-primary flex items-center gap-3 px-10 py-4 text-base">
        {saving ? <Loader size={20} className="animate-spin" /> : <CheckCircle size={20} />}
        {saving ? 'Saving...' : 'Save Subject Selection'}
      </button>
    </div>
  );
}
