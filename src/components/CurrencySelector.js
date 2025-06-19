import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const CurrencySelector = ({ className = '' }) => {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label htmlFor="currency-select" className="text-sm font-medium text-gray-700">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        {Object.entries(currencies).map(([code, currencyInfo]) => (
          <option key={code} value={code}>
            {currencyInfo.symbol} - {currencyInfo.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;