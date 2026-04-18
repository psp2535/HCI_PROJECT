import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Trash2, Loader, Upload, CheckCircle } from 'lucide-react';

const FEE_BREAKDOWN = {
  academic: [
    { particular: 'Tuition Fee', amount: 72000 },
    { particular: 'Library Fee', amount: 2000 },
    { particular: 'Exam Fee', amount: 1500 },
    { particular: 'Registration Fee', amount: 1000 },
    { particular: 'Internet Fee', amount: 2000 },
    { particular: 'Medical Fee', amount: 1500 },
    { particular: 'Cultural Activities Fee', amount: 1000 },
    { particular: 'Hostel Room Rent', amount: 12000 },
  ],
  mess: [
    { particular: 'Hostel Mess Fee', amount: 18000 },
  ],
};

export default function FeePayment() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([{ amount: '', date: '', utrNo: '', bankName: '', depositorName: '', debitAccountNo: '' }]);
  const [file, setFile] = useState(null);

  const academicTotal = FEE_BREAKDOWN.academic.reduce((s, i) => s + i.amount, 0);
  const messTotal = FEE_BREAKDOWN.mess.reduce((s, i) => s + i.amount, 0);
  const grandTotal = academicTotal + messTotal;

  useEffect(() => {
    api.get('/payment/my-payment').then(res => { if (res.data) setPayment(res.data); setLoading(false); });
  }, []);

  const addTransaction = () => {
    if (transactions.length < 3) setTransactions([...transactions, { amount: '', date: '', utrNo: '', bankName: '', depositorName: '', debitAccountNo: '' }]);
  };
  const removeTransaction = (i) => setTransactions(transactions.filter((_, idx) => idx !== i));
  const updateTxn = (i, key, val) => setTransactions(t => t.map((tx, idx) => idx === i ? { ...tx, [key]: val } : tx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('transactions', JSON.stringify(transactions));
      formData.append('totalAmount', transactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0));
      formData.append('academicFee', academicTotal);
      formData.append('messFee', messTotal);
      if (file) formData.append('paymentProof', file);

      await api.post('/payment/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Payment details submitted!');
      const res = await api.get('/payment/my-payment');
      setPayment(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="spinner" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(5,150,105,0.2)' }}>
          <CreditCard size={20} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Fee Payment</h2>
          <p className="text-slate-400 text-sm">Academic Year 2025-26 · Jan-June 2026</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Fee */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Academic Fee
          </h3>
          <div className="space-y-2">
            {FEE_BREAKDOWN.academic.map(({ particular, amount }) => (
              <div key={particular} className="flex justify-between text-sm">
                <span className="text-slate-400">{particular}</span>
                <span className="text-white font-medium">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-blue-300">Academic Total</span>
              <span className="text-blue-300">₹{academicTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Mess Fee + Total */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Hostel Mess Fee
            </h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Hostel Mess Fee</span>
              <span className="text-white font-medium">₹{messTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-amber-300">Mess Total</span>
              <span className="text-amber-300">₹{messTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="glass-card p-5" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Grand Total</span>
              <span className="text-blue-300 font-bold text-xl">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">One Lakh Eleven Thousand Rupees Only</p>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      {payment ? (
        <div className="glass-card p-6" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-emerald-400" size={22} />
            <h3 className="text-white font-semibold">Payment Submitted</h3>
            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium status-${payment.status === 'verified' ? 'payment_verified' : 'payment_done'}`}>
              {payment.status === 'verified' ? '✅ Verified' : '🕐 Under Verification'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {payment.transactions?.map((txn, i) => (
              <div key={i} className="p-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-slate-400 text-xs mb-1">Transaction {i + 1}</p>
                <p className="text-white font-bold">₹{parseFloat(txn.amount || 0).toLocaleString('en-IN')}</p>
                <p className="text-slate-400 text-xs mt-1">UTR: {txn.utrNo}</p>
                <p className="text-slate-400 text-xs">{txn.bankName}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Payment Form */
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          <h3 className="text-white font-semibold">Enter Payment Details</h3>
          <p className="text-slate-400 text-sm -mt-3">As per Details of Fees Payment Form. Add up to 3 transactions if paid in parts.</p>

          {transactions.map((txn, i) => (
            <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-sm font-medium">Transaction {i + 1}</p>
                {i > 0 && <button type="button" onClick={() => removeTransaction(i)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" placeholder="e.g. 93000" value={txn.amount} onChange={e => updateTxn(i, 'amount', e.target.value)} required={i === 0} />
                </div>
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={txn.date} onChange={e => updateTxn(i, 'date', e.target.value)} required={i === 0} />
                </div>
                <div>
                  <label className="form-label">UTR Number *</label>
                  <input type="text" className="form-input" placeholder="12-digit UTR" value={txn.utrNo} onChange={e => updateTxn(i, 'utrNo', e.target.value)} required={i === 0} />
                </div>
                <div>
                  <label className="form-label">Bank Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. State Bank of India" value={txn.bankName} onChange={e => updateTxn(i, 'bankName', e.target.value)} required={i === 0} />
                </div>
                <div>
                  <label className="form-label">Depositor Name</label>
                  <input type="text" className="form-input" placeholder="Name of depositor" value={txn.depositorName} onChange={e => updateTxn(i, 'depositorName', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Debit Account No.</label>
                  <input type="text" className="form-input" placeholder="Account number" value={txn.debitAccountNo} onChange={e => updateTxn(i, 'debitAccountNo', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          {transactions.length < 3 && (
            <button type="button" onClick={addTransaction} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              <Plus size={16} /> Add Another Transaction
            </button>
          )}

          {/* Upload Proof */}
          <div>
            <label className="form-label">Upload Payment Screenshot / Receipt</label>
            <label className="flex flex-col items-center justify-center h-24 rounded-xl cursor-pointer transition-all" style={{ border: '2px dashed rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
              <Upload size={20} className="text-slate-400 mb-1" />
              <span className="text-slate-400 text-sm">{file ? file.name : 'Click to upload (max 5MB)'}</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 px-8 py-3">
            {submitting ? <Loader size={18} className="animate-spin" /> : <CreditCard size={18} />}
            {submitting ? 'Submitting...' : 'Submit Payment Details'}
          </button>
        </form>
      )}
    </div>
  );
}
