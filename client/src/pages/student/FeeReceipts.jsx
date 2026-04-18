import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, Clock, XCircle, Plus, Trash2, Eye, File } from 'lucide-react';

export default function FeeReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    utrNumber: '',
    amount: '',
    paymentDate: '',
    bankName: '',
    manualEntry: false,
    receiptFile: null
  });
  const [extractedDetails, setExtractedDetails] = useState({
    utrNumber: null,
    amount: null,
    paymentDate: null,
    bankName: null
  });

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const response = await api.get('/receipt/my-receipts');
      setReceipts(response.data.receipts || []);
    } catch (err) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('utrNumber', formData.utrNumber);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('paymentDate', formData.paymentDate);
      formDataToSend.append('bankName', formData.bankName || 'Unknown');
      formDataToSend.append('manualEntry', formData.manualEntry);
      
      // Add file if selected and not manual entry
      if (formData.receiptFile && !formData.manualEntry) {
        formDataToSend.append('receiptFile', formData.receiptFile);
      }
      
      const response = await api.post('/receipt/upload-receipt', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowUploadForm(false);
        setFormData({
          utrNumber: '',
          amount: '',
          paymentDate: '',
          bankName: '',
          manualEntry: false,
          receiptFile: null
        });
        setExtractedDetails({
        utrNumber: null,
        amount: null,
        paymentDate: null,
        bankName: null
      });
        loadReceipts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

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

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Fee Receipts</h2>
          <p className="text-slate-400">Upload and manage your payment receipts</p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          Upload Receipt
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Upload size={18} className="text-purple-400" />
            Upload Payment Receipt
          </h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  UTR Number {!formData.manualEntry && '(Optional - will be extracted from PDF)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={formData.manualEntry ? "Enter UTR number" : "Enter UTR number or leave empty to extract from PDF"}
                  value={formData.utrNumber}
                  onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                  required={formData.manualEntry}
                />
                {extractedDetails.utrNumber && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <p className="text-green-400 text-sm">
                      <strong>UTR Extracted from PDF:</strong> {extractedDetails.utrNumber}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label">
                  Amount (¥) {!formData.manualEntry && '(Optional - will be extracted from PDF)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={formData.manualEntry ? "Enter amount" : "Enter amount or leave empty to extract from PDF"}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required={formData.manualEntry}
                />
                {extractedDetails.amount && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <p className="text-green-400 text-sm">
                      <strong>Amount Extracted:</strong> ¥{extractedDetails.amount}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label">
                  Payment Date {!formData.manualEntry && '(Optional - will be extracted from PDF)'}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required={formData.manualEntry}
                />
                {extractedDetails.paymentDate && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <p className="text-green-400 text-sm">
                      <strong>Date Extracted:</strong> {new Date(extractedDetails.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label">
                  Bank Name {!formData.manualEntry && '(Optional - will be extracted from PDF)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={formData.manualEntry ? "Enter bank name" : "Enter bank name or leave empty to extract from PDF"}
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required={formData.manualEntry}
                />
                {extractedDetails.bankName && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <p className="text-green-400 text-sm">
                      <strong>Bank Extracted:</strong> {extractedDetails.bankName}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upload Options */}
            <div className="space-y-4">
              <div className="text-slate-300 font-medium">Choose Upload Method:</div>
              
              {/* PDF Upload Option */}
              <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                !formData.manualEntry 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-slate-600 bg-slate-800/50'
              }`}
              onClick={() => setFormData({ ...formData, manualEntry: false })}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    !formData.manualEntry 
                      ? 'border-purple-500' 
                      : 'border-slate-600'
                  }`}>
                    {!formData.manualEntry && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <File size={18} />
                      Upload PDF Receipt
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Upload the PDF receipt you downloaded from the payment portal
                    </p>
                  </div>
                </div>
                
                {!formData.manualEntry && (
                  <div className="mt-4">
                    <label className="block">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-slate-800/50">
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => setFormData({ ...formData, receiptFile: e.target.files[0] })}
                        />
                        {formData.receiptFile ? (
                          <div className="text-center">
                            <FileText size={32} className="text-purple-400 mx-auto mb-2" />
                            <p className="text-white text-sm">{formData.receiptFile.name}</p>
                            <p className="text-slate-400 text-xs">Click to change file</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-300 text-sm">Click to upload PDF</p>
                            <p className="text-slate-500 text-xs">or drag and drop</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
              
              {/* Manual Entry Option */}
              <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                formData.manualEntry 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-slate-600 bg-slate-800/50'
              }`}
              onClick={() => setFormData({ ...formData, manualEntry: true })}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.manualEntry 
                      ? 'border-purple-500' 
                      : 'border-slate-600'
                  }`}>
                    {formData.manualEntry && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <FileText size={18} />
                      Manual UTR Entry
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Enter UTR details manually without uploading PDF
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Buttons */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="btn-secondary px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!formData.receiptFile && !formData.manualEntry)}
                  className="btn-primary flex items-center gap-2 px-6 py-2"
                >
                  {uploading ? <div className="spinner w-4 h-4" /> : <Upload size={18} />}
                  {uploading ? 'Uploading...' : 'Upload Receipt'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Receipts List */}
      <div className="space-y-4">
        {receipts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText size={48} className="text-slate-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-white font-semibold mb-2">No Receipts Uploaded</h3>
            <p className="text-slate-400 mb-4">
              Upload your payment receipts to track verification status
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2 mx-auto"
            >
              <Plus size={18} />
              Upload First Receipt
            </button>
          </div>
        ) : (
          receipts.map((receipt) => (
            <div key={receipt._id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(receipt.status)}
                    <h4 className="text-white font-semibold">
                      UTR: {receipt.utrNumber}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(receipt.status)}`}>
                      {getStatusText(receipt.status)}
                    </span>
                    {receipt.manualEntry && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Manual Entry
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-400">
                    Uploaded on {new Date(receipt.uploadedAt).toLocaleString('en-IN')}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="glass-card p-6 bg-blue-500/10 border-blue-500/30">
        <h3 className="text-white font-semibold mb-3">Instructions</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">1.</span>
            <span>After completing payment, download your receipt from the payment portal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">2.</span>
            <span>Upload the receipt PDF or manually enter the UTR number</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">3.</span>
            <span>Your receipt will be sent to the accounts staff for verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">4.</span>
            <span>You can track the verification status here</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
