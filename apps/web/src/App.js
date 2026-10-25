import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';

// Layouts
import PublicLayout from './components/layout/PublicLayout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout/AuthLayout';

// Route Guards
import PrivateRoute from './routes/PrivateRoute';
import RoleBasedRoute from './routes/RoleBasedRoute';

// Module 1: Authentication
import Login from './modules/01-authentication/pages/Login/Login';
import Register from './modules/01-authentication/pages/Register/Register';
import ForgotPassword from './modules/01-authentication/pages/ForgotPassword/ForgotPassword';
import RoleSelection from './modules/01-authentication/pages/RoleSelection/RoleSelection';

// Module 2: Patient Profile
import PatientProfile from './modules/02-patient-profile/pages/PatientProfile/PatientProfile';
import PatientProfileTest from './modules/02-patient-profile/pages/PatientProfile/PatientProfileTest';
import SimpleProfile from './modules/02-patient-profile/pages/PatientProfile/SimpleProfile';
import PatientDashboard from './modules/02-patient-profile/pages/PatientDashboard/PatientDashboard';
import MedicalRecords from './modules/02-patient-profile/pages/MedicalRecords/MedicalRecords';
import MedicalHistory from './modules/02-patient-profile/pages/MedicalHistory/MedicalHistory';
import DoctorPatientsList from './modules/02-patient-profile/pages/DoctorPatientsList/DoctorPatientsList';

// Module 3: Symptom Screening
import SymptomChecker from './modules/03-symptom-screening/pages/SymptomChecker/SymptomChecker';
import SymptomResults from './modules/03-symptom-screening/pages/SymptomResults/SymptomResults';
import SymptomHistory from './modules/03-symptom-screening/pages/SymptomHistory/SymptomHistory';

// Module 4: Clinical Notes
import ClinicalNotesDashboard from './modules/04-clinical-notes/pages/ClinicalNotes/ClinicalNotesDashboard';
import NoteEditorPro from './modules/04-clinical-notes/pages/NoteEditor/NoteEditorPro';

// Module 5: Appointments
import BookAppointment from './modules/05-appointment-management/pages/BookAppointment/BookAppointment';
import AppointmentList from './modules/05-appointment-management/pages/AppointmentList/AppointmentList';

// Pages
import DoctorPublicProfile from './pages/DoctorProfile/DoctorProfile';

// Module 6: Telemedicine
import VideoConsultation from './modules/06-telemedicine/pages/VideoConsultation/VideoConsultation';

// Module 7: Prescription
import CreatePrescription from './modules/07-prescription/pages/CreatePrescription/CreatePrescription';
import ViewPrescription from './modules/07-prescription/pages/ViewPrescription/ViewPrescription';

// ============================================
// Module 8: Laboratory — ✅ UPDATED
// ============================================
import BookLabTest from './modules/08-laboratory/pages/BookLabTest/BookLabTest';
import TestResults from './modules/08-laboratory/pages/TestResults/TestResults';
import LaboratoryDashboard from './modules/08-laboratory/pages/LaboratoryDashboard/LaboratoryDashboard';
import ManageTests from './modules/08-laboratory/pages/ManageTests/ManageTests';
import LabOrders from './modules/08-laboratory/pages/LabOrders/LabOrders';
import LabOrderDetails from './modules/08-laboratory/pages/LabOrderDetails/LabOrderDetails';

// ============================================
// Module 9: Pharmacy
// ============================================
import OrderMedicine from './modules/09-pharmacy/pages/OrderMedicine/OrderMedicine';
import TrackOrder from './modules/09-pharmacy/pages/TrackOrder/TrackOrder';
import Orders from './modules/09-pharmacy/pages/Orders/Orders';
import OrderDetails from './modules/09-pharmacy/pages/OrderDetails/OrderDetails';
import Prescriptions from './modules/09-pharmacy/pages/Prescriptions/Prescriptions';
import Inventory from './modules/09-pharmacy/pages/Inventory/Inventory';
import Reports from './modules/09-pharmacy/pages/Reports/Reports';

// Module 10: Communication
import Messaging from './modules/10-communication/pages/Messaging/Messaging';
import Notifications from './modules/10-communication/pages/Notifications/Notifications';
import PatientRecordsSharing from './modules/10-communication/pages/PatientRecordsSharing/PatientRecordsSharing';
import Collaboration from './modules/10-communication/pages/Collaboration/Collaboration';

// Module 11: Admin Dashboard
import Dashboard from './modules/11-admin-dashboard/pages/Dashboard/Dashboard';
import DoctorDashboard from './modules/11-admin-dashboard/pages/DoctorDashboard/DoctorDashboard';
import PharmacyDashboard from './modules/11-admin-dashboard/pages/PharmacyDashboard/PharmacyDashboard';
import LabApprovals from './modules/11-admin-dashboard/pages/LabApprovals/LabApprovals';
import Analytics from './modules/11-admin-dashboard/pages/Analytics/Analytics';
import EnhancedUserManagement from './modules/11-admin-dashboard/pages/EnhancedUserManagement/EnhancedUserManagement';
import SystemMonitoring from './modules/11-admin-dashboard/pages/SystemMonitoring/SystemMonitoring';

// Module 12: Security
import SecurityDashboard from './modules/12-security-compliance/pages/SecurityDashboard/SecurityDashboard';
import AuditLogs from './modules/12-security-compliance/pages/AuditLogs/AuditLogs';
import SecurityCompliance from './modules/12-security-compliance/pages/SecurityCompliance/SecurityCompliance';
import SecuritySettings from './modules/12-security-compliance/pages/SecuritySettings/SecuritySettings';
import UserSecurityProfiles from './modules/12-security-compliance/pages/UserSecurityProfiles/UserSecurityProfiles';
import SecurityVulnerabilities from './modules/12-security-compliance/pages/SecurityVulnerabilities/SecurityVulnerabilities';

// Home
import Home from './pages/Home/Home.jsx';
import About from './pages/About/About';
import Services from './pages/Services/Services';
import Contact from './pages/Contact/Contact';
import Privacy from './pages/Privacy/Privacy';
import Terms from './pages/Terms/Terms';
import NotFound from './pages/NotFound/NotFound.jsx';
import Unauthorized from './pages/Unauthorized/Unauthorized';

// Utils
import RoleDashboardRedirect from './routes/RoleDashboardRedirect';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/symptoms" element={<SymptomChecker />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/select-role" element={<RoleSelection />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Dashboard Redirect */}
              <Route path="/dashboard" element={<RoleDashboardRedirect />} />

              {/* Patient Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['patient', 'admin']} />}>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/simple-profile" element={<SimpleProfile />} />
                <Route path="/profile" element={<PatientProfile />} />
                <Route path="/profile-test" element={<PatientProfileTest />} />
                <Route path="/medical-records" element={<MedicalRecords />} />
                <Route path="/medical-history" element={<MedicalHistory />} />
                <Route path="/patient/profile" element={<PatientProfile />} />
                <Route path="/patient/medical-records" element={<MedicalRecords />} />

                {/* Symptom Screening Routes */}
                <Route path="/symptoms/checker" element={<SymptomChecker />} />
                <Route path="/symptoms/history" element={<SymptomHistory />} />
                <Route path="/symptom-results/:checkId" element={<SymptomResults />} />
                <Route path="/patient/symptom-checker" element={<SymptomChecker />} />
                <Route path="/patient/symptom-results" element={<SymptomResults />} />
                <Route path="/patient/symptom-results/:checkId" element={<SymptomResults />} />

                {/* Appointment Routes */}
                <Route path="/appointments/book" element={<BookAppointment />} />
                <Route path="/patient/book-appointment" element={<BookAppointment />} />
                <Route path="/doctors/:doctorId" element={<DoctorPublicProfile />} />
                <Route path="/appointments" element={<AppointmentList />} />
                <Route path="/patient/appointments" element={<AppointmentList />} />
                <Route path="/telemedicine" element={<VideoConsultation />} />
                <Route path="/patient/consultation/:id" element={<VideoConsultation />} />
                <Route path="/prescriptions" element={<ViewPrescription />} />
                <Route path="/patient/prescriptions" element={<ViewPrescription />} />

                {/* Laboratory Booking Routes (patient) */}
                <Route path="/laboratory/book-test" element={<BookLabTest />} />
                <Route path="/lab-tests" element={<BookLabTest />} />
                <Route path="/patient/lab-tests" element={<BookLabTest />} />
                <Route path="/patient/test-results" element={<TestResults />} />

                {/* Patient Pharmacy Routes */}
                <Route path="/patient/order-medicine" element={<OrderMedicine />} />
                <Route path="/patient/track-order/:id" element={<TrackOrder />} />
                <Route path="/patient/messages" element={<Messaging />} />
              </Route>

              {/* Doctor Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['doctor', 'admin']} />}>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor/patients" element={<DoctorPatientsList />} />
                <Route path="/doctor/patients/:patientId" element={<PatientProfile />} />
                <Route path="/doctor/appointments" element={<AppointmentList />} />
                <Route path="/doctor/appointments/:appointmentId" element={<AppointmentList />} />
                <Route path="/doctor/consultations" element={<VideoConsultation />} />
                <Route path="/doctor/consultation/:id" element={<VideoConsultation />} />
                <Route path="/doctor/clinical-notes" element={<ClinicalNotesDashboard />} />
                <Route path="/doctor/clinical-notes/new" element={<NoteEditorPro />} />
                <Route path="/doctor/clinical-notes/:noteId" element={<NoteEditorPro />} />
                <Route path="/doctor/prescriptions" element={<CreatePrescription />} />
                <Route path="/doctor/create-prescription" element={<CreatePrescription />} />
                <Route path="/doctor/schedule" element={<AppointmentList />} />
                <Route path="/doctor/profile" element={<PatientProfile />} />
                <Route path="/doctor/messages" element={<Messaging />} />
                <Route path="/doctor/patient-records-sharing" element={<PatientRecordsSharing />} />
                <Route path="/doctor/collaborations" element={<Collaboration />} />
              </Route>

              {/* ============================================
                  Lab Routes — ✅ UPDATED
                  ============================================ */}
              <Route element={<RoleBasedRoute allowedRoles={['lab', 'laboratory', 'admin']} />}>
                <Route path="/laboratory/dashboard" element={<LaboratoryDashboard />} />
                <Route path="/laboratory/catalog" element={<ManageTests />} />
                <Route path="/laboratory/results" element={<TestResults />} />
                <Route path="/laboratory/patient-records" element={<LaboratoryDashboard />} />
                <Route path="/laboratory/notifications" element={<LaboratoryDashboard />} />
                <Route path="/laboratory/locations" element={<LaboratoryDashboard />} />

                {/* ✅ Lab Orders now use real components */}
                <Route path="/laboratory/orders" element={<LabOrders />} />
                <Route path="/laboratory/orders/:orderId" element={<LabOrderDetails />} />

                {/* Legacy redirects */}
                <Route path="/lab/dashboard" element={<Navigate to="/laboratory/dashboard" replace />} />
                <Route path="/lab/orders" element={<Navigate to="/laboratory/orders" replace />} />
                <Route path="/lab/results" element={<Navigate to="/laboratory/results" replace />} />
              </Route>

              {/* Pharmacy Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['pharmacy', 'admin']} />}>
                <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
                <Route path="/pharmacy/prescriptions" element={<Prescriptions />} />
                <Route path="/pharmacy/prescriptions/:prescriptionId" element={<Prescriptions />} />
                <Route path="/pharmacy/inventory" element={<Inventory />} />
                <Route path="/pharmacy/orders" element={<Orders />} />
                <Route path="/pharmacy/orders/:id" element={<OrderDetails />} />
                <Route path="/pharmacy/track-delivery" element={<TrackOrder />} />
                <Route path="/pharmacy/reports" element={<Reports />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/users" element={<EnhancedUserManagement />} />
                <Route path="/admin/doctors" element={<EnhancedUserManagement />} />
                <Route path="/admin/patients" element={<EnhancedUserManagement />} />
                <Route path="/admin/appointments" element={<AppointmentList />} />
                <Route path="/admin/pharmacy" element={<PharmacyDashboard />} />
                <Route path="/admin/laboratory" element={<BookLabTest />} />
                <Route path="/admin/lab-approvals" element={<LabApprovals />} />
                <Route path="/admin/analytics" element={<Analytics />} />
                <Route path="/admin/reports" element={<Analytics />} />
                <Route path="/admin/system-monitoring" element={<SystemMonitoring />} />
                <Route path="/admin/settings" element={<EnhancedUserManagement />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/admin/security-dashboard" element={<SecurityDashboard />} />
                <Route path="/admin/security-compliance" element={<SecurityCompliance />} />
                <Route path="/admin/security-settings" element={<SecuritySettings />} />
                <Route path="/admin/user-security-profiles" element={<UserSecurityProfiles />} />
                <Route path="/admin/security-vulnerabilities" element={<SecurityVulnerabilities />} />
              </Route>

              {/* Shared Routes */}
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;