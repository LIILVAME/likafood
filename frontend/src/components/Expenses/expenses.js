import React, { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import apiService from '../../services/apiService';
import LoadingSpinner from '../LoadingSpinner';
import './expenses.css';

const Expenses = () => {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();

  // State management
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [stats, setStats] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    category: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Categories for filtering
  const categories = [
    { value: 'all', label: t('expenses.categories.all') },
    { value: 'ingredients', label: t('expenses.categories.ingredients') },
    { value: 'utilities', label: t('expenses.categories.utilities') },
    { value: 'equipment', label: t('expenses.categories.equipment') },
    { value: 'transport', label: t('expenses.categories.transport') },
    { value: 'marketing', label: t('expenses.categories.marketing') },
    { value: 'rent', label: t('expenses.categories.rent') },
    { value: 'staff', label: t('expenses.categories.staff') },
    { value: 'other', label: t('expenses.categories.other') }
  ];

  // Fetch expenses from API
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      const response = await apiService.get('/expenses', { params });
      
      if (response.data.success) {
        setExpenses(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(t('expenses.errors.fetchFailed'));
      addNotification(t('expenses.errors.fetchFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, t, addNotification]);

  // Fetch expense statistics
  const fetchStats = useCallback(async () => {
    try {
      const params = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      const response = await apiService.get('/expenses/stats/summary', { params });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching expense stats:', err);
    }
  }, [filters.startDate, filters.endDate]);

  // Create new expense
  const createExpense = async (expenseData) => {
    try {
      const response = await apiService.post('/expenses', expenseData);
      
      if (response.data.success) {
        addNotification(t('expenses.messages.createSuccess'), 'success');
        setShowAddModal(false);
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      console.error('Error creating expense:', err);
      const errorMessage = err.response?.data?.message || t('expenses.errors.createFailed');
      addNotification(errorMessage, 'error');
    }
  };

  // Update expense
  const updateExpense = async (id, expenseData) => {
    try {
      const response = await apiService.put(`/expenses/${id}`, expenseData);
      
      if (response.data.success) {
        addNotification(t('expenses.messages.updateSuccess'), 'success');
        setEditingExpense(null);
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating expense:', err);
      const errorMessage = err.response?.data?.message || t('expenses.errors.updateFailed');
      addNotification(errorMessage, 'error');
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    if (!window.confirm(t('expenses.confirmDelete'))) {
      return;
    }

    try {
      const response = await apiService.delete(`/expenses/${id}`);
      
      if (response.data.success) {
        addNotification(t('expenses.messages.deleteSuccess'), 'success');
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      const errorMessage = err.response?.data?.message || t('expenses.errors.deleteFailed');
      addNotification(errorMessage, 'error');
    }
  };

  // Filter expenses locally by search term
  useEffect(() => {
    if (!filters.search) {
      setFilteredExpenses(expenses);
      return;
    }

    const filtered = expenses.filter(expense => 
      expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      expense.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
      expense.tags?.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
    );
    setFilteredExpenses(filtered);
  }, [expenses, filters.search]);

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const categoryObj = categories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.label : category;
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="expenses-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="expenses-container">
      {/* Header */}
      <div className="expenses-header">
        <div className="header-content">
          <h1>{t('expenses.title')}</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus"></i>
            {t('expenses.addExpense')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalExpenses)}</h3>
              <p>{t('expenses.stats.totalExpenses')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.expenseCount}</h3>
              <p>{t('expenses.stats.expenseCount')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.averageExpense)}</h3>
              <p>{t('expenses.stats.averageExpense')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="expenses-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>{t('expenses.filters.category')}</label>
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('expenses.filters.startDate')}</label>
            <input 
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t('expenses.filters.endDate')}</label>
            <input 
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t('expenses.filters.search')}</label>
            <input 
              type="text"
              placeholder={t('expenses.filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchExpenses} className="btn btn-secondary">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Expenses List */}
      <div className="expenses-content">
        {loading ? (
          <LoadingSpinner />
        ) : filteredExpenses.length === 0 ? (
          <div className="no-expenses">
            <i className="fas fa-receipt"></i>
            <h3>{t('expenses.noExpenses')}</h3>
            <p>{t('expenses.noExpensesDescription')}</p>
          </div>
        ) : (
          <>
            <div className="expenses-list">
              {filteredExpenses.map(expense => (
                <div key={expense._id} className="expense-card">
                  <div className="expense-header">
                    <div className="expense-info">
                      <h4>{expense.description}</h4>
                      <span className={`category-badge category-${expense.category}`}>
                        {getCategoryLabel(expense.category)}
                      </span>
                    </div>
                    <div className="expense-amount">
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                  
                  <div className="expense-details">
                    <div className="expense-date">
                      <i className="fas fa-calendar"></i>
                      {formatDate(expense.date)}
                    </div>
                    
                    {expense.notes && (
                      <div className="expense-notes">
                        <i className="fas fa-sticky-note"></i>
                        {expense.notes}
                      </div>
                    )}
                    
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="expense-tags">
                        {expense.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {expense.isRecurring && (
                      <div className="recurring-badge">
                        <i className="fas fa-repeat"></i>
                        {t(`expenses.recurring.${expense.recurringFrequency}`)}
                      </div>
                    )}
                  </div>
                  
                  <div className="expense-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <i className="fas fa-edit"></i>
                      {t('common.edit')}
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteExpense(expense._id)}
                    >
                      <i className="fas fa-trash"></i>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  {t('common.previous')}
                </button>
                
                <span className="pagination-info">
                  {t('common.pageOf', { current: pagination.page, total: pagination.pages })}
                </span>
                
                <button 
                  className="btn btn-secondary"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {(showAddModal || editingExpense) && (
        <ExpenseModal
          expense={editingExpense}
          categories={categories}
          onSave={editingExpense ? 
            (data) => updateExpense(editingExpense._id, data) : 
            createExpense
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};

// Expense Modal Component
const ExpenseModal = ({ expense, categories, onSave, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'other',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: expense?.notes || '',
    isRecurring: expense?.isRecurring || false,
    recurringFrequency: expense?.recurringFrequency || 'monthly',
    tags: expense?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content expense-modal">
        <div className="modal-header">
          <h3>{expense ? t('expenses.editExpense') : t('expenses.addExpense')}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('expenses.form.description')} *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label>{t('expenses.form.amount')} *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('expenses.form.category')} *</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              >
                {categories.filter(cat => cat.value !== 'all').map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('expenses.form.date')} *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('expenses.form.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>{t('expenses.form.tags')}</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder={t('expenses.form.tagsPlaceholder')}
            />
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                />
                {t('expenses.form.isRecurring')}
              </label>
            </div>

            {formData.isRecurring && (
              <div className="form-group">
                <label>{t('expenses.form.recurringFrequency')}</label>
                <select
                  value={formData.recurringFrequency}
                  onChange={(e) => handleChange('recurringFrequency', e.target.value)}
                >
                  <option value="daily">{t('expenses.recurring.daily')}</option>
                  <option value="weekly">{t('expenses.recurring.weekly')}</option>
                  <option value="monthly">{t('expenses.recurring.monthly')}</option>
                  <option value="yearly">{t('expenses.recurring.yearly')}</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> {t('common.saving')}</>
              ) : (
                expense ? t('common.update') : t('common.create')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Expenses;