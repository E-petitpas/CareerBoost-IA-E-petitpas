import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ProtectedRecruiterRoute from './components/ProtectedRecruiterRoute';

// Pages d'authentification
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import SetPassword from './pages/Auth/SetPassword';

// Pages principales
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

// Pages candidat
import OfferSearch from './pages/Candidate/OfferSearch';
import Applications from './pages/Candidate/Applications';
import CandidateProfile from './pages/Candidate/Profile';

// Pages recruteur
import RecruiterDashboard from './pages/Recruiter/Dashboard';
import RecruiterOffers from './pages/Recruiter/Offers';
import RecruiterApplications from './pages/Recruiter/Applications';
import CreateOffer from './pages/Recruiter/CreateOffer';

// Pages admin
import AdminDashboard from './pages/Admin/AdminDashboard';
import CompanyValidation from './pages/Admin/CompanyValidation';
import AdminOffers from './pages/Admin/AdminOffers';
import FranceTravailOffers from './pages/Admin/FranceTravailOffers';

// Pages utilitaires
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/set-password" element={<SetPassword />} />

            {/* Routes protégées - Toutes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Routes candidat */}
            <Route path="/offers" element={
              <ProtectedRoute roles={['CANDIDATE']}>
                <Layout>
                  <OfferSearch />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/applications" element={
              <ProtectedRoute roles={['CANDIDATE']}>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute roles={['CANDIDATE']}>
                <Layout>
                  <CandidateProfile />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Routes recruteur */}
            <Route path="/recruiter/dashboard" element={
              <ProtectedRoute roles={['RECRUITER']}>
                <ProtectedRecruiterRoute>
                  <Layout>
                    <RecruiterDashboard />
                  </Layout>
                </ProtectedRecruiterRoute>
              </ProtectedRoute>
            } />

            <Route path="/recruiter/offers" element={
              <ProtectedRoute roles={['RECRUITER']}>
                <ProtectedRecruiterRoute>
                  <Layout>
                    <RecruiterOffers />
                  </Layout>
                </ProtectedRecruiterRoute>
              </ProtectedRoute>
            } />

            <Route path="/recruiter/offers/new" element={
              <ProtectedRoute roles={['RECRUITER']}>
                <ProtectedRecruiterRoute>
                  <Layout>
                    <CreateOffer />
                  </Layout>
                </ProtectedRecruiterRoute>
              </ProtectedRoute>
            } />

            <Route path="/recruiter/applications" element={
              <ProtectedRoute roles={['RECRUITER']}>
                <ProtectedRecruiterRoute>
                  <Layout>
                    <RecruiterApplications />
                  </Layout>
                </ProtectedRecruiterRoute>
              </ProtectedRoute>
            } />

            {/* Routes admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/companies" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <CompanyValidation />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/offers" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <AdminOffers />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/france-travail" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Layout>
                  <FranceTravailOffers />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Pages d'erreur */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
