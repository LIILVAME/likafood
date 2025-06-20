import React, { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';

function Expenses() {
  const { formatCurrency } = useCurrency();
  const { t, getDateLocale } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data since backend endpoints don't exist yet
      const mockExpenses = [
        {
          id: '1',
          description: 'Achat ingrédients marché',
          amount: 15000,
          category: t('ingredients'),
          date: new Date().toISOString(),
          receipt: null
        },
        {
          id: '2',
          description: 'Facture électricité',
          amount: 25000,
          category: t('utilities'),
          date: new Date(Date.now() - 86400000).toISOString(),
          receipt: null
        }
      ];
      setExpenses(mockExpenses);
    } catch (err) {
      setError(t('loadingError'));
      console.error('Expenses error:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const deleteExpense = async (expenseId) => {
    if (!window.confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      // Mock delete - in real app this would call the API
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
    } catch (err) {
      setError(t('deleteExpenseError'));
    }
  };

  // formatCurrency is now provided by useCurrency hook

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(getDateLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= today;
        });
        break;
      case 'week':
        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= weekAgo;
        });
        break;
      case 'month':
        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthAgo;
        });
        break;
      default:
        break;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredExpenses = getFilteredExpenses();
  const categories = [...new Set(expenses.map(expense => expense.category))].filter(Boolean);
  
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const today = new Date();
      return expenseDate.toDateString() === today.toDateString();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const getCategoryColor = (category) => {
    const colors = {
      // French categories
      'Ingrédients': 'bg-green-100 text-green-800 border-green-200',
      'Utilitaires': 'bg-blue-100 text-blue-800 border-blue-200',
      'Équipement': 'bg-purple-100 text-purple-800 border-purple-200',
      'Marketing': 'bg-pink-100 text-pink-800 border-pink-200',
      'Transport': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Autre': 'bg-gray-100 text-gray-800 border-gray-200',
      // English categories
      'Ingredients': 'bg-green-100 text-green-800 border-green-200',
      'Utilities': 'bg-blue-100 text-blue-800 border-blue-200',
      'Equipment': 'bg-purple-100 text-purple-800 border-purple-200',
      'Transportation': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors[t('other')] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('expenses')}</h1>
        <button
          onClick={() => setShowAddExpense(true)}
          className="btn-primary"
        >
          {t('addExpense')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-sm text-gray-600">
            {filter === 'all' ? t('total') : 
             filter === 'today' ? t('today') :
             filter === 'week' ? t('thisWeek') : t('thisMonth')}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(todayExpenses)}
          </div>
          <div className="text-sm text-gray-600">{t('todaysExpenses')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Date Filter */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: t('all') },
            { key: 'today', label: t('today') },
            { key: 'week', label: t('thisWeek') },
            { key: 'month', label: t('thisMonth') }
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

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-primary-100 text-primary-800 border-primary-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {t('allCategories')}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  categoryFilter === category
                    ? 'bg-primary-100 text-primary-800 border-primary-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noExpensesFound')}</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? t('noExpensesRecorded') : `${t('noExpensesFound')} ${filter === 'today' ? t('today') : filter === 'week' ? t('thisWeek') : filter === 'month' ? t('thisMonth') : filter}`}
          </p>
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn-primary"
          >
            {t('addFirstExpense')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                    <p className="text-lg font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <ExpenseModal
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={(newExpense) => {
            setExpenses([newExpense, ...expenses]);
            setShowAddExpense(false);
          }}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchExpenses}
            className="text-red-700 hover:text-red-800 text-sm font-medium mt-2"
          >
            {t('tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
}

// Expense Modal Component
function ExpenseModal({ onClose, onExpenseAdded }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: t('other'),
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    t('ingredients'),
    t('utilities'),
    t('equipment'),
    t('marketing'),
    t('transportation'),
    t('other')
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const expenseData = {
        ...formData,
        id: Date.now().toString(),
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      // Mock API call - in real app this would call the backend
      onExpenseAdded(expenseData);
    } catch (err) {
      setError(t('addExpenseError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('addNewExpense')}</h2>
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
                {t('description')} *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder={t('descriptionPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('amount')} ($) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('category')} *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('date')} *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
                required
              />
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
                {loading ? t('adding') : t('addExpense')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Expenses;