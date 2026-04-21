import { useEffect, useState, useMemo } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle, AlertCircle, Loader, Info, Search } from 'lucide-react';

export default function SubjectSelection() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);        // ALL subjects from API
  const [registration, setRegistration] = useState(null);
  const [selected, setSelected] = useState([]);         // IDs of selected electives
  const [backlogs, setBacklogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'core' | 'elective'

  // ─── Derive ALL core subjects from full subject list (not filtered view) ───
  const allCoreSubjects = useMemo(() => subjects.filter(s => s.type === 'core'), [subjects]);
  const allElectiveSubjects = useMemo(() => subjects.filter(s => s.type === 'elective'), [subjects]);

  // ─── Filtered view for display only (search + type filter) ───
  const filteredSubjects = useMemo(() => subjects.filter(subject => {
    const matchesSearch =
      searchTerm === '' ||
      subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || subject.type === filterType;
    return matchesSearch && matchesType;
  }), [subjects, searchTerm, filterType]);

  const filteredCoreSubjects = useMemo(() => filteredSubjects.filter(s => s.type === 'core'), [filteredSubjects]);
  const filteredElectiveSubjects = useMemo(() => filteredSubjects.filter(s => s.type === 'elective'), [filteredSubjects]);

  // ─── Total credits = ALL core + user-selected electives (always from full list) ───
  const totalCredits = useMemo(() => {
    const coreCredits = allCoreSubjects.reduce((sum, s) => sum + s.credits, 0);
    const electiveCredits = allElectiveSubjects
      .filter(s => selected.includes(s._id))
      .reduce((sum, s) => sum + s.credits, 0);
    const backlogCredits = subjects
      .filter(s => backlogs.includes(s._id))
      .reduce((sum, s) => sum + s.credits, 0);
    return coreCredits + electiveCredits + backlogCredits;
  }, [allCoreSubjects, allElectiveSubjects, subjects, selected, backlogs]);

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, regRes] = await Promise.all([
          api.get('/subjects/available'),
          api.get('/student/registration-status')
        ]);
        const allSubs = subRes.data.allSubjects || [];
        setSubjects(allSubs);
        setRegistration(regRes.data);

        // Pre-populate previously selected electives from saved registration
        if (regRes.data?.selectedSubjects?.length > 0) {
          const savedIds = regRes.data.selectedSubjects.map(s => s._id || s.id || s);
          // Only pre-select electives (core are always auto-enrolled)
          const electiveIds = savedIds.filter(id =>
            allSubs.find(s => (s._id === id || s._id?.toString() === id?.toString()) && s.type === 'elective')
          );
          setSelected(electiveIds);
        }
        if (regRes.data?.backlogSubjects?.length > 0) {
          setBacklogs(regRes.data.backlogSubjects.map(s => s._id || s.id || s));
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
        toast.error('Failed to load subjects. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleElective = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  const handleSubmit = async () => {
    // Always use ALL core subjects (from full list, not filtered view)
    const coreIds = allCoreSubjects.map(s => s._id);
    const allSelectedIds = [...new Set([...coreIds, ...selected])];

    if (totalCredits > 32) {
      toast.error(`Total credits (${totalCredits}) exceed the maximum limit of 32!`);
      return;
    }
    if (allSelectedIds.length === 0) {
      toast.error('No subjects found. Please contact admin.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/subjects/select', {
        subjectIds: allSelectedIds,
        backlogSubjectIds: backlogs
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Subjects saved successfully!');
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

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <div className="spinner" />
    </div>
  );

  const isRegistrationLocked = registration?.verificationStatus === 'approved' ||
    registration?.overallStatus === 'final_approved';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <BookOpen size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-2xl">Subject Selection</h2>
          <p className="text-slate-300 text-base mt-1">
            Semester {user?.currentSemester || user?.semester} · Academic Year 2025-26
          </p>
        </div>
      </div>

      {/* Locked Banner */}
      {isRegistrationLocked && (
        <div className="glass-card p-4 flex items-center gap-3 border border-amber-500/30">
          <AlertCircle size={20} className="text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            Your registration is under review. Subject selection is locked.
          </p>
        </div>
      )}

      {/* No subjects found */}
      {subjects.length === 0 && (
        <div className="glass-card p-8 text-center">
          <BookOpen size={40} className="text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-lg font-medium">No subjects found</p>
          <p className="text-slate-500 text-sm mt-1">
            Subjects for your program (Semester {user?.currentSemester || user?.semester}) have not been uploaded yet. Please contact the admin.
          </p>
        </div>
      )}

      {subjects.length > 0 && (
        <>
          {/* Search and Filter */}
          <div className="glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search subjects by name or code..."
                    className="form-input pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { label: `All (${subjects.length})`, value: 'all', activeClass: 'bg-purple-600 text-white' },
                  { label: `Core (${allCoreSubjects.length})`, value: 'core', activeClass: 'bg-blue-600 text-white' },
                  { label: `Electives (${allElectiveSubjects.length})`, value: 'elective', activeClass: 'bg-amber-600 text-white' },
                ].map(({ label, value, activeClass }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      filterType === value ? activeClass : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-slate-400">
                Found {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>

          {/* Credit Counter */}
          <div className={`glass-card p-6 flex items-center justify-between ${totalCredits > 32 ? 'border-2 border-red-500/30' : 'border-2 border-emerald-500/20'}`}>
            <div className="flex items-center gap-4">
              <Info size={22} className={totalCredits > 32 ? 'text-red-400' : 'text-emerald-400'} />
              <div>
                <span className="text-white font-semibold text-lg">Total Credits Selected</span>
                <p className="text-slate-400 text-xs mt-0.5">
                  {allCoreSubjects.length} core subjects auto-enrolled · {selected.length} elective{selected.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalCredits / 32) * 100, 100)}%`,
                    background: totalCredits > 32 ? '#ef4444' : 'linear-gradient(90deg, #2563eb, #7c3aed)'
                  }}
                />
              </div>
              <span className={`font-bold text-2xl ${totalCredits > 32 ? 'text-red-400' : 'text-emerald-400'}`}>
                {totalCredits} / 32
              </span>
              {totalCredits > 32 && <AlertCircle size={22} className="text-red-400" />}
            </div>
          </div>

          {/* Core Subjects */}
          {(filterType === 'all' || filterType === 'core') && (
            <div className="glass-card p-8">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Core Subjects
                <span className="text-slate-500 text-base font-normal">(Auto-enrolled)</span>
                <span className="ml-auto text-sm font-normal text-slate-400">
                  {filteredCoreSubjects.length} subject{filteredCoreSubjects.length !== 1 ? 's' : ''}
                </span>
              </h3>
              {filteredCoreSubjects.length === 0 ? (
                <p className="text-slate-500 text-base">
                  {searchTerm ? `No core subjects match "${searchTerm}".` : 'No core subjects found for this semester/program.'}
                </p>
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
                      {filteredCoreSubjects.map((sub, i) => (
                        <tr key={sub._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="py-4 px-4 text-slate-400 font-medium">{i + 1}</td>
                          <td className="py-4 px-4 font-mono text-blue-300 text-sm font-semibold">{sub.subjectCode}</td>
                          <td className="py-4 px-4 text-white font-medium">{sub.subjectName}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-sm">{sub.ltp || 'N/A'}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(37,99,235,0.2)', color: '#93c5fd' }}>
                              {sub.credits}
                            </span>
                          </td>
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
          )}

          {/* Elective Subjects */}
          {(filterType === 'all' || filterType === 'elective') && (
            <div className="glass-card p-8">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                Elective Subjects
                <span className="ml-auto text-sm font-normal text-slate-400">
                  {filteredElectiveSubjects.length} subject{filteredElectiveSubjects.length !== 1 ? 's' : ''}
                </span>
              </h3>
              {filteredElectiveSubjects.length === 0 ? (
                <p className="text-slate-500 text-base">
                  {searchTerm
                    ? `No elective subjects match "${searchTerm}".`
                    : 'No elective subjects available for this semester/program.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredElectiveSubjects.map((sub) => {
                    const isSelected = selected.includes(sub._id);
                    return (
                      <div
                        key={sub._id}
                        className={`flex items-center justify-between p-5 rounded-2xl transition-all ${isRegistrationLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.01]'}`}
                        style={{
                          background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `2px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`
                        }}
                        onClick={() => !isRegistrationLocked && toggleElective(sub._id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                            {isSelected && <CheckCircle size={14} className="text-white" />}
                          </div>
                          <span className="font-mono text-purple-300 text-sm font-semibold">{sub.subjectCode}</span>
                          <span className="text-white text-base font-medium">{sub.subjectName}</span>
                          <span className="text-slate-500 text-sm">{sub.ltp || 'N/A'}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd' }}>
                          {sub.credits} cr
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Backlog Section */}
          <div className="glass-card p-8">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Backlog Courses
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Select backlog subjects if applicable. Total credits including backlogs must not exceed 32.
            </p>
            <p className="text-slate-500 text-base">
              No backlog subjects configured. Contact the academic section if you have backlogs.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={saving || totalCredits > 32 || isRegistrationLocked}
            className="btn-primary flex items-center gap-3 px-10 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader size={20} className="animate-spin" /> : <CheckCircle size={20} />}
            {saving ? 'Saving...' : isRegistrationLocked ? 'Registration Locked' : 'Save Subject Selection'}
          </button>
        </>
      )}
    </div>
  );
}
