import { useEffect, lazy, Suspense, useState } from "react";
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
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })));

// Client pages
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard").then((m) => ({ default: m.ClientDashboard })));
const ClientProgressPage = lazy(() => import("@/pages/client/ClientProgressPage").then((m) => ({ default: m.ClientProgressPage })));
const ClientFilesPage = lazy(() => import("@/pages/client/ClientFilesPage").then((m) => ({ default: m.ClientFilesPage })));
const ClientBlueprintsPage = lazy(() => import("@/pages/client/ClientBlueprintsPage").then((m) => ({ default: m.ClientBlueprintsPage })));
const ClientProfilePage = lazy(() => import("@/pages/client/ClientProfilePage").then((m) => ({ default: m.ClientProfilePage })));

function PageLoader({ fixed = false }: { fixed?: boolean }) {
  const { branding } = useAppSettings();

  return (
    <div className={`${fixed ? "fixed inset-0 z-[999] min-h-screen bg-white/90 backdrop-blur-sm" : "min-h-[60vh]"} flex items-center justify-center`}>
      <div className="relative grid h-28 w-28 place-items-center rounded-full bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-orange-100">
        <div className="absolute inset-0 rounded-full border border-orange-100" />
        <div className="absolute inset-2 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin [animation-duration:3s]" />
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.companyName} className="max-h-14 max-w-16 object-contain animate-spin [animation-duration:6s]" />
          ) : (
            <Building2 className="h-10 w-10 animate-spin text-brand-primary [animation-duration:6s]" />
          )}
        </div>
      </div>
    </div>
  );
}

function RouteChangeLoader() {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><ClientProfilePage /></Suspense>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
