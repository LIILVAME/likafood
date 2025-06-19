import { useState, useCallback, useRef, useEffect } from 'react';
import { useNotifications } from '../components/NotificationSystem';

/**
 * Custom hook for form management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation rules
 * @param {Object} options - Configuration options
 * @returns {Object} - Form state and handlers
 */
export const useForm = (initialValues = {}, validationSchema = {}, options = {}) => {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    showErrorNotifications = false
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  
  const { error: showError } = useNotifications();
  const initialValuesRef = useRef(initialValues);

  // Update initial values if they change
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Validation function
  const validateField = useCallback((name, value, allValues = values) => {
    const fieldSchema = validationSchema[name];
    if (!fieldSchema) return null;

    // Required validation
    if (fieldSchema.required && (!value || value.toString().trim() === '')) {
      return fieldSchema.requiredMessage || `${name} est requis`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Min length validation
    if (fieldSchema.minLength && value.toString().length < fieldSchema.minLength) {
      return fieldSchema.minLengthMessage || `${name} doit contenir au moins ${fieldSchema.minLength} caractères`;
    }

    // Max length validation
    if (fieldSchema.maxLength && value.toString().length > fieldSchema.maxLength) {
      return fieldSchema.maxLengthMessage || `${name} ne peut pas dépasser ${fieldSchema.maxLength} caractères`;
    }

    // Pattern validation
    if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
      return fieldSchema.patternMessage || `${name} n'est pas valide`;
    }

    // Email validation
    if (fieldSchema.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return fieldSchema.emailMessage || 'Adresse email invalide';
      }
    }

    // Phone validation
    if (fieldSchema.phone) {
      const phonePattern = /^[+]?[0-9\s\-\(\)]{8,}$/;
      if (!phonePattern.test(value)) {
        return fieldSchema.phoneMessage || 'Numéro de téléphone invalide';
      }
    }

    // Number validation
    if (fieldSchema.number) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return fieldSchema.numberMessage || `${name} doit être un nombre`;
      }
      
      if (fieldSchema.min !== undefined && numValue < fieldSchema.min) {
        return fieldSchema.minMessage || `${name} doit être supérieur ou égal à ${fieldSchema.min}`;
      }
      
      if (fieldSchema.max !== undefined && numValue > fieldSchema.max) {
        return fieldSchema.maxMessage || `${name} doit être inférieur ou égal à ${fieldSchema.max}`;
      }
    }

    // Custom validation function
    if (fieldSchema.validate) {
      const result = fieldSchema.validate(value, allValues);
      if (result !== true) {
        return result || `${name} n'est pas valide`;
      }
    }

    return null;
  }, [validationSchema, values]);

  // Validate all fields
  const validateForm = useCallback((formValues = values) => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, formValues[fieldName], formValues);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    return { isValid, errors: newErrors };
  }, [validateField, validationSchema, values]);

  // Handle field change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Validate on change if enabled
    if (validateOnChange || touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateField, validateOnChange, touched]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur if enabled
    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateField, validateOnBlur, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    try {
      // Mark all fields as touched
      const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validate form
      const validation = validateForm();
      setErrors(validation.errors);

      if (!validation.isValid) {
        if (showErrorNotifications) {
          const firstError = Object.values(validation.errors)[0];
          showError(firstError);
        }
        return { success: false, errors: validation.errors };
      }

      // Submit form
      const result = await onSubmit(values);
      return { success: true, data: result };
    } catch (error) {
      if (showErrorNotifications) {
        showError(error.message || 'Erreur lors de la soumission');
      }
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema, validateForm, showErrorNotifications, showError]);

  // Reset form
  const reset = useCallback((newValues = initialValuesRef.current) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, []);

  // Set field value
  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Get field props for easy integration with input components
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        handleChange(name, value);
      },
      onBlur: () => handleBlur(name),
      error: touched[name] ? errors[name] : undefined,
      hasError: touched[name] && !!errors[name]
    };
  }, [values, errors, touched, handleChange, handleBlur]);

  // Check if form is dirty (has changes)
  const isDirty = useCallback(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  // Check if form is valid
  const isValid = useCallback(() => {
    const validation = validateForm();
    return validation.isValid;
  }, [validateForm]);

  return {
    // Values and state
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Utilities
    reset,
    setFieldValue,
    setFieldError,
    getFieldProps,
    validateField,
    validateForm,
    
    // Status checks
    isDirty: isDirty(),
    isValid: isValid(),
    hasErrors: Object.keys(errors).length > 0,
    hasSubmitted: submitCount > 0
  };
};

/**
 * Hook for handling multi-step forms
 * @param {Array} steps - Array of step configurations
 * @param {Object} initialValues - Initial form values
 * @returns {Object} - Multi-step form state and handlers
 */
export const useMultiStepForm = (steps, initialValues = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState(initialValues);

  const currentStepConfig = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Form hook for current step
  const form = useForm(
    stepData,
    currentStepConfig?.validationSchema || {},
    currentStepConfig?.options || {}
  );

  // Go to next step
  const nextStep = useCallback(async () => {
    if (isLastStep) return false;

    // Validate current step
    const validation = form.validateForm();
    if (!validation.isValid) {
      form.setErrors(validation.errors);
      return false;
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    // Save step data
    setStepData(prev => ({ ...prev, ...form.values }));
    
    // Move to next step
    setCurrentStep(prev => prev + 1);
    return true;
  }, [currentStep, isLastStep, form]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (isFirstStep) return false;
    
    // Save current step data
    setStepData(prev => ({ ...prev, ...form.values }));
    
    // Move to previous step
    setCurrentStep(prev => prev - 1);
    return true;
  }, [currentStep, isFirstStep, form.values]);

  // Go to specific step
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false;
    
    // Save current step data
    setStepData(prev => ({ ...prev, ...form.values }));
    
    setCurrentStep(stepIndex);
    return true;
  }, [steps.length, form.values]);

  // Submit entire form
  const submitForm = useCallback(async (onSubmit) => {
    // Validate current step
    const validation = form.validateForm();
    if (!validation.isValid) {
      form.setErrors(validation.errors);
      return { success: false, errors: validation.errors };
    }

    // Combine all step data
    const finalData = { ...stepData, ...form.values };
    
    try {
      const result = await onSubmit(finalData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [form, stepData, onSubmit]);

  // Reset form
  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepData(initialValues);
    form.reset();
  }, [initialValues, form]);

  return {
    // Current step info
    currentStep,
    currentStepConfig,
    isFirstStep,
    isLastStep,
    
    // Step management
    nextStep,
    prevStep,
    goToStep,
    
    // Form data
    stepData: { ...stepData, ...form.values },
    completedSteps,
    
    // Form controls
    form,
    submitForm,
    reset,
    
    // Progress
    progress: ((currentStep + 1) / steps.length) * 100,
    totalSteps: steps.length
  };
};

export default useForm;