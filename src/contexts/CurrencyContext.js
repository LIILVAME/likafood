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
  const [currency, setCurrency] = useState('XOF'); // Default to West African CFA franc

  const currencies = {
    XOF: {
      code: 'XOF',
      name: 'Franc CFA',
      symbol: 'FCFA',
      position: 'after' // Symbol position relative to amount
    },
    EUR: {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      position: 'after'
    },
    USD: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      position: 'before'
    }
  };

  const formatCurrency = (amount, currencyCode = currency) => {
    const curr = currencies[currencyCode];
    if (!curr) return amount;
    
    const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
    
    return curr.position === 'before' 
      ? `${curr.symbol}${formattedAmount}`
      : `${formattedAmount} ${curr.symbol}`;
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

export default CurrencyContext;