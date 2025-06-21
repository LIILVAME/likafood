import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationToaster from './components/NotificationSystem';
import './App.css';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Orders = lazy(() => import('./pages/Orders'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Settings = lazy(() => import('./pages/Settings'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
               <div className="App">
                 <NotificationToaster />
                 <Suspense fallback={<LoadingSpinner />}>
                   <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout>
                          <Home />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <Layout>
                          <Orders />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/catalog" element={
                      <ProtectedRoute>
                        <Layout>
                          <Catalog />
                        </Layout>
                      </ProtectedRoute>
                    } />
                     <Route path="/expenses" element={
                       <ProtectedRoute>
                         <Layout>
                           <Expenses />
                         </Layout>
                       </ProtectedRoute>
                     } />
                     <Route path="/settings" element={
                       <ProtectedRoute>
                         <Layout>
                           <Settings />
                         </Layout>
                       </ProtectedRoute>
                     } />
                   </Routes>
                 </Suspense>
               </div>
             </Router>
           </AuthProvider>
         </CurrencyProvider>
       </LanguageProvider>
     </ErrorBoundary>
  );
}

export default App;