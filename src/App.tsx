import { Navigate, Route, HashRouter, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { CreateProjectPage } from './pages/CreateProjectPage'
import { OwnerDashboardPage } from './pages/OwnerDashboardPage'
import { PublicWallPage } from './pages/PublicWallPage'
import { CaseStudyPage } from './pages/CaseStudyPage'
import { DemoPage } from './pages/DemoPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { AppDashboardPage } from './pages/AppDashboardPage'
import { AppProjectPage } from './pages/AppProjectPage'
import { ProjectCreatedPage } from './pages/ProjectCreatedPage'
import { ProjectSettingsPage } from './pages/ProjectSettingsPage'

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateProjectPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/case-study" element={<CaseStudyPage />} />
            <Route path="/p/:publicSlug" element={<PublicWallPage />} />
            <Route path="/p/:publicSlug/admin" element={<OwnerDashboardPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Authenticated workspace */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/app/projects" element={<Navigate to="/app" replace />} />
            <Route
              path="/app/projects/new"
              element={
                <ProtectedRoute>
                  <CreateProjectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/projects/:projectId/created"
              element={
                <ProtectedRoute>
                  <ProjectCreatedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/projects/:projectId"
              element={
                <ProtectedRoute>
                  <AppProjectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/projects/:projectId/settings"
              element={
                <ProtectedRoute>
                  <ProjectSettingsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </HashRouter>
  )
}
