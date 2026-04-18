import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Users, CreditCard, BarChart2, Receipt, Loader, Database, Upload, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [processing, setProcessing] = useState('');
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const load = async () => {
    try {
      const [statRes, regRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/registrations')]);
      setStats(statRes.data);
      setRegistrations(regRes.data);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/admin/seed-demo');
      toast.success('Demo data seeded! Check the login credentials.');
      console.log('Credentials:', res.data.credentials);
      await load();
    } catch (err) { toast.error('Seeding failed'); }
    finally { setSeeding(false); }
  };

  const handleFinalApprove = async (regId, action) => {
    setProcessing(regId);
    try {
      await api.post(`/admin/final-approve/${regId}`, { action });
      toast.success(`Registration ${action}d!`);
      await load();
    } catch (err) { toast.error('Failed'); }
    finally { setProcessing(''); }
  };

  const handleSubjectPDFUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setUploadingPDF(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      
      const response = await api.post('/admin/upload-subjects-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(response.data.message || 'Subjects uploaded successfully!');
      setSelectedFile(null);
      // Reset file input
      document.getElementById('pdf-upload-input').value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingPDF(false);
    }
  };

  const pieData = [
    { name: 'Draft', value: registrations.filter(r => r.overallStatus === 'draft').length },
    { name: 'Payment Done', value: registrations.filter(r => r.overallStatus === 'payment_done').length },
    { name: 'Verified', value: registrations.filter(r => r.overallStatus === 'payment_verified').length },
    { name: 'Faculty OK', value: registrations.filter(r => r.overallStatus === 'faculty_approved').length },
    { name: 'Final Done', value: registrations.filter(r => r.overallStatus === 'final_approved').length },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;

  const pendingFinalApproval = registrations.filter(r => r.facultyApprovalStatus === 'approved' && r.adminApprovalStatus === 'pending');

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: '#3b82f6' },
          { label: 'Registrations', value: stats.totalRegistrations || 0, icon: BarChart2, color: '#8b5cf6' },
          { label: 'Pending Payments', value: stats.pendingPayments || 0, icon: CreditCard, color: '#f59e0b' },
          { label: 'Final Approved', value: stats.finalApproved || 0, icon: CheckCircle, color: '#10b981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">{label}</p>
              <p className="font-bold text-2xl text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Registration Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-500">No data yet. Seed demo data first.</div>}
        </div>

        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={seedDemo} disabled={seeding} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {seeding ? <Loader size={16} className="animate-spin" /> : <Database size={16} />}
              {seeding ? 'Seeding demo data...' : 'Seed Demo Data & Users'}
            </button>
            
            {/* Subject PDF Upload */}
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 mb-3 font-semibold flex items-center gap-2">
                <FileText size={14} />
                Upload Subject PDF
              </p>
              <div className="space-y-2">
                <input
                  id="pdf-upload-input"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <button
                  onClick={handleSubjectPDFUpload}
                  disabled={uploadingPDF || !selectedFile}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPDF ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
                  {uploadingPDF ? 'Processing...' : 'Upload & Process'}
                </button>
              </div>
            </div>
            
            <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 mb-2 font-semibold">Demo Credentials (after seeding):</p>
              {[
                ['Student', '2023IMT-001', 'Student@123'],
                ['Accounts Staff', 'STAFF001', 'Staff@123'],
                ['Faculty', 'FAC001', 'Faculty@123'],
                ['Admin', 'ADMIN001', 'Admin@123'],
              ].map(([role, id, pwd]) => (
                <div key={role} className="flex justify-between mb-1">
                  <span className="text-slate-500">{role}:</span>
                  <span className="text-white">{id} / {pwd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final Approval Queue */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <CheckCircle size={18} className="text-red-400" /> Pending Final Approval ({pendingFinalApproval.length})
        </h3>
        {pendingFinalApproval.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3 opacity-50" />
            <p className="text-slate-400">No registrations pending final approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Student', 'Roll No', 'Program', 'Sem', 'Credits', 'Verification', 'Faculty', 'Action'].map(h => (
                    <th key={h} className="py-2 px-3 text-left text-xs text-slate-400 font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingFinalApproval.map(reg => (
                  <tr key={reg._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 px-3 text-white font-medium">{reg.studentId?.name}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-xs">{reg.studentId?.rollNo}</td>
                    <td className="py-3 px-3 text-slate-400">{reg.studentId?.program}</td>
                    <td className="py-3 px-3 text-slate-400">{reg.studentId?.semester}</td>
                    <td className="py-3 px-3 text-blue-300 font-bold">{reg.totalCredits}</td>
                    <td className="py-3 px-3"><span className="text-xs text-emerald-400">✓ Verified</span></td>
                    <td className="py-3 px-3"><span className="text-xs text-purple-400">✓ Approved</span></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleFinalApprove(reg._id, 'approve')} disabled={processing === reg._id}
                          className="btn-success text-xs px-3 py-1.5 flex items-center gap-1">
                          {processing === reg._id ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                        </button>
                        <button onClick={() => handleFinalApprove(reg._id, 'reject')} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
