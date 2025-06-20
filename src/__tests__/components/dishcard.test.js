import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DishCard from '../../components/DishCard';
import { toast } from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}));

const mockDish = {
  _id: 'dish-123',
  name: 'Coq au Vin',
  description: 'Plat traditionnel français avec du poulet mijoté dans le vin rouge, accompagné de champignons sautés et de lardons croustillants. Ce plat emblématique de la cuisine française est préparé avec soin selon une recette traditionnelle transmise de génération en génération.',
  price: 18.50,
  category: 'Plats principaux',
  ingredients: ['Poulet', 'Vin rouge', 'Champignons', 'Lardons'],
  imageUrl: 'https://example.com/coq-au-vin.jpg',
  isAvailable: true,
  preparationTime: 30,
  allergens: ['Gluten'],
  nutritionalInfo: {
    calories: 450,
    protein: 35,
    carbs: 12,
    fat: 25
  }
};

// Wrapper component for providers
const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('DishCard Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleAvailability = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render dish basic information', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Coq au Vin')).toBeInTheDocument();
      expect(screen.getByText('18,50 €')).toBeInTheDocument();
      expect(screen.getByText('Plats principaux')).toBeInTheDocument();
      expect(screen.getByTestId('dish-card')).toBeInTheDocument();
    });

    it('should render dish image with correct alt text', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const image = screen.getByAltText('Coq au Vin');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockDish.imageUrl);
    });

    it('should show availability badge', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('availability-badge')).toBeInTheDocument();
      expect(screen.getByText('Disponible')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should show placeholder when no image URL', () => {
      const dishWithoutImage = { ...mockDish, imageUrl: null };
      
      render(
        <TestWrapper>
          <DishCard
            dish={dishWithoutImage}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Pas d\'image')).toBeInTheDocument();
    });

    it('should handle image load error', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const image = screen.getByAltText('Coq au Vin');
      fireEvent.error(image);
      
      expect(screen.getByText('Pas d\'image')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should expand to show detailed information', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const expandButton = screen.getByTestId('expand-button');
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Temps de préparation:')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('Ingrédients:')).toBeInTheDocument();
      expect(screen.getByText('Poulet, Vin rouge, Champignons, Lardons')).toBeInTheDocument();
    });

    it('should collapse when clicking expand button again', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const expandButton = screen.getByTestId('expand-button');
      
      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText('Voir moins')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(expandButton);
      expect(screen.getByText('Voir plus')).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('should call onEdit when edit button is clicked', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockDish);
    });

    it('should call onToggleAvailability when toggle button is clicked', async () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('toggle-availability-button');
      fireEvent.click(toggleButton);
      
      expect(mockOnToggleAvailability).toHaveBeenCalledWith(mockDish._id, false);
    });

    it('should show confirmation dialog and call onDelete when delete button is clicked', () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);
      
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer ce plat ?');
      expect(mockOnDelete).toHaveBeenCalledWith(mockDish._id);
      
      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Loading States', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            isLoading={true}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Availability Status', () => {
    it('should show unavailable status correctly', () => {
      const unavailableDish = { ...mockDish, isAvailable: false };
      
      render(
        <TestWrapper>
          <DishCard
            dish={unavailableDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Indisponible')).toBeInTheDocument();
      expect(screen.getByTestId('dish-card')).toHaveClass('opacity-60');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveAttribute('aria-label', 'Plat: Coq au Vin');
      
      const editButton = screen.getByTestId('edit-button');
      expect(editButton).toHaveAttribute('aria-label', 'Modifier Coq au Vin');
      
      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton).toHaveAttribute('aria-label', 'Supprimer Coq au Vin');
    });
   });
});