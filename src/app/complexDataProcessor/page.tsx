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

        // Complex
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

  // Ultra-complex function with extremely high cyclomatic complexity (70+)
  const ultraComplexDataAnalyzer = useCallback(
    (
      data: DataPoint[],
      analysisType: string,
      parameters: any,
      mode: string,
      options: any
    ): any => {
      let result: any = {
        primary: {},
        secondary: {},
        tertiary: {},
        metrics: {},
        recommendations: [],
        alerts: [],
      };

      // Initial parameter validation with multiple nested conditions (15+ decision points)
      if (!data || !Array.isArray(data)) {
        if (typeof data === "object" && data !== null) {
          if (Object.keys(data).length === 0) {
            return { error: "Empty object provided instead of array" };
          } else if (Object.prototype.hasOwnProperty.call(data, "length")) {
            return { error: "Array-like object but not proper array" };
          } else {
            data = [data as any];
          }
        } else if (typeof data === "string") {
          const dataStr = data as string;
          if (dataStr.trim() === "") {
            return { error: "Empty string provided" };
          } else if (dataStr.includes(",")) {
            return { error: "CSV string detected, requires parsing" };
          } else {
            return { error: "Unparseable string data" };
          }
        } else {
          return { error: "Invalid data type provided" };
        }
      }

      // Analysis type routing with extensive branching (50+ decision points)
      switch (analysisType) {
        case "statistical":
          if (mode === "basic") {
            if (parameters.includeOutliers) {
              if (parameters.outlierMethod === "zscore") {
                if (parameters.zThreshold) {
                  if (parameters.zThreshold > 3) {
                    result.primary.outlierDetection = "conservative";
                  } else if (parameters.zThreshold > 2) {
                    result.primary.outlierDetection = "moderate";
                  } else if (parameters.zThreshold > 1) {
                    result.primary.outlierDetection = "liberal";
                  } else {
                    result.primary.outlierDetection = "minimal";
                  }
                } else {
                  result.primary.outlierDetection = "default";
                }
              } else if (parameters.outlierMethod === "iqr") {
                if (parameters.iqrMultiplier) {
                  if (parameters.iqrMultiplier > 2) {
                    result.primary.outlierDetection = "strict_iqr";
                  } else if (parameters.iqrMultiplier > 1.5) {
                    result.primary.outlierDetection = "standard_iqr";
                  } else {
                    result.primary.outlierDetection = "loose_iqr";
                  }
                } else {
                  result.primary.outlierDetection = "default_iqr";
                }
              } else if (parameters.outlierMethod === "modified_zscore") {
                if (parameters.medianThreshold) {
                  if (parameters.medianThreshold > 3.5) {
                    result.primary.outlierDetection = "strict_modified";
                  } else {
                    result.primary.outlierDetection = "standard_modified";
                  }
                } else {
                  result.primary.outlierDetection = "default_modified";
                }
              } else {
                result.primary.outlierDetection = "unknown_method";
              }
            } else {
              result.primary.outlierDetection = "disabled";
            }

            // Distribution analysis with nested conditions
            if (parameters.analyzeDistribution) {
              const values = data.map((d) => d.value);
              if (values.length > 0) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance =
                  values.reduce(
                    (sum, val) => sum + Math.pow(val - mean, 2),
                    0
                  ) / values.length;
                const stdDev = Math.sqrt(variance);

                if (stdDev === 0) {
                  result.secondary.distribution = "constant";
                } else if (stdDev < mean * 0.1) {
                  result.secondary.distribution = "low_variance";
                } else if (stdDev < mean * 0.3) {
                  result.secondary.distribution = "moderate_variance";
                } else if (stdDev < mean * 0.6) {
                  result.secondary.distribution = "high_variance";
                } else {
                  result.secondary.distribution = "extreme_variance";
                }

                // Skewness analysis with multiple conditions
                const skewness =
                  values.reduce(
                    (sum, val) => sum + Math.pow((val - mean) / stdDev, 3),
                    0
                  ) / values.length;

                if (Math.abs(skewness) < 0.5) {
                  result.secondary.skewness = "symmetric";
                } else if (Math.abs(skewness) < 1) {
                  result.secondary.skewness = "moderately_skewed";
                } else {
                  result.secondary.skewness = "highly_skewed";
                }

                if (skewness > 0) {
                  result.secondary.skewDirection = "right_skewed";
                } else if (skewness < 0) {
                  result.secondary.skewDirection = "left_skewed";
                } else {
                  result.secondary.skewDirection = "no_skew";
                }
              }
            }
          } else if (mode === "advanced") {
            // Advanced statistical analysis with more branching
            if (parameters.correlationAnalysis) {
              if (parameters.correlationMethod === "pearson") {
                if (data.length >= 2) {
                  for (let i = 0; i < data.length - 1; i++) {
                    for (let j = i + 1; j < data.length; j++) {
                      const correlation = Math.random(); // Simplified
                      if (correlation > 0.8) {
                        result.tertiary.strongCorrelations =
                          result.tertiary.strongCorrelations || [];
                        result.tertiary.strongCorrelations.push({
                          pair: [i, j],
                          strength: "very_strong",
                        });
                      } else if (correlation > 0.6) {
                        result.tertiary.moderateCorrelations =
                          result.tertiary.moderateCorrelations || [];
                        result.tertiary.moderateCorrelations.push({
                          pair: [i, j],
                          strength: "strong",
                        });
                      } else if (correlation > 0.4) {
                        result.tertiary.weakCorrelations =
                          result.tertiary.weakCorrelations || [];
                        result.tertiary.weakCorrelations.push({
                          pair: [i, j],
                          strength: "moderate",
                        });
                      }
                    }
                  }
                }
              } else if (parameters.correlationMethod === "spearman") {
                result.tertiary.correlationMethod = "rank_based";
              } else if (parameters.correlationMethod === "kendall") {
                result.tertiary.correlationMethod = "tau_based";
              }
            }

            if (parameters.timeSeriesAnalysis) {
              if (parameters.trendAnalysis) {
                if (parameters.trendMethod === "linear") {
                  result.tertiary.trend = "linear_regression";
                } else if (parameters.trendMethod === "polynomial") {
                  if (parameters.polynomialDegree) {
                    if (parameters.polynomialDegree === 2) {
                      result.tertiary.trend = "quadratic";
                    } else if (parameters.polynomialDegree === 3) {
                      result.tertiary.trend = "cubic";
                    } else if (parameters.polynomialDegree > 3) {
                      result.tertiary.trend = "high_order_polynomial";
                    } else {
                      result.tertiary.trend = "linear_fallback";
                    }
                  } else {
                    result.tertiary.trend = "polynomial_unspecified";
                  }
                } else if (parameters.trendMethod === "exponential") {
                  result.tertiary.trend = "exponential_growth";
                } else if (parameters.trendMethod === "logarithmic") {
                  result.tertiary.trend = "logarithmic_growth";
                } else {
                  result.tertiary.trend = "unknown_trend";
                }
              }
            }
          } else if (mode === "expert") {
            if (parameters.machineLearningAnalysis) {
              if (parameters.clusteringAnalysis) {
                if (parameters.clusteringMethod === "kmeans") {
                  if (parameters.numClusters) {
                    if (parameters.numClusters <= 2) {
                      result.metrics.clustering = "binary_classification";
                    } else if (parameters.numClusters <= 5) {
                      result.metrics.clustering = "few_clusters";
                    } else if (parameters.numClusters <= 10) {
                      result.metrics.clustering = "moderate_clusters";
                    } else {
                      result.metrics.clustering = "many_clusters";
                    }
                  } else {
                    result.metrics.clustering = "auto_cluster_count";
                  }
                } else if (parameters.clusteringMethod === "hierarchical") {
                  if (parameters.linkageCriteria) {
                    if (parameters.linkageCriteria === "ward") {
                      result.metrics.clustering = "ward_linkage";
                    } else if (parameters.linkageCriteria === "complete") {
                      result.metrics.clustering = "complete_linkage";
                    } else if (parameters.linkageCriteria === "average") {
                      result.metrics.clustering = "average_linkage";
                    } else if (parameters.linkageCriteria === "single") {
                      result.metrics.clustering = "single_linkage";
                    }
                  }
                } else if (parameters.clusteringMethod === "dbscan") {
                  if (parameters.eps && parameters.minSamples) {
                    if (parameters.eps < 0.1) {
                      result.metrics.clustering = "tight_dbscan";
                    } else if (parameters.eps < 0.5) {
                      result.metrics.clustering = "moderate_dbscan";
                    } else {
                      result.metrics.clustering = "loose_dbscan";
                    }
                  }
                }
              }

              if (parameters.anomalyDetection) {
                if (parameters.anomalyMethod === "isolation_forest") {
                  if (parameters.contamination) {
                    if (parameters.contamination < 0.01) {
                      result.metrics.anomalies = "very_rare";
                    } else if (parameters.contamination < 0.05) {
                      result.metrics.anomalies = "rare";
                    } else if (parameters.contamination < 0.1) {
                      result.metrics.anomalies = "uncommon";
                    } else {
                      result.metrics.anomalies = "common";
                    }
                  }
                } else if (parameters.anomalyMethod === "one_class_svm") {
                  if (parameters.nu) {
                    if (parameters.nu < 0.01) {
                      result.metrics.anomalies = "strict_svm";
                    } else if (parameters.nu < 0.05) {
                      result.metrics.anomalies = "moderate_svm";
                    } else {
                      result.metrics.anomalies = "lenient_svm";
                    }
                  }
                } else if (
                  parameters.anomalyMethod === "local_outlier_factor"
                ) {
                  if (parameters.neighbors) {
                    if (parameters.neighbors < 5) {
                      result.metrics.anomalies = "local_focus";
                    } else if (parameters.neighbors < 20) {
                      result.metrics.anomalies = "neighborhood_focus";
                    } else {
                      result.metrics.anomalies = "global_focus";
                    }
                  }
                }
              }
            }
          }
          break;

        case "categorical":
          if (data.length > 0) {
            const categories = data.map((d) => d.category);
            const categoryCounts = categories.reduce((acc, cat) => {
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {} as any);

            const uniqueCategories = Object.keys(categoryCounts);
            if (uniqueCategories.length === 1) {
              result.primary.diversity = "homogeneous";
            } else if (uniqueCategories.length === 2) {
              result.primary.diversity = "binary";
            } else if (uniqueCategories.length <= 5) {
              result.primary.diversity = "low_diversity";
            } else if (uniqueCategories.length <= 10) {
              result.primary.diversity = "moderate_diversity";
            } else {
              result.primary.diversity = "high_diversity";
            }

            // Dominance analysis
            const maxCount = Math.max(
              ...Object.values(categoryCounts).map((v) => v as number)
            );
            const dominanceRatio = maxCount / data.length;

            if (dominanceRatio > 0.8) {
              result.secondary.dominance = "single_dominant";
            } else if (dominanceRatio > 0.6) {
              result.secondary.dominance = "majority_dominant";
            } else if (dominanceRatio > 0.4) {
              result.secondary.dominance = "plurality_dominant";
            } else {
              result.secondary.dominance = "balanced";
            }
          }
          break;

        case "temporal":
          if (parameters.timeWindow) {
            if (parameters.timeWindow === "minute") {
              if (options.aggregation === "sum") {
                result.primary.temporalAggregation = "minute_sum";
              } else if (options.aggregation === "average") {
                result.primary.temporalAggregation = "minute_average";
              } else if (options.aggregation === "max") {
                result.primary.temporalAggregation = "minute_max";
              } else if (options.aggregation === "min") {
                result.primary.temporalAggregation = "minute_min";
              } else {
                result.primary.temporalAggregation = "minute_default";
              }
            } else if (parameters.timeWindow === "hour") {
              if (options.smoothing) {
                if (options.smoothing === "moving_average") {
                  if (options.windowSize) {
                    if (options.windowSize < 3) {
                      result.secondary.smoothing = "minimal_smoothing";
                    } else if (options.windowSize < 7) {
                      result.secondary.smoothing = "light_smoothing";
                    } else if (options.windowSize < 15) {
                      result.secondary.smoothing = "moderate_smoothing";
                    } else {
                      result.secondary.smoothing = "heavy_smoothing";
                    }
                  } else {
                    result.secondary.smoothing = "default_smoothing";
                  }
                } else if (options.smoothing === "exponential") {
                  if (options.alpha) {
                    if (options.alpha < 0.1) {
                      result.secondary.smoothing = "conservative_exponential";
                    } else if (options.alpha < 0.3) {
                      result.secondary.smoothing = "moderate_exponential";
                    } else if (options.alpha < 0.7) {
                      result.secondary.smoothing = "aggressive_exponential";
                    } else {
                      result.secondary.smoothing =
                        "very_aggressive_exponential";
                    }
                  }
                } else if (options.smoothing === "savitzky_golay") {
                  result.secondary.smoothing = "polynomial_smoothing";
                }
              }
              result.primary.temporalAggregation = "hourly";
            } else if (parameters.timeWindow === "day") {
              result.primary.temporalAggregation = "daily";
            } else if (parameters.timeWindow === "week") {
              result.primary.temporalAggregation = "weekly";
            } else if (parameters.timeWindow === "month") {
              result.primary.temporalAggregation = "monthly";
            } else if (parameters.timeWindow === "year") {
              result.primary.temporalAggregation = "yearly";
            }
          }
          break;

        case "quality":
          if (parameters.qualityMetrics) {
            if (parameters.qualityMetrics.includes("completeness")) {
              const completenessScore =
                data.filter((d) => d.value !== null && d.value !== undefined)
                  .length / data.length;

              if (completenessScore === 1) {
                result.primary.completeness = "perfect";
              } else if (completenessScore > 0.95) {
                result.primary.completeness = "excellent";
              } else if (completenessScore > 0.9) {
                result.primary.completeness = "good";
              } else if (completenessScore > 0.8) {
                result.primary.completeness = "fair";
              } else if (completenessScore > 0.7) {
                result.primary.completeness = "poor";
              } else {
                result.primary.completeness = "very_poor";
              }
            }

            if (parameters.qualityMetrics.includes("consistency")) {
              const categoryConsistency = data.every(
                (d) => typeof d.category === "string" && d.category.length > 0
              );
              const valueConsistency = data.every(
                (d) => typeof d.value === "number" && !isNaN(d.value)
              );

              if (categoryConsistency && valueConsistency) {
                result.secondary.consistency = "fully_consistent";
              } else if (categoryConsistency || valueConsistency) {
                result.secondary.consistency = "partially_consistent";
              } else {
                result.secondary.consistency = "inconsistent";
              }
            }

            if (parameters.qualityMetrics.includes("accuracy")) {
              const confidenceScores = data.map((d) => d.metadata.confidence);
              const avgConfidence =
                confidenceScores.reduce((sum, conf) => sum + conf, 0) /
                confidenceScores.length;

              if (avgConfidence > 0.9) {
                result.tertiary.accuracy = "very_high";
              } else if (avgConfidence > 0.8) {
                result.tertiary.accuracy = "high";
              } else if (avgConfidence > 0.7) {
                result.tertiary.accuracy = "moderate";
              } else if (avgConfidence > 0.6) {
                result.tertiary.accuracy = "low";
              } else {
                result.tertiary.accuracy = "very_low";
              }
            }
          }
          break;

        case "performance":
          if (parameters.performanceMetrics) {
            if (parameters.performanceMetrics.includes("throughput")) {
              const processingTimes = data.map((d) => d.processing.stage);
              const avgProcessingStage =
                processingTimes.reduce((sum, stage) => sum + stage, 0) /
                processingTimes.length;

              if (avgProcessingStage >= 5) {
                result.primary.throughput = "fully_processed";
              } else if (avgProcessingStage >= 4) {
                result.primary.throughput = "mostly_processed";
              } else if (avgProcessingStage >= 3) {
                result.primary.throughput = "partially_processed";
              } else if (avgProcessingStage >= 2) {
                result.primary.throughput = "minimally_processed";
              } else {
                result.primary.throughput = "unprocessed";
              }
            }

            if (parameters.performanceMetrics.includes("error_rate")) {
              const totalErrors = data.reduce(
                (sum, d) => sum + d.processing.errors.length,
                0
              );
              const errorRate = totalErrors / data.length;

              if (errorRate === 0) {
                result.secondary.errorRate = "error_free";
              } else if (errorRate < 0.01) {
                result.secondary.errorRate = "very_low_errors";
              } else if (errorRate < 0.05) {
                result.secondary.errorRate = "low_errors";
              } else if (errorRate < 0.1) {
                result.secondary.errorRate = "moderate_errors";
              } else if (errorRate < 0.2) {
                result.secondary.errorRate = "high_errors";
              } else {
                result.secondary.errorRate = "critical_errors";
              }
            }

            if (parameters.performanceMetrics.includes("resource_usage")) {
              const transformationCounts = data.map(
                (d) => d.processing.transformations.length
              );
              const avgTransformations =
                transformationCounts.reduce((sum, count) => sum + count, 0) /
                transformationCounts.length;

              if (avgTransformations < 1) {
                result.tertiary.resourceUsage = "minimal";
              } else if (avgTransformations < 3) {
                result.tertiary.resourceUsage = "light";
              } else if (avgTransformations < 5) {
                result.tertiary.resourceUsage = "moderate";
              } else if (avgTransformations < 8) {
                result.tertiary.resourceUsage = "heavy";
              } else {
                result.tertiary.resourceUsage = "intensive";
              }
            }
          }
          break;

        default:
          result.error = "Unknown analysis type";
          return result;
      }

      // Generate comprehensive recommendations with complex branching logic (20+ decision points)
      if (
        result.primary.completeness === "poor" ||
        result.primary.completeness === "very_poor"
      ) {
        result.recommendations.push(
          "Improve data collection processes to reduce missing values"
        );
        result.alerts.push("Data completeness below acceptable threshold");

        if (result.secondary.consistency === "inconsistent") {
          result.alerts.push(
            "Critical: Both completeness and consistency issues detected"
          );
        }
      }

      if (
        result.secondary.errorRate === "high_errors" ||
        result.secondary.errorRate === "critical_errors"
      ) {
        result.recommendations.push(
          "Review and optimize data processing pipeline"
        );
        result.alerts.push(
          "High error rate detected - immediate attention required"
        );

        if (
          result.primary.throughput === "unprocessed" ||
          result.primary.throughput === "minimally_processed"
        ) {
          result.alerts.push(
            "Critical: High errors with low processing completion"
          );
        }
      }

      if (
        result.tertiary.accuracy === "low" ||
        result.tertiary.accuracy === "very_low"
      ) {
        result.recommendations.push("Implement additional validation rules");
        result.recommendations.push("Consider data source verification");
      }

      if (result.primary.diversity === "homogeneous") {
        result.recommendations.push("Consider diversifying data sources");
      } else if (result.primary.diversity === "high_diversity") {
        result.recommendations.push(
          "Monitor for potential data quality issues due to high diversity"
        );

        if (result.secondary.consistency === "inconsistent") {
          result.alerts.push("High diversity with consistency issues");
        }
      }

      if (result.secondary.distribution === "extreme_variance") {
        result.recommendations.push("Investigate causes of extreme variance");
        result.alerts.push("Unusual distribution pattern detected");
      }

      if (
        result.tertiary.resourceUsage === "heavy" ||
        result.tertiary.resourceUsage === "intensive"
      ) {
        result.recommendations.push(
          "Optimize processing algorithms for better performance"
        );
      }

      // Final scoring with multiple conditions
      let overallScore = 100;

      if (result.alerts.length > 0) {
        overallScore -= result.alerts.length * 15;

        if (result.alerts.length > 3) {
          overallScore -= (result.alerts.length - 3) * 10;
        }
      }

      if (result.recommendations.length > 3) {
        overallScore -= (result.recommendations.length - 3) * 5;
      }

      result.metrics.overallScore = Math.max(0, overallScore);

      if (result.metrics.overallScore >= 90) {
        result.metrics.classification = "excellent";
      } else if (result.metrics.overallScore >= 80) {
        result.metrics.classification = "good";
      } else if (result.metrics.overallScore >= 70) {
        result.metrics.classification = "acceptable";
      } else if (result.metrics.overallScore >= 60) {
        result.metrics.classification = "needs_improvement";
      } else {
        result.metrics.classification = "critical";
      }

      return result;
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#303030] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Complex Data Processor
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Demonstrates ultra-high cognitive complexity (50+) and cyclomatic
          complexity (70+) for SonarQube analysis, including the
          ultraComplexDataAnalyzer function
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
                    setFilterCriteria((prev: any) => ({
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
                    setFilterCriteria((prev: any) => ({
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
