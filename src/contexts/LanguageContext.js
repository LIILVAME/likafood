import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr'); // Default to French

  const languages = {
    fr: {
      code: 'fr',
      name: 'Français',
      flag: '🇫🇷'
    },
    en: {
      code: 'en',
      name: 'English',
      flag: '🇺🇸'
    }
  };

  // Translation strings
  const translations = {
    fr: {
      // Navigation
      home: 'Accueil',
      orders: 'Commandes',
      catalog: 'Catalogue',
      expenses: 'Dépenses',
      settings: 'Paramètres',
      
      // Common actions
      add: 'Ajouter',
      edit: 'Modifier',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      loading: 'Chargement...',
      dataIsStale: 'Les données ne sont plus à jour',
      clickToRefresh: 'Cliquez pour actualiser',
      refresh: 'Actualiser',
      refreshingData: 'Actualisation des données...',
      retryingRequest: 'Nouvelle tentative...',
      
      // Order related
    addOrder: 'Ajouter Commande',
    order: 'Commande',
    orderStatus: 'Statut de la commande',
    pending: 'En attente',
    preparing: 'En préparation',
    ready: 'Prêt',
    completed: 'Terminé',
    startPreparation: 'Commencer la préparation',
    markAsReady: 'Marquer comme prêt',
    completeOrder: 'Terminer la commande',
    total: 'Total',
    noOrdersFound: 'Aucune commandes trouvées',
    noOrdersYet: 'Aucune commande pour le moment',
    createFirstOrder: 'Créer Première Commande',
      
      // Expenses
      addExpense: 'Ajouter Dépense',
      noExpensesFound: 'Aucune dépense trouvée',
      noExpensesRecorded: 'Aucune dépense enregistrée',
      addFirstExpense: 'Ajouter Votre Première Dépense',
      todaysExpenses: "Dépenses d'Aujourd'hui",
      allCategories: 'Toutes Catégories',
      
      // Time filters
      all: 'Tout',
      today: "Aujourd'hui",
      thisWeek: 'Cette Semaine',
      thisMonth: 'Ce Mois',
      
      // Categories
      ingredients: 'Ingrédients',
      utilities: 'Utilitaires',
      equipment: 'Équipement',
      marketing: 'Marketing',
      transportation: 'Transport',
      other: 'Autre',
      
      // Messages
      loadingError: 'Échec du chargement',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ?',
    addItemFirst: 'Veuillez ajouter au moins un article',
    createOrderError: 'Échec de la création de la commande',
    addExpenseError: 'Échec de l\'ajout de la dépense',
    
    // Home page
    welcomeBack: 'Bienvenue',
    vendor: 'Vendeur',
    yourBusiness: 'Votre Entreprise',
    todaysOrders: 'Commandes du Jour',
    todaysSales: 'Ventes du Jour',
    todaysProfit: 'Profit du Jour',
    pendingOrders: 'Commandes en Attente',
    quickActions: 'Actions Rapides',
    recentOrders: 'Commandes Récentes',
    viewAll: 'Voir Tout',
    noOrdersToday: 'Aucune commande aujourd\'hui',
    failedToLoadData: 'Échec du chargement des données',
     deleteExpenseError: 'Échec de la suppression de la dépense',
     
     // Settings page
     businessProfile: 'Profil d\'Entreprise',
     businessName: 'Nom de l\'Entreprise',
     ownerName: 'Nom du Propriétaire',
     phoneNumber: 'Numéro de Téléphone',
     phoneNumberCannotBeChanged: 'Le numéro de téléphone ne peut pas être modifié',
     location: 'Emplacement',
     locationPlaceholder: 'ex., Marché du Centre, Rue 123',
     businessDescription: 'Description de l\'Entreprise',
     businessDescriptionPlaceholder: 'Brève description de votre entreprise et spécialités',
     updating: 'Mise à jour...',
     updateProfile: 'Mettre à Jour le Profil',
     businessHours: 'Heures d\'Ouverture',
     
     // Login page
     loading: 'Chargement...',
     vendorManagementSystem: 'Système de Gestion des Vendeurs',
     enterPhoneNumber: 'Entrez Votre Numéro de Téléphone',
     includeCountryCode: 'Inclure le code pays (ex., +1 pour les États-Unis)',
     sendingOTP: 'Envoi du code...',
     sendOTP: 'Envoyer le Code',
     failedToSendOTP: 'Échec de l\'envoi du code. Veuillez réessayer.',
     loginFailed: 'Échec de la connexion. Veuillez réessayer.',
     registrationFailed: 'Échec de l\'inscription. Veuillez réessayer.',
     createAccount: 'Créer Votre Compte',
     phoneNotRegistered: 'Le numéro {phoneNumber} n\'est pas enregistré. Veuillez compléter votre inscription.',
     businessNamePlaceholder: 'Nom de Votre Restaurant',
     ownerNamePlaceholder: 'Votre Nom Complet',
     creatingAccount: 'Création du compte...',
     createAccountSendOTP: 'Créer le Compte et Envoyer le Code',
     changePhoneNumber: 'Changer le Numéro de Téléphone',
     enterVerificationCode: 'Entrez le Code de Vérification',
     sentVerificationCode: 'Nous avons envoyé un code de vérification à {phoneNumber}',
     verificationCode: 'Code de Vérification',
     enterDigitCode: 'Entrez le code à 4-6 chiffres',
     verifying: 'Vérification...',
     verifyLogin: 'Vérifier et Se Connecter',
     demoOTPMessage: 'À des fins de démonstration, utilisez le code : 1234',
     openingTime: 'Heure d\'Ouverture',
     closingTime: 'Heure de Fermeture',
     daysOpen: 'Jours d\'Ouverture',
     currentSchedule: 'Horaire Actuel',
     hours: 'Heures',
     days: 'Jours',
     noDaysSelected: 'Aucun jour sélectionné',
     updateBusinessHours: 'Mettre à Jour les Heures d\'Ouverture',
     currencySettings: 'Paramètres de Devise',
     chooseCurrencyDescription: 'Choisissez votre devise préférée pour afficher les prix et montants dans l\'application.',
     currencyInformation: 'Informations sur les Devises',
     euroDescription: 'Euro - Utilisé dans les pays européens',
     xofDescription: 'Franc CFA Ouest-Africain - Utilisé dans les pays d\'Afrique de l\'Ouest incluant le Sénégal, Mali, Burkina Faso, etc.',
     tip: 'Conseil',
     currencyTipDescription: 'Votre sélection de devise sera sauvegardée et appliquée à tous les affichages de prix dans l\'application.',
     aboutLikaFood: 'À Propos de LikaFood',
     version: 'Version',
     description: 'Description',
     appDescription: 'LikaFood est une PWA mobile conçue pour aider les vendeurs alimentaires informels à gérer leur entreprise efficacement. Suivez les commandes, gérez votre menu, surveillez les dépenses et développez votre entreprise.',
     features: 'Fonctionnalités',
     orderManagementTracking: 'Gestion et suivi des commandes',
     menuCatalogManagement: 'Gestion du catalogue de menu',
     expenseTrackingCategorization: 'Suivi et catégorisation des dépenses',
     dailySalesProfitMetrics: 'Métriques de ventes et profits quotidiens',
     businessProfileHoursManagement: 'Gestion du profil et des heures d\'entreprise',
     mobileOptimizedInterface: 'Interface optimisée pour mobile',
     support: 'Support',
     helpCenter: 'Centre d\'Aide',
     contactSupport: 'Contacter le Support',
     privacyPolicy: 'Politique de Confidentialité',
     termsOfService: 'Conditions d\'Utilisation',
     accountActions: 'Actions du Compte',
     
     // Catalog page
     failedToLoadDishes: 'Échec du chargement des plats',
     failedToUpdateDishAvailability: 'Échec de la mise à jour de la disponibilité du plat',
     confirmDeleteDish: 'Êtes-vous sûr de vouloir supprimer ce plat ?',
     menuCatalog: 'Catalogue de Menu',
     addDish: 'Ajouter Plat',
     allDishes: 'Tous les Plats',
     available: 'Disponible',
     unavailable: 'Indisponible',
     totalDishes: 'Total des Plats',
     categories: 'Catégories',
     noDishesFound: 'Aucun plat trouvé',
     noDishesInCatalog: 'Aucun plat dans le catalogue pour le moment',
     noFilteredDishes: 'Aucun plat {filter} trouvé',
     addYourFirstDish: 'Ajouter Votre Premier Plat',
     prepTime: 'Temps de préparation',
     minutes: 'minutes',
     markUnavailable: 'Marquer Indisponible',
     markAvailable: 'Marquer Disponible',
     failedToUpdateDish: 'Échec de la mise à jour du plat',
     failedToCreateDish: 'Échec de la création du plat',
     editDish: 'Modifier le Plat',
     addNewDish: 'Ajouter Nouveau Plat',
     dishName: 'Nom du Plat',
     priceDollar: 'Prix ($)',
     categoryPlaceholder: 'ex., Plats principaux',
     preparationTimeMinutes: 'Temps de Préparation (minutes)',
     preparationTimePlaceholder: 'ex., 30',
     availableForOrders: 'Disponible pour les commandes',
     saving: 'Sauvegarde...',
     updateDish: 'Mettre à Jour le Plat',
     
     
     // Orders page - additional translations
     tryAgain: 'Réessayer',
     addNewOrder: 'Ajouter Nouvelle Commande',
     customerName: 'Nom du Client',
     customerPhone: 'Téléphone du Client',
     selectItems: 'Sélectionner les Articles',
     orderItems: 'Articles de la Commande',
     remove: 'Supprimer',
     creating: 'Création...',
     createOrder: 'Créer la Commande',
     
     // Expenses page - additional translations
     addNewExpense: 'Ajouter Nouvelle Dépense',
     amount: 'Montant',
     category: 'Catégorie',
     date: 'Date',
     descriptionPlaceholder: 'ex., Riz et épices',
     adding: 'Ajout...'
    },
    en: {
      // Navigation
      home: 'Home',
      orders: 'Orders',
      catalog: 'Catalog',
      expenses: 'Expenses',
      settings: 'Settings',
      
      // Common actions
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      dataIsStale: 'Data is outdated',
      clickToRefresh: 'Click to refresh',
      refresh: 'Refresh',
      refreshingData: 'Refreshing data...',
      retryingRequest: 'Retrying request...',
      
      // Order related
    addOrder: 'Add Order',
    order: 'Order',
    orderStatus: 'Order Status',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    startPreparation: 'Start Preparation',
    markAsReady: 'Mark as Ready',
    completeOrder: 'Complete Order',
    total: 'Total',
    noOrdersFound: 'No orders found',
    noOrdersYet: 'No orders yet',
    createFirstOrder: 'Create First Order',
      
      // Expenses
      addExpense: 'Add Expense',
      noExpensesFound: 'No expenses found',
      noExpensesRecorded: 'No expenses recorded yet',
      addFirstExpense: 'Add Your First Expense',
      todaysExpenses: "Today's Expenses",
      allCategories: 'All Categories',
      
      // Time filters
      all: 'All',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      
      // Categories
      ingredients: 'Ingredients',
      utilities: 'Utilities',
      equipment: 'Equipment',
      marketing: 'Marketing',
      transportation: 'Transportation',
      other: 'Other',
      
      // Messages
      loadingError: 'Failed to load',
      deleteConfirm: 'Are you sure you want to delete?',
    addItemFirst: 'Please add at least one item',
    createOrderError: 'Failed to create order',
    addExpenseError: 'Failed to add expense',
    
    // Home page
    welcomeBack: 'Welcome back',
    vendor: 'Vendor',
    yourBusiness: 'Your Business',
    todaysOrders: 'Today\'s Orders',
    todaysSales: 'Today\'s Sales',
    todaysProfit: 'Today\'s Profit',
    pendingOrders: 'Pending Orders',
    quickActions: 'Quick Actions',
    recentOrders: 'Recent Orders',
    viewAll: 'View All',
    noOrdersToday: 'No orders yet today',
    failedToLoadData: 'Failed to load dashboard data',
      deleteExpenseError: 'Failed to delete expense',

// Settings page
businessProfile: 'Business Profile',
businessName: 'Business Name',
ownerName: 'Owner Name',
phoneNumber: 'Phone Number',
phoneNumberCannotBeChanged: 'Phone number cannot be changed',
location: 'Location',
locationPlaceholder: 'e.g., Downtown Market, Street 123',
businessDescription: 'Business Description',
businessDescriptionPlaceholder: 'Brief description of your business and specialties',
updating: 'Updating...',
updateProfile: 'Update Profile',
businessHours: 'Business Hours',

// Login page
loading: 'Loading...',
vendorManagementSystem: 'Vendor Management System',
enterPhoneNumber: 'Enter Your Phone Number',
includeCountryCode: 'Include country code (e.g., +1 for US)',
sendingOTP: 'Sending OTP...',
sendOTP: 'Send OTP',
failedToSendOTP: 'Failed to send OTP. Please try again.',
loginFailed: 'Login failed. Please try again.',
registrationFailed: 'Registration failed. Please try again.',
createAccount: 'Create Your Account',
phoneNotRegistered: 'Phone number {phoneNumber} is not registered. Please complete your registration.',
businessNamePlaceholder: 'Your Restaurant Name',
ownerNamePlaceholder: 'Your Full Name',
creatingAccount: 'Creating Account...',
createAccountSendOTP: 'Create Account & Send OTP',
changePhoneNumber: 'Change Phone Number',
enterVerificationCode: 'Enter Verification Code',
sentVerificationCode: 'We sent a verification code to {phoneNumber}',
verificationCode: 'Verification Code',
enterDigitCode: 'Enter the 4-6 digit code',
verifying: 'Verifying...',
verifyLogin: 'Verify & Login',
demoOTPMessage: 'For demo purposes, use OTP: 1234',
openingTime: 'Opening Time',
closingTime: 'Closing Time',
daysOpen: 'Days Open',
currentSchedule: 'Current Schedule',
hours: 'Hours',
days: 'Days',
noDaysSelected: 'No days selected',
updateBusinessHours: 'Update Business Hours',
currencySettings: 'Currency Settings',
chooseCurrencyDescription: 'Choose your preferred currency for displaying prices and amounts throughout the app.',
currencyInformation: 'Currency Information',
euroDescription: 'Euro - Used in European countries',
xofDescription: 'West African CFA Franc - Used in West African countries including Senegal, Mali, Burkina Faso, etc.',
tip: 'Tip',
currencyTipDescription: 'Your currency selection will be saved and applied to all price displays in the app.',
aboutLikaFood: 'About LikaFood',
version: 'Version',
description: 'Description',
appDescription: 'LikaFood is a mobile-first PWA designed to help informal food vendors manage their business efficiently. Track orders, manage your menu, monitor expenses, and grow your business.',
features: 'Features',
orderManagementTracking: 'Order management and tracking',
menuCatalogManagement: 'Menu catalog management',
expenseTrackingCategorization: 'Expense tracking and categorization',
dailySalesProfitMetrics: 'Daily sales and profit metrics',
businessProfileHoursManagement: 'Business profile and hours management',

// Orders page - additional translations
tryAgain: 'Try Again',
addNewOrder: 'Add New Order',
customerName: 'Customer Name',
customerPhone: 'Customer Phone',
selectItems: 'Select Items',
orderItems: 'Order Items',
remove: 'Remove',
creating: 'Creating...',
createOrder: 'Create Order',

// Expenses page - additional translations
addNewExpense: 'Add New Expense',
amount: 'Amount',
category: 'Category',
date: 'Date',
descriptionPlaceholder: 'e.g., Rice and spices',
adding: 'Adding...',
mobileOptimizedInterface: 'Mobile-optimized interface',
support: 'Support',
helpCenter: 'Help Center',
contactSupport: 'Contact Support',
privacyPolicy: 'Privacy Policy',
termsOfService: 'Terms of Service',
accountActions: 'Account Actions',

// Catalog page
failedToLoadDishes: 'Failed to load dishes',
failedToUpdateDishAvailability: 'Failed to update dish availability',
confirmDeleteDish: 'Are you sure you want to delete this dish?',
menuCatalog: 'Menu Catalog',
addDish: 'Add Dish',
allDishes: 'All Dishes',
available: 'Available',
unavailable: 'Unavailable',
totalDishes: 'Total Dishes',
categories: 'Categories',
noDishesFound: 'No dishes found',
noDishesInCatalog: 'No dishes in catalog yet',
noFilteredDishes: 'No {filter} dishes found',
addYourFirstDish: 'Add Your First Dish',
prepTime: 'Prep Time',
minutes: 'minutes',
markUnavailable: 'Mark Unavailable',
markAvailable: 'Mark Available',
failedToUpdateDish: 'Failed to update dish',
failedToCreateDish: 'Failed to create dish',
editDish: 'Edit Dish',
addNewDish: 'Add New Dish',
dishName: 'Dish Name',
priceDollar: 'Price ($)',
categoryPlaceholder: 'e.g., Main dishes',
preparationTimeMinutes: 'Preparation Time (minutes)',
preparationTimePlaceholder: 'e.g., 30',
availableForOrders: 'Available for orders',
saving: 'Saving...',
updateDish: 'Update Dish'
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  const getDateLocale = () => {
    return language === 'fr' ? 'fr-FR' : 'en-US';
  };

  const value = {
    language,
    setLanguage,
    languages,
    t,
    getDateLocale,
    currentLanguage: languages[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};