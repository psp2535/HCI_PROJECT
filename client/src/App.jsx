import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Page imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StaffRegisterPage from './pages/StaffRegisterPage';

// Layouts
import StudentLayout from './components/StudentLayout';
import VerificationLayout from './components/VerificationLayout';
import FacultyLayout from './components/FacultyLayout';
import AdminLayout from './components/AdminLayout';


// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import SubjectSelection from './pages/student/SubjectSelection';
import FeePayment from './pages/student/FeePayment';
import Receipts from './pages/student/Receipts';

// Verification Pages
import VerificationDashboard from './pages/verification/VerificationDashboard';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected Route
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/staff-register" element={<StaffRegisterPage />} />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout><div /></StudentLayout></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout><StudentDashboard /></StudentLayout></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout><StudentProfile /></StudentLayout></ProtectedRoute>} />
        <Route path="/student/subjects" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout><SubjectSelection /></StudentLayout></ProtectedRoute>} />
        <Route path="/student/payment" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout><FeePayment /></StudentLayout></ProtectedRoute>} />
        <Route path="/student/receipts" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout><Receipts /></StudentLayout></ProtectedRoute>} />

        {/* Verification Staff */}
        <Route path="/verification/dashboard" element={<ProtectedRoute allowedRoles={['verification_staff']}><VerificationLayout><VerificationDashboard /></VerificationLayout></ProtectedRoute>} />
        <Route path="/verification/pending" element={<ProtectedRoute allowedRoles={['verification_staff']}><VerificationLayout><VerificationDashboard /></VerificationLayout></ProtectedRoute>} />
        <Route path="/verification/all" element={<ProtectedRoute allowedRoles={['verification_staff']}><VerificationLayout><VerificationDashboard /></VerificationLayout></ProtectedRoute>} />

        {/* Faculty */}
        <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyLayout><FacultyDashboard /></FacultyLayout></ProtectedRoute>} />
        <Route path="/faculty/students" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyLayout><FacultyDashboard /></FacultyLayout></ProtectedRoute>} />
        <Route path="/faculty/courses" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyLayout><FacultyDashboard /></FacultyLayout></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/registrations" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={
          user ? (
            user.role === 'student' ? <Navigate to="/student/dashboard" replace /> :
            user.role === 'verification_staff' ? <Navigate to="/verification/dashboard" replace /> :
            user.role === 'faculty' ? <Navigate to="/faculty/dashboard" replace /> :
            user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
            <Navigate to="/login" replace />
          ) : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>


    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
