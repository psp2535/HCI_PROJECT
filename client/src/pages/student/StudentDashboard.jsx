import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Clock, AlertCircle, XCircle, ChevronRight, BookOpen, CreditCard, User, Receipt, Sparkles } from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748b', icon: Clock, class: 'status-draft' },
  payment_done: { label: 'Payment Submitted', color: '#3b82f6', icon: Clock, class: 'status-payment_done' },
  under_verification: { label: 'Under Verification', color: '#f59e0b', icon: Clock, class: 'status-under_verification' },
  payment_verified: { label: 'Payment Verified', color: '#10b981', icon: CheckCircle, class: 'status-payment_verified' },
  faculty_approved: { label: 'Faculty Approved', color: '#8b5cf6', icon: CheckCircle, class: 'status-faculty_approved' },
  final_approved: { label: '✅ Registration Complete', color: '#10b981', icon: CheckCircle, class: 'status-final_approved' },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle, class: 'status-rejected' },
};

const STEPS = [
  { key: 'personal', label: 'Personal Info', icon: User, desc: 'Fill your personal details' },
  { key: 'subjects', label: 'Subject Selection', icon: BookOpen, desc: 'Choose your courses' },
  { key: 'payment', label: 'Fee Payment', icon: CreditCard, desc: 'Submit payment details' },
  { key: 'verification', label: 'Verification', icon: CheckCircle, desc: 'Staff verifies payment' },
  { key: 'faculty', label: 'Faculty Approval', icon: Sparkles, desc: 'Academic approval' },
  { key: 'final', label: 'Registration Done', icon: CheckCircle, desc: 'Final registration complete' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize or fetch registration
        await api.post('/student/init-registration');
        const res = await api.get('/student/registration-status');
        setRegistration(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getStepStatus = (stepKey) => {
    if (!registration) return 'pending';
    const status = registration.overallStatus;
    const stepOrder = ['personal', 'subjects', 'payment', 'verification', 'faculty', 'final'];
    const statusToStep = {
      draft: 0,
      payment_done: 2,
      under_verification: 3,
      payment_verified: 3,
      faculty_approved: 4,
      final_approved: 5,
      rejected: -1,
    };
    const currentStep = statusToStep[status] ?? 0;
    
    if (!registration.personalInfoCompleted && stepKey === 'personal') return 'active';
    if (registration.personalInfoCompleted && stepKey === 'personal') return 'done';
    if (registration.subjectsSelected && stepKey === 'subjects') return 'done';
    if (!registration.subjectsSelected && stepKey === 'subjects' && registration.personalInfoCompleted) return 'active';

    const idx = stepOrder.indexOf(stepKey);
    if (idx <= currentStep) return 'done';
    if (idx === currentStep + 1) return 'active';
    return 'pending';
  };

  const statusInfo = registration ? STATUS_CONFIG[registration.overallStatus] : STATUS_CONFIG.draft;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }} />
        <div className="relative flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-slate-400 mt-1 text-sm">{user?.program} Programme · Semester {user?.semester} · Academic Year 2025-26</p>
            <div className="mt-3">
              <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-semibold ${statusInfo?.class}`}>
                {statusInfo?.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">Registration Deadline</p>
            <p className="text-amber-400 font-bold text-sm mt-1">30 April 2026</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-400" /> Registration Progress
        </h3>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 hidden lg:block" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {STEPS.map(({ key, label, icon: Icon, desc }) => {
              const s = getStepStatus(key);
              return (
                <div key={key} className="flex flex-col items-center text-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${s === 'done' ? 'step-done' : s === 'active' ? 'step-active' : 'step-pending'}`}>
                    {s === 'done' ? <CheckCircle size={18} className="text-white" /> : <Icon size={16} className={s === 'active' ? 'text-white' : 'text-slate-500'} />}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${s === 'done' ? 'text-emerald-400' : s === 'active' ? 'text-blue-400' : 'text-slate-500'}`}>{label}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5 hidden lg:block">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/student/profile', icon: User, label: 'Personal Info', desc: registration?.personalInfoCompleted ? 'Completed ✓' : 'Complete your profile', done: registration?.personalInfoCompleted, color: '#2563eb' },
          { to: '/student/subjects', icon: BookOpen, label: 'Subject Selection', desc: registration?.subjectsSelected ? `${registration.totalCredits} credits selected` : 'Select your courses', done: registration?.subjectsSelected, color: '#7c3aed' },
          { to: '/student/payment', icon: CreditCard, label: 'Fee Payment', desc: registration?.paymentStatus === 'submitted' ? 'Payment submitted' : 'Submit fee details', done: registration?.paymentStatus !== 'pending', color: '#059669' },
          { to: '/student/receipts', icon: Receipt, label: 'Receipts', desc: 'Download fee receipts', done: false, color: '#d97706' },
        ].map(({ to, icon: Icon, label, desc, done, color }) => (
          <Link key={to} to={to} className="glass-card p-4 hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: done ? `${color}44` : undefined }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon size={20} style={{ color }} />
              </div>
              {done && <CheckCircle size={16} className="text-emerald-400" />}
            </div>
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-slate-400 text-xs mt-1">{desc}</p>
            <div className="flex items-center gap-1 mt-3 text-xs" style={{ color }}>
              {done ? 'View details' : 'Get started'} <ChevronRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* Registration details */}
      {registration && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Registration Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Total Credits', `${registration.totalCredits || 0} / 32`],
              ['Subjects Selected', registration.selectedSubjects?.length || 0],
              ['Payment Status', registration.paymentStatus || 'Pending'],
              ['Overall Status', registration.overallStatus?.replace(/_/g, ' ') || 'Draft'],
            ].map(([label, value]) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-white font-semibold text-sm capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
