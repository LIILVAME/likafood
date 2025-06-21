import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiservice';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/languagecontext';
import { useNotifications } from '../components/notificationsystem';

function Orders() {
  const { formatCurrency } = useCurrency();
  const { t, getDateLocale } = useLanguage();
  const { showSuccess, showError } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'ready', 'completed'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch orders and dishes in parallel
      const [ordersResponse, dishesResponse] = await Promise.all([
        apiService.get('/orders'),
        apiService.get('/dishes')
      ]);
      
      // Handle orders data
      const ordersData = ordersResponse.data.data || [];
      const formattedOrders = ordersData.map(order => ({
        ...order,
        id: order._id || order.id
      }));
      
      // Handle dishes data
      const dishesData = dishesResponse.data.data || [];
      const formattedDishes = dishesData.map(dish => ({
        ...dish,
        id: dish._id || dish.id
      }));
      
      setOrders(formattedOrders);
      setDishes(formattedDishes);
    } catch (err) {
      setError(t('loadingError'));
      console.error('Orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await apiService.put(`/orders/${orderId}`, { status: newStatus });
      const updatedOrder = response.data.data;
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...updatedOrder, id: updatedOrder._id || updatedOrder.id } : order
      ));
      
      showSuccess(t('orderStatusUpdated') || 'Statut de la commande mis à jour');
     } catch (err) {
       setError(t('updateOrderError') || 'Erreur lors de la mise à jour de la commande');
       console.error('Update order error:', err);
     }
   };

  const createOrder = async (orderData) => {
    try {
      const response = await apiService.post('/orders', orderData);
      const newOrder = response.data.data;
      
      setOrders(prevOrders => [{
        ...newOrder,
        id: newOrder._id || newOrder.id
      }, ...prevOrders]);
      
      setShowAddOrder(false);
      showSuccess(t('orderCreated') || 'Commande créée avec succès');
    } catch (err) {
      showError(t('createOrderError') || 'Erreur lors de la création de la commande');
      console.error('Create order error:', err);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await apiService.delete(`/orders/${orderId}`);
      setOrders(orders.filter(order => order.id !== orderId));
      showSuccess(t('orderDeleted') || 'Commande supprimée');
    } catch (err) {
      showError(t('deleteOrderError') || 'Erreur lors de la suppression de la commande');
      console.error('Delete order error:', err);
    }
  };

  // formatCurrency is now provided by useCurrency hook

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(getDateLocale(), {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
      return t('startPreparation');
    case 'preparing':
      return t('markAsReady');
    case 'ready':
      return t('completeOrder');
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getDishName = (dishRef) => {
    // Handle both populated dish objects and dish IDs
    if (typeof dishRef === 'object' && dishRef.name) {
      return dishRef.name;
    }
    const dish = dishes.find(d => d.id === dishRef);
    return dish ? dish.name : 'Unknown Dish';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('orders')}</h1>
        <button
          onClick={() => setShowAddOrder(true)}
          className="btn-primary"
        >
          {t('addOrder')}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: t('all') },
          { key: 'pending', label: t('pending') },
          { key: 'preparing', label: t('preparing') },
          { key: 'ready', label: t('ready') },
          { key: 'completed', label: t('completed') }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noOrdersFound')}</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? t('noOrdersYet') : `${t('noOrdersFound')} ${t(filter)}`}
          </p>
          <button
            onClick={() => setShowAddOrder(true)}
            className="btn-primary"
          >
            {t('createFirstOrder')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{t('order')} #{order.orderNumber || order.id}</h3>
                  <p className="text-sm text-gray-600">
                    {order.customerName} • {order.customerPhone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(order.createdAt || order.orderTime)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {t(order.status)}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {getDishName(item.dish || item.dishId)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-lg font-semibold text-gray-900">
                  {t('total')}: {formatCurrency(order.total)}
                </div>
                
                {getNextStatus(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    {getNextStatusLabel(order.status)}
                  </button>
                )}
                
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="ml-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    {t('cancel')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrder && (
        <AddOrderModal
          dishes={dishes}
          onClose={() => setShowAddOrder(false)}
          onOrderAdded={createOrder}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="text-red-700 hover:text-red-800 text-sm font-medium mt-2"
          >
            {t('tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
}

// Add Order Modal Component
function AddOrderModal({ dishes, onClose, onOrderAdded }) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { showError } = useNotifications();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = (dish) => {
    const existingItem = selectedItems.find(item => item.dishId === dish.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.dishId === dish.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        dishId: dish.id,
        quantity: 1,
        price: dish.price
      }]);
    }
  };

  const removeItem = (dishId) => {
    setSelectedItems(selectedItems.filter(item => item.dishId !== dishId));
  };

  const updateQuantity = (dishId, quantity) => {
    if (quantity <= 0) {
      removeItem(dishId);
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.dishId === dishId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError(t('addItemFirst'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        customerName,
        customerPhone,
        items: selectedItems,
        total: calculateTotal(),
        notes: ''
      };

      await onOrderAdded(orderData);
    } catch (err) {
      showError(t('createOrderError') || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('addNewOrder')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customerName')}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customerPhone')}
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectItems')}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dishes.filter(dish => dish.available).map((dish) => (
                  <div key={dish.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{dish.name}</h4>
                      <p className="text-sm text-gray-600">${dish.price}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(dish)}
                      className="btn-primary text-sm py-1 px-3"
                    >
                      {t('add')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('orderItems')}
                </label>
                <div className="space-y-2">
                  {selectedItems.map((item) => {
                    const dish = dishes.find(d => d.id === item.dishId);
                    return (
                      <div key={item.dishId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{dish?.name}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.dishId)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2"
                          >
                            {t('remove')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-right font-semibold">
                    {t('total')}: {formatCurrency(calculateTotal())}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={loading || selectedItems.length === 0}
              >
                {loading ? t('creating') : t('createOrder')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Orders;