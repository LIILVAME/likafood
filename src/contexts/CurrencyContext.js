import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('EUR'); // Default to EUR

  const currencies = {
    EUR: {
      symbol: '€',
      name: 'Euro',
      code: 'EUR'
    },
    XOF: {
      symbol: 'FCFA',
      name: 'West African CFA Franc',
      code: 'XOF'
    }
  };

  const formatCurrency = (amount) => {
    // Handle undefined, null, or non-numeric values
    const numericAmount = Number(amount) || 0;
    const currentCurrency = currencies[currency];
    if (currency === 'EUR') {
      return `${numericAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currentCurrency.symbol}`;
    } else {
      return `${numericAmount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currentCurrency.symbol}`;
    }
  };

  const value = {
    currency,
    setCurrency,
    currencies,
    formatCurrency,
    currentCurrency: currencies[currency]
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};