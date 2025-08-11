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

interface DataPoint {
  id: string;
  x: number;
  y: number;
  z?: number;
  value: number;
  category: string;
  timestamp: Date;
  metadata: {
    source: string;
    confidence: number;
    tags: string[];
    relations: string[];
  };
}

interface ChartConfiguration {
  type:
    | "scatter"
    | "line"
    | "bar"
    | "heatmap"
    | "bubble"
    | "radar"
    | "tree"
    | "network";
  dimensions: {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
  };
  scales: {
    x: {
      type: "linear" | "time" | "ordinal";
      domain: [number, number] | string[];
      range: [number, number];
    };
    y: {
      type: "linear" | "time" | "ordinal";
      domain: [number, number] | string[];
      range: [number, number];
    };
    color: { type: "categorical" | "sequential" | "diverging"; scheme: string };
    size: { type: "linear"; domain: [number, number]; range: [number, number] };
  };
  axes: {
    x: { show: boolean; label: string; tickCount: number; format: string };
    y: { show: boolean; label: string; tickCount: number; format: string };
  };
  interactions: {
    zoom: boolean;
    pan: boolean;
    brush: boolean;
    tooltip: boolean;
    selection: boolean;
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
    stagger: number;
  };
  filters: {
    category: string[];
    dateRange: { start: Date | null; end: Date | null };
    valueRange: { min: number | null; max: number | null };
  };
  grouping: {
    enabled: boolean;
    field: string;
    aggregation: "sum" | "avg" | "count" | "max" | "min";
  };
}

interface VisualizationState {
  data: DataPoint[];
  filteredData: DataPoint[];
  processedData: any[];
  selectedPoints: string[];
  hoveredPoint: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  renderingStats: {
    pointsRendered: number;
    renderTime: number;
    lastUpdate: Date;
    frameRate: number;
  };
}

interface RenderingContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  svg: SVGSVGElement | null;
  animationFrame: number | null;
  lastFrameTime: number;
  renderQueue: any[];
  optimizations: {
    culling: boolean;
    batching: boolean;
    levelOfDetail: boolean;
    quadTree: boolean;
  };
}

export default function ComplexVisualizationEngine() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [config, setConfig] = useState<ChartConfiguration>({
    type: "scatter",
    dimensions: {
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 40, left: 50 },
    },
    scales: {
      x: { type: "linear", domain: [0, 100], range: [0, 800] },
      y: { type: "linear", domain: [0, 100], range: [600, 0] },
      color: { type: "categorical", scheme: "category10" },
      size: { type: "linear", domain: [1, 100], range: [2, 20] },
    },
    axes: {
      x: { show: true, label: "X Axis", tickCount: 10, format: ".1f" },
      y: { show: true, label: "Y Axis", tickCount: 10, format: ".1f" },
    },
    interactions: {
      zoom: true,
      pan: true,
      brush: true,
      tooltip: true,
      selection: true,
    },
    animations: {
      enabled: true,
      duration: 500,
      easing: "easeInOut",
      stagger: 50,
    },
    filters: {
      category: [],
      dateRange: { start: null, end: null },
      valueRange: { min: null, max: null },
    },
    grouping: {
      enabled: false,
      field: "category",
      aggregation: "avg",
    },
  });

  const [vizState, setVizState] = useState<VisualizationState>({
    data: [],
    filteredData: [],
    processedData: [],
    selectedPoints: [],
    hoveredPoint: null,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    renderingStats: {
      pointsRendered: 0,
      renderTime: 0,
      lastUpdate: new Date(),
      frameRate: 0,
    },
  });

  const [renderingContext, setRenderingContext] = useState<RenderingContext>({
    canvas: null,
    ctx: null,
    svg: null,
    animationFrame: null,
    lastFrameTime: 0,
    renderQueue: [],
    optimizations: {
      culling: true,
      batching: true,
      levelOfDetail: true,
      quadTree: true,
    },
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<
    "quality" | "balanced" | "performance"
  >("balanced");

  // Initialize sample data with complex relationships
  useEffect(() => {
    const generateComplexDataset = () => {
      const categories = [
        "Technology",
        "Science",
        "Business",
        "Healthcare",
        "Education",
        "Entertainment",
      ];
      const sources = [
        "API",
        "Database",
        "Manual",
        "Import",
        "Generated",
        "Calculated",
      ];
      const dataPoints: DataPoint[] = [];

      // Generate base dataset with mathematical relationships
      for (let i = 0; i < 1000; i++) {
        const category =
          categories[Math.floor(Math.random() * categories.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];

        // Create mathematical relationships between variables
        const baseX = Math.random() * 100;
        const baseY = Math.random() * 100;

        // Add some correlation patterns
        let x = baseX;
        let y = baseY;
        let value = Math.random() * 100;

        if (category === "Technology") {
          // Technology points tend to cluster in high x, high y
          x = baseX * 0.3 + 70 + Math.random() * 20;
          y = baseY * 0.3 + 70 + Math.random() * 20;
          value = 50 + Math.random() * 50;
        } else if (category === "Science") {
          // Science points follow a logarithmic pattern
          x = Math.log10(baseX + 1) * 20 + Math.random() * 10;
          y = Math.sin(baseX * 0.1) * 20 + 50 + Math.random() * 10;
          value = Math.abs(Math.sin(baseX * 0.05)) * 100;
        } else if (category === "Business") {
          // Business points follow economic cycles
          const cycle = Math.sin(i * 0.01) * 30;
          x = baseX + cycle;
          y = baseY + cycle * 0.5;
          value = 30 + Math.abs(cycle) + Math.random() * 20;
        } else if (category === "Healthcare") {
          // Healthcare data with outliers and clusters
          if (Math.random() < 0.1) {
            // 10% outliers
            x = Math.random() * 100;
            y = Math.random() * 100;
            value = Math.random() * 100;
          } else {
            // Clustered data
            const clusterCenter = {
              x: 25 + Math.random() * 50,
              y: 25 + Math.random() * 50,
            };
            x = clusterCenter.x + (Math.random() - 0.5) * 20;
            y = clusterCenter.y + (Math.random() - 0.5) * 20;
            value = 40 + Math.random() * 30;
          }
        }

        const point: DataPoint = {
          id: `point_${i}`,
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          z: Math.random() * 50,
          value: Math.max(0, Math.min(100, value)),
          category,
          timestamp: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          metadata: {
            source,
            confidence: Math.random(),
            tags: [
              `tag_${Math.floor(Math.random() * 20)}`,
              `priority_${Math.floor(Math.random() * 5)}`,
              category.toLowerCase(),
            ],
            relations: [],
          },
        };

        // Add relationships between points
        if (i > 0 && Math.random() < 0.3) {
          const relatedIndex = Math.floor(Math.random() * i);
          point.metadata.relations.push(`point_${relatedIndex}`);
          if (dataPoints[relatedIndex]) {
            dataPoints[relatedIndex].metadata.relations.push(point.id);
          }
        }

        dataPoints.push(point);
      }

      setData(dataPoints);
      setVizState((prev) => ({
        ...prev,
        data: dataPoints,
        filteredData: dataPoints,
      }));
    };

    generateComplexDataset();
  }, []);

  // Complex data processing pipeline with extremely high cognitive complexity
  const processDataForVisualization = useCallback(
    async (
      rawData: DataPoint[],
      configuration: ChartConfiguration,
      state: VisualizationState
    ): Promise<any[]> => {
      const startTime = Date.now();
      setIsRendering(true);

      try {
        let processedData = [...rawData];

        // Phase 1: Advanced Filtering
        if (configuration.filters.category.length > 0) {
          processedData = processedData.filter((point) =>
            configuration.filters.category.includes(point.category)
          );
        }

        if (
          configuration.filters.dateRange.start ||
          configuration.filters.dateRange.end
        ) {
          processedData = processedData.filter((point) => {
            const pointDate = point.timestamp;
            if (
              configuration.filters.dateRange.start &&
              pointDate < configuration.filters.dateRange.start
            ) {
              return false;
            }
            if (
              configuration.filters.dateRange.end &&
              pointDate > configuration.filters.dateRange.end
            ) {
              return false;
            }
            return true;
          });
        }

        if (
          configuration.filters.valueRange.min !== null ||
          configuration.filters.valueRange.max !== null
        ) {
          processedData = processedData.filter((point) => {
            if (
              configuration.filters.valueRange.min !== null &&
              point.value < configuration.filters.valueRange.min
            ) {
              return false;
            }
            if (
              configuration.filters.valueRange.max !== null &&
              point.value > configuration.filters.valueRange.max
            ) {
              return false;
            }
            return true;
          });
        }

        // Phase 2: Data Transformation and Scaling
        const scaledData = processedData.map((point) => {
          let scaledX: number, scaledY: number;

          // Apply scale transformations
          switch (configuration.scales.x.type) {
            case "linear":
              const xDomain = configuration.scales.x.domain as [number, number];
              const xRange = configuration.scales.x.range;
              scaledX =
                ((point.x - xDomain[0]) / (xDomain[1] - xDomain[0])) *
                  (xRange[1] - xRange[0]) +
                xRange[0];
              break;
            case "time":
              // Time scale transformation
              const timeDomain = configuration.scales.x.domain as [
                number,
                number
              ];
              const timeRange = configuration.scales.x.range;
              const timeValue = point.timestamp.getTime();
              scaledX =
                ((timeValue - timeDomain[0]) /
                  (timeDomain[1] - timeDomain[0])) *
                  (timeRange[1] - timeRange[0]) +
                timeRange[0];
              break;
            default:
              scaledX = point.x;
          }

          switch (configuration.scales.y.type) {
            case "linear":
              const yDomain = configuration.scales.y.domain as [number, number];
              const yRange = configuration.scales.y.range;
              scaledY =
                ((point.y - yDomain[0]) / (yDomain[1] - yDomain[0])) *
                  (yRange[1] - yRange[0]) +
                yRange[0];
              break;
            default:
              scaledY = point.y;
          }

          // Size scaling
          const sizeDomain = configuration.scales.size.domain;
          const sizeRange = configuration.scales.size.range;
          const scaledSize =
            ((point.value - sizeDomain[0]) / (sizeDomain[1] - sizeDomain[0])) *
              (sizeRange[1] - sizeRange[0]) +
            sizeRange[0];

          return {
            ...point,
            scaledX,
            scaledY,
            scaledSize: Math.max(
              sizeRange[0],
              Math.min(sizeRange[1], scaledSize)
            ),
            color: getColorForCategory(
              point.category,
              configuration.scales.color
            ),
            opacity: point.metadata.confidence,
          };
        });

        // Phase 3: Grouping and Aggregation
        let aggregatedData = scaledData;
        if (configuration.grouping.enabled) {
          const groups = new Map<string, any[]>();

          scaledData.forEach((point) => {
            let groupKey: string;
            switch (configuration.grouping.field) {
              case "category":
                groupKey = point.category;
                break;
              case "source":
                groupKey = point.metadata.source;
                break;
              case "timeWindow":
                groupKey = new Date(
                  point.timestamp.getFullYear(),
                  point.timestamp.getMonth()
                ).toISOString();
                break;
              default:
                groupKey = "default";
            }

            if (!groups.has(groupKey)) {
              groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(point);
          });

          aggregatedData = Array.from(groups.entries()).map(
            ([groupKey, groupPoints]) => {
              let aggregatedValue: number;
              let aggregatedX: number;
              let aggregatedY: number;

              switch (configuration.grouping.aggregation) {
                case "sum":
                  aggregatedValue = groupPoints.reduce(
                    (sum, p) => sum + p.value,
                    0
                  );
                  aggregatedX = groupPoints.reduce(
                    (sum, p) => sum + p.scaledX,
                    0
                  );
                  aggregatedY = groupPoints.reduce(
                    (sum, p) => sum + p.scaledY,
                    0
                  );
                  break;
                case "avg":
                  aggregatedValue =
                    groupPoints.reduce((sum, p) => sum + p.value, 0) /
                    groupPoints.length;
                  aggregatedX =
                    groupPoints.reduce((sum, p) => sum + p.scaledX, 0) /
                    groupPoints.length;
                  aggregatedY =
                    groupPoints.reduce((sum, p) => sum + p.scaledY, 0) /
                    groupPoints.length;
                  break;
                case "count":
                  aggregatedValue = groupPoints.length;
                  aggregatedX =
                    groupPoints.reduce((sum, p) => sum + p.scaledX, 0) /
                    groupPoints.length;
                  aggregatedY =
                    groupPoints.reduce((sum, p) => sum + p.scaledY, 0) /
                    groupPoints.length;
                  break;
                case "max":
                  aggregatedValue = Math.max(
                    ...groupPoints.map((p) => p.value)
                  );
                  const maxPoint = groupPoints.reduce((max, p) =>
                    p.value > max.value ? p : max
                  );
                  aggregatedX = maxPoint.scaledX;
                  aggregatedY = maxPoint.scaledY;
                  break;
                case "min":
                  aggregatedValue = Math.min(
                    ...groupPoints.map((p) => p.value)
                  );
                  const minPoint = groupPoints.reduce((min, p) =>
                    p.value < min.value ? p : min
                  );
                  aggregatedX = minPoint.scaledX;
                  aggregatedY = minPoint.scaledY;
                  break;
                default:
                  aggregatedValue = groupPoints[0].value;
                  aggregatedX = groupPoints[0].scaledX;
                  aggregatedY = groupPoints[0].scaledY;
              }

              return {
                id: `group_${groupKey}`,
                groupKey,
                groupSize: groupPoints.length,
                originalPoints: groupPoints,
                scaledX:
                  aggregatedX /
                  (configuration.grouping.aggregation === "sum"
                    ? 1
                    : groupPoints.length),
                scaledY:
                  aggregatedY /
                  (configuration.grouping.aggregation === "sum"
                    ? 1
                    : groupPoints.length),
                value: aggregatedValue,
                scaledSize: Math.sqrt(groupPoints.length) * 3,
                color: getColorForCategory(
                  groupPoints[0].category,
                  configuration.scales.color
                ),
                opacity:
                  groupPoints.reduce(
                    (sum, p) => sum + p.metadata.confidence,
                    0
                  ) / groupPoints.length,
                category: groupPoints[0].category,
                metadata: {
                  type: "group",
                  aggregationType: configuration.grouping.aggregation,
                  field: configuration.grouping.field,
                },
              };
            }
          );
        }

        // Phase 4: Advanced Spatial Calculations
        if (configuration.type === "network" || configuration.type === "tree") {
          aggregatedData = await calculateNetworkLayout(
            aggregatedData,
            configuration
          );
        } else if (configuration.type === "heatmap") {
          aggregatedData = await calculateHeatmapGrid(
            aggregatedData,
            configuration
          );
        }

        // Phase 5: Collision Detection and Spatial Optimization
        if (performanceMode === "quality" && aggregatedData.length > 100) {
          aggregatedData = await performCollisionDetection(
            aggregatedData,
            configuration
          );
        }

        // Phase 6: Level of Detail (LOD) Optimization
        if (
          renderingContext.optimizations.levelOfDetail &&
          aggregatedData.length > 500
        ) {
          aggregatedData = await applyLevelOfDetail(
            aggregatedData,
            state.zoomLevel,
            configuration
          );
        }

        // Phase 7: Quadtree Spatial Indexing for Performance
        if (
          renderingContext.optimizations.quadTree &&
          aggregatedData.length > 200
        ) {
          aggregatedData = await buildQuadtreeIndex(
            aggregatedData,
            configuration
          );
        }

        // Phase 8: Animation State Calculation
        if (configuration.animations.enabled) {
          aggregatedData = await calculateAnimationStates(
            aggregatedData,
            configuration,
            state
          );
        }

        // Phase 9: Selection and Interaction States
        aggregatedData = aggregatedData.map((point) => ({
          ...point,
          selected: state.selectedPoints.includes(point.id),
          hovered: state.hoveredPoint === point.id,
          interactionState: getInteractionState(point, state, configuration),
        }));

        // Phase 10: Final Rendering Optimizations
        if (renderingContext.optimizations.culling) {
          const viewBounds = calculateViewBounds(configuration, state);
          aggregatedData = aggregatedData.filter((point) =>
            isPointInView(point, viewBounds, configuration)
          );
        }

        if (renderingContext.optimizations.batching) {
          aggregatedData = await createRenderingBatches(
            aggregatedData,
            configuration
          );
        }

        // Update rendering statistics
        const processingTime = Date.now() - startTime;
        setVizState((prev) => ({
          ...prev,
          processedData: aggregatedData,
          renderingStats: {
            pointsRendered: aggregatedData.length,
            renderTime: processingTime,
            lastUpdate: new Date(),
            frameRate: 1000 / Math.max(processingTime, 16), // Target 60fps
          },
        }));

        return aggregatedData;
      } catch (error) {
        console.error("Data processing error:", error);
        return [];
      } finally {
        setIsRendering(false);
      }
    },
    [renderingContext.optimizations, performanceMode]
  );

  // Helper function to get color for category
  const getColorForCategory = (category: string, colorScale: any): string => {
    const colors = {
      Technology: "#3b82f6",
      Science: "#10b981",
      Business: "#f59e0b",
      Healthcare: "#ef4444",
      Education: "#8b5cf6",
      Entertainment: "#ec4899",
    };
    return colors[category as keyof typeof colors] || "#6b7280";
  };

  // Calculate network layout for network visualizations
  const calculateNetworkLayout = async (
    data: any[],
    config: ChartConfiguration
  ): Promise<any[]> => {
    // Implement force-directed layout algorithm
    const nodes = [...data];
    const iterations = 100;
    const k = Math.sqrt(
      (config.dimensions.width * config.dimensions.height) / nodes.length
    );

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate repulsive forces
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].fx = 0;
        nodes[i].fy = 0;

        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const dx = nodes[i].scaledX - nodes[j].scaledX;
            const dy = nodes[i].scaledY - nodes[j].scaledY;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const force = (k * k) / distance;

            nodes[i].fx += (dx / distance) * force;
            nodes[i].fy += (dy / distance) * force;
          }
        }
      }

      // Calculate attractive forces for connected nodes
      nodes.forEach((node) => {
        if (node.metadata && node.metadata.relations) {
          node.metadata.relations.forEach((relatedId: string) => {
            const relatedNode = nodes.find((n) => n.id === relatedId);
            if (relatedNode) {
              const dx = relatedNode.scaledX - node.scaledX;
              const dy = relatedNode.scaledY - node.scaledY;
              const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
              const force = (distance * distance) / k;

              node.fx += (dx / distance) * force * 0.1;
              node.fy += (dy / distance) * force * 0.1;
            }
          });
        }
      });

      // Apply forces with cooling
      const cooling = 1 - iter / iterations;
      nodes.forEach((node) => {
        const displacement =
          Math.sqrt(node.fx * node.fx + node.fy * node.fy) || 0.1;
        node.scaledX +=
          (node.fx / displacement) * Math.min(displacement, cooling * 10);
        node.scaledY +=
          (node.fy / displacement) * Math.min(displacement, cooling * 10);

        // Keep nodes within bounds
        node.scaledX = Math.max(
          0,
          Math.min(config.dimensions.width, node.scaledX)
        );
        node.scaledY = Math.max(
          0,
          Math.min(config.dimensions.height, node.scaledY)
        );
      });
    }

    return nodes;
  };

  // Calculate heatmap grid
  const calculateHeatmapGrid = async (
    data: any[],
    config: ChartConfiguration
  ): Promise<any[]> => {
    const gridSize = 20;
    const cellWidth = config.dimensions.width / gridSize;
    const cellHeight = config.dimensions.height / gridSize;
    const grid: any[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    // Aggregate data into grid cells
    data.forEach((point) => {
      const cellX = Math.floor(point.scaledX / cellWidth);
      const cellY = Math.floor(point.scaledY / cellHeight);

      if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
        if (!grid[cellY][cellX]) {
          grid[cellY][cellX] = {
            id: `cell_${cellX}_${cellY}`,
            x: cellX,
            y: cellY,
            scaledX: cellX * cellWidth + cellWidth / 2,
            scaledY: cellY * cellHeight + cellHeight / 2,
            value: 0,
            count: 0,
            points: [],
          };
        }

        grid[cellY][cellX].value += point.value;
        grid[cellY][cellX].count += 1;
        grid[cellY][cellX].points.push(point);
      }
    });

    // Convert grid to flat array and calculate intensity
    const heatmapData: any[] = [];
    const maxValue = Math.max(
      ...grid
        .flat()
        .filter(Boolean)
        .map((cell) => cell.value)
    );

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell) {
          heatmapData.push({
            ...cell,
            intensity: cell.value / maxValue,
            color: `rgba(255, ${Math.floor(255 * (1 - cell.intensity))}, 0, ${
              cell.intensity
            })`,
            scaledSize: cellWidth,
          });
        }
      });
    });

    return heatmapData;
  };

  // Collision detection to prevent overlapping
  const performCollisionDetection = async (
    data: any[],
    config: ChartConfiguration
  ): Promise<any[]> => {
    const adjustedData = [...data];
    const maxIterations = 50;

    for (let iter = 0; iter < maxIterations; iter++) {
      let collisionFound = false;

      for (let i = 0; i < adjustedData.length; i++) {
        for (let j = i + 1; j < adjustedData.length; j++) {
          const point1 = adjustedData[i];
          const point2 = adjustedData[j];

          const dx = point1.scaledX - point2.scaledX;
          const dy = point1.scaledY - point2.scaledY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (point1.scaledSize + point2.scaledSize) / 2 + 2;

          if (distance < minDistance && distance > 0) {
            collisionFound = true;
            const overlap = minDistance - distance;
            const separationX = (dx / distance) * overlap * 0.5;
            const separationY = (dy / distance) * overlap * 0.5;

            point1.scaledX += separationX;
            point1.scaledY += separationY;
            point2.scaledX -= separationX;
            point2.scaledY -= separationY;

            // Keep points within bounds
            point1.scaledX = Math.max(
              point1.scaledSize,
              Math.min(
                config.dimensions.width - point1.scaledSize,
                point1.scaledX
              )
            );
            point1.scaledY = Math.max(
              point1.scaledSize,
              Math.min(
                config.dimensions.height - point1.scaledSize,
                point1.scaledY
              )
            );
            point2.scaledX = Math.max(
              point2.scaledSize,
              Math.min(
                config.dimensions.width - point2.scaledSize,
                point2.scaledX
              )
            );
            point2.scaledY = Math.max(
              point2.scaledSize,
              Math.min(
                config.dimensions.height - point2.scaledSize,
                point2.scaledY
              )
            );
          }
        }
      }

      if (!collisionFound) break;
    }

    return adjustedData;
  };

  // Apply level of detail optimization
  const applyLevelOfDetail = async (
    data: any[],
    zoomLevel: number,
    config: ChartConfiguration
  ): Promise<any[]> => {
    if (zoomLevel >= 1) return data; // Full detail at normal zoom

    const lodThreshold = Math.floor(data.length * zoomLevel);
    const importance = data.map((point) => ({
      point,
      importance: calculatePointImportance(point, config),
    }));

    importance.sort((a, b) => b.importance - a.importance);
    return importance.slice(0, lodThreshold).map((item) => item.point);
  };

  // Calculate point importance for LOD
  const calculatePointImportance = (
    point: any,
    config: ChartConfiguration
  ): number => {
    let importance = point.value || 0;

    // Boost importance for selected or hovered points
    if (point.selected) importance *= 2;
    if (point.hovered) importance *= 1.5;

    // Boost importance for points with relationships
    if (point.metadata?.relations?.length > 0) {
      importance *= 1 + point.metadata.relations.length * 0.1;
    }

    // Boost importance for points near edges (outliers)
    const centerX = config.dimensions.width / 2;
    const centerY = config.dimensions.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(point.scaledX - centerX, 2) +
        Math.pow(point.scaledY - centerY, 2)
    );
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    importance *= 1 + (distanceFromCenter / maxDistance) * 0.5;

    return importance;
  };

  // Build quadtree spatial index
  const buildQuadtreeIndex = async (
    data: any[],
    config: ChartConfiguration
  ): Promise<any[]> => {
    // Simplified quadtree implementation for spatial indexing
    const bounds = {
      x: 0,
      y: 0,
      width: config.dimensions.width,
      height: config.dimensions.height,
    };

    const quadtree = {
      bounds,
      points: data,
      children: null as any,
      divided: false,
    };

    const subdivide = (node: any) => {
      const { x, y, width, height } = node.bounds;
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      node.children = [
        {
          bounds: { x, y, width: halfWidth, height: halfHeight },
          points: [],
          children: null,
          divided: false,
        },
        {
          bounds: { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
          points: [],
          children: null,
          divided: false,
        },
        {
          bounds: {
            x,
            y: y + halfHeight,
            width: halfWidth,
            height: halfHeight,
          },
          points: [],
          children: null,
          divided: false,
        },
        {
          bounds: {
            x: x + halfWidth,
            y: y + halfHeight,
            width: halfWidth,
            height: halfHeight,
          },
          points: [],
          children: null,
          divided: false,
        },
      ];

      node.points.forEach((point: any) => {
        const childIndex =
          (point.scaledX >= x + halfWidth ? 1 : 0) +
          (point.scaledY >= y + halfHeight ? 2 : 0);
        node.children[childIndex].points.push({
          ...point,
          quadrant: childIndex,
          depth: (point.depth || 0) + 1,
        });
      });

      node.divided = true;
    };

    const buildTree = (
      node: any,
      maxDepth: number,
      currentDepth: number = 0
    ) => {
      if (currentDepth < maxDepth && node.points.length > 10) {
        subdivide(node);
        node.children.forEach((child: any) => {
          buildTree(child, maxDepth, currentDepth + 1);
        });
      }
    };

    buildTree(quadtree, 4);

    // Flatten quadtree back to array with spatial metadata
    const flattenTree = (node: any): any[] => {
      if (node.children) {
        return node.children.flatMap(flattenTree);
      }
      return node.points;
    };

    return flattenTree(quadtree);
  };

  // Calculate animation states
  const calculateAnimationStates = async (
    data: any[],
    config: ChartConfiguration,
    state: VisualizationState
  ): Promise<any[]> => {
    const animationDuration = config.animations.duration;
    const staggerDelay = config.animations.stagger;
    const currentTime = Date.now();

    return data.map((point, index) => ({
      ...point,
      animationDelay: index * staggerDelay,
      animationProgress: Math.min(
        1,
        (currentTime % animationDuration) / animationDuration
      ),
      easedProgress: easeInOut(
        (currentTime % animationDuration) / animationDuration
      ),
      originalPosition: { x: point.x, y: point.y },
      animatedPosition: {
        x: point.scaledX,
        y: point.scaledY,
      },
    }));
  };

  // Easing function
  const easeInOut = (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  // Get interaction state
  const getInteractionState = (
    point: any,
    state: VisualizationState,
    config: ChartConfiguration
  ): string => {
    if (point.selected) return "selected";
    if (point.hovered) return "hovered";
    if (
      point.metadata?.relations?.some((id: string) =>
        state.selectedPoints.includes(id)
      )
    )
      return "related";
    return "normal";
  };

  // Calculate view bounds
  const calculateViewBounds = (
    config: ChartConfiguration,
    state: VisualizationState
  ) => {
    const { zoomLevel, panOffset } = state;
    const { width, height } = config.dimensions;

    return {
      left: -panOffset.x / zoomLevel,
      right: (width - panOffset.x) / zoomLevel,
      top: -panOffset.y / zoomLevel,
      bottom: (height - panOffset.y) / zoomLevel,
    };
  };

  // Check if point is in view
  const isPointInView = (
    point: any,
    bounds: any,
    config: ChartConfiguration
  ): boolean => {
    const margin = point.scaledSize || 5;
    return (
      point.scaledX >= bounds.left - margin &&
      point.scaledX <= bounds.right + margin &&
      point.scaledY >= bounds.top - margin &&
      point.scaledY <= bounds.bottom + margin
    );
  };

  // Create rendering batches
  const createRenderingBatches = async (
    data: any[],
    config: ChartConfiguration
  ): Promise<any[]> => {
    const batchSize = 100;
    const batches: any[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      batches.push({
        id: `batch_${i / batchSize}`,
        type: "batch",
        points: batch,
        batchIndex: i / batchSize,
        priority: calculateBatchPriority(batch, config),
      });
    }

    return batches.sort((a, b) => b.priority - a.priority);
  };

  // Calculate batch priority
  const calculateBatchPriority = (
    batch: any[],
    config: ChartConfiguration
  ): number => {
    const selectedCount = batch.filter((p) => p.selected).length;
    const hoveredCount = batch.filter((p) => p.hovered).length;
    const averageImportance =
      batch.reduce((sum, p) => sum + calculatePointImportance(p, config), 0) /
      batch.length;

    return selectedCount * 10 + hoveredCount * 5 + averageImportance;
  };

  // Process data when configuration or state changes
  useEffect(() => {
    if (data.length > 0) {
      processDataForVisualization(vizState.filteredData, config, vizState);
    }
  }, [
    data,
    config,
    vizState.selectedPoints,
    vizState.hoveredPoint,
    vizState.zoomLevel,
    processDataForVisualization,
  ]);

  // SVG rendering function for high-quality output
  const renderSVGVisualization = useCallback(
    (data: any[], config: ChartConfiguration) => {
      if (!svgRef.current) return;

      const svg = svgRef.current;
      svg.innerHTML = ""; // Clear previous content

      // Create SVG groups for different layers
      const backgroundGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      backgroundGroup.setAttribute("class", "background-layer");

      const dataGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      dataGroup.setAttribute("class", "data-layer");

      const interactionGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      interactionGroup.setAttribute("class", "interaction-layer");

      svg.appendChild(backgroundGroup);
      svg.appendChild(dataGroup);
      svg.appendChild(interactionGroup);

      // Render axes if enabled
      if (config.axes.x.show || config.axes.y.show) {
        const axesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        axesGroup.setAttribute("class", "axes-layer");

        if (config.axes.x.show) {
          const xAxis = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          xAxis.setAttribute("x1", "0");
          xAxis.setAttribute("y1", config.dimensions.height.toString());
          xAxis.setAttribute("x2", config.dimensions.width.toString());
          xAxis.setAttribute("y2", config.dimensions.height.toString());
          xAxis.setAttribute("stroke", "#666");
          xAxis.setAttribute("stroke-width", "1");
          axesGroup.appendChild(xAxis);

          // X-axis ticks and labels
          for (let i = 0; i <= config.axes.x.tickCount; i++) {
            const x = (i / config.axes.x.tickCount) * config.dimensions.width;
            const tick = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line"
            );
            tick.setAttribute("x1", x.toString());
            tick.setAttribute("y1", config.dimensions.height.toString());
            tick.setAttribute("x2", x.toString());
            tick.setAttribute("y2", (config.dimensions.height + 5).toString());
            tick.setAttribute("stroke", "#666");
            tick.setAttribute("stroke-width", "1");
            axesGroup.appendChild(tick);

            const label = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );
            label.setAttribute("x", x.toString());
            label.setAttribute("y", (config.dimensions.height + 15).toString());
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("fill", "#999");
            label.setAttribute("font-size", "12");
            const xDomain = config.scales.x.domain as [number, number];
            const value =
              xDomain[0] +
              (i / config.axes.x.tickCount) * (xDomain[1] - xDomain[0]);
            label.textContent = value.toFixed(1);
            axesGroup.appendChild(label);
          }
        }

        if (config.axes.y.show) {
          const yAxis = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          yAxis.setAttribute("x1", "0");
          yAxis.setAttribute("y1", "0");
          yAxis.setAttribute("x2", "0");
          yAxis.setAttribute("y2", config.dimensions.height.toString());
          yAxis.setAttribute("stroke", "#666");
          yAxis.setAttribute("stroke-width", "1");
          axesGroup.appendChild(yAxis);

          // Y-axis ticks and labels
          for (let i = 0; i <= config.axes.y.tickCount; i++) {
            const y =
              config.dimensions.height -
              (i / config.axes.y.tickCount) * config.dimensions.height;
            const tick = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line"
            );
            tick.setAttribute("x1", "0");
            tick.setAttribute("y1", y.toString());
            tick.setAttribute("x2", "-5");
            tick.setAttribute("y2", y.toString());
            tick.setAttribute("stroke", "#666");
            tick.setAttribute("stroke-width", "1");
            axesGroup.appendChild(tick);

            const label = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );
            label.setAttribute("x", "-10");
            label.setAttribute("y", (y + 4).toString());
            label.setAttribute("text-anchor", "end");
            label.setAttribute("fill", "#999");
            label.setAttribute("font-size", "12");
            const yDomain = config.scales.y.domain as [number, number];
            const value =
              yDomain[0] +
              (i / config.axes.y.tickCount) * (yDomain[1] - yDomain[0]);
            label.textContent = value.toFixed(1);
            axesGroup.appendChild(label);
          }
        }

        backgroundGroup.appendChild(axesGroup);
      }

      // Render data points based on chart type
      data.forEach((point, index) => {
        if (point.type === "batch") {
          // Render batch of points
          point.points.forEach((p: any, pIndex: number) => {
            renderSVGPoint(p, dataGroup, config, index * 100 + pIndex);
          });
        } else {
          renderSVGPoint(point, dataGroup, config, index);
        }
      });
    },
    []
  );

  // Render individual SVG point
  const renderSVGPoint = (
    point: any,
    group: SVGGElement,
    config: ChartConfiguration,
    index: number
  ) => {
    let element: SVGElement;

    switch (config.type) {
      case "scatter":
      case "bubble":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        element.setAttribute("cx", point.scaledX.toString());
        element.setAttribute("cy", point.scaledY.toString());
        element.setAttribute("r", (point.scaledSize / 2).toString());
        break;

      case "bar":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        element.setAttribute(
          "x",
          (point.scaledX - point.scaledSize / 2).toString()
        );
        element.setAttribute("y", point.scaledY.toString());
        element.setAttribute("width", point.scaledSize.toString());
        element.setAttribute(
          "height",
          (config.dimensions.height - point.scaledY).toString()
        );
        break;

      case "heatmap":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        element.setAttribute(
          "x",
          (point.scaledX - point.scaledSize / 2).toString()
        );
        element.setAttribute(
          "y",
          (point.scaledY - point.scaledSize / 2).toString()
        );
        element.setAttribute("width", point.scaledSize.toString());
        element.setAttribute("height", point.scaledSize.toString());
        break;

      default:
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        element.setAttribute("cx", point.scaledX.toString());
        element.setAttribute("cy", point.scaledY.toString());
        element.setAttribute("r", (point.scaledSize / 2).toString());
    }

    // Apply styling
    element.setAttribute("fill", point.color || "#3b82f6");
    element.setAttribute("opacity", (point.opacity || 0.7).toString());
    element.setAttribute("stroke", point.selected ? "#fff" : "none");
    element.setAttribute("stroke-width", point.selected ? "2" : "0");

    // Add interaction classes
    element.setAttribute(
      "class",
      `data-point ${point.interactionState || "normal"}`
    );
    element.setAttribute("data-id", point.id);
    element.setAttribute("data-category", point.category || "");

    // Animation
    if (config.animations.enabled && point.animationDelay !== undefined) {
      element.style.animationDelay = `${point.animationDelay}ms`;
      element.style.animationDuration = `${config.animations.duration}ms`;
      element.classList.add("animated");
    }

    group.appendChild(element);
  };

  // Canvas rendering for performance
  const renderCanvasVisualization = useCallback(
    (data: any[], config: ChartConfiguration) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas size
      canvas.width = config.dimensions.width;
      canvas.height = config.dimensions.height;

      // Render data points
      data.forEach((point) => {
        if (point.type === "batch") {
          point.points.forEach((p: any) => {
            renderCanvasPoint(p, ctx, config);
          });
        } else {
          renderCanvasPoint(point, ctx, config);
        }
      });
    },
    []
  );

  // Render individual canvas point
  const renderCanvasPoint = (
    point: any,
    ctx: CanvasRenderingContext2D,
    config: ChartConfiguration
  ) => {
    ctx.save();

    // Set styles
    ctx.fillStyle = point.color || "#3b82f6";
    ctx.globalAlpha = point.opacity || 0.7;

    if (point.selected) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
    }

    // Draw based on chart type
    switch (config.type) {
      case "scatter":
      case "bubble":
        ctx.beginPath();
        ctx.arc(
          point.scaledX,
          point.scaledY,
          point.scaledSize / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
        if (point.selected) ctx.stroke();
        break;

      case "bar":
        ctx.fillRect(
          point.scaledX - point.scaledSize / 2,
          point.scaledY,
          point.scaledSize,
          config.dimensions.height - point.scaledY
        );
        if (point.selected) {
          ctx.strokeRect(
            point.scaledX - point.scaledSize / 2,
            point.scaledY,
            point.scaledSize,
            config.dimensions.height - point.scaledY
          );
        }
        break;

      case "heatmap":
        ctx.fillRect(
          point.scaledX - point.scaledSize / 2,
          point.scaledY - point.scaledSize / 2,
          point.scaledSize,
          point.scaledSize
        );
        break;
    }

    ctx.restore();
  };

  // Update rendering context
  useEffect(() => {
    setRenderingContext((prev) => ({
      ...prev,
      canvas: canvasRef.current,
      ctx: canvasRef.current?.getContext("2d") || null,
      svg: svgRef.current,
    }));
  }, []);

  // Main render effect
  useEffect(() => {
    if (vizState.processedData.length > 0) {
      if (performanceMode === "performance") {
        renderCanvasVisualization(vizState.processedData, config);
      } else {
        renderSVGVisualization(vizState.processedData, config);
      }
    }
  }, [
    vizState.processedData,
    config,
    performanceMode,
    renderCanvasVisualization,
    renderSVGVisualization,
  ]);

  return (
    <div className="min-h-screen bg-[#303030] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Complex Visualization Engine
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Demonstrates extremely high cognitive complexity (50+) and cyclomatic
          complexity (60+) data visualization system
        </p>

        {/* Visualization Controls */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Chart Type
              </label>
              <select
                value={config.type}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    type: e.target.value as any,
                  }))
                }
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2"
              >
                <option value="scatter">Scatter Plot</option>
                <option value="bubble">Bubble Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="heatmap">Heatmap</option>
                <option value="network">Network Graph</option>
                <option value="line">Line Chart</option>
              </select>
            </div>

            {/* Performance Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Performance Mode
              </label>
              <select
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value as any)}
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2"
              >
                <option value="quality">Quality (SVG)</option>
                <option value="balanced">Balanced</option>
                <option value="performance">Performance (Canvas)</option>
              </select>
            </div>

            {/* Grouping */}
            <div>
              <label className="block text-sm font-medium mb-2">Grouping</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.grouping.enabled}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      grouping: { ...prev.grouping, enabled: e.target.checked },
                    }))
                  }
                  className="rounded"
                />
                <select
                  value={config.grouping.field}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      grouping: { ...prev.grouping, field: e.target.value },
                    }))
                  }
                  className="flex-1 bg-gray-700 text-white border-gray-600 rounded px-2 py-1 text-sm"
                  disabled={!config.grouping.enabled}
                >
                  <option value="category">Category</option>
                  <option value="source">Source</option>
                  <option value="timeWindow">Time Window</option>
                </select>
              </div>
            </div>

            {/* Animations */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Animations
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.animations.enabled}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      animations: {
                        ...prev.animations,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  className="rounded"
                />
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={config.animations.duration}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      animations: {
                        ...prev.animations,
                        duration: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="flex-1"
                  disabled={!config.animations.enabled}
                />
                <span className="text-xs text-gray-400">
                  {config.animations.duration}ms
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Filter
              </label>
              <select
                multiple
                value={config.filters.category}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setConfig((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, category: selected },
                  }));
                }}
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2 h-20"
              >
                <option value="Technology">Technology</option>
                <option value="Science">Science</option>
                <option value="Business">Business</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Value Range
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={config.filters.valueRange.min || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        valueRange: {
                          ...prev.filters.valueRange,
                          min: parseFloat(e.target.value) || null,
                        },
                      },
                    }))
                  }
                  className="bg-gray-700 text-white border-gray-600"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={config.filters.valueRange.max || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        valueRange: {
                          ...prev.filters.valueRange,
                          max: parseFloat(e.target.value) || null,
                        },
                      },
                    }))
                  }
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Optimizations
              </label>
              <div className="space-y-1">
                {Object.entries(renderingContext.optimizations).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setRenderingContext((prev) => ({
                            ...prev,
                            optimizations: {
                              ...prev.optimizations,
                              [key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-xs capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rendering Statistics */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Rendering Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {vizState.renderingStats.pointsRendered}
              </div>
              <div className="text-gray-400">Points Rendered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {vizState.renderingStats.renderTime}ms
              </div>
              <div className="text-gray-400">Render Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {vizState.renderingStats.frameRate.toFixed(1)}
              </div>
              <div className="text-gray-400">Target FPS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {data.length}
              </div>
              <div className="text-gray-400">Total Data Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {vizState.selectedPoints.length}
              </div>
              <div className="text-gray-400">Selected</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  isRendering ? "text-yellow-400" : "text-gray-400"
                }`}
              >
                {isRendering ? "RENDERING" : "IDLE"}
              </div>
              <div className="text-gray-400">Status</div>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="relative">
            {/* SVG Rendering */}
            <svg
              ref={svgRef}
              width={config.dimensions.width}
              height={config.dimensions.height}
              className={`${
                performanceMode === "performance" ? "hidden" : "block"
              } border border-gray-600 bg-gray-900`}
              style={{ maxWidth: "100%", height: "auto" }}
            ></svg>

            {/* Canvas Rendering */}
            <canvas
              ref={canvasRef}
              width={config.dimensions.width}
              height={config.dimensions.height}
              className={`${
                performanceMode === "performance" ? "block" : "hidden"
              } border border-gray-600 bg-gray-900`}
              style={{ maxWidth: "100%", height: "auto" }}
            />

            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 space-y-2">
              <Button
                onClick={() => {
                  const newData = data.map((point) => ({
                    ...point,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    value: Math.random() * 100,
                  }));
                  setData(newData);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1"
              >
                Randomize Data
              </Button>

              <Button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    animations: {
                      ...prev.animations,
                      enabled: !prev.animations.enabled,
                    },
                  }))
                }
                className="bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1"
              >
                Toggle Animation
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-gray-700 p-3 rounded">
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="space-y-1">
                {[
                  "Technology",
                  "Science",
                  "Business",
                  "Healthcare",
                  "Education",
                  "Entertainment",
                ].map((category) => (
                  <div
                    key={category}
                    className="flex items-center space-x-2 text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: getColorForCategory(
                          category,
                          config.scales.color
                        ),
                      }}
                    ></div>
                    <span>{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
