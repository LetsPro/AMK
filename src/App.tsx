import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { PublicLayout } from "@/pages/public/PublicLayout";
import { ContactPage, CustomerRegisterPage, HomePage, ListingPage, ProjectDetailPage } from "@/pages/public/PublicPages";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { ModulePage } from "@/pages/operations/ModulePage";
import { CalculatorPage } from "@/pages/operations/CalculatorPage";
import { CmsPage } from "@/pages/admin/CmsPage";
import { MediaPage } from "@/pages/admin/MediaPage";
import { SettingsPage } from "@/pages/admin/SettingsPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<ListingPage type="about" />} />
        <Route path="projects" element={<ListingPage type="projects" />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="services" element={<ListingPage type="services" />} />
        <Route path="gallery" element={<ListingPage type="gallery" />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="customer-register" element={<CustomerRegisterPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="leads" element={<ModulePage name="leads" />} />
          <Route path="customers" element={<ModulePage name="customers" />} />
          <Route path="clients" element={<ModulePage name="clients" />} />
          <Route path="projects" element={<ModulePage name="projects" />} />
          <Route path="calculations" element={<CalculatorPage />} />
          <Route path="quotations" element={<ModulePage name="quotations" />} />
          <Route path="invoices" element={<ModulePage name="invoices" />} />
          <Route path="payments" element={<ModulePage name="payments" />} />
          <Route path="staff" element={<ModulePage name="staff" />} />
          <Route path="attendance" element={<ModulePage name="attendance" />} />
          <Route path="expenses" element={<ModulePage name="expenses" />} />
          <Route path="tickets" element={<ModulePage name="tickets" />} />
          <Route path="cms" element={<CmsPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="activity" element={<ModulePage name="activity" />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
