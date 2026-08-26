import { useEffect, lazy, Suspense, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Building2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { PublicLayout } from "@/pages/public/PublicLayout";
import { ContactPage, HomePage, ListingPage, ProjectDetailPage } from "@/pages/public/PublicPages";
import { PortfolioListingPage, PortfolioDetailPage } from "@/pages/public/PortfolioPages";
import { PanoramaPage } from "@/pages/public/PanoramaPage";
import { useAppSettings } from "@/hooks/useAppSettings";

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
  const { branding } = useAppSettings();

  return (
    <div className={`${fixed ? "fixed inset-0 z-[999] min-h-screen bg-white/95 backdrop-blur-sm" : "min-h-[60vh]"} flex items-center justify-center p-6`}>
      {branding.logoUrl ? (
        <img src={branding.logoUrl} alt={branding.companyName} className={fixed ? "max-h-[75vh] max-w-[86vw] object-contain" : "max-h-28 max-w-xs object-contain"} />
      ) : (
        <Building2 className={fixed ? "h-24 w-24 text-brand-primary" : "h-14 w-14 text-brand-primary"} />
      )}
    </div>
  );
}

function InitialSplash({ onComplete }: { onComplete: () => void }) {
  const { branding } = useAppSettings();

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 3000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] grid min-h-screen place-items-center overflow-hidden bg-white p-6 md:p-10">
      {branding.logoUrl ? (
        <img src={branding.logoUrl} alt={branding.companyName} className="max-h-[86vh] max-w-[90vw] object-contain" />
      ) : (
        <div className="flex flex-col items-center text-center">
          <Building2 className="h-24 w-24 text-brand-primary" />
          <h1 className="mt-5 text-3xl font-black text-slate-950">{branding.companyName}</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.22em] text-brand-primary">{branding.companySuffix}</p>
        </div>
      )}
    </div>
  );
}

function RouteChangeLoader() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return loading ? <PageLoader fixed /> : null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

export function App() {
  const [splashComplete, setSplashComplete] = useState(false);

  if (!splashComplete) return <InitialSplash onComplete={() => setSplashComplete(true)} />;

  return (
    <>
      <ScrollToTop />
      <RouteChangeLoader />
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<ListingPage type="about" />} />
          <Route path="projects" element={<PortfolioListingPage />} />
          <Route path="projects/:slug" element={<PortfolioDetailPage />} />
          <Route path="services" element={<ListingPage type="services" />} />
          <Route path="gallery" element={<ListingPage type="gallery" />} />
          <Route path="360-interiors" element={<PanoramaPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="app" element={<AppLayout />}>
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
            <Route path="360-interiors" element={<Suspense fallback={<PageLoader />}><PanoramaAdminPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>
        </Route>

        {/* Client routes */}
        <Route element={<ProtectedRoute requireClient />}>
          <Route path="client" element={<ClientLayout />}>
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
    </>
  );
}
