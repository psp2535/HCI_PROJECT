import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, FileText } from 'lucide-react';

export default function ReceiptVerification() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadReceipts();
  }, [filter]);

  const loadReceipts = async () => {
    try {
      const response = await api.get('/receipt/all-receipts', {
        params: { status: filter === 'all' ? undefined : filter }
      });
      setReceipts(response.data.receipts || []);
    } catch (err) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (receiptId, action) => {
    setProcessing(receiptId);
    try {
      const response = await api.post(`/receipt/verify/${receiptId}`, { action });
      
      if (response.data.success) {
        toast.success(`Receipt ${action === 'verify' ? 'verified' : 'rejected'} successfully!`);
        loadReceipts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify receipt');
    } finally {
      setProcessing(null);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.utrNumber.toLowerCase().includes(search.toLowerCase()) ||
      receipt.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.studentId?.rollNo?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'pending_verification':
        return <Clock className="text-amber-400" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Clock className="text-slate-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending_verification':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Receipt Verification</h2>
        <p className="text-slate-400">Verify student payment receipts submitted after payment completion</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by UTR, student name, or roll number..."
                className="form-input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {['all', 'pending_verification', 'verified', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All' : 
                 status === 'pending_verification' ? 'Pending' :
                 status === 'verified' ? 'Verified' : 'Rejected'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Receipts', value: receipts.length, color: '#6366f1' },
          { label: 'Pending', value: receipts.filter(r => r.status === 'pending_verification').length, color: '#f59e0b' },
          { label: 'Verified', value: receipts.filter(r => r.status === 'verified').length, color: '#10b981' },
          { label: 'Rejected', value: receipts.filter(r => r.status === 'rejected').length, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Receipts List */}
      <div className="space-y-4">
        {filteredReceipts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText size={48} className="text-slate-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-white font-semibold mb-2">No Receipts Found</h3>
            <p className="text-slate-400">
              {search ? 'No receipts match your search criteria' : 'No receipts submitted yet'}
            </p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => (
            <div key={receipt._id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(receipt.status)}
                    <div>
                      <h4 className="text-white font-semibold">
                        UTR: {receipt.utrNumber}
                      </h4>
                      <p className="text-slate-400 text-sm">
                        {receipt.studentId?.name} · {receipt.studentId?.rollNo}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(receipt.status)}`}>
                      {receipt.status === 'pending_verification' ? 'Pending Verification' :
                       receipt.status === 'verified' ? 'Verified' : 'Rejected'}
                    </span>
                    {receipt.manualEntry && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Manual Entry
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Amount</p>
                      <p className="text-white font-medium">¥{receipt.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Payment Date</p>
                      <p className="text-white font-medium">
                        {new Date(receipt.paymentDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Bank Name</p>
                      <p className="text-white font-medium">{receipt.bankName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Program</p>
                      <p className="text-white font-medium">{receipt.studentId?.program}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-400">
                    Uploaded on {new Date(receipt.uploadedAt).toLocaleString('en-IN')}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    <Eye size={18} />
                  </button>
                  
                  {receipt.status === 'pending_verification' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerification(receipt._id, 'verify')}
                        disabled={processing === receipt._id}
                        className="btn-success flex items-center gap-1 px-3 py-2 text-sm"
                      >
                        {processing === receipt._id ? <div className="spinner w-3 h-3" /> : <CheckCircle size={14} />}
                        Verify
                      </button>
                      <button
                        onClick={() => handleVerification(receipt._id, 'reject')}
                        disabled={processing === receipt._id}
                        className="btn-danger flex items-center gap-1 px-3 py-2 text-sm"
                      >
                        {processing === receipt._id ? <div className="spinner w-3 h-3" /> : <XCircle size={14} />}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
