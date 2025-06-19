import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

function Catalog() {
  const { t } = useLanguage();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDish, setShowAddDish] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'unavailable'

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/dishes');
      // Backend returns data in response.data.data format
      const dishesData = response.data.data || [];
      // Convert _id to id for frontend compatibility
      const dishesWithId = dishesData.map(dish => ({
        ...dish,
        id: dish._id || dish.id
      }));
      setDishes(dishesWithId);
    } catch (err) {
      setError(t('failedToLoadDishes'));
      console.error('Dishes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDishAvailability = async (dishId, currentAvailability) => {
    try {
      const response = await apiService.put(`/dishes/${dishId}`, { available: !currentAvailability });
      const updatedDish = response.data.data;
      setDishes(dishes.map(dish => 
        dish.id === dishId ? { ...updatedDish, id: updatedDish._id || updatedDish.id } : dish
      ));
    } catch (err) {
      setError(t('failedToUpdateDishAvailability'));
      console.error('Toggle availability error:', err);
    }
  };

  const deleteDish = async (dishId) => {
    if (!window.confirm(t('confirmDeleteDish'))) {
      return;
    }

    try {
      await apiService.delete(`/dishes/${dishId}`);
      setDishes(dishes.filter(dish => dish.id !== dishId));
    } catch (err) {
      setError(t('deleteExpenseError'));
      console.error('Delete dish error:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredDishes = dishes.filter(dish => {
    if (filter === 'all') return true;
    if (filter === 'available') return dish.available;
    if (filter === 'unavailable') return !dish.available;
    return true;
  });

  const categories = [...new Set(dishes.map(dish => dish.category))].filter(Boolean);

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
        <h1 className="text-2xl font-bold text-gray-900">{t('menuCatalog')}</h1>
        <button
          onClick={() => setShowAddDish(true)}
          className="btn-primary"
        >
          {t('addDish')}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: t('allDishes') },
          { key: 'available', label: t('available') },
          { key: 'unavailable', label: t('unavailable') }
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

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="text-xl font-bold text-gray-900">{dishes.length}</div>
          <div className="text-sm text-gray-600">{t('totalDishes')}</div>
        </div>
        <div className="metric-card">
          <div className="text-xl font-bold text-green-600">
            {dishes.filter(d => d.available).length}
          </div>
          <div className="text-sm text-gray-600">{t('available')}</div>
        </div>
        <div className="metric-card">
          <div className="text-xl font-bold text-gray-600">
            {categories.length}
          </div>
          <div className="text-sm text-gray-600">{t('categories')}</div>
        </div>
      </div>

      {/* Dishes List */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noDishesFound')}</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? t('noDishesInCatalog') : t('noFilteredDishes').replace('{filter}', filter)}
          </p>
          <button
            onClick={() => setShowAddDish(true)}
            className="btn-primary"
          >
            {t('addYourFirstDish')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{dish.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dish.available 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {dish.available ? t('available') : t('unavailable')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(dish.price)}
                    </p>
                    {dish.category && (
                      <p className="text-sm text-gray-600">
                        {t('category')}: {dish.category}
                      </p>
                    )}
                    {dish.preparationTime && (
                      <p className="text-sm text-gray-600">
                        {t('prepTime')}: {dish.preparationTime} {t('minutes')}
                      </p>
                    )}
                  </div>
                  
                  {dish.description && (
                    <p className="text-gray-700 mb-4">{dish.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingDish(dish)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => toggleDishAvailability(dish.id, dish.available)}
                    className={`font-medium text-sm ${
                      dish.available
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {dish.available ? t('markUnavailable') : t('markAvailable')}
                  </button>
                  <button
                    onClick={() => deleteDish(dish.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dish Modal */}
      {(showAddDish || editingDish) && (
        <DishModal
          dish={editingDish}
          onClose={() => {
            setShowAddDish(false);
            setEditingDish(null);
          }}
          onDishSaved={(savedDish) => {
            if (editingDish) {
              setDishes(dishes.map(dish => 
                dish.id === savedDish.id ? savedDish : dish
              ));
            } else {
              setDishes([savedDish, ...dishes]);
            }
            setShowAddDish(false);
            setEditingDish(null);
          }}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchDishes}
            className="text-red-700 hover:text-red-800 text-sm font-medium mt-2"
          >
            {t('tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
}

// Dish Modal Component
function DishModal({ dish, onClose, onDishSaved }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: dish?.name || '',
    price: dish?.price || '',
    category: dish?.category || '',
    description: dish?.description || '',
    preparationTime: dish?.preparationTime || '',
    available: dish?.available ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dishData = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null
      };

      let response;
      if (dish) {
        response = await apiService.put(`/dishes/${dish.id}`, dishData);
      } else {
        response = await apiService.post('/dishes', dishData);
      }

      // Backend returns data in response.data.data format
      const savedDish = response.data.data;
      // Convert _id to id for frontend compatibility
      const dishWithId = {
        ...savedDish,
        id: savedDish._id || savedDish.id
      };
      onDishSaved(dishWithId);
    } catch (err) {
      setError(dish ? t('failedToUpdateDish') : t('failedToCreateDish'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {dish ? t('editDish') : t('addNewDish')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dishName')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('priceDollar')} *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('category')}
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                placeholder={t('categoryPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preparationTimeMinutes')}
              </label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleChange}
                min="1"
                className="input-field"
                placeholder={t('preparationTimePlaceholder')}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="available"
                id="available"
                checked={formData.available}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                {t('availableForOrders')}
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
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
                disabled={loading}
              >
                {loading ? t('saving') : (dish ? t('updateDish') : t('addDish'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Catalog;