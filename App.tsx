import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AOS from 'aos';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TechnicianPage = lazy(() => import('./pages/TechnicianPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));


const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const PageLoader: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
     return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideLayout = location.pathname.startsWith('/admin') || location.pathname.startsWith('/technician');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
};


const App: React.FC = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out',
      offset: 100,
    });
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <HashRouter>
          <AuthProvider>
            <ScrollToTop />
            <div className="bg-white dark:bg-dark-bg text-secondary dark:text-gray-300 font-sans">
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route 
                      path="/admin/*" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/technician" 
                      element={
                        <ProtectedRoute allowedRoles={['technician']}>
                          <TechnicianPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </Suspense>
              </Layout>
            </div>
          </AuthProvider>
        </HashRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;