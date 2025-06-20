describe('Catalog Management', () => {
  beforeEach(() => {
    cy.cleanDatabase();
    cy.seedTestData();
    cy.loginAsTestUser();
    cy.visit('/catalog');
  });

  describe('Dish Display', () => {
    it('should display existing dishes', () => {
      cy.get('[data-testid="dish-list"]').should('be.visible');
      cy.get('[data-testid="dish-item"]').should('have.length.at.least', 1);
      
      // Check dish information is displayed
      cy.get('[data-testid="dish-item"]').first().within(() => {
        cy.get('[data-testid="dish-name"]').should('be.visible');
        cy.get('[data-testid="dish-price"]').should('be.visible');
        cy.get('[data-testid="dish-description"]').should('be.visible');
      });
    });

    it('should show empty state when no dishes exist', () => {
      cy.cleanDatabase();
      cy.visit('/catalog');
      
      cy.get('[data-testid="empty-catalog"]').should('be.visible');
      cy.get('[data-testid="empty-catalog"]').should('contain', 'No dishes in your catalog');
      cy.get('[data-testid="add-first-dish-button"]').should('be.visible');
    });

    it('should filter dishes by category', () => {
      // Assuming we have dishes with different categories
      cy.get('[data-testid="category-filter"]').select('Entrées');
      cy.get('[data-testid="dish-item"]').each(($dish) => {
        cy.wrap($dish).find('[data-testid="dish-category"]').should('contain', 'Entrées');
      });
      
      cy.get('[data-testid="category-filter"]').select('Plats principaux');
      cy.get('[data-testid="dish-item"]').each(($dish) => {
        cy.wrap($dish).find('[data-testid="dish-category"]').should('contain', 'Plats principaux');
      });
    });

    it('should search dishes by name', () => {
      cy.get('[data-testid="search-input"]').type('Poulet');
      cy.get('[data-testid="dish-item"]').each(($dish) => {
        cy.wrap($dish).find('[data-testid="dish-name"]').should('contain.text', 'Poulet');
      });
      
      // Clear search
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="dish-item"]').should('have.length.at.least', 1);
    });
  });

  describe('Add New Dish', () => {
    it('should open add dish modal', () => {
      cy.get('[data-testid="add-dish-button"]').click();
      cy.get('[data-testid="dish-modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'Ajouter un plat');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="add-dish-button"]').click();
      
      // Try to save without filling required fields
      cy.get('[data-testid="save-dish-button"]').click();
      
      // Check validation errors
      cy.get('[data-testid="name-error"]').should('contain', 'Le nom est requis');
      cy.get('[data-testid="price-error"]').should('contain', 'Le prix est requis');
      cy.get('[data-testid="category-error"]').should('contain', 'La catégorie est requise');
    });

    it('should create a new dish successfully', () => {
      cy.get('[data-testid="add-dish-button"]').click();
      
      // Fill form
      cy.get('[data-testid="dish-name-input"]').type('Nouveau Plat Test');
      cy.get('[data-testid="dish-description-input"]').type('Description du nouveau plat de test');
      cy.get('[data-testid="dish-price-input"]').type('15.99');
      cy.get('[data-testid="dish-category-select"]').select('Plats principaux');
      cy.get('[data-testid="dish-ingredients-input"]').type('Ingrédient 1, Ingrédient 2, Ingrédient 3');
      
      // Mock API call
      cy.intercept('POST', '/api/dishes', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 'new-dish-id',
            name: 'Nouveau Plat Test',
            description: 'Description du nouveau plat de test',
            price: 15.99,
            category: 'Plats principaux',
            ingredients: ['Ingrédient 1', 'Ingrédient 2', 'Ingrédient 3'],
            isAvailable: true
          }
        }
      }).as('createDish');
      
      cy.get('[data-testid="save-dish-button"]').click();
      cy.wait('@createDish');
      
      // Modal should close
      cy.get('[data-testid="dish-modal"]').should('not.exist');
      
      // New dish should appear in list
      cy.get('[data-testid="dish-item"]').should('contain', 'Nouveau Plat Test');
      
      // Success message should appear
      cy.get('[data-testid="success-toast"]').should('contain', 'Plat ajouté avec succès');
    });

    it('should handle image upload', () => {
      cy.get('[data-testid="add-dish-button"]').click();
      
      // Upload image
      cy.get('[data-testid="image-upload-input"]').selectFile('cypress/fixtures/dish-image.jpg', { force: true });
      
      // Check image preview
      cy.get('[data-testid="image-preview"]').should('be.visible');
      cy.get('[data-testid="image-preview"] img').should('have.attr', 'src').and('include', 'blob:');
      
      // Remove image
      cy.get('[data-testid="remove-image-button"]').click();
      cy.get('[data-testid="image-preview"]').should('not.exist');
    });
  });

  describe('Edit Dish', () => {
    it('should open edit modal with existing data', () => {
      cy.get('[data-testid="dish-item"]').first().find('[data-testid="edit-dish-button"]').click();
      
      cy.get('[data-testid="dish-modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'Modifier le plat');
      
      // Check that form is pre-filled
      cy.get('[data-testid="dish-name-input"]').should('not.have.value', '');
      cy.get('[data-testid="dish-price-input"]').should('not.have.value', '');
    });

    it('should update dish successfully', () => {
      cy.get('[data-testid="dish-item"]').first().find('[data-testid="edit-dish-button"]').click();
      
      // Modify fields
      cy.get('[data-testid="dish-name-input"]').clear().type('Plat Modifié');
      cy.get('[data-testid="dish-price-input"]').clear().type('18.50');
      
      // Mock API call
      cy.intercept('PUT', '/api/dishes/*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'dish-id',
            name: 'Plat Modifié',
            price: 18.50
          }
        }
      }).as('updateDish');
      
      cy.get('[data-testid="save-dish-button"]').click();
      cy.wait('@updateDish');
      
      // Check updated dish in list
      cy.get('[data-testid="dish-item"]').should('contain', 'Plat Modifié');
      cy.get('[data-testid="dish-item"]').should('contain', '18,50');
      
      cy.get('[data-testid="success-toast"]').should('contain', 'Plat modifié avec succès');
    });
  });

  describe('Delete Dish', () => {
    it('should show confirmation dialog', () => {
      cy.get('[data-testid="dish-item"]').first().find('[data-testid="delete-dish-button"]').click();
      
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
      cy.get('[data-testid="delete-confirmation-message"]').should('contain', 'Êtes-vous sûr de vouloir supprimer ce plat');
    });

    it('should cancel deletion', () => {
      const initialDishCount = cy.get('[data-testid="dish-item"]').its('length');
      
      cy.get('[data-testid="dish-item"]').first().find('[data-testid="delete-dish-button"]').click();
      cy.get('[data-testid="cancel-delete-button"]').click();
      
      cy.get('[data-testid="delete-confirmation-modal"]').should('not.exist');
      cy.get('[data-testid="dish-item"]').should('have.length', initialDishCount);
    });

    it('should delete dish successfully', () => {
      cy.get('[data-testid="dish-item"]').first().find('[data-testid="dish-name"]').invoke('text').as('dishName');
      
      cy.get('[data-testid="dish-item"]').first().find('[data-testid="delete-dish-button"]').click();
      
      // Mock API call
      cy.intercept('DELETE', '/api/dishes/*', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Plat supprimé avec succès'
        }
      }).as('deleteDish');
      
      cy.get('[data-testid="confirm-delete-button"]').click();
      cy.wait('@deleteDish');
      
      // Check dish is removed from list
      cy.get('@dishName').then((dishName) => {
        cy.get('[data-testid="dish-item"]').should('not.contain', dishName);
      });
      
      cy.get('[data-testid="success-toast"]').should('contain', 'Plat supprimé avec succès');
    });
  });

  describe('Dish Availability Toggle', () => {
    it('should toggle dish availability', () => {
      cy.get('[data-testid="dish-item"]').first().within(() => {
        cy.get('[data-testid="availability-toggle"]').click();
      });
      
      // Mock API call
      cy.intercept('PATCH', '/api/dishes/*/availability', {
        statusCode: 200,
        body: {
          success: true,
          data: { isAvailable: false }
        }
      }).as('toggleAvailability');
      
      cy.wait('@toggleAvailability');
      
      // Check visual indication of unavailable dish
      cy.get('[data-testid="dish-item"]').first().should('have.class', 'dish-unavailable');
      cy.get('[data-testid="success-toast"]').should('contain', 'Disponibilité mise à jour');
    });
  });

  describe('Bulk Operations', () => {
    it('should select multiple dishes', () => {
      cy.get('[data-testid="select-all-checkbox"]').check();
      cy.get('[data-testid="dish-checkbox"]').should('be.checked');
      
      cy.get('[data-testid="bulk-actions"]').should('be.visible');
      cy.get('[data-testid="selected-count"]').should('contain', 'plats sélectionnés');
    });

    it('should bulk delete dishes', () => {
      cy.get('[data-testid="dish-checkbox"]').first().check();
      cy.get('[data-testid="dish-checkbox"]').eq(1).check();
      
      cy.get('[data-testid="bulk-delete-button"]').click();
      
      cy.get('[data-testid="bulk-delete-confirmation"]').should('be.visible');
      cy.get('[data-testid="bulk-delete-message"]').should('contain', '2 plats');
      
      // Mock API call
      cy.intercept('DELETE', '/api/dishes/bulk', {
        statusCode: 200,
        body: {
          success: true,
          message: '2 plats supprimés avec succès'
        }
      }).as('bulkDelete');
      
      cy.get('[data-testid="confirm-bulk-delete-button"]').click();
      cy.wait('@bulkDelete');
      
      cy.get('[data-testid="success-toast"]').should('contain', '2 plats supprimés avec succès');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.get('[data-testid="add-dish-button"]').click();
      
      // Fill form
      cy.get('[data-testid="dish-name-input"]').type('Test Dish');
      cy.get('[data-testid="dish-price-input"]').type('10.00');
      cy.get('[data-testid="dish-category-select"]').select('Entrées');
      
      // Mock API error
      cy.intercept('POST', '/api/dishes', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Erreur serveur'
        }
      }).as('createDishError');
      
      cy.get('[data-testid="save-dish-button"]').click();
      cy.wait('@createDishError');
      
      // Error message should appear
      cy.get('[data-testid="error-toast"]').should('contain', 'Erreur lors de la création du plat');
      
      // Modal should remain open
      cy.get('[data-testid="dish-modal"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-testid="add-dish-button"]').focus().type('{enter}');
      cy.get('[data-testid="dish-modal"]').should('be.visible');
      
      cy.get('[data-testid="dish-name-input"]').should('be.focused');
      
      // Navigate with Tab
      cy.focused().tab();
      cy.get('[data-testid="dish-description-input"]').should('be.focused');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-testid="dish-list"]').should('be.visible');
      cy.get('[data-testid="add-dish-button"]').should('be.visible');
      
      // Test mobile-specific interactions
      cy.get('[data-testid="dish-item"]').first().swipe('left');
      cy.get('[data-testid="mobile-actions"]').should('be.visible');
    });
  });
});