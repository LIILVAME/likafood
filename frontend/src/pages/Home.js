import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAsyncData } from '../hooks/useAsync';
import { useNotifications } from '../components/NotificationSystem';
import { DashboardSkeleton } from '../components/SkeletonLoaders';
import { apiService } from '../services/apiService';

function Home() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { t, getDateLocale } = useLanguage();
  const { success: showSuccess } = useNotifications();

  // Data fetcher function using apiService
  const fetchDashboardData = async () => {
    const response = await apiService.get('/dashboard');
    return response.data;
  };

  // Use the async data hook for dashboard data
  const {
    data: dashboardData,
    loading,
    error,
    refresh,
    isStale
  } = useAsyncData(
    fetchDashboardData,
    'dashboard-data',
    {
      cacheTime: 300000, // 5 minutes
      staleTime: 60000,  // 1 minute
      errorMessage: t('failedToLoadData'),
      showErrorNotification: true
    }
  );

  const metrics = dashboardData?.metrics || {
    todayOrders: 0,
    todaySales: 0,
    todayProfit: 0,
    pendingOrders: 0,
    totalDishes: 0
  };
  
  const recentOrders = dashboardData?.orders || [];



  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(getDateLocale(), {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stale data indicator */}
      {isStale && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">{t('dataIsStale')}</p>
              <p className="text-xs text-yellow-600">{t('clickToRefresh')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              refresh();
              showSuccess(t('refreshingData'));
            }}
            className="text-yellow-600 hover:text-yellow-700 font-medium text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-lg transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      )}
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-3xl p-8 text-white animate-slide-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {t('welcomeBack')}, {user?.ownerName || t('vendor')}!
              </h2>
              <p className="text-white/80 font-medium">
                {user?.businessName || t('yourBusiness')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white/70">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">
              {new Date().toLocaleDateString(getDateLocale(), {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card group hover:scale-105 animate-bounce-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="status-dot status-pending"></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.todayOrders}</div>
          <div className="text-sm text-gray-600 font-medium">{t('todaysOrders')}</div>
        </div>
        
        <div className="metric-card group hover:scale-105 animate-bounce-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">+12%</div>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(metrics.todaySales)}
          </div>
          <div className="text-sm text-gray-600 font-medium">{t('todaysSales')}</div>
        </div>
        
        <div className="metric-card group hover:scale-105 animate-bounce-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-xs text-purple-600 font-semibold bg-purple-100 px-2 py-1 rounded-full">+8%</div>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {formatCurrency(metrics.todayProfit)}
          </div>
          <div className="text-sm text-gray-600 font-medium">{t('todaysProfit')}</div>
        </div>
        
        <div className="metric-card group hover:scale-105 animate-bounce-in" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {metrics.pendingOrders > 0 && (
              <div className="status-dot status-pending"></div>
            )}
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">{metrics.pendingOrders}</div>
          <div className="text-sm text-gray-600 font-medium">{t('pendingOrders')}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card animate-slide-up" style={{animationDelay: '0.5s'}}>
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('quickActions')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/orders"
            className="group relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-bold text-primary-700 group-hover:text-primary-800">{t('addOrder')}</span>
            </div>
          </Link>
          
          <Link
            to="/catalog"
            className="group relative overflow-hidden bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-6 border border-secondary-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-secondary-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-sm font-bold text-secondary-700 group-hover:text-secondary-800">{t('addDish')}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card animate-slide-up" style={{animationDelay: '0.6s'}}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('recentOrders')}</h3>
          </div>
          <Link
            to="/orders"
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-semibold bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-xl transition-all duration-300"
          >
            <span>{t('viewAll')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-4">{t('noOrdersToday')}</p>
            <Link to="/orders" className="btn-primary inline-flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('createFirstOrder')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <div key={order.id} className="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 animate-slide-up" style={{animationDelay: `${0.7 + index * 0.1}s`}}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-100/30 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-gray-700">#{order.id}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-600">{formatTime(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusColor(order.status)}`}>
                        {t(order.status)}
                      </span>
                      <div className={`status-dot status-${order.status}`}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-red-800">Error Loading Data</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              refresh();
              showSuccess(t('retryingRequest'));
            }}
            className="btn-danger text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;