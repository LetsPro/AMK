import { useEffect, lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Building2 } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Seo } from "@/components/seo/Seo";

const AppLayout = lazy(() => import("@/components/layout/AppLayout").then((m) => ({ default: m.AppLayout })));
const ClientLayout = lazy(() => import("@/components/layout/ClientLayout").then((m) => ({ default: m.ClientLayout })));
const PublicLayout = lazy(() => import("@/pages/public/PublicLayout").then((m) => ({ default: m.PublicLayout })));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })));
const HomePage = lazy(() => import("@/pages/public/PublicPages").then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import("@/pages/public/PublicPages").then((m) => ({ default: () => <m.ListingPage type="about" /> })));
const ServicesPage = lazy(() => import("@/pages/public/PublicPages").then((m) => ({ default: () => <m.ListingPage type="services" /> })));
const GalleryPage = lazy(() => import("@/pages/public/PublicPages").then((m) => ({ default: () => <m.ListingPage type="gallery" /> })));
const ContactPage = lazy(() => import("@/pages/public/PublicPages").then((m) => ({ default: m.ContactPage })));
const PortfolioListingPage = lazy(() => import("@/pages/public/PortfolioPages").then((m) => ({ default: m.PortfolioListingPage })));
const PortfolioDetailPage = lazy(() => import("@/pages/public/PortfolioPages").then((m) => ({ default: m.PortfolioDetailPage })));
const PanoramaPage = lazy(() => import("@/pages/public/PanoramaPage").then((m) => ({ default: m.PanoramaPage })));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ClientsPage = lazy(() => import("@/pages/admin/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import("@/pages/admin/ClientDetailPage").then((m) => ({ default: m.ClientDetailPage })));
const PortfolioPage = lazy(() => import("@/pages/admin/PortfolioPage").then((m) => ({ default: m.PortfolioPage })));
const FilesPage = lazy(() => import("@/pages/admin/FilesPage").then((m) => ({ default: m.FilesPage })));
const StagesPage = lazy(() => import("@/pages/admin/StagesPage").then((m) => ({ default: m.StagesPage })));
const AssignmentsPage = lazy(() => import("@/pages/admin/AssignmentsPage").then((m) => ({ default: m.AssignmentsPage })));
const BlueprintsAdminPage = lazy(() => import("@/pages/admin/BlueprintsAdminPage").then((m) => ({ default: m.BlueprintsAdminPage })));
const ActivityPage = lazy(() => import("@/pages/admin/ActivityPage").then((m) => ({ default: m.ActivityPage })));
const CmsPage = lazy(() => import("@/pages/admin/CmsPage").then((m) => ({ default: m.CmsPage })));
const MediaPage = lazy(() => import("@/pages/admin/MediaPage").then((m) => ({ default: m.MediaPage })));
const PanoramaAdminPage = lazy(() => import("@/pages/admin/PanoramaAdminPage").then((m) => ({ default: m.PanoramaAdminPage })));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })));

// Client pages
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard").then((m) => ({ default: m.ClientDashboard })));
const ClientProgressPage = lazy(() => import("@/pages/client/ClientProgressPage").then((m) => ({ default: m.ClientProgressPage })));
const ClientFilesPage = lazy(() => import("@/pages/client/ClientFilesPage").then((m) => ({ default: m.ClientFilesPage })));
const ClientBlueprintsPage = lazy(() => import("@/pages/client/ClientBlueprintsPage").then((m) => ({ default: m.ClientBlueprintsPage })));
const ClientProfilePage = lazy(() => import("@/pages/client/ClientProfilePage").then((m) => ({ default: m.ClientProfilePage })));
const ClientPanoramasPage = lazy(() => import("@/pages/client/ClientPanoramasPage").then((m) => ({ default: m.ClientPanoramasPage })));

function PageLoader({ fixed = false }: { fixed?: boolean }) {
  return (
    <div className={`${fixed ? "fixed inset-0 z-[999] min-h-screen bg-white/95" : "min-h-[45vh]"} flex items-center justify-center p-6`}>
      <span className="animate-pulse text-sm font-semibold text-slate-400">Loading…</span>
    </div>
  );
}

function InitialSplash({ onComplete }: { onComplete: () => void }) {
  const { branding } = useAppSettings();

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] grid min-h-screen place-items-center overflow-hidden bg-white p-6 md:p-10">
      {branding.logoUrl ? (
        <img src={branding.logoUrl} alt={branding.companyName} loading="eager" decoding="async" fetchPriority="high" className="max-h-[86vh] max-w-[90vw] animate-[logo-fade-in_1s_ease-out_both] object-contain" />
      ) : (
        <div className="flex animate-[logo-fade-in_1s_ease-out_both] flex-col items-center text-center">
          <Building2 className="h-24 w-24 text-brand-primary" />
          <h1 className="mt-5 text-3xl font-black text-slate-950">{branding.companyName}</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.22em] text-brand-primary">{branding.companySuffix}</p>
        </div>
      )}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

export function App() {
  const [splashComplete, setSplashComplete] = useState(false);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader fixed />}>
       <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="projects" element={<PortfolioListingPage />} />
          <Route path="projects/:slug" element={<PortfolioDetailPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="360-interiors" element={<PanoramaPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route path="login" element={<><Seo title="Secure Login | AMK Architects & Engineers" description="Secure sign-in for AMK Architects & Engineers clients and administrators." noIndex /><LoginPage /></>} />
        <Route path="forgot-password" element={<><Seo title="Reset Password | AMK Architects & Engineers" description="Request a secure password reset link for your AMK account." noIndex /><ForgotPasswordPage /></>} />
        <Route path="reset-password" element={<><Seo title="Choose New Password | AMK Architects & Engineers" description="Choose a new password for your secure AMK account." noIndex /><ResetPasswordPage /></>} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="app" element={<><Seo title="Administration Portal | AMK Architects & Engineers" description="Secure AMK website and project administration portal." noIndex /><AppLayout /></>}>
            <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
            <Route path="clients" element={<Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>} />
            <Route path="clients/:id" element={<Suspense fallback={<PageLoader />}><ClientDetailPage /></Suspense>} />
            <Route path="portfolio" element={<Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>} />
            <Route path="files" element={<Suspense fallback={<PageLoader />}><FilesPage /></Suspense>} />
            <Route path="stages" element={<Suspense fallback={<PageLoader />}><StagesPage /></Suspense>} />
            <Route path="assignments" element={<Suspense fallback={<PageLoader />}><AssignmentsPage /></Suspense>} />
            <Route path="blueprints" element={<Suspense fallback={<PageLoader />}><BlueprintsAdminPage /></Suspense>} />
            <Route path="activity" element={<Suspense fallback={<PageLoader />}><ActivityPage /></Suspense>} />
            <Route path="cms" element={<Suspense fallback={<PageLoader />}><CmsPage /></Suspense>} />
            <Route path="media" element={<Suspense fallback={<PageLoader />}><MediaPage /></Suspense>} />
            <Route path="360-interiors" element={<Suspense fallback={<PageLoader />}><PanoramaAdminPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>
        </Route>

        {/* Client routes */}
        <Route element={<ProtectedRoute requireClient />}>
          <Route path="client" element={<><Seo title="Client Project Portal | AMK Architects & Engineers" description="Secure AMK client portal for project progress, files, blueprints, and 360 interior views." noIndex /><ClientLayout /></>}>
            <Route index element={<Suspense fallback={<PageLoader />}><ClientDashboard /></Suspense>} />
            <Route path="progress" element={<Suspense fallback={<PageLoader />}><ClientProgressPage /></Suspense>} />
            <Route path="files" element={<Suspense fallback={<PageLoader />}><ClientFilesPage /></Suspense>} />
            <Route path="blueprints" element={<Suspense fallback={<PageLoader />}><ClientBlueprintsPage /></Suspense>} />
            <Route path="360-interiors" element={<Suspense fallback={<PageLoader />}><ClientPanoramasPage /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><ClientProfilePage /></Suspense>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
       </Routes>
      </Suspense>
      {!splashComplete && <InitialSplash onComplete={() => setSplashComplete(true)} />}
    </>
  );
}
