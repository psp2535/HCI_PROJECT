import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, MessageSquare, Loader, Filter, ChevronRight, List } from 'lucide-react';

export default function VerificationDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [processing, setProcessing] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('dashboard');

  // Add debugging for component lifecycle
  console.log('VerificationDashboard component rendering');
  console.log('Current location:', location.pathname);
  console.log('Active section:', activeSection);
  console.log('Loading state:', loading);
  console.log('Payments count:', payments.length);
  console.log('Stats:', stats);

  // Set active section based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      setActiveSection('dashboard');
    } else if (path.includes('/pending')) {
      setActiveSection('pending');
    } else if (path.includes('/all')) {
      setActiveSection('all');
    }
  }, [location.pathname]);

  const load = async () => {
    try {
      console.log('Starting load function for section:', activeSection);
      setLoading(true);
      
      // Always load stats for dashboard
      console.log('Loading stats...');
      const statRes = await api.get('/verification/stats');
      console.log('Stats response:', statRes.data);
      setStats(statRes.data);
      
      // Load section-specific data
      console.log('Loading payments for section:', activeSection);
      if (activeSection === 'dashboard') {
        const payRes = await api.get('/verification/all');
        console.log('Dashboard payments response:', payRes.data);
        setPayments(payRes.data || []);
      } else if (activeSection === 'pending') {
        const payRes = await api.get('/verification/all');
        const pendingPayments = (payRes.data || []).filter(p => p.status === 'submitted');
        console.log('Pending payments:', pendingPayments);
        setPayments(pendingPayments);
      } else if (activeSection === 'all') {
        const payRes = await api.get('/verification/all');
        console.log('All payments response:', payRes.data);
        setPayments(payRes.data || []);
      }
      
      console.log('Payments loaded for section:', activeSection, 'count:', payments.length);
      
    } catch(err) { 
      console.error('Error loading verification data:', err);
      console.error('Error details:', err.response?.data || err.message);
    }
    finally { 
      console.log('Load function completed, setting loading to false');
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, [activeSection]);

  const handleVerify = async (paymentId, action) => {
    setProcessing(paymentId + action);
    try {
      await api.post(`/verification/verify/${paymentId}`, { action, remarks: remarks[paymentId] || '' });
      toast.success(`Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setProcessing(''); }
  };

  const handleBulk = async (action) => {
    if (!selectedIds.length) { toast.error('No payments selected'); return; }
    try {
      await api.post('/verification/bulk-verify', { paymentIds: selectedIds, action });
      toast.success(`${selectedIds.length} payments ${action === 'approve' ? 'verified' : 'rejected'}`);
      setSelectedIds([]);
      await load();
    } catch (err) { toast.error('Bulk action failed'); }
  };

  // Add debugging
console.log('Payments array:', payments);
console.log('Filter:', filter);
console.log('Stats:', stats);

const filtered = filter === 'all' ? payments : payments.filter(p => {
  // Handle different status mappings
  if (filter === 'submitted') return p.status === 'submitted';
  if (filter === 'verified') return p.status === 'verified';
  if (filter === 'rejected') return p.status === 'rejected';
  return false;
});

console.log('Filtered payments:', filtered);

  if (loading) {
    console.log('Showing loading spinner...');
    return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;
  }

  console.log('Checking active section for rendering:', activeSection);

  // Render different content based on active section
  if (activeSection === 'pending') {
    console.log('Rendering pending section...');
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <CheckCircle size={24} className="text-yellow-400" />
            Pending Verifications
          </h2>
          
          <div className="mb-6">
            <button 
              onClick={() => navigate('/verification/dashboard')} 
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              <ChevronRight size={16} className="rotate-180" />
              Back to Dashboard
            </button>
          </div>

          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-slate-400 text-xs">Pending Payments: {payments.length} items</p>
          </div>

          {/* Pending Payments Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <th className="py-3 px-4 text-left">
                      <input type="checkbox" className="rounded" onChange={e => setSelectedIds(e.target.checked ? payments.map(p => p._id) : [])} />
                    </th>
                    {['Student', 'Roll No', 'Program', 'Amount', 'UTR No.', 'Bank', 'Date', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={9} className="py-10 text-center text-slate-500">No pending payments found</td></tr>
                  ) : payments.map(p => {
                    const txn = p.transactions?.[0];
                    return (
                      <tr key={p._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="py-3 px-4">
                          <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={e => setSelectedIds(sel => e.target.checked ? [...sel, p._id] : sel.filter(x => x !== p._id))} />
                        </td>
                        <td className="py-3 px-4 text-white font-medium whitespace-nowrap">{p.studentId?.name}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs">{p.rollNo || p.studentId?.rollNo}</td>
                        <td className="py-3 px-4 text-slate-400">{p.studentId?.program}</td>
                        <td className="py-3 px-4 text-emerald-400 font-bold">₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-xs">{txn?.utrNo || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{txn?.bankName}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{txn?.date ? new Date(txn.date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleVerify(p._id, 'approve')} disabled={processing === p._id + 'approve'} className="btn-success text-xs px-3 py-1.5 flex items-center gap-1">
                              {processing === p._id + 'approve' ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                            </button>
                            <button onClick={() => handleVerify(p._id, 'reject')} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleBulk('approve')} className="btn-success text-sm px-4 py-2 flex items-center gap-1">
                <CheckCircle size={14} /> Approve ({selectedIds.length})
              </button>
              <button onClick={() => handleBulk('reject')} className="btn-danger text-sm px-4 py-2 flex items-center gap-1">
                <XCircle size={14} /> Reject ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeSection === 'all') {
    console.log('Rendering all payments section...');
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <List size={24} className="text-blue-400" />
            All Payments
          </h2>
          
          <div className="mb-6">
            <button 
              onClick={() => navigate('/verification/dashboard')} 
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              <ChevronRight size={16} className="rotate-180" />
              Back to Dashboard
            </button>
          </div>

          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-slate-400 text-xs">Total Payments: {payments.length} items</p>
          </div>

          {/* All Payments Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    {['Student', 'Roll No', 'Program', 'Amount', 'UTR No.', 'Bank', 'Date', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-slate-500">No payments found</td></tr>
                  ) : payments.map(p => {
                    const txn = p.transactions?.[0];
                    return (
                      <tr key={p._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="py-3 px-4 text-white font-medium whitespace-nowrap">{p.studentId?.name}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs">{p.rollNo || p.studentId?.rollNo}</td>
                        <td className="py-3 px-4 text-slate-400">{p.studentId?.program}</td>
                        <td className="py-3 px-4 text-emerald-400 font-bold">₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-xs">{txn?.utrNo || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{txn?.bankName}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{txn?.date ? new Date(txn.date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium status-${p.status}`}>
                            {p.status === 'submitted' ? 'Pending' : p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Dashboard View
  console.log('Rendering default dashboard view...');
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: stats.total || 0, color: '#3b82f6' },
          { label: 'Pending Verification', value: stats.pending || 0, color: '#f59e0b' },
          { label: 'Verified', value: stats.verified || 0, color: '#10b981' },
          { label: 'Rejected', value: stats.rejected || 0, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Bulk Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['all', 'submitted', 'verified', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`} style={filter !== f ? { background: 'rgba(255,255,255,0.05)' } : {}}>
              {f === 'submitted' ? 'Pending' : f}
            </button>
          ))}
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => handleBulk('approve')} className="btn-success text-sm px-4 py-2 flex items-center gap-1"><CheckCircle size={14} /> Approve ({selectedIds.length})</button>
            <button onClick={() => handleBulk('reject')} className="btn-danger text-sm px-4 py-2 flex items-center gap-1"><XCircle size={14} /> Reject ({selectedIds.length})</button>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <th className="py-3 px-4 text-left">
                  <input type="checkbox" className="rounded" onChange={e => setSelectedIds(e.target.checked ? filtered.filter(p => p.status === 'submitted').map(p => p._id) : [])} />
                </th>
                {['Student', 'Roll No', 'Program', 'Amount', 'UTR No.', 'Bank', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-10 text-center text-slate-500">No payments found</td></tr>
              ) : filtered.map(p => {
                const txn = p.transactions?.[0];
                return (
                  <tr key={p._id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 px-4">
                      {p.status === 'submitted' && (
                        <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={e => setSelectedIds(sel => e.target.checked ? [...sel, p._id] : sel.filter(x => x !== p._id))} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-white font-medium whitespace-nowrap">{p.studentId?.name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{p.rollNo || p.studentId?.rollNo}</td>
                    <td className="py-3 px-4 text-slate-400">{p.studentId?.program}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs">{txn?.utrNo || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{txn?.bankName}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{txn?.date ? new Date(txn.date).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${p.status === 'submitted' ? 'payment_done' : p.status === 'verified' ? 'payment_verified' : 'rejected'}`}>
                        {p.status === 'submitted' ? 'Pending' : p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.status === 'submitted' && (
                        <div className="flex items-center gap-2">
                          <input type="text" placeholder="Remarks..." className="form-input text-xs py-1 px-2 w-28"
                            value={remarks[p._id] || ''} onChange={e => setRemarks(r => ({ ...r, [p._id]: e.target.value }))} />
                          <button onClick={() => handleVerify(p._id, 'approve')} disabled={processing === p._id + 'approve'}
                            className="p-1.5 rounded-lg hover:bg-emerald-900/30 text-emerald-400 transition-all" title="Approve">
                            {processing === p._id + 'approve' ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                          </button>
                          <button onClick={() => handleVerify(p._id, 'reject')} disabled={processing === p._id + 'reject'}
                            className="p-1.5 rounded-lg hover:bg-red-900/30 text-red-400 transition-all" title="Reject">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
