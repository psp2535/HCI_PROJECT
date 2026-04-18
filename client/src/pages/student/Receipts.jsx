import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Receipt, Download, FileText, Loader, CheckCircle } from 'lucide-react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');

  const loadReceipts = async () => {
    try {
      const res = await api.get('/receipt/my-receipts');
      setReceipts(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReceipts(); }, []);

  const generateReceipt = async (type) => {
    setGenerating(type);
    try {
      const res = await api.post('/receipt/generate', { type });
      toast.success(`${type === 'academic' ? 'Academic' : 'Mess'} fee receipt generated!`);
      await loadReceipts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate receipt');
    } finally {
      setGenerating('');
    }
  };

  const downloadReceipt = (receipt) => {
    if (receipt.pdfPath) {
      window.open(receipt.pdfPath, '_blank');
    } else {
      toast.error('PDF not found. Please regenerate the receipt.');
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;

  const academicReceipt = receipts.find(r => r.type === 'academic');
  const messReceipt = receipts.find(r => r.type === 'mess');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.2)' }}>
          <Receipt size={20} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Fee Receipts</h2>
          <p className="text-slate-400 text-sm">Download your official ABV-IIITM fee receipts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Academic Receipt Card */}
        <div className="glass-card p-6" style={academicReceipt ? { border: '1px solid rgba(16,185,129,0.3)' } : {}}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Academic Fee Receipt</h3>
              <p className="text-slate-400 text-sm mt-0.5">Tuition, Library, Exam, Internet, Medical, Cultural, Hostel</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.2)' }}>
              <FileText size={20} className="text-blue-400" />
            </div>
          </div>

          {academicReceipt ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-slate-400 text-xs">Receipt No.</p>
                  <p className="text-white font-bold text-sm mt-1">{academicReceipt.receiptNo}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-slate-400 text-xs">Total Amount</p>
                  <p className="text-emerald-400 font-bold text-sm mt-1">₹{academicReceipt.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-slate-400 text-xs">Date</p>
                  <p className="text-white text-sm mt-1">{new Date(academicReceipt.date).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-slate-400 text-xs">Transaction No.</p>
                  <p className="text-white text-sm mt-1 truncate">{academicReceipt.transactionNo || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => downloadReceipt(academicReceipt)} className="btn-success w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                <Download size={16} /> Download Academic Receipt PDF
              </button>
              <button onClick={() => generateReceipt('academic')} disabled={generating === 'academic'} className="w-full text-slate-400 hover:text-white text-xs py-2 transition-colors">
                {generating === 'academic' ? 'Regenerating...' : 'Regenerate Receipt'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-white font-bold">₹93,000.00</span>
                </div>
                <p className="text-slate-500 text-xs">Includes: Tuition 72K + Library 2K + Exam 1.5K + Registration 1K + Internet 2K + Medical 1.5K + Cultural 1K + Hostel Room 12K</p>
              </div>
              <button onClick={() => generateReceipt('academic')} disabled={!!generating} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                {generating === 'academic' ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Receipt size={16} /> Generate Academic Receipt</>}
              </button>
            </div>
          )}
        </div>

        {/* Mess Receipt Card */}
        <div className="glass-card p-6" style={messReceipt ? { border: '1px solid rgba(16,185,129,0.3)' } : {}}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Hostel Mess Fee Receipt</h3>
              <p className="text-slate-400 text-sm mt-0.5">Hostel mess fee for the semester</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.2)' }}>
              <FileText size={20} className="text-amber-400" />
            </div>
          </div>

          {messReceipt ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-slate-400 text-xs">Receipt No.</p>
                  <p className="text-white font-bold text-sm mt-1">{messReceipt.receiptNo}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-slate-400 text-xs">Total Amount</p>
                  <p className="text-emerald-400 font-bold text-sm mt-1">₹{messReceipt.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button onClick={() => downloadReceipt(messReceipt)} className="btn-success w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                <Download size={16} /> Download Mess Receipt PDF
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Hostel Mess Fee</span>
                  <span className="text-white font-bold">₹18,000.00</span>
                </div>
              </div>
              <button onClick={() => generateReceipt('mess')} disabled={!!generating} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                {generating === 'mess' ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Receipt size={16} /> Generate Mess Receipt</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* All Receipts List */}
      {receipts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">All Receipts</h3>
          <div className="space-y-2">
            {receipts.map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 rounded-xl table-row" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-blue-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{r.receiptNo} — {r.type === 'academic' ? 'Academic Fee' : 'Mess Fee'}</p>
                    <p className="text-slate-400 text-xs">{new Date(r.date).toLocaleDateString('en-IN')} · Txn: {r.transactionNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-sm">₹{r.totalAmount?.toLocaleString('en-IN')}</span>
                  <button onClick={() => downloadReceipt(r)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
