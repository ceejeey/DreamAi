"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ComplexityPageInfo {
  path: string;
  title: string;
  description: string;
  cognitiveComplexity: number;
  cyclomaticComplexity: number;
  features: string[];
}

const complexityPages: ComplexityPageInfo[] = [
  {
    path: "/complexDataProcessor",
    title: "Complex Data Processor",
    description:
      "Advanced data processing pipeline with nested validation, transformation, and analysis algorithms",
    cognitiveComplexity: 35,
    cyclomaticComplexity: 42,
    features: [
      "Multi-format data parsing (JSON, CSV, delimited)",
      "Complex validation rules with dependencies",
      "Statistical outlier detection",
      "Cross-field validation and business rules",
      "Pattern detection (arithmetic/geometric sequences)",
      "Performance metrics and error tracking",
    ],
  },
  {
    path: "/complexFormValidator",
    title: "Complex Form Validator",
    description:
      "Enterprise-grade form validation system with conditional rules, cross-field dependencies, and async validation",
    cognitiveComplexity: 38,
    cyclomaticComplexity: 45,
    features: [
      "Multi-tier validation rules (required, pattern, custom, conditional)",
      "Password complexity analysis with security checks",
      "Async email deliverability validation",
      "Country-specific business rule validation",
      "Cross-field dependency validation",
      "Real-time validation with debouncing",
    ],
  },
  {
    path: "/complexSearchEngine",
    title: "Complex Search Engine",
    description:
      "Multi-modal search system with fuzzy matching, semantic search, and advanced filtering capabilities",
    cognitiveComplexity: 42,
    cyclomaticComplexity: 48,
    features: [
      "Hybrid search (exact, fuzzy, semantic)",
      "Inverted index with n-gram support",
      "Edit distance fuzzy matching",
      "Multi-criteria filtering and sorting",
      "Faceted search with aggregations",
      "Search suggestion engine",
    ],
  },
  {
    path: "/complexStateMachine",
    title: "Complex State Machine",
    description:
      "Advanced finite state machine with parallel states, conditional transitions, and complex event processing",
    cognitiveComplexity: 45,
    cyclomaticComplexity: 52,
    features: [
      "Hierarchical and parallel state support",
      "Guard conditions and custom validators",
      "Event queue with priority handling",
      "State timeouts and auto-transitions",
      "Action execution with error handling",
      "Comprehensive state analytics",
    ],
  },
  {
    path: "/complexVisualizationEngine",
    title: "Complex Visualization Engine",
    description:
      "High-performance data visualization system with multiple chart types, animations, and real-time rendering",
    cognitiveComplexity: 50,
    cyclomaticComplexity: 60,
    features: [
      "Multiple chart types (scatter, bubble, heatmap, network)",
      "SVG and Canvas rendering modes",
      "Spatial optimization (quadtree, LOD)",
      "Advanced data transformations and grouping",
      "Animation system with easing",
      "Interactive features (zoom, pan, selection)",
    ],
  },
];

export default function ComplexityNavigation() {
  const totalCognitiveComplexity = complexityPages.reduce(
    (sum, page) => sum + page.cognitiveComplexity,
    0
  );
  const totalCyclomaticComplexity = complexityPages.reduce(
    (sum, page) => sum + page.cyclomaticComplexity,
    0
  );
  const averageCognitiveComplexity =
    totalCognitiveComplexity / complexityPages.length;
  const averageCyclomaticComplexity =
    totalCyclomaticComplexity / complexityPages.length;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-center">
          SonarQube Complexity Demonstration
        </h2>
        <p className="text-gray-300 text-center mb-6">
          This project demonstrates various SonarQube use cases by implementing
          highly complex functions that exceed recommended cognitive and
          cyclomatic complexity thresholds.
        </p>

        {/* Complexity Summary */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            Project Complexity Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">
                {totalCognitiveComplexity}
              </div>
              <div className="text-sm text-gray-400">
                Total Cognitive Complexity
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {totalCyclomaticComplexity}
              </div>
              <div className="text-sm text-gray-400">
                Total Cyclomatic Complexity
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {averageCognitiveComplexity.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">
                Avg Cognitive Complexity
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {averageCyclomaticComplexity.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">
                Avg Cyclomatic Complexity
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400 text-center">
            <p>
              ⚠️ SonarQube recommended thresholds: Cognitive Complexity ≤ 15,
              Cyclomatic Complexity ≤ 10
            </p>
            <p>
              🎯 This project intentionally exceeds these limits to demonstrate
              SonarQube alerts and analysis
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {complexityPages.map((page, index) => (
          <div
            key={page.path}
            className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-xl font-semibold text-white mr-4">
                    {page.title}
                  </h3>
                  <div className="flex space-x-3">
                    <span className="px-2 py-1 bg-red-600 rounded text-xs font-medium">
                      CC: {page.cognitiveComplexity}
                    </span>
                    <span className="px-2 py-1 bg-orange-600 rounded text-xs font-medium">
                      CYC: {page.cyclomaticComplexity}
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 mb-4">{page.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-2">
                    Key Features:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {page.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="text-sm text-gray-400 flex items-start"
                      >
                        <span className="text-green-400 mr-2">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:ml-6 mt-4 lg:mt-0">
                <Link href={page.path}>
                  <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                    Explore Component
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SonarQube Integration Notes */}
      <div className="mt-8 bg-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">
          SonarQube Integration Notes
        </h3>
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            <strong>🔍 Analysis Setup:</strong> Run{" "}
            <code className="bg-gray-800 px-2 py-1 rounded">sonar-scanner</code>{" "}
            or integrate with your CI/CD pipeline to analyze this codebase.
          </p>
          <p>
            <strong>📊 Expected Issues:</strong> SonarQube will flag high
            cognitive complexity, cyclomatic complexity, long methods, and
            nested conditionals in the components above.
          </p>
          <p>
            <strong>🎯 Learning Objectives:</strong> This project helps
            understand how SonarQube identifies code smells, maintainability
            issues, and complexity anti-patterns in real-world scenarios.
          </p>
          <p>
            <strong>✅ Best Practices:</strong> In production code, refactor
            these functions into smaller, focused methods to improve
            maintainability and reduce complexity scores.
          </p>
        </div>
      </div>
    </div>
  );
}
