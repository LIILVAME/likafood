import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authcontext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/languagecontext';
import Layout from './components/Layout';
import LoadingSpinner from './components/loadingspinner';
import ErrorBoundary from './components/errorboundary';
import NotificationToaster from './components/notificationsystem';
import './app.css';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/login'));
const Home = lazy(() => import('./pages/home'));
const Orders = lazy(() => import('./pages/orders'));
const Catalog = lazy(() => import('./pages/catalog'));
const Expenses = lazy(() => import('./pages/expenses'));
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