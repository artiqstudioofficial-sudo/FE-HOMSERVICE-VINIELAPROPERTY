import AOS from 'aos';
import 'aos/dist/aos.css';
import React, { Suspense, lazy, useEffect } from 'react';

import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TechnicianPage = lazy(() => import('./pages/Technician/TechnicianPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));

const PageLoader: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function refreshAOSReliable() {
  // refresh beberapa kali biar aman (DOM + layout + images)
  requestAnimationFrame(() => {
    AOS.refreshHard();
    requestAnimationFrame(() => AOS.refreshHard());
  });
}

const AOSSmartRefresh: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1) refresh pas route berubah
    refreshAOSReliable();

    // 2) refresh saat gambar selesai load (layout berubah)
    const imgs = Array.from(document.images || []);
    const onImgDone = () => refreshAOSReliable();

    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener('load', onImgDone, { once: true });
    });

    // 3) refresh otomatis kalau ada elemen baru masuk (lazy/data/api)
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches?.('[data-aos]') || node.querySelector?.('[data-aos]')) {
            refreshAOSReliable();
            return;
          }
        }
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      imgs.forEach((img) => img.removeEventListener('load', onImgDone));
      obs.disconnect();
    };
  }, [pathname]);

  return null;
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
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

  const hideLayout =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/technician');

  if (hideLayout) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <AOSSmartRefresh />

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
      // biasanya ini bantu kalau DOM sering berubah:
      disableMutationObserver: true, // kita handle sendiri pakai MutationObserver
    });
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <HashRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </HashRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
