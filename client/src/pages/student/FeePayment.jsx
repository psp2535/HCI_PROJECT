import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Trash2, Loader, Upload, CheckCircle, ExternalLink } from 'lucide-react';

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
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([{ amount: '', date: '', utrNo: '', bankName: '', depositorName: '', debitAccountNo: '' }]);
  const [showUtrModal, setShowUtrModal] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  
  // Direct payment URL
  const PAYMENT_URL = 'https://octopod.co.in/student/admission/08d02b1d9ee5fa9d0be8bb55f8c5dd3c';

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
    
    // Validate transactions
    const validTransactions = transactions.filter(t => t.amount && t.utrNo && t.date);
    if (validTransactions.length === 0) {
      toast.error('Please fill in at least one complete transaction with amount, UTR number, and date');
      return;
    }
    
    const totalAmount = validTransactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    if (totalAmount !== grandTotal) {
      toast.error(`Total amount (₹${totalAmount}) must equal the required fee (₹${grandTotal})`);
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('transactions', JSON.stringify(validTransactions));
      formData.append('totalAmount', totalAmount);
      formData.append('academicFee', academicTotal);
      formData.append('messFee', messTotal);
      if (file) formData.append('paymentProof', file);

      const response = await api.post('/payment/submit', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      toast.success('Payment details submitted successfully!');
      setPayment(response.data.payment);
      
      // Refresh registration status
      setTimeout(async () => {
        try {
          const regRes = await api.get('/student/registration-status');
          // This will trigger dashboard update if it's listening
        } catch (err) {
          console.error('Error refreshing registration status:', err);
        }
      }, 1000);
      
    } catch (err) {
      console.error('Payment submission error:', err);
      toast.error(err.response?.data?.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    console.log('=== Payment Status Update Called ===');
    
    // Show UTR input modal instead of directly creating payment
    setShowUtrModal(true);
  };

  const handleUtrSubmit = async () => {
    if (!utrInput.trim()) {
      toast.error('Please enter a valid UTR/Transaction number');
      return;
    }

    setUtrSubmitting(true);
    try {
      // Create a payment record with the provided UTR
      console.log('Creating new payment record with UTR:', utrInput);
      const formData = new FormData();
      formData.append('transactions', JSON.stringify([{
        amount: grandTotal.toString(),
        date: new Date().toISOString().split('T')[0],
        utrNo: utrInput.trim(),
        bankName: 'Online Payment Portal',
        depositorName: 'Self',
        debitAccountNo: 'N/A'
      }]));
      formData.append('totalAmount', grandTotal);
      formData.append('academicFee', academicTotal);
      formData.append('messFee', messTotal);

      const createResponse = await api.post('/payment/submit', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      console.log('Payment created:', createResponse.data);
      
      // Set the newly created payment
      setPayment(createResponse.data.payment);
      toast.success('Payment submitted successfully with UTR: ' + utrInput.trim() + '! Please wait for verification by accounts staff.');
      
      // Close modal and reset input
      setShowUtrModal(false);
      setUtrInput('');
      
      // Refetch payment data to get the latest status
      setTimeout(async () => {
        try {
          const updatedPayment = await api.get('/payment/my-payment');
          console.log('Refetched payment data:', updatedPayment.data);
          if (updatedPayment.data) {
            setPayment(updatedPayment.data);
          }
        } catch (error) {
          console.error('Error refetching payment:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error submitting payment:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to submit payment');
    } finally {
      setUtrSubmitting(false);
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
        /* Direct Payment Link */
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-white font-semibold">Complete Your Payment</h3>
          <p className="text-slate-400 text-sm -mt-3">Click the button below to proceed to the payment portal.</p>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm">Payment Amount</p>
                <p className="text-white font-bold text-xl">₹{grandTotal.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Payment Method</p>
                <p className="text-white font-medium">Online Payment</p>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-4">
              <p className="text-slate-400 text-sm mb-3">Payment Link:</p>
              <div className="bg-slate-900/50 rounded-lg p-3 break-all">
                <code className="text-blue-400 text-sm">{PAYMENT_URL}</code>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.open(PAYMENT_URL, '_blank')}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3 flex-1"
            >
              <ExternalLink size={18} />
              Open Payment Portal
            </button>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(PAYMENT_URL);
                toast.success('Payment link copied to clipboard!');
              }}
              className="btn-secondary flex items-center justify-center gap-2 px-6 py-3"
            >
              Copy Link
            </button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>Important:</strong> After completing payment, please return to this page and mark your payment as completed.
            </p>
          </div>

          <button
            onClick={() => handleStatusUpdate()}
            disabled={submitting}
            className="btn-success flex items-center justify-center gap-2 px-6 py-3 w-full"
          >
            <CheckCircle size={18} />
            Mark Payment as Completed
          </button>
        </div>
      )}

      {/* UTR Input Modal */}
      {showUtrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Enter UTR/Transaction Number</h3>
            <p className="text-slate-400 text-sm mb-6">
              Please enter the UTR (Unique Transaction Reference) or transaction number from your payment confirmation.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  UTR/Transaction Number *
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter UTR/Transaction number"
                  className="form-input w-full"
                  autoFocus
                />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> This UTR number will be sent to the verification staff for payment confirmation.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUtrModal(false);
                  setUtrInput('');
                }}
                className="btn-secondary flex-1 px-4 py-2"
                disabled={utrSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUtrSubmit}
                disabled={utrSubmitting || !utrInput.trim()}
                className="btn-success flex-1 px-4 py-2 flex items-center justify-center gap-2"
              >
                {utrSubmitting ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
