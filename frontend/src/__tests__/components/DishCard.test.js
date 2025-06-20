import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DishCard from '../../components/DishCard';
import { AuthProvider } from '../../contexts/AuthContext';
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

// Mock API calls
jest.mock('../../services/api', () => ({
  updateDish: jest.fn(),
  deleteDish: jest.fn(),
  toggleDishAvailability: jest.fn()
}));

const mockDish = {
  _id: 'dish-123',
  name: 'Coq au Vin',
  description: 'Plat traditionnel français avec du poulet mijoté dans le vin rouge',
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

const mockUser = {
  _id: 'user-123',
  phoneNumber: '+33123456789',
  businessName: 'Restaurant Test',
  role: 'user'
};

// Wrapper component for providers
const TestWrapper = ({ children, user = mockUser }) => {
  return (
    <BrowserRouter>
      <AuthProvider value={{ user, isAuthenticated: true }}>
        {children}
      </AuthProvider>
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

  describe('Rendering', () => {
    it('should render dish information correctly', () => {
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
      expect(screen.getByText('Plat traditionnel français avec du poulet mijoté dans le vin rouge')).toBeInTheDocument();
      expect(screen.getByText('18,50 €')).toBeInTheDocument();
      expect(screen.getByText('Plats principaux')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
    });

    it('should render dish image with alt text', () => {
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

    it('should render placeholder image when no imageUrl provided', () => {
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

      const image = screen.getByAltText('Coq au Vin');
      expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });

    it('should render ingredients list', () => {
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

      mockDish.ingredients.forEach(ingredient => {
        expect(screen.getByText(ingredient)).toBeInTheDocument();
      });
    });

    it('should render allergen information', () => {
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

      expect(screen.getByText('Allergènes:')).toBeInTheDocument();
      expect(screen.getByText('Gluten')).toBeInTheDocument();
    });

    it('should render nutritional information', () => {
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

      expect(screen.getByText('450 kcal')).toBeInTheDocument();
      expect(screen.getByText('35g protéines')).toBeInTheDocument();
      expect(screen.getByText('12g glucides')).toBeInTheDocument();
      expect(screen.getByText('25g lipides')).toBeInTheDocument();
    });
  });

  describe('Availability Status', () => {
    it('should show available status for available dish', () => {
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

      expect(screen.getByText('Disponible')).toBeInTheDocument();
      expect(screen.getByTestId('availability-indicator')).toHaveClass('available');
    });

    it('should show unavailable status for unavailable dish', () => {
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

      expect(screen.getByText('Non disponible')).toBeInTheDocument();
      expect(screen.getByTestId('availability-indicator')).toHaveClass('unavailable');
    });

    it('should apply unavailable styling to card when dish is unavailable', () => {
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

      expect(screen.getByTestId('dish-card')).toHaveClass('dish-unavailable');
    });
  });

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      
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

      const editButton = screen.getByTestId('edit-dish-button');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockDish);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      
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

      const deleteButton = screen.getByTestId('delete-dish-button');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockDish._id);
    });

    it('should call onToggleAvailability when availability toggle is clicked', async () => {
      const user = userEvent.setup();
      
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

      const availabilityToggle = screen.getByTestId('availability-toggle');
      await user.click(availabilityToggle);

      expect(mockOnToggleAvailability).toHaveBeenCalledWith(mockDish._id, !mockDish.isAvailable);
    });

    it('should expand/collapse detailed view when card is clicked', async () => {
      const user = userEvent.setup();
      
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

      // Initially, detailed view should be collapsed
      expect(screen.queryByTestId('dish-details')).not.toBeInTheDocument();

      // Click to expand
      const card = screen.getByTestId('dish-card');
      await user.click(card);

      expect(screen.getByTestId('dish-details')).toBeInTheDocument();

      // Click again to collapse
      await user.click(card);

      expect(screen.queryByTestId('dish-details')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when toggling availability', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DishCard
            dish={mockDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
            isLoading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      // Buttons should be disabled during loading
      expect(screen.getByTestId('edit-dish-button')).toBeDisabled();
      expect(screen.getByTestId('delete-dish-button')).toBeDisabled();
      expect(screen.getByTestId('availability-toggle')).toBeDisabled();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
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

      const card = screen.getByTestId('dish-card');
      expect(card).toHaveClass('mobile-layout');
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

      expect(screen.getByLabelText('Modifier le plat Coq au Vin')).toBeInTheDocument();
      expect(screen.getByLabelText('Supprimer le plat Coq au Vin')).toBeInTheDocument();
      expect(screen.getByLabelText('Basculer la disponibilité de Coq au Vin')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
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

      // Tab to edit button
      await user.tab();
      expect(screen.getByTestId('edit-dish-button')).toHaveFocus();

      // Tab to delete button
      await user.tab();
      expect(screen.getByTestId('delete-dish-button')).toHaveFocus();

      // Tab to availability toggle
      await user.tab();
      expect(screen.getByTestId('availability-toggle')).toHaveFocus();
    });

    it('should activate buttons with Enter key', async () => {
      const user = userEvent.setup();
      
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

      const editButton = screen.getByTestId('edit-dish-button');
      editButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnEdit).toHaveBeenCalledWith(mockDish);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing dish data gracefully', () => {
      const incompleteDish = {
        _id: 'dish-123',
        name: 'Test Dish'
        // Missing other required fields
      };
      
      render(
        <TestWrapper>
          <DishCard
            dish={incompleteDish}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onToggleAvailability={mockOnToggleAvailability}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Dish')).toBeInTheDocument();
      // Should not crash and should show default values
      expect(screen.getByText('0,00 €')).toBeInTheDocument();
    });

    it('should handle image loading errors', async () => {
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
      
      // Simulate image load error
      fireEvent.error(image);
      
      // Should fallback to placeholder
      await waitFor(() => {
        expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
      });
    });
  });
});