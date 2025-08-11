"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ValidationRule {
  id: string;
  field: string;
  type:
    | "required"
    | "length"
    | "pattern"
    | "custom"
    | "dependency"
    | "async"
    | "conditional"
    | "range"
    | "format"
    | "unique";
  params: any;
  message: string;
  severity: "error" | "warning" | "info";
  dependencies: string[];
  conditions: any[];
  priority: number;
  group: string;
}

interface ValidationResult {
  field: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
  score: number;
  suggestions: string[];
  metadata: {
    executionTime: number;
    rulesApplied: number;
    dependenciesChecked: string[];
    conditionsMet: boolean[];
  };
}

interface FormField {
  name: string;
  value: any;
  type: string;
  required: boolean;
  dependencies: string[];
  validators: string[];
  metadata: {
    touched: boolean;
    dirty: boolean;
    focused: boolean;
    lastValidated: Date | null;
    validationCount: number;
    errorHistory: string[];
  };
}

interface ValidationContext {
  formData: { [key: string]: any };
  previousData: { [key: string]: any };
  validationHistory: ValidationResult[];
  userProfile: any;
  systemSettings: any;
  temporaryData: any;
}

export default function ComplexFormValidator() {
  const [formFields, setFormFields] = useState<{ [key: string]: FormField }>(
    {}
  );
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [validationResults, setValidationResults] = useState<{
    [key: string]: ValidationResult;
  }>({});
  const [validationContext, setValidationContext] = useState<ValidationContext>(
    {
      formData: {},
      previousData: {},
      validationHistory: [],
      userProfile: {},
      systemSettings: {},
      temporaryData: {},
    }
  );
  const [isValidating, setIsValidating] = useState(false);
  const [validationMode, setValidationMode] = useState<
    "strict" | "normal" | "lenient"
  >("normal");
  const [validationStats, setValidationStats] = useState<any>({});
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize complex validation rules
  useEffect(() => {
    const rules: ValidationRule[] = [
      // Basic required field rules
      {
        id: "email_required",
        field: "email",
        type: "required",
        params: {},
        message: "Email address is required",
        severity: "error",
        dependencies: [],
        conditions: [],
        priority: 10,
        group: "basic",
      },
      {
        id: "password_required",
        field: "password",
        type: "required",
        params: {},
        message: "Password is required",
        severity: "error",
        dependencies: [],
        conditions: [],
        priority: 10,
        group: "basic",
      },
      // Complex pattern validation rules
      {
        id: "email_pattern",
        field: "email",
        type: "pattern",
        params: {
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          flags: "i",
        },
        message: "Please enter a valid email address",
        severity: "error",
        dependencies: ["email_required"],
        conditions: [{ field: "email", operator: "not_empty" }],
        priority: 8,
        group: "format",
      },
      // Advanced password complexity rules
      {
        id: "password_length",
        field: "password",
        type: "length",
        params: { min: 8, max: 128 },
        message: "Password must be between 8 and 128 characters",
        severity: "error",
        dependencies: ["password_required"],
        conditions: [{ field: "password", operator: "not_empty" }],
        priority: 9,
        group: "security",
      },
      {
        id: "password_complexity",
        field: "password",
        type: "custom",
        params: {
          validator: (value: string) => {
            if (!value) return false;
            const hasUppercase = /[A-Z]/.test(value);
            const hasLowercase = /[a-z]/.test(value);
            const hasNumbers = /\d/.test(value);
            const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            const hasNoRepeatingChars = !/(.)\1{2,}/.test(value);
            const hasNoCommonPatterns = !/123|abc|qwe|password|admin/i.test(
              value
            );

            return (
              hasUppercase &&
              hasLowercase &&
              hasNumbers &&
              hasSpecialChars &&
              hasNoRepeatingChars &&
              hasNoCommonPatterns
            );
          },
        },
        message:
          "Password must contain uppercase, lowercase, numbers, special characters, and avoid common patterns",
        severity: "error",
        dependencies: ["password_length"],
        conditions: [{ field: "password", operator: "length_gte", value: 8 }],
        priority: 7,
        group: "security",
      },
      // Conditional validation rules
      {
        id: "confirm_password_required",
        field: "confirmPassword",
        type: "conditional",
        params: {
          condition: (context: ValidationContext) => {
            return (
              context.formData.password && context.formData.password.length > 0
            );
          },
        },
        message: "Please confirm your password",
        severity: "error",
        dependencies: ["password_required"],
        conditions: [{ field: "password", operator: "not_empty" }],
        priority: 9,
        group: "security",
      },
      {
        id: "password_match",
        field: "confirmPassword",
        type: "dependency",
        params: {
          dependentField: "password",
          comparison: "equals",
        },
        message: "Passwords do not match",
        severity: "error",
        dependencies: ["confirm_password_required", "password_complexity"],
        conditions: [
          { field: "password", operator: "not_empty" },
          { field: "confirmPassword", operator: "not_empty" },
        ],
        priority: 8,
        group: "security",
      },
      // Advanced phone number validation
      {
        id: "phone_format",
        field: "phone",
        type: "custom",
        params: {
          validator: (value: string, context: ValidationContext) => {
            if (!value) return true; // Optional field

            // Remove all non-digit characters
            const digits = value.replace(/\D/g, "");

            // Check various international formats
            if (digits.length === 10) {
              // US domestic format
              return /^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(digits);
            } else if (digits.length === 11 && digits.startsWith("1")) {
              // US with country code
              return /^1[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(digits);
            } else if (digits.length >= 10 && digits.length <= 15) {
              // International format
              return /^\d{10,15}$/.test(digits);
            }

            return false;
          },
        },
        message: "Please enter a valid phone number",
        severity: "warning",
        dependencies: [],
        conditions: [{ field: "phone", operator: "not_empty" }],
        priority: 5,
        group: "contact",
      },
      // Complex age validation with business logic
      {
        id: "age_validation",
        field: "age",
        type: "custom",
        params: {
          validator: (value: any, context: ValidationContext) => {
            const age = parseInt(value);
            if (isNaN(age)) return false;

            // Business rules based on context
            const accountType = context.formData.accountType;
            const country = context.formData.country;

            if (accountType === "child") {
              return age >= 6 && age < 13;
            } else if (accountType === "teen") {
              return age >= 13 && age < 18;
            } else if (accountType === "adult") {
              if (country === "US") {
                return age >= 18 && age <= 120;
              } else if (country === "DE") {
                return age >= 16 && age <= 120;
              } else {
                return age >= 18 && age <= 120;
              }
            } else if (accountType === "senior") {
              return age >= 65 && age <= 120;
            }

            return age >= 13 && age <= 120; // Default range
          },
        },
        message:
          "Age must be appropriate for the selected account type and country",
        severity: "error",
        dependencies: [],
        conditions: [
          { field: "age", operator: "not_empty" },
          { field: "accountType", operator: "not_empty" },
        ],
        priority: 6,
        group: "business_logic",
      },
      // Cross-field dependency validation
      {
        id: "credit_card_expiry",
        field: "cardExpiry",
        type: "custom",
        params: {
          validator: (value: string, context: ValidationContext) => {
            if (!value) return !context.formData.cardNumber; // Required only if card number provided

            const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
            if (!expiryPattern.test(value)) return false;

            const [month, year] = value.split("/").map((num) => parseInt(num));
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear() % 100;
            const currentMonth = currentDate.getMonth() + 1;

            if (
              year < currentYear ||
              (year === currentYear && month < currentMonth)
            ) {
              return false; // Expired
            }

            if (year > currentYear + 10) {
              return false; // Too far in future
            }

            return true;
          },
        },
        message: "Please enter a valid expiry date (MM/YY)",
        severity: "error",
        dependencies: [],
        conditions: [{ field: "cardNumber", operator: "not_empty" }],
        priority: 7,
        group: "payment",
      },
      // Advanced URL validation
      {
        id: "website_url",
        field: "website",
        type: "custom",
        params: {
          validator: (value: string, context: ValidationContext) => {
            if (!value) return true; // Optional

            try {
              const url = new URL(value);

              // Check protocol
              if (!["http:", "https:"].includes(url.protocol)) {
                return false;
              }

              // Check for valid domain
              const domainPattern =
                /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
              if (!domainPattern.test(url.hostname)) {
                return false;
              }

              // Blacklist check
              const blacklistedDomains = [
                "example.com",
                "test.com",
                "localhost",
              ];
              if (
                blacklistedDomains.some((domain) =>
                  url.hostname.includes(domain)
                )
              ) {
                return false;
              }

              return true;
            } catch {
              return false;
            }
          },
        },
        message: "Please enter a valid website URL",
        severity: "warning",
        dependencies: [],
        conditions: [{ field: "website", operator: "not_empty" }],
        priority: 4,
        group: "optional",
      },
    ];

    setValidationRules(rules);

    // Initialize form fields
    const fields = {
      email: {
        name: "email",
        value: "",
        type: "email",
        required: true,
        dependencies: [],
        validators: ["email_required", "email_pattern"],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      password: {
        name: "password",
        value: "",
        type: "password",
        required: true,
        dependencies: [],
        validators: [
          "password_required",
          "password_length",
          "password_complexity",
        ],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      confirmPassword: {
        name: "confirmPassword",
        value: "",
        type: "password",
        required: true,
        dependencies: ["password"],
        validators: ["confirm_password_required", "password_match"],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      phone: {
        name: "phone",
        value: "",
        type: "tel",
        required: false,
        dependencies: [],
        validators: ["phone_format"],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      age: {
        name: "age",
        value: "",
        type: "number",
        required: true,
        dependencies: ["accountType", "country"],
        validators: ["age_validation"],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      accountType: {
        name: "accountType",
        value: "",
        type: "select",
        required: true,
        dependencies: [],
        validators: [],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      country: {
        name: "country",
        value: "",
        type: "select",
        required: true,
        dependencies: [],
        validators: [],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      cardNumber: {
        name: "cardNumber",
        value: "",
        type: "text",
        required: false,
        dependencies: [],
        validators: [],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      cardExpiry: {
        name: "cardExpiry",
        value: "",
        type: "text",
        required: false,
        dependencies: ["cardNumber"],
        validators: ["credit_card_expiry"],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
      website: {
        name: "website",
        value: "",
        type: "url",
        required: false,
        dependencies: [],
        validators: ["website_url"],
        metadata: {
          touched: false,
          dirty: false,
          focused: false,
          lastValidated: null,
          validationCount: 0,
          errorHistory: [],
        },
      },
    };

    setFormFields(fields);
  }, []);

  // Complex validation engine with extremely high cognitive complexity
  const performComplexValidation = useCallback(
    async (fieldName?: string): Promise<void> => {
      const startTime = Date.now();
      setIsValidating(true);

      try {
        const fieldsToValidate = fieldName
          ? [fieldName]
          : Object.keys(formFields);
        const newResults: { [key: string]: ValidationResult } = {
          ...validationResults,
        };
        const stats = {
          totalRulesProcessed: 0,
          totalConditionsEvaluated: 0,
          totalDependenciesChecked: 0,
          totalValidationTime: 0,
          fieldValidationTimes: {} as { [key: string]: number },
        };

        // Update validation context
        const currentContext: ValidationContext = {
          ...validationContext,
          formData: Object.keys(formFields).reduce((acc, key) => {
            acc[key] = formFields[key].value;
            return acc;
          }, {} as { [key: string]: any }),
          previousData: { ...validationContext.formData },
        };

        // Process each field with complex validation logic
        for (const fieldKey of fieldsToValidate) {
          const fieldStartTime = Date.now();
          const field = formFields[fieldKey];
          if (!field) continue;

          const fieldResult: ValidationResult = {
            field: fieldKey,
            isValid: true,
            errors: [],
            warnings: [],
            infos: [],
            score: 100,
            suggestions: [],
            metadata: {
              executionTime: 0,
              rulesApplied: 0,
              dependenciesChecked: [],
              conditionsMet: [],
            },
          };

          // Get applicable validation rules for this field
          const applicableRules = validationRules
            .filter((rule) => rule.field === fieldKey)
            .sort((a, b) => b.priority - a.priority); // Higher priority first

          // Pre-validation dependency check
          const dependencyValidationMap: { [key: string]: boolean } = {};

          for (const rule of applicableRules) {
            stats.totalRulesProcessed++;
            fieldResult.metadata.rulesApplied++;

            // Check rule dependencies
            let dependenciesMet = true;
            for (const depRuleId of rule.dependencies) {
              stats.totalDependenciesChecked++;
              fieldResult.metadata.dependenciesChecked.push(depRuleId);

              const depRule = validationRules.find((r) => r.id === depRuleId);
              if (depRule) {
                // Check if dependency rule would pass
                if (!dependencyValidationMap[depRuleId]) {
                  const depResult = await validateSingleRule(
                    depRule,
                    currentContext,
                    formFields
                  );
                  dependencyValidationMap[depRuleId] = depResult.passed;
                }

                if (!dependencyValidationMap[depRuleId]) {
                  dependenciesMet = false;
                  break;
                }
              }
            }

            if (!dependenciesMet) {
              fieldResult.infos.push(
                `Skipped rule ${rule.id} due to unmet dependencies`
              );
              continue;
            }

            // Evaluate rule conditions
            let conditionsMet = true;
            for (const condition of rule.conditions) {
              stats.totalConditionsEvaluated++;

              const conditionResult = evaluateCondition(
                condition,
                currentContext
              );
              fieldResult.metadata.conditionsMet.push(conditionResult);

              if (!conditionResult) {
                conditionsMet = false;
                break;
              }
            }

            if (!conditionsMet) {
              fieldResult.infos.push(
                `Skipped rule ${rule.id} due to unmet conditions`
              );
              continue;
            }

            // Execute the actual validation rule
            try {
              const ruleResult = await validateSingleRule(
                rule,
                currentContext,
                formFields
              );

              if (!ruleResult.passed) {
                fieldResult.isValid = false;

                switch (rule.severity) {
                  case "error":
                    fieldResult.errors.push(rule.message);
                    fieldResult.score -= 20;
                    break;
                  case "warning":
                    fieldResult.warnings.push(rule.message);
                    fieldResult.score -= 10;
                    break;
                  case "info":
                    fieldResult.infos.push(rule.message);
                    fieldResult.score -= 2;
                    break;
                }

                // Add suggestions based on rule type and failure
                if (rule.type === "pattern" && rule.field === "email") {
                  fieldResult.suggestions.push("Try format: user@domain.com");
                } else if (
                  rule.type === "custom" &&
                  rule.field === "password"
                ) {
                  fieldResult.suggestions.push(
                    "Include uppercase, lowercase, numbers, and special characters"
                  );
                } else if (rule.type === "length") {
                  fieldResult.suggestions.push(
                    `Ensure length is between ${rule.params.min || 0} and ${
                      rule.params.max || "unlimited"
                    } characters`
                  );
                }
              } else {
                // Successful validation - add positive feedback
                if (
                  rule.type === "custom" &&
                  rule.field === "password" &&
                  rule.id === "password_complexity"
                ) {
                  fieldResult.infos.push("Strong password detected");
                  fieldResult.score += 5;
                }
              }

              dependencyValidationMap[rule.id] = ruleResult.passed;
            } catch (ruleError) {
              console.error(`Error executing rule ${rule.id}:`, ruleError);
              fieldResult.errors.push(`Validation rule error: ${rule.id}`);
              fieldResult.isValid = false;
              fieldResult.score -= 15;
            }
          }

          // Cross-field validation for complex business rules
          if (
            fieldKey === "age" &&
            currentContext.formData.accountType &&
            currentContext.formData.country
          ) {
            const ageBusinessRuleResult = validateAgeBusinessRules(
              currentContext.formData.age,
              currentContext.formData.accountType,
              currentContext.formData.country,
              validationMode
            );

            if (!ageBusinessRuleResult.valid) {
              fieldResult.errors.push(...ageBusinessRuleResult.errors);
              fieldResult.warnings.push(...ageBusinessRuleResult.warnings);
              fieldResult.suggestions.push(
                ...ageBusinessRuleResult.suggestions
              );
              fieldResult.isValid = false;
              fieldResult.score -= 15;
            }
          }

          // Password strength analysis
          if (fieldKey === "password" && currentContext.formData.password) {
            const strengthAnalysis = analyzePasswordStrength(
              currentContext.formData.password
            );
            fieldResult.score = Math.min(
              fieldResult.score,
              strengthAnalysis.score
            );
            fieldResult.suggestions.push(...strengthAnalysis.suggestions);

            if (strengthAnalysis.score < 60) {
              fieldResult.warnings.push("Password strength could be improved");
            }
          }

          // Email deliverability check (simulated)
          if (
            fieldKey === "email" &&
            currentContext.formData.email &&
            fieldResult.errors.length === 0
          ) {
            const deliverabilityCheck = await simulateEmailDeliverabilityCheck(
              currentContext.formData.email
            );
            if (!deliverabilityCheck.deliverable) {
              fieldResult.warnings.push("Email address may not be deliverable");
              fieldResult.score -= 5;
              fieldResult.suggestions.push("Verify email address is correct");
            }
          }

          // Security validation for sensitive fields
          if (
            ["password", "confirmPassword", "cardNumber"].includes(fieldKey)
          ) {
            const securityCheck = performSecurityValidation(
              fieldKey,
              currentContext.formData[fieldKey],
              currentContext
            );
            if (!securityCheck.secure) {
              fieldResult.warnings.push(...securityCheck.warnings);
              fieldResult.suggestions.push(...securityCheck.suggestions);
              fieldResult.score -= securityCheck.scorePenalty;
            }
          }

          // Finalize field validation result
          fieldResult.score = Math.max(0, Math.min(100, fieldResult.score));
          fieldResult.metadata.executionTime = Date.now() - fieldStartTime;
          stats.fieldValidationTimes[fieldKey] =
            fieldResult.metadata.executionTime;

          // Update field metadata
          const updatedField = {
            ...field,
            metadata: {
              ...field.metadata,
              lastValidated: new Date(),
              validationCount: field.metadata.validationCount + 1,
              errorHistory: [
                ...field.metadata.errorHistory,
                ...fieldResult.errors,
              ].slice(-10), // Keep last 10 errors
            },
          };

          setFormFields((prev) => ({
            ...prev,
            [fieldKey]: updatedField,
          }));

          newResults[fieldKey] = fieldResult;
        }

        // Global form validation (cross-field business rules)
        const globalValidationResult = performGlobalFormValidation(
          currentContext,
          validationMode
        );

        // Apply global validation results to individual fields
        Object.keys(globalValidationResult.fieldImpacts).forEach((fieldKey) => {
          if (newResults[fieldKey]) {
            const impact = globalValidationResult.fieldImpacts[fieldKey];
            newResults[fieldKey].errors.push(...impact.errors);
            newResults[fieldKey].warnings.push(...impact.warnings);
            newResults[fieldKey].suggestions.push(...impact.suggestions);
            newResults[fieldKey].score -= impact.scorePenalty;
            newResults[fieldKey].isValid =
              newResults[fieldKey].isValid && impact.valid;
          }
        });

        // Update validation context history
        const updatedValidationHistory = [
          ...currentContext.validationHistory,
          ...Object.values(newResults),
        ].slice(-50); // Keep last 50 validation results

        setValidationContext((prev) => ({
          ...prev,
          formData: currentContext.formData,
          previousData: currentContext.previousData,
          validationHistory: updatedValidationHistory,
        }));

        setValidationResults(newResults);

        // Update statistics
        stats.totalValidationTime = Date.now() - startTime;
        setValidationStats(stats);
      } catch (globalError) {
        console.error("Global validation error:", globalError);
      } finally {
        setIsValidating(false);
      }
    },
    [
      formFields,
      validationResults,
      validationRules,
      validationContext,
      validationMode,
    ]
  );

  // Helper function to validate a single rule
  const validateSingleRule = async (
    rule: ValidationRule,
    context: ValidationContext,
    fields: { [key: string]: FormField }
  ): Promise<{ passed: boolean; details?: any }> => {
    const fieldValue = context.formData[rule.field];

    switch (rule.type) {
      case "required":
        return {
          passed:
            fieldValue !== undefined &&
            fieldValue !== null &&
            String(fieldValue).trim() !== "",
        };

      case "length":
        if (typeof fieldValue !== "string") return { passed: false };
        const length = fieldValue.length;
        const min = rule.params.min || 0;
        const max = rule.params.max || Infinity;
        return { passed: length >= min && length <= max };

      case "pattern":
        if (typeof fieldValue !== "string") return { passed: false };
        const pattern = new RegExp(
          rule.params.pattern,
          rule.params.flags || ""
        );
        return { passed: pattern.test(fieldValue) };

      case "custom":
        if (typeof rule.params.validator === "function") {
          try {
            const result = await rule.params.validator(fieldValue, context);
            return { passed: Boolean(result) };
          } catch (error) {
            return { passed: false, details: error };
          }
        }
        return { passed: false };

      case "dependency":
        const dependentValue = context.formData[rule.params.dependentField];
        switch (rule.params.comparison) {
          case "equals":
            return { passed: fieldValue === dependentValue };
          case "not_equals":
            return { passed: fieldValue !== dependentValue };
          case "greater_than":
            return { passed: Number(fieldValue) > Number(dependentValue) };
          case "less_than":
            return { passed: Number(fieldValue) < Number(dependentValue) };
          default:
            return { passed: false };
        }

      case "conditional":
        if (typeof rule.params.condition === "function") {
          try {
            const conditionMet = await rule.params.condition(context);
            if (conditionMet) {
              // If condition is met, field is required
              return {
                passed:
                  fieldValue !== undefined &&
                  fieldValue !== null &&
                  String(fieldValue).trim() !== "",
              };
            }
            return { passed: true }; // If condition not met, validation passes
          } catch (error) {
            return { passed: false, details: error };
          }
        }
        return { passed: true };

      case "range":
        const numValue = Number(fieldValue);
        if (isNaN(numValue)) return { passed: false };
        const rangeMin = rule.params.min || -Infinity;
        const rangeMax = rule.params.max || Infinity;
        return { passed: numValue >= rangeMin && numValue <= rangeMax };

      default:
        return { passed: true };
    }
  };

  // Helper function to evaluate conditions
  const evaluateCondition = (
    condition: any,
    context: ValidationContext
  ): boolean => {
    const fieldValue = context.formData[condition.field];

    switch (condition.operator) {
      case "not_empty":
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          String(fieldValue).trim() !== ""
        );
      case "empty":
        return !fieldValue || String(fieldValue).trim() === "";
      case "equals":
        return fieldValue === condition.value;
      case "not_equals":
        return fieldValue !== condition.value;
      case "length_gte":
        return String(fieldValue || "").length >= condition.value;
      case "length_lte":
        return String(fieldValue || "").length <= condition.value;
      case "greater_than":
        return Number(fieldValue) > Number(condition.value);
      case "less_than":
        return Number(fieldValue) < Number(condition.value);
      default:
        return true;
    }
  };

  // Complex business rule validation
  const validateAgeBusinessRules = (
    age: any,
    accountType: string,
    country: string,
    mode: string
  ) => {
    const result = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    };

    const numAge = parseInt(age);
    if (isNaN(numAge)) {
      result.valid = false;
      result.errors.push("Age must be a valid number");
      return result;
    }

    // Country-specific age restrictions
    const countryRules: { [key: string]: any } = {
      US: { minAge: 13, adultAge: 18, seniorAge: 65 },
      DE: { minAge: 14, adultAge: 16, seniorAge: 67 },
      JP: { minAge: 13, adultAge: 20, seniorAge: 65 },
      FR: { minAge: 13, adultAge: 18, seniorAge: 62 },
    };

    const rules = countryRules[country] || countryRules["US"];

    // Account type specific validation
    switch (accountType) {
      case "child":
        if (numAge < 6) {
          result.valid = false;
          result.errors.push("Children accounts require minimum age of 6");
        } else if (numAge >= 13) {
          result.valid = false;
          result.errors.push("Children accounts are for ages 6-12");
          result.suggestions.push("Consider a teen or adult account");
        }
        break;

      case "teen":
        if (numAge < rules.minAge) {
          result.valid = false;
          result.errors.push(
            `Teen accounts require minimum age of ${rules.minAge} in ${country}`
          );
        } else if (numAge >= rules.adultAge) {
          result.valid = false;
          result.errors.push(
            `Teen accounts are for ages ${rules.minAge}-${
              rules.adultAge - 1
            } in ${country}`
          );
          result.suggestions.push("Consider an adult account");
        }
        break;

      case "adult":
        if (numAge < rules.adultAge) {
          result.valid = false;
          result.errors.push(
            `Adult accounts require minimum age of ${rules.adultAge} in ${country}`
          );
          result.suggestions.push("Consider a teen account");
        } else if (numAge >= rules.seniorAge && mode === "strict") {
          result.warnings.push(
            "Consider a senior account for additional benefits"
          );
        }
        break;

      case "senior":
        if (numAge < rules.seniorAge) {
          result.valid = false;
          result.errors.push(
            `Senior accounts require minimum age of ${rules.seniorAge} in ${country}`
          );
          result.suggestions.push("Consider an adult account");
        }
        break;

      default:
        result.warnings.push("Unknown account type selected");
    }

    // Universal age limits
    if (numAge > 120) {
      result.valid = false;
      result.errors.push("Age cannot exceed 120 years");
    } else if (numAge < 6) {
      result.valid = false;
      result.errors.push("Minimum age requirement is 6 years");
    }

    return result;
  };

  // Password strength analysis
  const analyzePasswordStrength = (password: string) => {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 8) score += 20;
    else suggestions.push("Use at least 8 characters");

    if (password.length >= 12) score += 10;
    else if (password.length >= 8)
      suggestions.push("Consider using 12+ characters for better security");

    if (/[a-z]/.test(password)) score += 15;
    else suggestions.push("Add lowercase letters");

    if (/[A-Z]/.test(password)) score += 15;
    else suggestions.push("Add uppercase letters");

    if (/\d/.test(password)) score += 15;
    else suggestions.push("Add numbers");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    else suggestions.push("Add special characters");

    if (!/(.)\1{2,}/.test(password)) score += 10;
    else suggestions.push("Avoid repeating characters");

    if (!/123|abc|qwe|password|admin/i.test(password)) score += 10;
    else suggestions.push("Avoid common patterns and words");

    return { score, suggestions };
  };

  // Simulated email deliverability check
  const simulateEmailDeliverabilityCheck = async (
    email: string
  ): Promise<{ deliverable: boolean; reason?: string }> => {
    // Simulate async API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return { deliverable: false, reason: "Invalid email format" };

    // Simulate some basic checks
    const commonProviders = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "aol.com",
    ];
    const disposableProviders = [
      "tempmail.org",
      "10minutemail.com",
      "guerrillamail.com",
    ];

    if (disposableProviders.includes(domain)) {
      return { deliverable: false, reason: "Disposable email provider" };
    }

    if (commonProviders.includes(domain)) {
      return { deliverable: true };
    }

    // Simulate random deliverability for other domains
    return { deliverable: Math.random() > 0.3 };
  };

  // Security validation for sensitive fields
  const performSecurityValidation = (
    fieldName: string,
    value: any,
    context: ValidationContext
  ) => {
    const result = {
      secure: true,
      warnings: [] as string[],
      suggestions: [] as string[],
      scorePenalty: 0,
    };

    if (fieldName === "password") {
      // Check against common passwords
      const commonPasswords = [
        "password",
        "123456",
        "qwerty",
        "admin",
        "welcome",
      ];
      if (
        commonPasswords.some((common) =>
          String(value).toLowerCase().includes(common)
        )
      ) {
        result.secure = false;
        result.warnings.push("Password contains common patterns");
        result.suggestions.push("Use a unique password");
        result.scorePenalty += 15;
      }

      // Check for personal information
      const personalInfo = [
        context.formData.email?.split("@")[0],
        context.formData.phone,
        String(context.formData.age),
      ].filter(Boolean);

      for (const info of personalInfo) {
        if (String(value).toLowerCase().includes(String(info).toLowerCase())) {
          result.warnings.push(
            "Password should not contain personal information"
          );
          result.suggestions.push(
            "Avoid using email, phone, or age in password"
          );
          result.scorePenalty += 10;
          break;
        }
      }
    }

    return result;
  };

  // Global form validation
  const performGlobalFormValidation = (
    context: ValidationContext,
    mode: string
  ) => {
    const result = {
      valid: true,
      globalErrors: [] as string[],
      globalWarnings: [] as string[],
      fieldImpacts: {} as { [key: string]: any },
    };

    // Initialize field impacts
    Object.keys(context.formData).forEach((field) => {
      result.fieldImpacts[field] = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        scorePenalty: 0,
      };
    });

    // Business rule: Email domain matching
    if (context.formData.email && context.formData.website) {
      const emailDomain = context.formData.email.split("@")[1];
      try {
        const websiteUrl = new URL(context.formData.website);
        const websiteDomain = websiteUrl.hostname;

        if (
          emailDomain &&
          websiteDomain &&
          !websiteDomain.includes(emailDomain) &&
          !emailDomain.includes(websiteDomain)
        ) {
          if (mode === "strict") {
            result.fieldImpacts.email.warnings.push(
              "Email domain does not match website domain"
            );
            result.fieldImpacts.website.warnings.push(
              "Website domain does not match email domain"
            );
          }
        }
      } catch {
        // Invalid website URL - already handled by URL validation
      }
    }

    // Business rule: Age consistency with account type
    if (context.formData.age && context.formData.accountType) {
      const age = parseInt(context.formData.age);
      if (!isNaN(age)) {
        if (context.formData.accountType === "senior" && age < 60) {
          result.fieldImpacts.accountType.warnings.push(
            "Senior account selected but age suggests adult account"
          );
          result.fieldImpacts.age.suggestions.push(
            "Verify age is correct for senior account"
          );
        }
      }
    }

    return result;
  };

  // Debounced validation
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      performComplexValidation();
    }, 300);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [formFields]);

  // Handle field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: value,
        metadata: {
          ...prev[fieldName].metadata,
          dirty: true,
          touched: true,
        },
      },
    }));
  };

  // Handle field focus
  const handleFieldFocus = (fieldName: string) => {
    setFormFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        metadata: {
          ...prev[fieldName].metadata,
          focused: true,
          touched: true,
        },
      },
    }));
  };

  // Handle field blur
  const handleFieldBlur = (fieldName: string) => {
    setFormFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        metadata: {
          ...prev[fieldName].metadata,
          focused: false,
        },
      },
    }));

    // Trigger immediate validation for this field
    performComplexValidation(fieldName);
  };

  // Get field validation status
  const getFieldStatus = (fieldName: string) => {
    const result = validationResults[fieldName];
    if (!result) return "neutral";

    if (result.errors.length > 0) return "error";
    if (result.warnings.length > 0) return "warning";
    if (result.score >= 90) return "excellent";
    if (result.score >= 70) return "good";
    return "neutral";
  };

  // Calculate overall form score
  const overallFormScore = useMemo(() => {
    const scores = Object.values(validationResults).map((r) => r.score);
    if (scores.length === 0) return 0;
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
  }, [validationResults]);

  return (
    <div className="min-h-screen bg-[#303030] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Complex Form Validator
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Demonstrates extremely high cognitive complexity (30+) and cyclomatic
          complexity (40+) validation system
        </p>

        {/* Validation Stats */}
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Validation Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {overallFormScore}
              </div>
              <div className="text-sm text-gray-400">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {validationStats.totalRulesProcessed || 0}
              </div>
              <div className="text-sm text-gray-400">Rules Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {validationStats.totalConditionsEvaluated || 0}
              </div>
              <div className="text-sm text-gray-400">Conditions Checked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {validationStats.totalValidationTime || 0}ms
              </div>
              <div className="text-sm text-gray-400">Validation Time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Fields */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">Form Fields</h2>

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formFields.email?.value || ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onFocus={() => handleFieldFocus("email")}
                  onBlur={() => handleFieldBlur("email")}
                  className={`bg-gray-700 text-white border-2 ${
                    getFieldStatus("email") === "error"
                      ? "border-red-500"
                      : getFieldStatus("email") === "warning"
                      ? "border-yellow-500"
                      : getFieldStatus("email") === "excellent"
                      ? "border-green-500"
                      : getFieldStatus("email") === "good"
                      ? "border-blue-500"
                      : "border-gray-600"
                  }`}
                  placeholder="Enter your email address"
                />
                {validationResults.email && (
                  <div className="mt-2 space-y-1">
                    {validationResults.email.errors.map((error, index) => (
                      <div key={index} className="text-red-400 text-sm">
                        {error}
                      </div>
                    ))}
                    {validationResults.email.warnings.map((warning, index) => (
                      <div key={index} className="text-yellow-400 text-sm">
                        {warning}
                      </div>
                    ))}
                    {validationResults.email.suggestions.map(
                      (suggestion, index) => (
                        <div key={index} className="text-blue-400 text-sm">
                          💡 {suggestion}
                        </div>
                      )
                    )}
                    <div className="text-gray-400 text-xs">
                      Score: {validationResults.email.score}/100
                    </div>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formFields.password?.value || ""}
                  onChange={(e) =>
                    handleFieldChange("password", e.target.value)
                  }
                  onFocus={() => handleFieldFocus("password")}
                  onBlur={() => handleFieldBlur("password")}
                  className={`bg-gray-700 text-white border-2 ${
                    getFieldStatus("password") === "error"
                      ? "border-red-500"
                      : getFieldStatus("password") === "warning"
                      ? "border-yellow-500"
                      : getFieldStatus("password") === "excellent"
                      ? "border-green-500"
                      : getFieldStatus("password") === "good"
                      ? "border-blue-500"
                      : "border-gray-600"
                  }`}
                  placeholder="Create a strong password"
                />
                {validationResults.password && (
                  <div className="mt-2 space-y-1">
                    {validationResults.password.errors.map((error, index) => (
                      <div key={index} className="text-red-400 text-sm">
                        {error}
                      </div>
                    ))}
                    {validationResults.password.warnings.map(
                      (warning, index) => (
                        <div key={index} className="text-yellow-400 text-sm">
                          {warning}
                        </div>
                      )
                    )}
                    {validationResults.password.suggestions.map(
                      (suggestion, index) => (
                        <div key={index} className="text-blue-400 text-sm">
                          💡 {suggestion}
                        </div>
                      )
                    )}
                    <div className="text-gray-400 text-xs">
                      Score: {validationResults.password.score}/100
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  value={formFields.confirmPassword?.value || ""}
                  onChange={(e) =>
                    handleFieldChange("confirmPassword", e.target.value)
                  }
                  onFocus={() => handleFieldFocus("confirmPassword")}
                  onBlur={() => handleFieldBlur("confirmPassword")}
                  className={`bg-gray-700 text-white border-2 ${
                    getFieldStatus("confirmPassword") === "error"
                      ? "border-red-500"
                      : getFieldStatus("confirmPassword") === "warning"
                      ? "border-yellow-500"
                      : getFieldStatus("confirmPassword") === "excellent"
                      ? "border-green-500"
                      : getFieldStatus("confirmPassword") === "good"
                      ? "border-blue-500"
                      : "border-gray-600"
                  }`}
                  placeholder="Confirm your password"
                />
                {validationResults.confirmPassword && (
                  <div className="mt-2 space-y-1">
                    {validationResults.confirmPassword.errors.map(
                      (error, index) => (
                        <div key={index} className="text-red-400 text-sm">
                          {error}
                        </div>
                      )
                    )}
                    {validationResults.confirmPassword.warnings.map(
                      (warning, index) => (
                        <div key={index} className="text-yellow-400 text-sm">
                          {warning}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Type *
                </label>
                <select
                  value={formFields.accountType?.value || ""}
                  onChange={(e) =>
                    handleFieldChange("accountType", e.target.value)
                  }
                  onFocus={() => handleFieldFocus("accountType")}
                  onBlur={() => handleFieldBlur("accountType")}
                  className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded px-3 py-2"
                >
                  <option value="">Select account type</option>
                  <option value="child">Child (6-12)</option>
                  <option value="teen">Teen (13-17)</option>
                  <option value="adult">Adult (18+)</option>
                  <option value="senior">Senior (65+)</option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country *
                </label>
                <select
                  value={formFields.country?.value || ""}
                  onChange={(e) => handleFieldChange("country", e.target.value)}
                  onFocus={() => handleFieldFocus("country")}
                  onBlur={() => handleFieldBlur("country")}
                  className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded px-3 py-2"
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="FR">France</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium mb-2">Age *</label>
                <Input
                  type="number"
                  value={formFields.age?.value || ""}
                  onChange={(e) => handleFieldChange("age", e.target.value)}
                  onFocus={() => handleFieldFocus("age")}
                  onBlur={() => handleFieldBlur("age")}
                  className={`bg-gray-700 text-white border-2 ${
                    getFieldStatus("age") === "error"
                      ? "border-red-500"
                      : getFieldStatus("age") === "warning"
                      ? "border-yellow-500"
                      : "border-gray-600"
                  }`}
                  placeholder="Enter your age"
                  min="6"
                  max="120"
                />
                {validationResults.age && (
                  <div className="mt-2 space-y-1">
                    {validationResults.age.errors.map((error, index) => (
                      <div key={index} className="text-red-400 text-sm">
                        {error}
                      </div>
                    ))}
                    {validationResults.age.warnings.map((warning, index) => (
                      <div key={index} className="text-yellow-400 text-sm">
                        {warning}
                      </div>
                    ))}
                    {validationResults.age.suggestions.map(
                      (suggestion, index) => (
                        <div key={index} className="text-blue-400 text-sm">
                          💡 {suggestion}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Optional Fields */}
              <div className="border-t border-gray-600 pt-6">
                <h3 className="text-lg font-medium mb-4">
                  Optional Information
                </h3>

                {/* Phone */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formFields.phone?.value || ""}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onFocus={() => handleFieldFocus("phone")}
                    onBlur={() => handleFieldBlur("phone")}
                    className={`bg-gray-700 text-white border-2 ${
                      getFieldStatus("phone") === "warning"
                        ? "border-yellow-500"
                        : "border-gray-600"
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {validationResults.phone && (
                    <div className="mt-2 space-y-1">
                      {validationResults.phone.warnings.map(
                        (warning, index) => (
                          <div key={index} className="text-yellow-400 text-sm">
                            {warning}
                          </div>
                        )
                      )}
                      {validationResults.phone.suggestions.map(
                        (suggestion, index) => (
                          <div key={index} className="text-blue-400 text-sm">
                            💡 {suggestion}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Website */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={formFields.website?.value || ""}
                    onChange={(e) =>
                      handleFieldChange("website", e.target.value)
                    }
                    onFocus={() => handleFieldFocus("website")}
                    onBlur={() => handleFieldBlur("website")}
                    className={`bg-gray-700 text-white border-2 ${
                      getFieldStatus("website") === "warning"
                        ? "border-yellow-500"
                        : "border-gray-600"
                    }`}
                    placeholder="https://example.com"
                  />
                  {validationResults.website && (
                    <div className="mt-2 space-y-1">
                      {validationResults.website.warnings.map(
                        (warning, index) => (
                          <div key={index} className="text-yellow-400 text-sm">
                            {warning}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Information */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-md font-medium mb-3">
                    Payment Information (Optional)
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Card Number
                      </label>
                      <Input
                        type="text"
                        value={formFields.cardNumber?.value || ""}
                        onChange={(e) =>
                          handleFieldChange("cardNumber", e.target.value)
                        }
                        onFocus={() => handleFieldFocus("cardNumber")}
                        onBlur={() => handleFieldBlur("cardNumber")}
                        className="bg-gray-700 text-white border-gray-600"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expiry Date
                      </label>
                      <Input
                        type="text"
                        value={formFields.cardExpiry?.value || ""}
                        onChange={(e) =>
                          handleFieldChange("cardExpiry", e.target.value)
                        }
                        onFocus={() => handleFieldFocus("cardExpiry")}
                        onBlur={() => handleFieldBlur("cardExpiry")}
                        className={`bg-gray-700 text-white border-2 ${
                          getFieldStatus("cardExpiry") === "error"
                            ? "border-red-500"
                            : "border-gray-600"
                        }`}
                        placeholder="MM/YY"
                      />
                      {validationResults.cardExpiry && (
                        <div className="mt-1">
                          {validationResults.cardExpiry.errors.map(
                            (error, index) => (
                              <div key={index} className="text-red-400 text-xs">
                                {error}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Mode Selector */}
            <div className="mt-6 pt-6 border-t border-gray-600">
              <label className="block text-sm font-medium mb-2">
                Validation Mode
              </label>
              <select
                value={validationMode}
                onChange={(e) => setValidationMode(e.target.value as any)}
                className="bg-gray-700 text-white border-gray-600 rounded px-3 py-2"
              >
                <option value="lenient">Lenient</option>
                <option value="normal">Normal</option>
                <option value="strict">Strict</option>
              </select>
            </div>

            <Button
              onClick={() => performComplexValidation()}
              disabled={isValidating}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
            >
              {isValidating ? "Validating..." : "Validate Form"}
            </Button>
          </div>

          {/* Validation Results */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">Validation Results</h2>

            <div className="space-y-4">
              {Object.values(validationResults).map((result) => (
                <div key={result.field} className="bg-gray-700 p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold capitalize">
                      {result.field.replace(/([A-Z])/g, " $1")}
                    </h3>
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        result.isValid ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {result.score}/100
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mb-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-red-400 text-sm">
                          ❌ {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="mb-2">
                      {result.warnings.map((warning, index) => (
                        <div key={index} className="text-yellow-400 text-sm">
                          ⚠️ {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.suggestions.length > 0 && (
                    <div className="mb-2">
                      {result.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-blue-400 text-sm">
                          💡 {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    Rules applied: {result.metadata.rulesApplied} | Time:{" "}
                    {result.metadata.executionTime}ms | Dependencies:{" "}
                    {result.metadata.dependenciesChecked.length}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Form Status */}
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <h3 className="font-semibold mb-2">Overall Form Status</h3>
              <div className="flex items-center justify-between">
                <span>Form Score</span>
                <div
                  className={`px-3 py-1 rounded ${
                    overallFormScore >= 90
                      ? "bg-green-600"
                      : overallFormScore >= 70
                      ? "bg-blue-600"
                      : overallFormScore >= 50
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                >
                  {overallFormScore}/100
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {overallFormScore >= 90
                  ? "Excellent - Ready to submit"
                  : overallFormScore >= 70
                  ? "Good - Minor improvements suggested"
                  : overallFormScore >= 50
                  ? "Fair - Several issues need attention"
                  : "Poor - Significant issues must be resolved"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
