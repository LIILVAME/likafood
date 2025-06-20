import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const DishCard = ({ 
  dish, 
  onEdit, 
  onDelete, 
  onToggleAvailability, 
  isLoading = false,
  showActions = true,
  compact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(dish);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      try {
        setIsUpdating(true);
        if (onDelete) {
          await onDelete(dish._id);
        }
        toast.success('Plat supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setIsUpdating(true);
      if (onToggleAvailability) {
        await onToggleAvailability(dish._id, !dish.isAvailable);
      }
      toast.success(
        dish.isAvailable ? 'Plat marqué comme indisponible' : 'Plat marqué comme disponible'
      );
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-48 bg-gray-300 rounded-md mb-4"></div>
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
        compact ? 'p-3' : 'p-4'
      } ${!dish.isAvailable ? 'opacity-60' : ''}`}
      data-testid="dish-card"
      role="article"
      aria-label={`Plat: ${dish.name}`}
    >
      {/* Image */}
      <div className="relative mb-4">
        {!imageError && dish.imageUrl ? (
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-48 object-cover rounded-md"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500">Pas d'image</span>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className="absolute top-2 right-2">
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              dish.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
            data-testid="availability-badge"
          >
            {dish.isAvailable ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {dish.name}
          </h3>
          <span className="text-lg font-bold text-green-600 ml-2">
            {formatPrice(dish.price)}
          </span>
        </div>

        <p className="text-gray-600 text-sm">
          {dish.category}
        </p>

        <div className="text-gray-700">
          <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
            {dish.description}
          </p>
          {dish.description && dish.description.length > 100 && (
            <button
              onClick={toggleExpanded}
              className="text-blue-600 text-sm hover:underline mt-1"
              data-testid="expand-button"
            >
              {isExpanded ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        {/* Additional Info */}
        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {dish.preparationTime && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Temps de préparation:</span> {dish.preparationTime} min
              </p>
            )}
            
            {dish.ingredients && dish.ingredients.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Ingrédients:</p>
                <p className="text-sm text-gray-600">
                  {dish.ingredients.join(', ')}
                </p>
              </div>
            )}
            
            {dish.allergens && dish.allergens.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Allergènes:</p>
                <p className="text-sm text-red-600">
                  {dish.allergens.join(', ')}
                </p>
              </div>
            )}
            
            {dish.nutritionalInfo && (
              <div>
                <p className="text-sm font-medium text-gray-700">Informations nutritionnelles:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>Calories: {dish.nutritionalInfo.calories}</span>
                  <span>Protéines: {dish.nutritionalInfo.protein}g</span>
                  <span>Glucides: {dish.nutritionalInfo.carbs}g</span>
                  <span>Lipides: {dish.nutritionalInfo.fat}g</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleEdit}
            disabled={isUpdating}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="edit-button"
            aria-label={`Modifier ${dish.name}`}
          >
            Modifier
          </button>
          
          <button
            onClick={handleToggleAvailability}
            disabled={isUpdating}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              dish.isAvailable
                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                : 'text-green-600 bg-green-50 hover:bg-green-100'
            }`}
            data-testid="toggle-availability-button"
            aria-label={`${dish.isAvailable ? 'Marquer comme indisponible' : 'Marquer comme disponible'} ${dish.name}`}
          >
            {dish.isAvailable ? 'Indisponible' : 'Disponible'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="delete-button"
            aria-label={`Supprimer ${dish.name}`}
          >
            Supprimer
          </button>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default DishCard;