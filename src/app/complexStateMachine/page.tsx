"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StateDefinition {
  id: string;
  name: string;
  type: "initial" | "normal" | "final" | "error" | "parallel" | "composite";
  data: any;
  actions: {
    onEntry: string[];
    onExit: string[];
    onTimeout: string[];
  };
  guards: {
    [transitionId: string]: (context: any, event: any) => boolean;
  };
  transitions: {
    [eventType: string]: {
      target: string;
      guard?: string;
      actions?: string[];
      condition?: (context: any, event: any) => boolean;
      priority: number;
    }[];
  };
  substates?: { [key: string]: StateDefinition };
  timeouts: {
    duration: number;
    event: string;
    repeat?: boolean;
  }[];
  metadata: {
    description: string;
    complexity: number;
    entryCount: number;
    lastEntered: Date | null;
    averageStayDuration: number;
    errorCount: number;
  };
}

interface StateEvent {
  type: string;
  payload?: any;
  timestamp: Date;
  source?: string;
  priority: number;
  correlationId?: string;
  metadata: {
    retryCount: number;
    processingTime?: number;
    validationErrors: string[];
  };
}

interface StateMachineContext {
  currentState: string;
  previousState: string | null;
  stateHistory: string[];
  eventHistory: StateEvent[];
  globalData: any;
  stateData: { [stateId: string]: any };
  timers: { [timerId: string]: NodeJS.Timeout };
  locks: { [lockId: string]: boolean };
  counters: { [counterId: string]: number };
  flags: { [flagId: string]: boolean };
  cache: { [key: string]: any };
  metrics: {
    stateTransitions: number;
    eventsProcessed: number;
    errorsEncountered: number;
    totalExecutionTime: number;
    averageEventProcessingTime: number;
    stateDistribution: { [stateId: string]: number };
  };
}

interface TransitionResult {
  success: boolean;
  newState: string;
  executedActions: string[];
  errors: string[];
  warnings: string[];
  metadata: {
    transitionTime: number;
    guardsEvaluated: number;
    actionsExecuted: number;
    conditionsChecked: number;
  };
}

export default function ComplexStateMachine() {
  const [states, setStates] = useState<{ [key: string]: StateDefinition }>({});
  const [context, setContext] = useState<StateMachineContext>({
    currentState: "idle",
    previousState: null,
    stateHistory: ["idle"],
    eventHistory: [],
    globalData: {},
    stateData: {},
    timers: {},
    locks: {},
    counters: {},
    flags: {},
    cache: {},
    metrics: {
      stateTransitions: 0,
      eventsProcessed: 0,
      errorsEncountered: 0,
      totalExecutionTime: 0,
      averageEventProcessingTime: 0,
      stateDistribution: {},
    },
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventQueue, setEventQueue] = useState<StateEvent[]>([]);
  const [machineConfig, setMachineConfig] = useState<any>({});
  const [debugMode, setDebugMode] = useState(true);
  const [visualizationData, setVisualizationData] = useState<any>({});
  const processingLockRef = useRef(false);
  const eventProcessorRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize complex state machine with high cognitive complexity
  useEffect(() => {
    const initializeStateMachine = () => {
      const initialStates: { [key: string]: StateDefinition } = {
        // Initial/Entry States
        idle: {
          id: "idle",
          name: "Idle State",
          type: "initial",
          data: { initialized: false, lastActivity: null },
          actions: {
            onEntry: ["logEntry", "initializeCounters", "clearCache"],
            onExit: ["logExit", "saveState"],
            onTimeout: ["checkHealthStatus"],
          },
          guards: {
            canStart: (context, event) =>
              !context.locks.processing && context.flags.systemReady,
            hasValidInput: (context, event) =>
              event.payload && event.payload.data,
          },
          transitions: {
            START: [
              {
                target: "initializing",
                guard: "canStart",
                actions: ["incrementCounter", "setProcessingFlag"],
                priority: 10,
              },
            ],
            CONFIGURE: [
              {
                target: "configuring",
                actions: ["validateConfiguration"],
                priority: 8,
              },
            ],
            RESET: [
              {
                target: "resetting",
                actions: ["clearAllData"],
                priority: 5,
              },
            ],
          },
          substates: {},
          timeouts: [
            { duration: 30000, event: "HEALTH_CHECK", repeat: true },
            { duration: 300000, event: "CLEANUP", repeat: true },
          ],
          metadata: {
            description: "Initial idle state of the system",
            complexity: 15,
            entryCount: 0,
            lastEntered: null,
            averageStayDuration: 0,
            errorCount: 0,
          },
        },

        // Configuration States
        configuring: {
          id: "configuring",
          name: "Configuration State",
          type: "normal",
          data: { configSteps: [], currentStep: 0, validationResults: {} },
          actions: {
            onEntry: [
              "startConfiguration",
              "loadDefaultConfig",
              "validateEnvironment",
            ],
            onExit: ["saveConfiguration", "notifyConfigComplete"],
            onTimeout: ["configurationTimeout"],
          },
          guards: {
            configValid: (context, event) => {
              const config = event.payload?.config;
              return (
                config &&
                config.version &&
                config.settings &&
                Object.keys(config.settings).length > 0
              );
            },
            hasRequiredFields: (context, event) => {
              const required = ["apiKey", "endpoint", "timeout"];
              return required.every((field) => event.payload?.config?.[field]);
            },
            isAuthorized: (context, event) =>
              context.globalData.user?.permissions?.includes("configure"),
          },
          transitions: {
            CONFIG_VALID: [
              {
                target: "validating",
                guard: "configValid",
                actions: ["processConfiguration", "incrementConfigVersion"],
                condition: (context, event) =>
                  event.payload.config.version >
                  context.globalData.configVersion,
                priority: 10,
              },
            ],
            CONFIG_INVALID: [
              {
                target: "configError",
                actions: ["logConfigError", "notifyUser"],
                priority: 9,
              },
            ],
            CANCEL: [
              {
                target: "idle",
                actions: ["restorePreviousConfig"],
                priority: 7,
              },
            ],
            TIMEOUT: [
              {
                target: "configTimeout",
                actions: ["handleTimeout"],
                priority: 6,
              },
            ],
          },
          substates: {
            apiConfig: {
              id: "apiConfig",
              name: "API Configuration",
              type: "normal",
              data: { endpoints: [], credentials: {} },
              actions: {
                onEntry: ["validateApiCredentials"],
                onExit: [],
                onTimeout: [],
              },
              guards: {},
              transitions: {
                API_VALIDATED: [{ target: "databaseConfig", priority: 10 }],
                API_FAILED: [{ target: "../configError", priority: 9 }],
              },
              substates: {},
              timeouts: [],
              metadata: {
                description: "API configuration substate",
                complexity: 8,
                entryCount: 0,
                lastEntered: null,
                averageStayDuration: 0,
                errorCount: 0,
              },
            },
            databaseConfig: {
              id: "databaseConfig",
              name: "Database Configuration",
              type: "normal",
              data: { connectionString: "", poolSize: 10 },
              actions: {
                onEntry: ["testDatabaseConnection"],
                onExit: [],
                onTimeout: [],
              },
              guards: {},
              transitions: {
                DB_CONNECTED: [{ target: "securityConfig", priority: 10 }],
                DB_FAILED: [{ target: "../configError", priority: 9 }],
              },
              substates: {},
              timeouts: [],
              metadata: {
                description: "Database configuration substate",
                complexity: 7,
                entryCount: 0,
                lastEntered: null,
                averageStayDuration: 0,
                errorCount: 0,
              },
            },
          },
          timeouts: [{ duration: 60000, event: "TIMEOUT" }],
          metadata: {
            description: "System configuration state with validation",
            complexity: 25,
            entryCount: 0,
            lastEntered: null,
            averageStayDuration: 0,
            errorCount: 0,
          },
        },

        // Processing States
        initializing: {
          id: "initializing",
          name: "Initialization State",
          type: "normal",
          data: { initSteps: [], progress: 0, dependencies: [] },
          actions: {
            onEntry: [
              "startInitialization",
              "checkDependencies",
              "allocateResources",
            ],
            onExit: ["finalizeInitialization"],
            onTimeout: ["initializationTimeout"],
          },
          guards: {
            dependenciesReady: (context, event) => {
              const deps = context.stateData.initializing?.dependencies || [];
              return deps.every((dep: any) => dep.status === "ready");
            },
            resourcesAvailable: (context, event) => {
              const mem = context.globalData.systemStats?.memoryUsage || 100;
              const cpu = context.globalData.systemStats?.cpuUsage || 100;
              return mem < 80 && cpu < 90;
            },
            hasValidLicense: (context, event) => {
              const license = context.globalData.license;
              return (
                license &&
                license.valid &&
                new Date(license.expiry) > new Date()
              );
            },
          },
          transitions: {
            DEPENDENCIES_READY: [
              {
                target: "loading",
                guard: "dependenciesReady",
                actions: ["proceedToLoading", "updateProgress"],
                condition: (context, event) =>
                  context.counters.initAttempts < 3,
                priority: 10,
              },
            ],
            INIT_ERROR: [
              {
                target: "initializationError",
                actions: ["logInitError", "incrementErrorCounter"],
                priority: 9,
              },
            ],
            RETRY: [
              {
                target: "initializing",
                actions: ["incrementRetryCounter", "resetInitState"],
                condition: (context, event) => context.counters.initRetries < 5,
                priority: 8,
              },
            ],
            ABORT: [
              {
                target: "aborted",
                actions: ["cleanupResources", "notifyAbort"],
                priority: 7,
              },
            ],
          },
          substates: {},
          timeouts: [{ duration: 120000, event: "INIT_TIMEOUT" }],
          metadata: {
            description: "System initialization with dependency checking",
            complexity: 30,
            entryCount: 0,
            lastEntered: null,
            averageStayDuration: 0,
            errorCount: 0,
          },
        },

        // Data Processing States
        processing: {
          id: "processing",
          name: "Data Processing State",
          type: "parallel",
          data: {
            queues: {},
            workers: [],
            batchSize: 100,
            processed: 0,
            errors: [],
            performance: { throughput: 0, latency: 0 },
          },
          actions: {
            onEntry: ["startProcessing", "initializeWorkers", "setupQueues"],
            onExit: ["stopWorkers", "flushQueues", "generateReport"],
            onTimeout: ["processTimeout", "checkPerformance"],
          },
          guards: {
            hasWork: (context, event) => {
              const queues = context.stateData.processing?.queues || {};
              return Object.values(queues).some(
                (queue: any) => queue.length > 0
              );
            },
            withinLimits: (context, event) => {
              const stats = context.stateData.processing?.performance || {};
              return stats.throughput > 10 && stats.latency < 5000;
            },
            healthyWorkers: (context, event) => {
              const workers = context.stateData.processing?.workers || [];
              const healthy = workers.filter(
                (w: any) => w.status === "healthy"
              ).length;
              return healthy / workers.length >= 0.7;
            },
          },
          transitions: {
            BATCH_COMPLETE: [
              {
                target: "processing",
                guard: "hasWork",
                actions: ["processBatch", "updateMetrics"],
                condition: (context, event) =>
                  event.payload.batchId !==
                  context.stateData.processing?.lastBatchId,
                priority: 10,
              },
            ],
            NO_MORE_WORK: [
              {
                target: "completed",
                actions: ["finalizeProcessing", "generateSummary"],
                priority: 9,
              },
            ],
            PERFORMANCE_DEGRADED: [
              {
                target: "optimizing",
                guard: "withinLimits",
                actions: ["analyzePerformance", "adjustParameters"],
                priority: 8,
              },
            ],
            WORKER_FAILED: [
              {
                target: "recovering",
                actions: ["handleWorkerFailure", "redistributeWork"],
                priority: 7,
              },
            ],
            PAUSE: [
              {
                target: "paused",
                actions: ["pauseProcessing", "saveProgress"],
                priority: 6,
              },
            ],
            ABORT: [
              {
                target: "aborted",
                actions: ["abortProcessing", "cleanup"],
                priority: 5,
              },
            ],
          },
          substates: {
            dataValidation: {
              id: "dataValidation",
              name: "Data Validation",
              type: "normal",
              data: { rules: [], failures: [], passRate: 0 },
              actions: {
                onEntry: ["loadValidationRules"],
                onExit: ["reportValidation"],
                onTimeout: [],
              },
              guards: {},
              transitions: {
                VALIDATION_PASSED: [
                  { target: "dataTransformation", priority: 10 },
                ],
                VALIDATION_FAILED: [
                  { target: "../processingError", priority: 9 },
                ],
              },
              substates: {},
              timeouts: [],
              metadata: {
                description: "Data validation subprocess",
                complexity: 12,
                entryCount: 0,
                lastEntered: null,
                averageStayDuration: 0,
                errorCount: 0,
              },
            },
            dataTransformation: {
              id: "dataTransformation",
              name: "Data Transformation",
              type: "normal",
              data: { transforms: [], pipeline: [], results: [] },
              actions: {
                onEntry: ["setupTransformPipeline"],
                onExit: ["finalizeTransforms"],
                onTimeout: [],
              },
              guards: {},
              transitions: {
                TRANSFORM_COMPLETE: [{ target: "dataOutput", priority: 10 }],
                TRANSFORM_ERROR: [
                  { target: "../processingError", priority: 9 },
                ],
              },
              substates: {},
              timeouts: [],
              metadata: {
                description: "Data transformation subprocess",
                complexity: 15,
                entryCount: 0,
                lastEntered: null,
                averageStayDuration: 0,
                errorCount: 0,
              },
            },
          },
          timeouts: [
            { duration: 30000, event: "PERFORMANCE_CHECK", repeat: true },
            { duration: 300000, event: "TIMEOUT" },
          ],
          metadata: {
            description: "Complex parallel data processing state",
            complexity: 45,
            entryCount: 0,
            lastEntered: null,
            averageStayDuration: 0,
            errorCount: 0,
          },
        },

        // Error and Recovery States
        error: {
          id: "error",
          name: "Error State",
          type: "error",
          data: {
            errorInfo: {},
            recoveryAttempts: 0,
            lastError: null,
            errorHistory: [],
            severity: "unknown",
          },
          actions: {
            onEntry: ["logError", "notifyErrorHandlers", "analyzeError"],
            onExit: ["clearErrorState"],
            onTimeout: ["errorTimeout"],
          },
          guards: {
            canRecover: (context, event) => {
              const attempts = context.stateData.error?.recoveryAttempts || 0;
              const severity = context.stateData.error?.severity || "unknown";
              return attempts < 3 && severity !== "critical";
            },
            isTransientError: (context, event) => {
              const errorType = context.stateData.error?.errorInfo?.type;
              return ["network", "timeout", "throttle"].includes(errorType);
            },
            userInterventionRequired: (context, event) => {
              const severity = context.stateData.error?.severity;
              return ["critical", "security", "data_corruption"].includes(
                severity
              );
            },
          },
          transitions: {
            RETRY: [
              {
                target: "recovering",
                guard: "canRecover",
                actions: ["incrementRecoveryAttempt", "prepareRecovery"],
                condition: (context, event) =>
                  Date.now() - context.stateData.error?.lastError?.timestamp >
                  5000,
                priority: 10,
              },
            ],
            ESCALATE: [
              {
                target: "escalated",
                guard: "userInterventionRequired",
                actions: ["escalateError", "notifyAdministrators"],
                priority: 9,
              },
            ],
            IGNORE: [
              {
                target: "idle",
                actions: ["ignoreError", "logIgnoredError"],
                condition: (context, event) => event.payload.force === true,
                priority: 8,
              },
            ],
            SHUTDOWN: [
              {
                target: "shutdown",
                actions: ["initiateShutdown", "saveErrorReport"],
                priority: 7,
              },
            ],
          },
          substates: {},
          timeouts: [{ duration: 60000, event: "ERROR_TIMEOUT" }],
          metadata: {
            description: "Error handling and recovery state",
            complexity: 35,
            entryCount: 0,
            lastEntered: null,
            averageStayDuration: 0,
            errorCount: 0,
          },
        },

        // Final States
        completed: {
          id: "completed",
          name: "Completed State",
          type: "final",
          data: {
            results: {},
            summary: {},
            performance: {},
            completionTime: null,
            artifacts: [],
          },
          actions: {
            onEntry: ["generateResults", "createSummary", "archiveData"],
            onExit: [],
            onTimeout: [],
          },
          guards: {},
          transitions: {
            RESTART: [
              {
                target: "idle",
                actions: ["resetSystem", "clearResults"],
                priority: 10,
              },
            ],
            EXPORT: [
              {
                target: "exporting",
                actions: ["prepareExport"],
                priority: 8,
              },
            ],
          },
          substates: {},
          timeouts: [],
          metadata: {
            description: "Final completion state",
            complexity: 20,
            entryCount: 0,
            lastEntered: null,
            averageStayDuration: 0,
            errorCount: 0,
          },
        },
      };

      setStates(initialStates);

      // Initialize context with first state
      setContext((prev) => ({
        ...prev,
        currentState: "idle",
        stateData: {
          idle: { ...initialStates.idle.data },
        },
        metrics: {
          ...prev.metrics,
          stateDistribution: { idle: 1 },
        },
      }));

      // Initialize machine configuration
      setMachineConfig({
        version: "1.0.0",
        strictMode: true,
        enableParallelStates: true,
        maxEventQueueSize: 1000,
        eventProcessingInterval: 100,
        timeoutGracePeriod: 5000,
        debugMode: true,
        performanceTracking: true,
      });
    };

    initializeStateMachine();
  }, []);

  // Complex event processing engine with extremely high cognitive complexity
  const processEvent = useCallback(
    async (event: StateEvent): Promise<TransitionResult> => {
      const startTime = Date.now();

      if (processingLockRef.current) {
        console.warn(
          "Event processing already in progress, queuing event:",
          event.type
        );
        setEventQueue((prev) =>
          [...prev, event].slice(-machineConfig.maxEventQueueSize || 1000)
        );
        return {
          success: false,
          newState: context.currentState,
          executedActions: [],
          errors: ["Event processing locked"],
          warnings: ["Event queued for later processing"],
          metadata: {
            transitionTime: 0,
            guardsEvaluated: 0,
            actionsExecuted: 0,
            conditionsChecked: 0,
          },
        };
      }

      processingLockRef.current = true;
      setIsProcessing(true);

      try {
        const currentState = states[context.currentState];
        if (!currentState) {
          throw new Error(`Current state '${context.currentState}' not found`);
        }

        const result: TransitionResult = {
          success: false,
          newState: context.currentState,
          executedActions: [],
          errors: [],
          warnings: [],
          metadata: {
            transitionTime: 0,
            guardsEvaluated: 0,
            actionsExecuted: 0,
            conditionsChecked: 0,
          },
        };

        // Phase 1: Event validation and preprocessing
        const validationResult = await validateEvent(
          event,
          context,
          currentState
        );
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors);
          result.warnings.push(...validationResult.warnings);
          return result;
        }

        // Phase 2: Check if event can trigger any transitions
        const availableTransitions = currentState.transitions[event.type] || [];
        if (availableTransitions.length === 0) {
          result.warnings.push(
            `No transitions available for event '${event.type}' in state '${context.currentState}'`
          );
          return result;
        }

        // Phase 3: Evaluate guards and conditions for each possible transition
        let selectedTransition: any = null;
        let selectedTransitionIndex = -1;

        // Sort transitions by priority (higher priority first)
        const sortedTransitions = [...availableTransitions].sort(
          (a, b) => b.priority - a.priority
        );

        for (let i = 0; i < sortedTransitions.length; i++) {
          const transition = sortedTransitions[i];
          result.metadata.guardsEvaluated++;

          // Check guard condition
          let guardPassed = true;
          if (transition.guard && currentState.guards[transition.guard]) {
            try {
              guardPassed = await currentState.guards[transition.guard](
                context,
                event
              );
            } catch (guardError) {
              console.error(
                `Guard evaluation error for '${transition.guard}':`,
                guardError
              );
              result.warnings.push(
                `Guard '${transition.guard}' evaluation failed`
              );
              guardPassed = false;
            }
          }

          if (!guardPassed) {
            result.warnings.push(
              `Guard '${transition.guard}' failed for transition to '${transition.target}'`
            );
            continue;
          }

          // Check custom condition
          let conditionPassed = true;
          if (transition.condition) {
            result.metadata.conditionsChecked++;
            try {
              conditionPassed = await transition.condition(context, event);
            } catch (conditionError) {
              console.error("Condition evaluation error:", conditionError);
              result.warnings.push("Custom condition evaluation failed");
              conditionPassed = false;
            }
          }

          if (!conditionPassed) {
            result.warnings.push(
              `Custom condition failed for transition to '${transition.target}'`
            );
            continue;
          }

          // All checks passed, select this transition
          selectedTransition = transition;
          selectedTransitionIndex = i;
          break;
        }

        if (!selectedTransition) {
          result.warnings.push(
            "No valid transition found after evaluating all guards and conditions"
          );
          return result;
        }

        // Phase 4: Execute exit actions of current state
        if (currentState.actions.onExit.length > 0) {
          for (const actionName of currentState.actions.onExit) {
            try {
              await executeAction(actionName, context, event, "exit");
              result.executedActions.push(`exit:${actionName}`);
              result.metadata.actionsExecuted++;
            } catch (actionError) {
              console.error(`Exit action '${actionName}' failed:`, actionError);
              result.errors.push(`Exit action '${actionName}' failed`);
            }
          }
        }

        // Phase 5: Execute transition actions
        if (
          selectedTransition.actions &&
          selectedTransition.actions.length > 0
        ) {
          for (const actionName of selectedTransition.actions) {
            try {
              await executeAction(actionName, context, event, "transition");
              result.executedActions.push(`transition:${actionName}`);
              result.metadata.actionsExecuted++;
            } catch (actionError) {
              console.error(
                `Transition action '${actionName}' failed:`,
                actionError
              );
              result.errors.push(`Transition action '${actionName}' failed`);
            }
          }
        }

        // Phase 6: Update state and context
        const targetState = states[selectedTransition.target];
        if (!targetState) {
          result.errors.push(
            `Target state '${selectedTransition.target}' not found`
          );
          return result;
        }

        // Update context with state transition
        const updatedContext: StateMachineContext = {
          ...context,
          previousState: context.currentState,
          currentState: selectedTransition.target,
          stateHistory: [
            ...context.stateHistory,
            selectedTransition.target,
          ].slice(-100), // Keep last 100 states
          eventHistory: [
            ...context.eventHistory,
            { ...event, timestamp: new Date() },
          ].slice(-500), // Keep last 500 events
          stateData: {
            ...context.stateData,
            [selectedTransition.target]: {
              ...targetState.data,
              ...(context.stateData[selectedTransition.target] || {}),
            },
          },
          metrics: {
            ...context.metrics,
            stateTransitions: context.metrics.stateTransitions + 1,
            eventsProcessed: context.metrics.eventsProcessed + 1,
            stateDistribution: {
              ...context.metrics.stateDistribution,
              [selectedTransition.target]:
                (context.metrics.stateDistribution[selectedTransition.target] ||
                  0) + 1,
            },
          },
        };

        // Phase 7: Execute entry actions of target state
        if (targetState.actions.onEntry.length > 0) {
          for (const actionName of targetState.actions.onEntry) {
            try {
              await executeAction(actionName, updatedContext, event, "entry");
              result.executedActions.push(`entry:${actionName}`);
              result.metadata.actionsExecuted++;
            } catch (actionError) {
              console.error(
                `Entry action '${actionName}' failed:`,
                actionError
              );
              result.errors.push(`Entry action '${actionName}' failed`);
            }
          }
        }

        // Phase 8: Setup timeouts for new state
        await setupStateTimeouts(targetState, updatedContext);

        // Phase 9: Handle parallel states and substates
        if (targetState.type === "parallel" && targetState.substates) {
          await handleParallelStateEntry(targetState, updatedContext, event);
        }

        // Phase 10: Update metadata and metrics
        const transitionTime = Date.now() - startTime;
        updatedContext.metrics.totalExecutionTime += transitionTime;
        updatedContext.metrics.averageEventProcessingTime =
          updatedContext.metrics.totalExecutionTime /
          updatedContext.metrics.eventsProcessed;

        // Update state metadata
        const stateMetadata = states[selectedTransition.target].metadata;
        stateMetadata.entryCount++;
        stateMetadata.lastEntered = new Date();

        if (context.previousState) {
          const previousStateMetadata = states[context.previousState].metadata;
          const stayDuration =
            Date.now() -
            (previousStateMetadata.lastEntered?.getTime() || Date.now());
          previousStateMetadata.averageStayDuration =
            (previousStateMetadata.averageStayDuration *
              (previousStateMetadata.entryCount - 1) +
              stayDuration) /
            previousStateMetadata.entryCount;
        }

        // Commit context changes
        setContext(updatedContext);

        result.success = true;
        result.newState = selectedTransition.target;
        result.metadata.transitionTime = transitionTime;

        // Phase 11: Process queued events if any
        if (eventQueue.length > 0) {
          const nextEvent = eventQueue[0];
          setEventQueue((prev) => prev.slice(1));

          // Schedule next event processing
          setTimeout(() => {
            processEvent(nextEvent);
          }, machineConfig.eventProcessingInterval || 100);
        }

        return result;
      } catch (globalError) {
        console.error("Global event processing error:", globalError);

        // Update error metrics
        setContext((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            errorsEncountered: prev.metrics.errorsEncountered + 1,
          },
        }));

        return {
          success: false,
          newState: context.currentState,
          executedActions: [],
          errors: [`Global processing error: ${globalError}`],
          warnings: [],
          metadata: {
            transitionTime: Date.now() - startTime,
            guardsEvaluated: 0,
            actionsExecuted: 0,
            conditionsChecked: 0,
          },
        };
      } finally {
        processingLockRef.current = false;
        setIsProcessing(false);
      }
    },
    [context, states, machineConfig, eventQueue]
  );

  // Event validation with complex business rules
  const validateEvent = async (
    event: StateEvent,
    context: StateMachineContext,
    currentState: StateDefinition
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> => {
    const result = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Basic event structure validation
    if (!event.type || typeof event.type !== "string") {
      result.valid = false;
      result.errors.push("Event type is required and must be a string");
    }

    if (!event.timestamp || !(event.timestamp instanceof Date)) {
      result.warnings.push("Event timestamp is missing or invalid");
    }

    if (
      typeof event.priority !== "number" ||
      event.priority < 0 ||
      event.priority > 10
    ) {
      result.warnings.push(
        "Event priority should be a number between 0 and 10"
      );
    }

    // Event type specific validation
    switch (event.type) {
      case "START":
        if (!context.flags.systemReady) {
          result.valid = false;
          result.errors.push("System not ready for start event");
        }
        break;

      case "CONFIGURE":
        if (!event.payload?.config) {
          result.valid = false;
          result.errors.push("Configuration payload is required");
        } else {
          const config = event.payload.config;
          if (!config.version || !config.settings) {
            result.valid = false;
            result.errors.push(
              "Configuration must include version and settings"
            );
          }
        }
        break;

      case "PROCESS_DATA":
        if (!event.payload?.data || !Array.isArray(event.payload.data)) {
          result.valid = false;
          result.errors.push("Data payload must be an array");
        } else if (event.payload.data.length === 0) {
          result.warnings.push("Empty data array provided");
        }
        break;

      case "BATCH_COMPLETE":
        if (!event.payload?.batchId) {
          result.valid = false;
          result.errors.push("Batch ID is required for batch complete events");
        }
        break;
    }

    // State-specific event validation
    if (
      currentState.type === "final" &&
      !["RESTART", "EXPORT"].includes(event.type)
    ) {
      result.valid = false;
      result.errors.push(
        `State '${currentState.id}' is final and only accepts RESTART or EXPORT events`
      );
    }

    if (currentState.type === "error" && event.type === "RETRY") {
      const errorData = context.stateData[currentState.id];
      if (errorData?.recoveryAttempts >= 3) {
        result.valid = false;
        result.errors.push("Maximum retry attempts exceeded");
      }
    }

    // Context-based validation
    if (
      context.locks.processing &&
      ["START", "PROCESS_DATA"].includes(event.type)
    ) {
      result.valid = false;
      result.errors.push(
        "Processing is locked, cannot accept processing events"
      );
    }

    // Rate limiting validation
    const recentEvents = context.eventHistory
      .filter((e) => Date.now() - e.timestamp.getTime() < 1000)
      .filter((e) => e.type === event.type);

    if (recentEvents.length > 10) {
      result.valid = false;
      result.errors.push(`Rate limit exceeded for event type '${event.type}'`);
    }

    return result;
  };

  // Complex action execution system
  const executeAction = async (
    actionName: string,
    context: StateMachineContext,
    event: StateEvent,
    phase: "entry" | "exit" | "transition"
  ): Promise<void> => {
    const actionStartTime = Date.now();

    switch (actionName) {
      case "logEntry":
        console.log(
          `[${phase.toUpperCase()}] Entering state: ${context.currentState}`
        );
        break;

      case "logExit":
        console.log(
          `[${phase.toUpperCase()}] Exiting state: ${context.previousState}`
        );
        break;

      case "initializeCounters":
        setContext((prev) => ({
          ...prev,
          counters: {
            ...prev.counters,
            initAttempts: 0,
            initRetries: 0,
            processingBatches: 0,
            errors: 0,
          },
        }));
        break;

      case "clearCache":
        setContext((prev) => ({
          ...prev,
          cache: {},
        }));
        break;

      case "setProcessingFlag":
        setContext((prev) => ({
          ...prev,
          flags: {
            ...prev.flags,
            processing: true,
          },
        }));
        break;

      case "incrementCounter":
        const counterName = event.payload?.counterName || "default";
        setContext((prev) => ({
          ...prev,
          counters: {
            ...prev.counters,
            [counterName]: (prev.counters[counterName] || 0) + 1,
          },
        }));
        break;

      case "validateConfiguration":
        if (event.payload?.config) {
          const config = event.payload.config;
          const validationResults: any = {};

          // Validate required fields
          const requiredFields = ["apiKey", "endpoint", "timeout"];
          requiredFields.forEach((field) => {
            if (!config[field]) {
              validationResults[field] = `${field} is required`;
            }
          });

          // Validate API endpoint
          if (config.endpoint) {
            try {
              new URL(config.endpoint);
            } catch {
              validationResults.endpoint = "Invalid URL format";
            }
          }

          // Validate timeout
          if (
            config.timeout &&
            (typeof config.timeout !== "number" || config.timeout < 1000)
          ) {
            validationResults.timeout = "Timeout must be a number >= 1000ms";
          }

          setContext((prev) => ({
            ...prev,
            stateData: {
              ...prev.stateData,
              configuring: {
                ...prev.stateData.configuring,
                validationResults,
              },
            },
          }));

          if (Object.keys(validationResults).length > 0) {
            throw new Error("Configuration validation failed");
          }
        }
        break;

      case "startInitialization":
        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            initializing: {
              ...prev.stateData.initializing,
              initSteps: [
                { name: "Check Dependencies", status: "pending" },
                { name: "Allocate Resources", status: "pending" },
                { name: "Load Configuration", status: "pending" },
                { name: "Initialize Services", status: "pending" },
              ],
              progress: 0,
            },
          },
        }));
        break;

      case "checkDependencies":
        // Simulate dependency checking
        const dependencies = [
          {
            name: "Database",
            status: Math.random() > 0.1 ? "ready" : "not_ready",
          },
          {
            name: "API Service",
            status: Math.random() > 0.05 ? "ready" : "not_ready",
          },
          {
            name: "Cache",
            status: Math.random() > 0.02 ? "ready" : "not_ready",
          },
        ];

        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            initializing: {
              ...prev.stateData.initializing,
              dependencies,
            },
          },
        }));

        // If any dependency is not ready, trigger error
        if (dependencies.some((dep) => dep.status !== "ready")) {
          setTimeout(() => {
            sendEvent({
              type: "INIT_ERROR",
              payload: { dependencies },
              timestamp: new Date(),
              priority: 8,
              metadata: { retryCount: 0, validationErrors: [] },
            });
          }, 1000);
        } else {
          setTimeout(() => {
            sendEvent({
              type: "DEPENDENCIES_READY",
              timestamp: new Date(),
              priority: 9,
              metadata: { retryCount: 0, validationErrors: [] },
            });
          }, 2000);
        }
        break;

      case "startProcessing":
        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            processing: {
              ...prev.stateData.processing,
              workers: [
                { id: "worker-1", status: "healthy", processed: 0 },
                { id: "worker-2", status: "healthy", processed: 0 },
                { id: "worker-3", status: "healthy", processed: 0 },
              ],
              queues: {
                high: [],
                normal: [],
                low: [],
              },
            },
          },
        }));
        break;

      case "processBatch":
        const batchSize = event.payload?.batchSize || 100;
        const processed = context.stateData.processing?.processed || 0;

        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            processing: {
              ...prev.stateData.processing,
              processed: processed + batchSize,
              lastBatchId: event.payload?.batchId,
            },
          },
          counters: {
            ...prev.counters,
            processingBatches: (prev.counters.processingBatches || 0) + 1,
          },
        }));
        break;

      case "logError":
        const errorInfo = {
          type: event.payload?.errorType || "unknown",
          message: event.payload?.message || "Unknown error",
          timestamp: new Date(),
          severity: event.payload?.severity || "medium",
          stackTrace: event.payload?.stackTrace,
        };

        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            error: {
              ...prev.stateData.error,
              errorInfo,
              lastError: errorInfo,
              errorHistory: [
                ...(prev.stateData.error?.errorHistory || []),
                errorInfo,
              ].slice(-50),
            },
          },
        }));
        break;

      case "incrementRecoveryAttempt":
        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            error: {
              ...prev.stateData.error,
              recoveryAttempts:
                (prev.stateData.error?.recoveryAttempts || 0) + 1,
            },
          },
        }));
        break;

      case "generateResults":
        const results = {
          totalProcessed: context.stateData.processing?.processed || 0,
          totalErrors: context.metrics.errorsEncountered,
          totalTransitions: context.metrics.stateTransitions,
          executionTime: context.metrics.totalExecutionTime,
          completionTime: new Date(),
          stateDistribution: context.metrics.stateDistribution,
        };

        setContext((prev) => ({
          ...prev,
          stateData: {
            ...prev.stateData,
            completed: {
              ...prev.stateData.completed,
              results,
              summary: {
                status: "success",
                duration:
                  Date.now() -
                  (prev.stateHistory[0] === "idle" ? Date.now() : Date.now()),
                efficiency:
                  results.totalProcessed / (results.executionTime || 1),
              },
            },
          },
        }));
        break;

      case "resetSystem":
        setContext((prev) => ({
          ...prev,
          currentState: "idle",
          previousState: null,
          stateHistory: ["idle"],
          eventHistory: [],
          globalData: {},
          stateData: { idle: states.idle?.data || {} },
          locks: {},
          counters: {},
          flags: {},
          cache: {},
          metrics: {
            stateTransitions: 0,
            eventsProcessed: 0,
            errorsEncountered: 0,
            totalExecutionTime: 0,
            averageEventProcessingTime: 0,
            stateDistribution: { idle: 1 },
          },
        }));
        break;

      default:
        console.warn(`Unknown action: ${actionName}`);
    }

    const actionDuration = Date.now() - actionStartTime;
    if (debugMode) {
      console.log(
        `[ACTION] ${actionName} executed in ${actionDuration}ms during ${phase} phase`
      );
    }
  };

  // Setup state timeouts
  const setupStateTimeouts = async (
    state: StateDefinition,
    context: StateMachineContext
  ): Promise<void> => {
    // Clear existing timers for this state
    Object.keys(context.timers).forEach((timerId) => {
      if (timerId.startsWith(`${state.id}_`)) {
        clearTimeout(context.timers[timerId]);
      }
    });

    // Setup new timers
    state.timeouts.forEach((timeout, index) => {
      const timerId = `${state.id}_${index}`;
      const timer = setTimeout(() => {
        sendEvent({
          type: timeout.event,
          timestamp: new Date(),
          priority: 5,
          source: "timeout",
          metadata: { retryCount: 0, validationErrors: [] },
        });

        if (timeout.repeat) {
          // Reschedule if repeat is enabled
          setupStateTimeouts(state, context);
        }
      }, timeout.duration);

      setContext((prev) => ({
        ...prev,
        timers: {
          ...prev.timers,
          [timerId]: timer,
        },
      }));
    });
  };

  // Handle parallel state entry
  const handleParallelStateEntry = async (
    state: StateDefinition,
    context: StateMachineContext,
    event: StateEvent
  ): Promise<void> => {
    if (!state.substates) return;

    // Enter all substates in parallel
    const substateEntries = Object.values(state.substates).map(
      async (substate) => {
        // Execute entry actions for each substate
        for (const actionName of substate.actions.onEntry) {
          try {
            await executeAction(actionName, context, event, "entry");
          } catch (error) {
            console.error(
              `Substate ${substate.id} entry action failed:`,
              error
            );
          }
        }
      }
    );

    await Promise.all(substateEntries);
  };

  // Send event helper function
  const sendEvent = useCallback(
    (event: Omit<StateEvent, "timestamp"> & { timestamp?: Date }) => {
      const fullEvent: StateEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
        metadata: {
          retryCount: 0,
          validationErrors: [],
          ...event.metadata,
        },
      };

      processEvent(fullEvent);
    },
    [processEvent]
  );

  // Generate visualization data
  const generateVisualizationData = useMemo(() => {
    const nodes = Object.values(states).map((state) => ({
      id: state.id,
      label: state.name,
      type: state.type,
      current: state.id === context.currentState,
      complexity: state.metadata.complexity,
      entryCount: state.metadata.entryCount,
    }));

    const edges: any[] = [];
    Object.values(states).forEach((state) => {
      Object.entries(state.transitions).forEach(([eventType, transitions]) => {
        transitions.forEach((transition) => {
          edges.push({
            from: state.id,
            to: transition.target,
            label: eventType,
            priority: transition.priority,
          });
        });
      });
    });

    return { nodes, edges };
  }, [states, context.currentState]);

  useEffect(() => {
    setVisualizationData(generateVisualizationData);
  }, [generateVisualizationData]);

  return (
    <div className="min-h-screen bg-[#303030] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Complex State Machine
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Demonstrates extremely high cognitive complexity (45+) and cyclomatic
          complexity (50+) state management system
        </p>

        {/* State Machine Status */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {context.currentState}
              </div>
              <div className="text-sm text-gray-400">Current State</div>
              <div className="text-xs text-gray-500 mt-1">
                {states[context.currentState]?.metadata.complexity || 0}{" "}
                complexity
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {context.metrics.stateTransitions}
              </div>
              <div className="text-sm text-gray-400">Transitions</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {context.metrics.averageEventProcessingTime.toFixed(2)}ms
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {context.metrics.eventsProcessed}
              </div>
              <div className="text-sm text-gray-400">Events Processed</div>
              <div className="text-xs text-gray-500 mt-1">
                Queue: {eventQueue.length}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">
                {context.metrics.errorsEncountered}
              </div>
              <div className="text-sm text-gray-400">Errors</div>
              <div className="text-xs text-gray-500 mt-1">
                {states[context.currentState]?.metadata.errorCount || 0} state
                errors
              </div>
            </div>

            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  isProcessing ? "text-yellow-400" : "text-gray-400"
                }`}
              >
                {isProcessing ? "ACTIVE" : "IDLE"}
              </div>
              <div className="text-sm text-gray-400">Processing Status</div>
              <div className="text-xs text-gray-500 mt-1">
                Lock: {processingLockRef.current ? "ON" : "OFF"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Controls */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">Event Controls</h2>

            <div className="space-y-4">
              <Button
                onClick={() => sendEvent({ type: "START", priority: 10 })}
                disabled={isProcessing || context.currentState !== "idle"}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start System
              </Button>

              <Button
                onClick={() =>
                  sendEvent({
                    type: "CONFIGURE",
                    payload: {
                      config: {
                        version: "2.0",
                        settings: {
                          apiKey: "test123",
                          endpoint: "https://api.example.com",
                          timeout: 5000,
                        },
                      },
                    },
                    priority: 8,
                  })
                }
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Configure System
              </Button>

              <Button
                onClick={() =>
                  sendEvent({
                    type: "PROCESS_DATA",
                    payload: {
                      data: new Array(100)
                        .fill(0)
                        .map((_, i) => ({ id: i, value: Math.random() })),
                    },
                    priority: 9,
                  })
                }
                disabled={
                  isProcessing ||
                  !["processing", "loading"].includes(context.currentState)
                }
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Process Data
              </Button>

              <Button
                onClick={() =>
                  sendEvent({
                    type: "BATCH_COMPLETE",
                    payload: { batchId: `batch_${Date.now()}`, batchSize: 100 },
                    priority: 7,
                  })
                }
                disabled={isProcessing || context.currentState !== "processing"}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Complete Batch
              </Button>

              <Button
                onClick={() =>
                  sendEvent({
                    type: "ERROR",
                    payload: {
                      errorType: "network",
                      message: "Simulated network error",
                      severity: "medium",
                    },
                    priority: 9,
                  })
                }
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Trigger Error
              </Button>

              <Button
                onClick={() => sendEvent({ type: "RESET", priority: 6 })}
                disabled={isProcessing}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                Reset System
              </Button>
            </div>

            {/* Custom Event */}
            <div className="mt-6 pt-6 border-t border-gray-600">
              <h3 className="text-lg font-medium mb-3">Custom Event</h3>
              <Input
                type="text"
                placeholder="Event Type (e.g., CUSTOM_EVENT)"
                className="mb-2 bg-gray-700 text-white border-gray-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      sendEvent({
                        type: target.value.trim().toUpperCase(),
                        priority: 5,
                      });
                      target.value = "";
                    }
                  }
                }}
              />
              <div className="text-xs text-gray-400">
                Press Enter to send custom event
              </div>
            </div>
          </div>

          {/* State Information */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">State Information</h2>

            {states[context.currentState] && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-400">
                    {states[context.currentState].name}
                  </h3>
                  <div className="text-sm text-gray-400 mt-1">
                    {states[context.currentState].metadata.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {states[context.currentState].type} | Complexity:{" "}
                    {states[context.currentState].metadata.complexity} |
                    Entries: {states[context.currentState].metadata.entryCount}
                  </div>
                </div>

                {/* Available Transitions */}
                <div>
                  <h4 className="font-medium mb-2">Available Transitions</h4>
                  <div className="space-y-1">
                    {Object.entries(
                      states[context.currentState].transitions
                    ).map(([event, transitions]) => (
                      <div key={event} className="text-sm">
                        <span className="text-green-400">{event}</span>
                        {transitions.map((transition, index) => (
                          <span key={index} className="text-gray-400 ml-2">
                            → {transition.target} (p:{transition.priority})
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* State Data */}
                <div>
                  <h4 className="font-medium mb-2">State Data</h4>
                  <div className="bg-gray-700 p-3 rounded text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(
                        context.stateData[context.currentState] || {},
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                {/* Active Timeouts */}
                <div>
                  <h4 className="font-medium mb-2">Active Timeouts</h4>
                  <div className="space-y-1">
                    {states[context.currentState].timeouts.map(
                      (timeout, index) => (
                        <div key={index} className="text-sm text-gray-400">
                          {timeout.event} in {timeout.duration}ms
                          {timeout.repeat && (
                            <span className="text-yellow-400">
                              {" "}
                              (repeating)
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Metrics and History */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">System Metrics</h2>

            {/* State Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">State Distribution</h3>
              {Object.entries(context.metrics.stateDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([state, count]) => (
                  <div
                    key={state}
                    className="flex justify-between items-center mb-2"
                  >
                    <span className="text-sm">{state}</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-600 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full"
                          style={{
                            width: `${
                              (count /
                                Math.max(
                                  ...Object.values(
                                    context.metrics.stateDistribution
                                  )
                                )) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 w-8">{count}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Recent Events */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Recent Events</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {context.eventHistory
                  .slice(-10)
                  .reverse()
                  .map((event, index) => (
                    <div
                      key={index}
                      className="text-sm bg-gray-700 p-2 rounded"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-green-400">{event.type}</span>
                        <span className="text-xs text-gray-400">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {event.source && (
                        <div className="text-xs text-gray-500">
                          Source: {event.source}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* State History */}
            <div>
              <h3 className="text-lg font-medium mb-3">State History</h3>
              <div className="text-sm text-gray-400">
                {context.stateHistory.slice(-10).join(" → ")}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        {debugMode && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6">Debug Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Context</h3>
                <div className="bg-gray-700 p-4 rounded text-xs max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        currentState: context.currentState,
                        previousState: context.previousState,
                        locks: context.locks,
                        counters: context.counters,
                        flags: context.flags,
                        metrics: context.metrics,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">
                  Machine Configuration
                </h3>
                <div className="bg-gray-700 p-4 rounded text-xs max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(machineConfig, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Toggle Debug Mode */}
            <div className="mt-4">
              <Button
                onClick={() => setDebugMode(!debugMode)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                {debugMode ? "Disable" : "Enable"} Debug Mode
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
