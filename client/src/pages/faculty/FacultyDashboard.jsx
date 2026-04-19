import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, BookOpen, Users, Loader, UserCheck, List, Filter, Download } from 'lucide-react';

export default function FacultyDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [processing, setProcessing] = useState('');
  const [activeTab, setActiveTab] = useState('approvals');
  const [courseRegistrations, setCourseRegistrations] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    console.log('Current path:', path);
    console.log('Setting active tab based on path...');
    
    if (path.includes('/students')) {
      console.log('Setting tab to approvals for /students route');
      setActiveTab('approvals');
    } else if (path.includes('/dashboard')) {
      console.log('Setting tab to approvals for /dashboard route');
      setActiveTab('approvals');
    } else if (path.includes('/courses')) {
      console.log('Setting tab to courses for /courses route');
      setActiveTab('courses');
    }
    
    console.log('Active tab set to:', activeTab);
  }, [location.pathname]);

  const loadCourseRegistrations = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedProgram) params.append('program', selectedProgram);
      if (selectedSemester) params.append('semester', selectedSemester);
      
      const response = await api.get(`/faculty/course-registrations?${params}`);
      setCourseRegistrations(response.data.registrations);
      setSubjectGroups(response.data.subjectGroups);
      setAvailableSubjects(response.data.availableSubjects);
    } catch (err) { 
      console.error(err); 
      toast.error('Failed to load course registrations');
    }
  };

  const load = async () => {
    try {
      console.log('Loading faculty dashboard data...');
      const [regRes, statRes] = await Promise.all([
        api.get('/faculty/students'),
        api.get('/faculty/stats')
      ]);
      console.log('Faculty registrations response:', regRes.data);
      console.log('Faculty stats response:', statRes.data);
      setRegistrations(regRes.data);
      setStats(statRes.data);
      
      // Also load course registrations if on that tab
      if (activeTab === 'courses') {
        await loadCourseRegistrations();
      }
    } catch (err) { 
      console.error('Faculty dashboard load error:', err); 
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeTab === 'courses') {
      loadCourseRegistrations();
    }
  }, [activeTab, selectedSubject, selectedProgram, selectedSemester]);

  const handleApprove = async (regId, action) => {
    setProcessing(regId + action);
    try {
      await api.post(`/faculty/approve/${regId}`, { action, remarks: remarks[regId] || '' });
      toast.success(`Registration ${action === 'approve' ? 'approved' : 'rejected'}!`);
      await load();
    } catch (err) { toast.error('Action failed'); }
    finally { setProcessing(''); }
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedProgram) params.append('program', selectedProgram);
      if (selectedSemester) params.append('semester', selectedSemester);
      
      const response = await api.get(`/faculty/export-attendance-pdf?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-list-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Attendance list exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export attendance list');
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;

  const pending = registrations.filter(r => r.verificationStatus === 'approved' && r.facultyApprovalStatus === 'pending');

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl">
        <button
          onClick={() => {
            console.log('Student Registrations tab clicked');
            setActiveTab('approvals');
            console.log('Navigating to /faculty/students');
            navigate('/faculty/students');
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'approvals' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Users size={18} />
          Student Registrations
        </button>
        <button
          onClick={() => {
            console.log('Course Registrations tab clicked');
            setActiveTab('courses');
            console.log('Navigating to /faculty/courses');
            navigate('/faculty/courses');
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'courses' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <BookOpen size={18} />
          Course Registrations
        </button>
      </div>

      {/* Course Registrations Tab */}
      {activeTab === 'courses' && (
        (() => {
          console.log('Rendering Course Registrations tab');
          return (
        <div className="space-y-6">
          {/* Filters */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Filter size={18} className="text-purple-400" /> Filters
              </h3>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download size={16} />
                Export PDF
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 text-sm block mb-2">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">All Programs</option>
                  {[...new Set(availableSubjects.map(s => s.program))].map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-2">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">All Semesters</option>
                  {[...new Set(availableSubjects.map(s => s.semester))].sort().map(semester => (
                    <option key={semester} value={semester}>Semester {semester}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">All Subjects</option>
                  {availableSubjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectCode} - {subject.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Course-wise Attendance Lists */}
          {subjectGroups.map(group => (
            <div key={group.subject._id} className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <List size={18} className="text-purple-400" />
                {group.subject.subjectCode} - {group.subject.subjectName}
                <span className="text-sm text-slate-400">
                  ({group.subject.program} - Sem {group.subject.semester})
                </span>
              </h3>
              <div className="mb-4">
                <span className="text-sm text-slate-400">
                  Total Students: {group.students.length} | 
                  Credits: {group.subject.credits} | 
                  Type: <span className="capitalize">{group.subject.type}</span>
                </span>
              </div>
              {group.students.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No students registered for this subject</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Roll No</th>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Name</th>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Program</th>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Semester</th>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Email</th>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Mobile</th>
                        <th className="text-left py-3 px-4 text-slate-300 font-bold">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.students.map((student, index) => (
                        <tr key={student._id} className="hover:bg-slate-800/30" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="py-3 px-4 text-blue-300 font-mono">{student.rollNo}</td>
                          <td className="py-3 px-4 text-white font-medium">{student.name}</td>
                          <td className="py-3 px-4 text-slate-400">{student.program}</td>
                          <td className="py-3 px-4 text-slate-400">{student.semester}</td>
                          <td className="py-3 px-4 text-slate-400 text-sm">{student.email}</td>
                          <td className="py-3 px-4 text-slate-400 text-sm">{student.mobile}</td>
                          <td className="py-3 px-4">
                            {student.isBacklog ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Backlog
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Regular
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      );
        })()
      )}

      {/* Student Approvals Tab */}
      {activeTab === 'approvals' && (
        (() => {
          console.log('Rendering Student Approvals tab');
          return (
        <div className="space-y-6">
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
        })()
      )}
    </div>
  );
}
