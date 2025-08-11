"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DataPoint {
  id: string;
  value: number;
  category: string;
  subCategory: string;
  metadata: {
    priority: number;
    tags: string[];
    timestamp: Date;
    source: string;
    confidence: number;
    relations: string[];
  };
  processing: {
    stage: number;
    errors: string[];
    warnings: string[];
    transformations: any[];
  };
}

interface ProcessingRule {
  id: string;
  condition: (data: DataPoint) => boolean;
  transformation: (data: DataPoint) => DataPoint;
  priority: number;
  dependencies: string[];
  errorHandling: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  recommendations: string[];
}

export default function ComplexDataProcessor() {
  const [rawData, setRawData] = useState<string>("");
  const [processedData, setProcessedData] = useState<DataPoint[]>([]);
  const [processingRules, setProcessingRules] = useState<ProcessingRule[]>([]);
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState<any>({});
  const [filterCriteria, setFilterCriteria] = useState<any>({});
  const [sortingOptions, setSortingOptions] = useState<any>({});
  const [aggregationSettings, setAggregationSettings] = useState<any>({});

  // Extremely complex data processing function with high cognitive complexity
  const processComplexData = useCallback(
    async (inputData: string): Promise<DataPoint[]> => {
      const startTime = Date.now();
      let processedResults: DataPoint[] = [];
      let errorCount = 0;
      let warningCount = 0;
      let transformationCount = 0;

      try {
        // Parse and validate input data with multiple formats
        let parsedData: any[] = [];

        if (
          inputData.trim().startsWith("[") ||
          inputData.trim().startsWith("{")
        ) {
          try {
            parsedData = JSON.parse(inputData);
            if (!Array.isArray(parsedData)) {
              parsedData = [parsedData];
            }
          } catch (jsonError) {
            // Try CSV parsing
            const lines = inputData.split("\n");
            if (lines.length > 1) {
              const headers = lines[0].split(",");
              for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                  const values = lines[i].split(",");
                  const obj: any = {};
                  for (
                    let j = 0;
                    j < headers.length && j < values.length;
                    j++
                  ) {
                    obj[headers[j].trim()] = values[j].trim();
                  }
                  parsedData.push(obj);
                }
              }
            } else {
              // Try space-separated parsing
              const values = inputData.split(/\s+/);
              for (const value of values) {
                if (value.trim()) {
                  parsedData.push({ value: parseFloat(value) || value });
                }
              }
            }
          }
        } else {
          // Try other parsing methods
          const lines = inputData.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              if (line.includes("=")) {
                const [key, value] = line.split("=");
                parsedData.push({ [key.trim()]: value.trim() });
              } else if (line.includes(":")) {
                const [key, value] = line.split(":");
                parsedData.push({ [key.trim()]: value.trim() });
              } else {
                parsedData.push({ value: line.trim() });
              }
            }
          }
        }

        // Complex validation and transformation pipeline
        for (let dataIndex = 0; dataIndex < parsedData.length; dataIndex++) {
          const rawDataPoint = parsedData[dataIndex];
          let currentDataPoint: DataPoint = {
            id: `data_${dataIndex}_${Date.now()}`,
            value: 0,
            category: "unknown",
            subCategory: "default",
            metadata: {
              priority: 1,
              tags: [],
              timestamp: new Date(),
              source: "user_input",
              confidence: 0.5,
              relations: [],
            },
            processing: {
              stage: 0,
              errors: [],
              warnings: [],
              transformations: [],
            },
          };

          // Stage 1: Initial data mapping and type inference
          if (typeof rawDataPoint === "object" && rawDataPoint !== null) {
            for (const [key, value] of Object.entries(rawDataPoint)) {
              switch (key.toLowerCase()) {
                case "id":
                case "identifier":
                case "key":
                  if (typeof value === "string" || typeof value === "number") {
                    currentDataPoint.id = String(value);
                  }
                  break;
                case "value":
                case "amount":
                case "score":
                case "number":
                  if (typeof value === "string") {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      currentDataPoint.value = numValue;
                    } else {
                      currentDataPoint.processing.warnings.push(
                        `Invalid numeric value: ${value}`
                      );
                      warningCount++;
                    }
                  } else if (typeof value === "number") {
                    currentDataPoint.value = value;
                  }
                  break;
                case "category":
                case "type":
                case "group":
                  if (typeof value === "string") {
                    // Complex category normalization
                    let normalizedCategory = value.toLowerCase().trim();
                    if (
                      normalizedCategory.includes("important") ||
                      normalizedCategory.includes("critical")
                    ) {
                      currentDataPoint.category = "high_priority";
                      currentDataPoint.metadata.priority = 5;
                    } else if (
                      normalizedCategory.includes("medium") ||
                      normalizedCategory.includes("normal")
                    ) {
                      currentDataPoint.category = "medium_priority";
                      currentDataPoint.metadata.priority = 3;
                    } else if (
                      normalizedCategory.includes("low") ||
                      normalizedCategory.includes("minor")
                    ) {
                      currentDataPoint.category = "low_priority";
                      currentDataPoint.metadata.priority = 1;
                    } else if (
                      normalizedCategory.includes("data") ||
                      normalizedCategory.includes("info")
                    ) {
                      currentDataPoint.category = "information";
                      currentDataPoint.metadata.priority = 2;
                    } else if (
                      normalizedCategory.includes("error") ||
                      normalizedCategory.includes("fail")
                    ) {
                      currentDataPoint.category = "error";
                      currentDataPoint.metadata.priority = 5;
                      currentDataPoint.processing.errors.push(
                        "Error category detected"
                      );
                      errorCount++;
                    } else {
                      currentDataPoint.category = normalizedCategory;
                    }
                  }
                  break;
                case "subcategory":
                case "subtype":
                case "subgroup":
                  if (typeof value === "string") {
                    currentDataPoint.subCategory = value.toLowerCase().trim();
                  }
                  break;
                case "tags":
                  if (Array.isArray(value)) {
                    currentDataPoint.metadata.tags = value.map((tag) =>
                      String(tag)
                    );
                  } else if (typeof value === "string") {
                    currentDataPoint.metadata.tags = value
                      .split(",")
                      .map((tag) => tag.trim());
                  }
                  break;
                case "priority":
                  if (typeof value === "number") {
                    currentDataPoint.metadata.priority = Math.max(
                      1,
                      Math.min(5, value)
                    );
                  } else if (typeof value === "string") {
                    const priorityMap: { [key: string]: number } = {
                      low: 1,
                      medium: 3,
                      high: 5,
                      critical: 5,
                      urgent: 5,
                    };
                    currentDataPoint.metadata.priority =
                      priorityMap[value.toLowerCase()] || 2;
                  }
                  break;
              }
            }
          } else {
            // Handle primitive values
            if (typeof rawDataPoint === "number") {
              currentDataPoint.value = rawDataPoint;
            } else if (typeof rawDataPoint === "string") {
              const numValue = parseFloat(rawDataPoint);
              if (!isNaN(numValue)) {
                currentDataPoint.value = numValue;
              } else {
                currentDataPoint.category = "text_data";
                currentDataPoint.metadata.tags.push("non_numeric");
              }
            }
          }

          currentDataPoint.processing.stage = 1;
          currentDataPoint.processing.transformations.push("initial_mapping");
          transformationCount++;

          // Stage 2: Advanced validation and enrichment
          currentDataPoint.processing.stage = 2;

          // Complex validation rules
          if (currentDataPoint.value < 0) {
            if (
              currentDataPoint.category !== "error" &&
              currentDataPoint.category !== "negative_allowed"
            ) {
              currentDataPoint.processing.warnings.push(
                "Negative value detected"
              );
              warningCount++;
              currentDataPoint.metadata.confidence *= 0.8;
            }
          }

          if (currentDataPoint.value > 1000000) {
            currentDataPoint.processing.warnings.push(
              "Extremely large value detected"
            );
            warningCount++;
            currentDataPoint.metadata.confidence *= 0.9;
          }

          if (
            currentDataPoint.category === "unknown" &&
            currentDataPoint.value !== 0
          ) {
            // Attempt category inference based on value patterns
            if (currentDataPoint.value >= 0 && currentDataPoint.value <= 1) {
              currentDataPoint.category = "probability";
              currentDataPoint.subCategory = "normalized";
            } else if (
              currentDataPoint.value >= 0 &&
              currentDataPoint.value <= 100
            ) {
              currentDataPoint.category = "percentage";
              currentDataPoint.subCategory = "score";
            } else if (
              currentDataPoint.value >= 1000 &&
              currentDataPoint.value <= 9999
            ) {
              currentDataPoint.category = "identifier";
              currentDataPoint.subCategory = "numeric_id";
            } else {
              currentDataPoint.category = "measurement";
              currentDataPoint.subCategory = "raw_value";
            }
            currentDataPoint.processing.transformations.push(
              "category_inference"
            );
            transformationCount++;
          }

          // Stage 3: Cross-reference validation and relationship mapping
          currentDataPoint.processing.stage = 3;

          // Check relationships with previously processed data
          for (
            let prevIndex = 0;
            prevIndex < processedResults.length;
            prevIndex++
          ) {
            const prevData = processedResults[prevIndex];

            // Value similarity check
            if (Math.abs(currentDataPoint.value - prevData.value) < 0.001) {
              currentDataPoint.metadata.relations.push(
                `similar_value_${prevData.id}`
              );
              currentDataPoint.processing.warnings.push(
                `Duplicate or very similar value found: ${prevData.value}`
              );
              warningCount++;
            }

            // Category relationship check
            if (currentDataPoint.category === prevData.category) {
              currentDataPoint.metadata.relations.push(
                `same_category_${prevData.id}`
              );
              if (currentDataPoint.subCategory === prevData.subCategory) {
                currentDataPoint.metadata.relations.push(
                  `same_subcategory_${prevData.id}`
                );
              }
            }

            // Pattern detection
            if (prevIndex >= 2) {
              const pattern1 = processedResults[prevIndex - 1];
              const pattern2 = processedResults[prevIndex];

              // Arithmetic progression check
              if (
                Math.abs(
                  pattern2.value -
                    pattern1.value -
                    (currentDataPoint.value - pattern2.value)
                ) < 0.001
              ) {
                currentDataPoint.metadata.tags.push("arithmetic_sequence");
                currentDataPoint.metadata.confidence *= 1.1;
              }

              // Geometric progression check
              if (pattern1.value !== 0 && pattern2.value !== 0) {
                const ratio1 = pattern2.value / pattern1.value;
                const ratio2 = currentDataPoint.value / pattern2.value;
                if (Math.abs(ratio1 - ratio2) < 0.001) {
                  currentDataPoint.metadata.tags.push("geometric_sequence");
                  currentDataPoint.metadata.confidence *= 1.1;
                }
              }
            }
          }

          // Stage 4: Advanced transformations and normalizations
          currentDataPoint.processing.stage = 4;

          // Apply complex transformations based on category and metadata
          if (
            currentDataPoint.category === "percentage" &&
            currentDataPoint.value > 1
          ) {
            if (currentDataPoint.value <= 100) {
              currentDataPoint.value = currentDataPoint.value / 100;
              currentDataPoint.processing.transformations.push(
                "percentage_normalization"
              );
              transformationCount++;
            } else {
              currentDataPoint.processing.errors.push(
                "Invalid percentage value > 100"
              );
              errorCount++;
            }
          }

          if (currentDataPoint.category === "probability") {
            if (currentDataPoint.value < 0 || currentDataPoint.value > 1) {
              currentDataPoint.processing.errors.push(
                "Probability value out of range [0,1]"
              );
              errorCount++;
              currentDataPoint.value = Math.max(
                0,
                Math.min(1, currentDataPoint.value)
              );
              currentDataPoint.processing.transformations.push(
                "probability_clamping"
              );
              transformationCount++;
            }
          }

          // Statistical outlier detection (simplified Z-score approach)
          if (processedResults.length >= 5) {
            const values = processedResults.map((d) => d.value);
            const mean =
              values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance =
              values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
              values.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev > 0) {
              const zScore = Math.abs((currentDataPoint.value - mean) / stdDev);
              if (zScore > 2) {
                currentDataPoint.metadata.tags.push("statistical_outlier");
                currentDataPoint.processing.warnings.push(
                  `Statistical outlier detected (z-score: ${zScore.toFixed(2)})`
                );
                warningCount++;
              }
            }
          }

          // Stage 5: Quality scoring and confidence adjustment
          currentDataPoint.processing.stage = 5;

          let qualityScore = 1.0;

          // Penalize for errors and warnings
          qualityScore -= currentDataPoint.processing.errors.length * 0.2;
          qualityScore -= currentDataPoint.processing.warnings.length * 0.1;

          // Bonus for relationships and patterns
          qualityScore += currentDataPoint.metadata.relations.length * 0.05;
          qualityScore += currentDataPoint.metadata.tags.length * 0.02;

          // Bonus for successful transformations
          qualityScore +=
            currentDataPoint.processing.transformations.length * 0.03;

          // Category-specific adjustments
          switch (currentDataPoint.category) {
            case "error":
              qualityScore *= 0.5;
              break;
            case "high_priority":
              qualityScore *= 1.2;
              break;
            case "low_priority":
              qualityScore *= 0.8;
              break;
            case "probability":
            case "percentage":
              qualityScore *= 1.1;
              break;
          }

          currentDataPoint.metadata.confidence = Math.max(
            0,
            Math.min(1, qualityScore)
          );

          // Final validation stage
          if (currentDataPoint.processing.errors.length > 3) {
            currentDataPoint.processing.warnings.push(
              "Too many errors - data quality compromised"
            );
            warningCount++;
          }

          if (currentDataPoint.metadata.confidence < 0.3) {
            currentDataPoint.processing.warnings.push(
              "Low confidence score - verify data accuracy"
            );
            warningCount++;
          }

          processedResults.push(currentDataPoint);
        }

        // Post-processing phase: Global optimizations and cross-data analysis
        for (let i = 0; i < processedResults.length; i++) {
          const currentData = processedResults[i];

          // Global normalization if needed
          if (currentData.category === "measurement") {
            const measurementValues = processedResults
              .filter((d) => d.category === "measurement")
              .map((d) => d.value);

            if (measurementValues.length > 1) {
              const minVal = Math.min(...measurementValues);
              const maxVal = Math.max(...measurementValues);

              if (maxVal > minVal) {
                const normalizedValue =
                  (currentData.value - minVal) / (maxVal - minVal);
                currentData.processing.transformations.push(
                  "global_min_max_normalization"
                );
                currentData.metadata.tags.push("globally_normalized");
                transformationCount++;
              }
            }
          }

          // Cluster analysis (simplified)
          if (processedResults.length >= 3) {
            const similarData = processedResults.filter((other, otherIndex) => {
              if (otherIndex === i) return false;
              return (
                Math.abs(other.value - currentData.value) <
                Math.abs(currentData.value) * 0.1 + 0.01
              );
            });

            if (similarData.length >= 2) {
              currentData.metadata.tags.push("cluster_member");
              currentData.metadata.relations.push(
                ...similarData.map((d) => `cluster_${d.id}`)
              );
            }
          }
        }
      } catch (globalError) {
        console.error("Global processing error:", globalError);
        errorCount++;
      }

      // Update processing statistics
      const endTime = Date.now();
      setProcessingStats({
        totalProcessed: processedResults.length,
        totalErrors: errorCount,
        totalWarnings: warningCount,
        totalTransformations: transformationCount,
        processingTime: endTime - startTime,
        averageConfidence:
          processedResults.length > 0
            ? processedResults.reduce(
                (sum, d) => sum + d.metadata.confidence,
                0
              ) / processedResults.length
            : 0,
      });

      return processedResults;
    },
    []
  );

  // Complex validation function with high cyclomatic complexity
  const performComplexValidation = useCallback(
    (data: DataPoint[]): ValidationResult[] => {
      const results: ValidationResult[] = [];

      for (const dataPoint of data) {
        let isValid = true;
        const errors: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];
        let score = 100;

        // Validation Rule 1: Basic data integrity
        if (!dataPoint.id || dataPoint.id.trim() === "") {
          errors.push("Missing or empty ID");
          isValid = false;
          score -= 20;
        }

        if (typeof dataPoint.value !== "number") {
          errors.push("Value must be a number");
          isValid = false;
          score -= 25;
        } else {
          // Numerical validation sub-rules
          if (isNaN(dataPoint.value)) {
            errors.push("Value is NaN");
            isValid = false;
            score -= 30;
          } else if (!isFinite(dataPoint.value)) {
            errors.push("Value is infinite");
            isValid = false;
            score -= 30;
          } else {
            // Range validation based on category
            switch (dataPoint.category) {
              case "probability":
                if (dataPoint.value < 0 || dataPoint.value > 1) {
                  errors.push("Probability must be between 0 and 1");
                  isValid = false;
                  score -= 15;
                }
                break;
              case "percentage":
                if (dataPoint.value < 0 || dataPoint.value > 1) {
                  warnings.push(
                    "Percentage should be normalized between 0 and 1"
                  );
                  score -= 5;
                }
                break;
              case "high_priority":
                if (dataPoint.metadata.priority < 4) {
                  warnings.push(
                    "High priority items should have priority >= 4"
                  );
                  score -= 3;
                }
                break;
              case "error":
                if (dataPoint.processing.errors.length === 0) {
                  warnings.push("Error category but no actual errors recorded");
                  score -= 5;
                }
                break;
            }
          }
        }

        // Validation Rule 2: Metadata consistency
        if (!dataPoint.metadata) {
          errors.push("Missing metadata object");
          isValid = false;
          score -= 20;
        } else {
          if (
            dataPoint.metadata.priority < 1 ||
            dataPoint.metadata.priority > 5
          ) {
            errors.push("Priority must be between 1 and 5");
            isValid = false;
            score -= 10;
          }

          if (
            dataPoint.metadata.confidence < 0 ||
            dataPoint.metadata.confidence > 1
          ) {
            errors.push("Confidence must be between 0 and 1");
            isValid = false;
            score -= 10;
          } else {
            if (dataPoint.metadata.confidence < 0.3) {
              warnings.push("Low confidence score");
              score -= 8;
              recommendations.push("Consider data quality improvement");
            } else if (dataPoint.metadata.confidence > 0.9) {
              recommendations.push("High confidence - good data quality");
            }
          }

          if (!Array.isArray(dataPoint.metadata.tags)) {
            errors.push("Tags must be an array");
            isValid = false;
            score -= 5;
          } else {
            // Tag validation
            for (const tag of dataPoint.metadata.tags) {
              if (typeof tag !== "string") {
                warnings.push("All tags should be strings");
                score -= 2;
              } else {
                if (tag.length > 50) {
                  warnings.push("Tag too long (>50 characters)");
                  score -= 1;
                }
                if (tag.includes(" ")) {
                  recommendations.push(
                    "Consider using underscores instead of spaces in tags"
                  );
                }
              }
            }

            // Duplicate tag check
            const uniqueTags = new Set(dataPoint.metadata.tags);
            if (uniqueTags.size !== dataPoint.metadata.tags.length) {
              warnings.push("Duplicate tags detected");
              score -= 3;
            }
          }

          if (!Array.isArray(dataPoint.metadata.relations)) {
            errors.push("Relations must be an array");
            isValid = false;
            score -= 5;
          }

          if (!(dataPoint.metadata.timestamp instanceof Date)) {
            warnings.push("Timestamp should be a Date object");
            score -= 3;
          }
        }

        // Validation Rule 3: Processing stage validation
        if (!dataPoint.processing) {
          errors.push("Missing processing object");
          isValid = false;
          score -= 15;
        } else {
          if (
            typeof dataPoint.processing.stage !== "number" ||
            dataPoint.processing.stage < 0
          ) {
            errors.push("Invalid processing stage");
            isValid = false;
            score -= 10;
          }

          if (!Array.isArray(dataPoint.processing.errors)) {
            errors.push("Processing errors must be an array");
            isValid = false;
            score -= 5;
          } else {
            if (dataPoint.processing.errors.length > 5) {
              warnings.push("Too many processing errors");
              score -= 10;
              recommendations.push("Review data processing pipeline");
            }
          }

          if (!Array.isArray(dataPoint.processing.warnings)) {
            errors.push("Processing warnings must be an array");
            isValid = false;
            score -= 5;
          }

          if (!Array.isArray(dataPoint.processing.transformations)) {
            errors.push("Processing transformations must be an array");
            isValid = false;
            score -= 5;
          }
        }

        // Validation Rule 4: Category-specific validation
        const validCategories = [
          "unknown",
          "high_priority",
          "medium_priority",
          "low_priority",
          "information",
          "error",
          "probability",
          "percentage",
          "identifier",
          "measurement",
          "text_data",
        ];

        if (!validCategories.includes(dataPoint.category)) {
          warnings.push(`Unknown category: ${dataPoint.category}`);
          score -= 5;
          recommendations.push(
            "Use standard category names for better processing"
          );
        }

        // Validation Rule 5: Cross-field validation
        if (dataPoint.category === "error" && dataPoint.metadata.priority < 3) {
          warnings.push("Error items should typically have higher priority");
          score -= 3;
        }

        if (
          dataPoint.metadata.confidence > 0.8 &&
          dataPoint.processing.errors.length > 0
        ) {
          warnings.push("High confidence despite processing errors");
          score -= 5;
        }

        if (
          dataPoint.metadata.tags.includes("statistical_outlier") &&
          dataPoint.metadata.confidence > 0.7
        ) {
          recommendations.push("Consider reviewing outlier data for accuracy");
        }

        // Validation Rule 6: Performance and efficiency checks
        if (dataPoint.processing.transformations.length > 10) {
          warnings.push(
            "Excessive transformations may indicate processing inefficiency"
          );
          score -= 5;
        }

        if (dataPoint.metadata.relations.length > 20) {
          warnings.push("Too many relations may impact performance");
          score -= 3;
        }

        // Final score adjustments
        score = Math.max(0, Math.min(100, score));

        // Generate recommendations based on overall assessment
        if (score >= 90) {
          recommendations.push("Excellent data quality");
        } else if (score >= 70) {
          recommendations.push("Good data quality with minor issues");
        } else if (score >= 50) {
          recommendations.push("Moderate data quality - consider improvements");
        } else {
          recommendations.push(
            "Poor data quality - immediate attention required"
          );
        }

        results.push({
          isValid,
          errors,
          warnings,
          score,
          recommendations,
        });
      }

      return results;
    },
    []
  );

  // Complex filtering and sorting function
  const applyComplexFiltering = useCallback(
    (data: DataPoint[]): DataPoint[] => {
      let filteredData = [...data];

      // Multi-criteria filtering
      if (filterCriteria.minValue !== undefined) {
        filteredData = filteredData.filter(
          (d) => d.value >= filterCriteria.minValue
        );
      }

      if (filterCriteria.maxValue !== undefined) {
        filteredData = filteredData.filter(
          (d) => d.value <= filterCriteria.maxValue
        );
      }

      if (filterCriteria.categories && filterCriteria.categories.length > 0) {
        filteredData = filteredData.filter((d) =>
          filterCriteria.categories.includes(d.category)
        );
      }

      if (filterCriteria.minConfidence !== undefined) {
        filteredData = filteredData.filter(
          (d) => d.metadata.confidence >= filterCriteria.minConfidence
        );
      }

      if (
        filterCriteria.requiredTags &&
        filterCriteria.requiredTags.length > 0
      ) {
        filteredData = filteredData.filter((d) =>
          filterCriteria.requiredTags.every((tag: string) =>
            d.metadata.tags.includes(tag)
          )
        );
      }

      if (filterCriteria.excludeTags && filterCriteria.excludeTags.length > 0) {
        filteredData = filteredData.filter(
          (d) =>
            !filterCriteria.excludeTags.some((tag: string) =>
              d.metadata.tags.includes(tag)
            )
        );
      }

      // Complex sorting
      if (sortingOptions.primary) {
        filteredData.sort((a, b) => {
          let comparison = 0;

          switch (sortingOptions.primary) {
            case "value":
              comparison = a.value - b.value;
              break;
            case "confidence":
              comparison = a.metadata.confidence - b.metadata.confidence;
              break;
            case "priority":
              comparison = a.metadata.priority - b.metadata.priority;
              break;
            case "category":
              comparison = a.category.localeCompare(b.category);
              break;
            case "timestamp":
              comparison =
                a.metadata.timestamp.getTime() - b.metadata.timestamp.getTime();
              break;
          }

          if (sortingOptions.primaryDirection === "desc") {
            comparison = -comparison;
          }

          // Secondary sorting
          if (comparison === 0 && sortingOptions.secondary) {
            switch (sortingOptions.secondary) {
              case "value":
                comparison = a.value - b.value;
                break;
              case "confidence":
                comparison = a.metadata.confidence - b.metadata.confidence;
                break;
              case "priority":
                comparison = a.metadata.priority - b.metadata.priority;
                break;
            }

            if (sortingOptions.secondaryDirection === "desc") {
              comparison = -comparison;
            }
          }

          return comparison;
        });
      }

      return filteredData;
    },
    [filterCriteria, sortingOptions]
  );

  // Process data handler
  const handleProcessData = async () => {
    if (!rawData.trim()) return;

    setIsProcessing(true);
    try {
      const processed = await processComplexData(rawData);
      setProcessedData(processed);

      const validation = performComplexValidation(processed);
      setValidationResults(validation);
    } catch (error) {
      console.error("Processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Memoized filtered data
  const filteredData = useMemo(
    () => applyComplexFiltering(processedData),
    [processedData, applyComplexFiltering]
  );

  // Complex aggregation calculations
  const aggregationData = useMemo(() => {
    if (filteredData.length === 0) return {};

    const byCategory = filteredData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          count: 0,
          totalValue: 0,
          avgConfidence: 0,
          errors: 0,
          warnings: 0,
        };
      }

      acc[item.category].count++;
      acc[item.category].totalValue += item.value;
      acc[item.category].avgConfidence += item.metadata.confidence;
      acc[item.category].errors += item.processing.errors.length;
      acc[item.category].warnings += item.processing.warnings.length;

      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(byCategory).forEach((category) => {
      byCategory[category].avgValue =
        byCategory[category].totalValue / byCategory[category].count;
      byCategory[category].avgConfidence =
        byCategory[category].avgConfidence / byCategory[category].count;
    });

    return byCategory;
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#303030] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Complex Data Processor
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Demonstrates high cognitive complexity (30+) and cyclomatic complexity
          (40+) for SonarQube analysis
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Input Data</h2>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Enter data in JSON, CSV, or other formats..."
              className="min-h-[200px] bg-gray-700 text-white border-gray-600"
            />

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Min Value Filter"
                  onChange={(e) =>
                    setFilterCriteria((prev) => ({
                      ...prev,
                      minValue: parseFloat(e.target.value),
                    }))
                  }
                  className="bg-gray-700 text-white border-gray-600"
                />
                <Input
                  type="number"
                  placeholder="Max Value Filter"
                  onChange={(e) =>
                    setFilterCriteria((prev) => ({
                      ...prev,
                      maxValue: parseFloat(e.target.value),
                    }))
                  }
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>

              <Button
                onClick={handleProcessData}
                disabled={isProcessing || !rawData.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? "Processing..." : "Process Complex Data"}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Processing Results</h2>

            {processingStats.totalProcessed > 0 && (
              <div className="mb-4 p-4 bg-gray-700 rounded">
                <h3 className="font-semibold mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Processed: {processingStats.totalProcessed}</div>
                  <div>Errors: {processingStats.totalErrors}</div>
                  <div>Warnings: {processingStats.totalWarnings}</div>
                  <div>
                    Transformations: {processingStats.totalTransformations}
                  </div>
                  <div>Time: {processingStats.processingTime}ms</div>
                  <div>
                    Avg Confidence:{" "}
                    {(processingStats.averageConfidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto">
              {filteredData.map((item, index) => (
                <div key={item.id} className="mb-4 p-4 bg-gray-700 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{item.category}</span>
                    <span className="text-sm text-gray-300">
                      Confidence: {(item.metadata.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-lg">Value: {item.value}</div>
                  <div className="text-sm text-gray-400">
                    Priority: {item.metadata.priority}, Stage:{" "}
                    {item.processing.stage}
                  </div>
                  {item.metadata.tags.length > 0 && (
                    <div className="text-xs text-purple-300 mt-1">
                      Tags: {item.metadata.tags.join(", ")}
                    </div>
                  )}
                  {validationResults[index] && (
                    <div className="mt-2 text-xs">
                      <span
                        className={
                          validationResults[index].isValid
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        Validation Score: {validationResults[index].score}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aggregation Results */}
        {Object.keys(aggregationData).length > 0 && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">
              Category Aggregations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(aggregationData).map(
                ([category, data]: [string, any]) => (
                  <div key={category} className="bg-gray-700 p-4 rounded">
                    <h3 className="font-semibold mb-2 capitalize">
                      {category.replace("_", " ")}
                    </h3>
                    <div className="text-sm space-y-1">
                      <div>Count: {data.count}</div>
                      <div>Avg Value: {data.avgValue?.toFixed(2)}</div>
                      <div>
                        Avg Confidence: {(data.avgConfidence * 100).toFixed(1)}%
                      </div>
                      <div>Errors: {data.errors}</div>
                      <div>Warnings: {data.warnings}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
