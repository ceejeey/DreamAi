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

interface SearchCriteria {
  textQuery: string;
  filters: {
    category: string[];
    dateRange: { start: Date | null; end: Date | null };
    numericRange: { min: number | null; max: number | null; field: string };
    tags: { include: string[]; exclude: string[] };
    priority: { min: number; max: number };
    status: string[];
    customFilters: { [key: string]: any };
  };
  sorting: {
    primary: { field: string; direction: "asc" | "desc" };
    secondary: { field: string; direction: "asc" | "desc" } | null;
    tertiary: { field: string; direction: "asc" | "desc" } | null;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  searchMode: "fuzzy" | "exact" | "semantic" | "hybrid";
  boost: {
    titleBoost: number;
    contentBoost: number;
    tagBoost: number;
    freshnessBoost: number;
    popularityBoost: number;
  };
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdDate: Date;
  updatedDate: Date;
  priority: number;
  status: string;
  popularity: number;
  relevanceScore: number;
  highlightedContent: string;
  matchedFields: string[];
  metadata: {
    wordCount: number;
    readingTime: number;
    author: string;
    source: string;
    language: string;
    contentType: string;
  };
}

interface SearchIndex {
  terms: {
    [term: string]: {
      [docId: string]: { frequency: number; positions: number[] };
    };
  };
  documents: { [docId: string]: SearchResult };
  categories: { [category: string]: string[] };
  tags: { [tag: string]: string[] };
  dateIndex: { [dateKey: string]: string[] };
  ngrams: { [ngram: string]: string[] };
  synonyms: { [word: string]: string[] };
  stopWords: Set<string>;
}

export default function ComplexSearchEngine() {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    textQuery: "",
    filters: {
      category: [],
      dateRange: { start: null, end: null },
      numericRange: { min: null, max: null, field: "priority" },
      tags: { include: [], exclude: [] },
      priority: { min: 1, max: 5 },
      status: [],
      customFilters: {},
    },
    sorting: {
      primary: { field: "relevanceScore", direction: "desc" },
      secondary: null,
      tertiary: null,
    },
    pagination: {
      page: 1,
      pageSize: 10,
    },
    searchMode: "hybrid",
    boost: {
      titleBoost: 2.0,
      contentBoost: 1.0,
      tagBoost: 1.5,
      freshnessBoost: 0.5,
      popularityBoost: 0.3,
    },
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState<any>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [facets, setFacets] = useState<any>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize search index with sample data
  useEffect(() => {
    const initializeSearchIndex = () => {
      const sampleData: SearchResult[] = [
        {
          id: "doc1",
          title: "Advanced Machine Learning Techniques for Data Analysis",
          content:
            "This comprehensive guide explores advanced machine learning algorithms including neural networks, deep learning, and ensemble methods. We discuss feature engineering, model selection, and hyperparameter tuning strategies that can significantly improve your model performance.",
          category: "technology",
          tags: ["machine-learning", "data-science", "ai", "algorithms"],
          createdDate: new Date("2024-01-15"),
          updatedDate: new Date("2024-01-20"),
          priority: 5,
          status: "published",
          popularity: 95,
          relevanceScore: 0,
          highlightedContent: "",
          matchedFields: [],
          metadata: {
            wordCount: 850,
            readingTime: 4,
            author: "Dr. Sarah Chen",
            source: "Tech Blog",
            language: "en",
            contentType: "article",
          },
        },
        {
          id: "doc2",
          title: "Sustainable Energy Solutions for Modern Cities",
          content:
            "Urban planning requires innovative approaches to energy consumption. Solar panels, wind energy, and smart grid technologies are revolutionizing how cities manage their power needs. This article examines case studies from leading smart cities worldwide.",
          category: "environment",
          tags: ["sustainability", "energy", "urban-planning", "green-tech"],
          createdDate: new Date("2024-02-01"),
          updatedDate: new Date("2024-02-05"),
          priority: 4,
          status: "published",
          popularity: 78,
          relevanceScore: 0,
          highlightedContent: "",
          matchedFields: [],
          metadata: {
            wordCount: 1200,
            readingTime: 6,
            author: "Michael Rodriguez",
            source: "Environmental Journal",
            language: "en",
            contentType: "research",
          },
        },
        {
          id: "doc3",
          title: "The Future of Quantum Computing in Cryptography",
          content:
            "Quantum computers promise to revolutionize computing power, but they also pose significant challenges to current cryptographic methods. This paper discusses quantum-resistant algorithms and the timeline for quantum supremacy in various computational domains.",
          category: "technology",
          tags: ["quantum-computing", "cryptography", "security", "algorithms"],
          createdDate: new Date("2024-01-10"),
          updatedDate: new Date("2024-01-25"),
          priority: 5,
          status: "draft",
          popularity: 65,
          relevanceScore: 0,
          highlightedContent: "",
          matchedFields: [],
          metadata: {
            wordCount: 2100,
            readingTime: 10,
            author: "Prof. Alan Turing",
            source: "Computer Science Review",
            language: "en",
            contentType: "academic",
          },
        },
        {
          id: "doc4",
          title:
            "Modern Web Development: React, TypeScript, and Performance Optimization",
          content:
            "Building scalable web applications requires careful consideration of architecture, state management, and performance. This tutorial covers advanced React patterns, TypeScript best practices, and optimization techniques for large-scale applications.",
          category: "programming",
          tags: ["react", "typescript", "web-development", "performance"],
          createdDate: new Date("2024-02-10"),
          updatedDate: new Date("2024-02-12"),
          priority: 3,
          status: "published",
          popularity: 88,
          relevanceScore: 0,
          highlightedContent: "",
          matchedFields: [],
          metadata: {
            wordCount: 1500,
            readingTime: 8,
            author: "Emma Johnson",
            source: "Dev Community",
            language: "en",
            contentType: "tutorial",
          },
        },
        {
          id: "doc5",
          title: "Climate Change Impact on Global Food Security",
          content:
            "Rising temperatures and changing precipitation patterns are affecting agricultural productivity worldwide. This comprehensive analysis examines adaptation strategies, crop resilience, and policy recommendations for ensuring food security in the face of climate change.",
          category: "environment",
          tags: ["climate-change", "agriculture", "food-security", "policy"],
          createdDate: new Date("2024-01-05"),
          updatedDate: new Date("2024-01-30"),
          priority: 5,
          status: "published",
          popularity: 72,
          relevanceScore: 0,
          highlightedContent: "",
          matchedFields: [],
          metadata: {
            wordCount: 3200,
            readingTime: 15,
            author: "Dr. Maria Santos",
            source: "Climate Research",
            language: "en",
            contentType: "research",
          },
        },
      ];

      const index: SearchIndex = {
        terms: {},
        documents: {},
        categories: {},
        tags: {},
        dateIndex: {},
        ngrams: {},
        synonyms: {
          ai: ["artificial-intelligence", "machine-learning", "ml"],
          ml: ["machine-learning", "ai", "artificial-intelligence"],
          tech: ["technology", "technical"],
          env: ["environment", "environmental"],
          dev: ["development", "developer", "programming"],
        },
        stopWords: new Set([
          "the",
          "a",
          "an",
          "and",
          "or",
          "but",
          "in",
          "on",
          "at",
          "to",
          "for",
          "of",
          "with",
          "by",
          "is",
          "are",
          "was",
          "were",
          "be",
          "been",
          "have",
          "has",
          "had",
          "do",
          "does",
          "did",
          "will",
          "would",
          "could",
          "should",
          "may",
          "might",
          "can",
          "this",
          "that",
          "these",
          "those",
        ]),
      };

      // Build inverted index
      sampleData.forEach((doc) => {
        index.documents[doc.id] = doc;

        // Category index
        if (!index.categories[doc.category]) {
          index.categories[doc.category] = [];
        }
        index.categories[doc.category].push(doc.id);

        // Tag index
        doc.tags.forEach((tag) => {
          if (!index.tags[tag]) {
            index.tags[tag] = [];
          }
          index.tags[tag].push(doc.id);
        });

        // Date index
        const dateKey = doc.createdDate.toISOString().split("T")[0];
        if (!index.dateIndex[dateKey]) {
          index.dateIndex[dateKey] = [];
        }
        index.dateIndex[dateKey].push(doc.id);

        // Text processing for terms and n-grams
        const allText = `${doc.title} ${doc.content}`.toLowerCase();
        const words = allText.match(/\b\w+\b/g) || [];

        // Build term index
        words.forEach((word, position) => {
          if (!index.stopWords.has(word) && word.length > 2) {
            if (!index.terms[word]) {
              index.terms[word] = {};
            }
            if (!index.terms[word][doc.id]) {
              index.terms[word][doc.id] = { frequency: 0, positions: [] };
            }
            index.terms[word][doc.id].frequency++;
            index.terms[word][doc.id].positions.push(position);
          }
        });

        // Build n-gram index (bigrams and trigrams)
        for (let i = 0; i < words.length - 1; i++) {
          const bigram = `${words[i]} ${words[i + 1]}`;
          const trigram =
            i < words.length - 2
              ? `${words[i]} ${words[i + 1]} ${words[i + 2]}`
              : null;

          if (
            !index.stopWords.has(words[i]) &&
            !index.stopWords.has(words[i + 1])
          ) {
            if (!index.ngrams[bigram]) {
              index.ngrams[bigram] = [];
            }
            if (!index.ngrams[bigram].includes(doc.id)) {
              index.ngrams[bigram].push(doc.id);
            }
          }

          if (trigram && !index.stopWords.has(words[i + 2])) {
            if (!index.ngrams[trigram]) {
              index.ngrams[trigram] = [];
            }
            if (!index.ngrams[trigram].includes(doc.id)) {
              index.ngrams[trigram].push(doc.id);
            }
          }
        }
      });

      setSearchIndex(index);
    };

    initializeSearchIndex();
  }, []);

  // Complex search algorithm with extremely high cognitive complexity
  const performComplexSearch = useCallback(
    async (criteria: SearchCriteria): Promise<SearchResult[]> => {
      if (!searchIndex) return [];

      const startTime = Date.now();
      setIsSearching(true);

      try {
        const stats = {
          totalDocuments: Object.keys(searchIndex.documents).length,
          termMatches: 0,
          phraseMatches: 0,
          fuzzyMatches: 0,
          filterApplications: 0,
          scoringCalculations: 0,
          searchTime: 0,
        };

        let candidateDocuments: Set<string> = new Set();
        const scoringData: { [docId: string]: any } = {};

        // Initialize scoring data for all documents
        Object.keys(searchIndex.documents).forEach((docId) => {
          scoringData[docId] = {
            termScores: {},
            phraseScores: {},
            fuzzyScores: {},
            boostScores: {},
            finalScore: 0,
            matchedFields: new Set<string>(),
            highlightPositions: [],
          };
        });

        // Phase 1: Query processing and term extraction
        let processedQueries: string[] = [];
        if (criteria.textQuery.trim()) {
          const rawQuery = criteria.textQuery.toLowerCase().trim();

          // Handle quoted phrases
          const phrases = rawQuery.match(/"([^"]+)"/g) || [];
          let remainingQuery = rawQuery;

          phrases.forEach((phrase) => {
            const cleanPhrase = phrase.replace(/"/g, "");
            processedQueries.push(cleanPhrase);
            remainingQuery = remainingQuery.replace(phrase, "");
          });

          // Process remaining individual terms
          const individualTerms = remainingQuery.match(/\b\w+\b/g) || [];
          processedQueries.push(
            ...individualTerms.filter(
              (term) => !searchIndex.stopWords.has(term) && term.length > 2
            )
          );

          // Add synonym expansion
          const expandedQueries = [...processedQueries];
          processedQueries.forEach((term) => {
            if (searchIndex.synonyms[term]) {
              expandedQueries.push(...searchIndex.synonyms[term]);
            }
          });
          processedQueries = [...new Set(expandedQueries)];
        }

        // Phase 2: Document retrieval based on search mode
        if (processedQueries.length > 0) {
          switch (criteria.searchMode) {
            case "exact":
              await performExactSearch(
                processedQueries,
                candidateDocuments,
                scoringData,
                stats
              );
              break;
            case "fuzzy":
              await performFuzzySearch(
                processedQueries,
                candidateDocuments,
                scoringData,
                stats
              );
              break;
            case "semantic":
              await performSemanticSearch(
                processedQueries,
                candidateDocuments,
                scoringData,
                stats
              );
              break;
            case "hybrid":
            default:
              await performHybridSearch(
                processedQueries,
                candidateDocuments,
                scoringData,
                stats
              );
              break;
          }
        } else {
          // No text query - include all documents for filtering
          candidateDocuments = new Set(Object.keys(searchIndex.documents));
        }

        // Phase 3: Advanced filtering
        candidateDocuments = await applyComplexFilters(
          candidateDocuments,
          criteria,
          stats
        );

        // Phase 4: Scoring and ranking
        const scoredResults = await calculateComplexScores(
          candidateDocuments,
          scoringData,
          criteria,
          stats
        );

        // Phase 5: Sorting with multiple criteria
        const sortedResults = await performMultiCriteriaSorting(
          scoredResults,
          criteria,
          stats
        );

        // Phase 6: Pagination and result preparation
        const paginatedResults = await applyPaginationAndHighlighting(
          sortedResults,
          criteria,
          processedQueries,
          stats
        );

        // Update search statistics
        stats.searchTime = Date.now() - startTime;
        setSearchStats(stats);

        return paginatedResults;
      } catch (error) {
        console.error("Search error:", error);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [searchIndex]
  );

  // Exact search implementation
  const performExactSearch = async (
    queries: string[],
    candidateDocuments: Set<string>,
    scoringData: any,
    stats: any
  ) => {
    if (!searchIndex) return;

    for (const query of queries) {
      stats.termMatches++;

      // Direct term match
      if (searchIndex.terms[query]) {
        Object.keys(searchIndex.terms[query]).forEach((docId) => {
          candidateDocuments.add(docId);
          const termData = searchIndex.terms[query][docId];
          scoringData[docId].termScores[query] = {
            frequency: termData.frequency,
            positions: termData.positions,
            exactMatch: true,
          };
          scoringData[docId].matchedFields.add("content");
        });
      }

      // N-gram phrase matching
      if (searchIndex.ngrams[query]) {
        stats.phraseMatches++;
        searchIndex.ngrams[query].forEach((docId) => {
          candidateDocuments.add(docId);
          scoringData[docId].phraseScores[query] = {
            ngramMatch: true,
            boost: 1.5,
          };
          scoringData[docId].matchedFields.add("phrase");
        });
      }

      // Title matching (higher relevance)
      Object.keys(searchIndex.documents).forEach((docId) => {
        const doc = searchIndex.documents[docId];
        if (doc.title.toLowerCase().includes(query)) {
          candidateDocuments.add(docId);
          scoringData[docId].termScores[query] = {
            ...(scoringData[docId].termScores[query] || {}),
            titleMatch: true,
            boost: 2.0,
          };
          scoringData[docId].matchedFields.add("title");
        }
      });

      // Tag matching
      Object.keys(searchIndex.tags).forEach((tag) => {
        if (tag.includes(query) || query.includes(tag)) {
          searchIndex.tags[tag].forEach((docId) => {
            candidateDocuments.add(docId);
            scoringData[docId].termScores[query] = {
              ...(scoringData[docId].termScores[query] || {}),
              tagMatch: true,
              boost: 1.5,
            };
            scoringData[docId].matchedFields.add("tags");
          });
        }
      });
    }
  };

  // Fuzzy search implementation with edit distance
  const performFuzzySearch = async (
    queries: string[],
    candidateDocuments: Set<string>,
    scoringData: any,
    stats: any
  ) => {
    if (!searchIndex) return;

    const calculateEditDistance = (str1: string, str2: string): number => {
      const matrix = Array(str2.length + 1)
        .fill(null)
        .map(() => Array(str1.length + 1).fill(null));

      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + indicator
          );
        }
      }

      return matrix[str2.length][str1.length];
    };

    for (const query of queries) {
      stats.fuzzyMatches++;

      // Fuzzy matching against all terms
      Object.keys(searchIndex.terms).forEach((term) => {
        const distance = calculateEditDistance(query, term);
        const maxLength = Math.max(query.length, term.length);
        const similarity = 1 - distance / maxLength;

        if (similarity >= 0.7) {
          // Threshold for fuzzy match
          Object.keys(searchIndex.terms[term]).forEach((docId) => {
            candidateDocuments.add(docId);
            scoringData[docId].fuzzyScores[query] = {
              matchedTerm: term,
              similarity: similarity,
              distance: distance,
              frequency: searchIndex.terms[term][docId].frequency,
            };
            scoringData[docId].matchedFields.add("fuzzy");
          });
        }
      });

      // Fuzzy matching against document titles
      Object.keys(searchIndex.documents).forEach((docId) => {
        const doc = searchIndex.documents[docId];
        const titleWords = doc.title.toLowerCase().match(/\b\w+\b/g) || [];

        titleWords.forEach((word) => {
          const distance = calculateEditDistance(query, word);
          const similarity = 1 - distance / Math.max(query.length, word.length);

          if (similarity >= 0.8) {
            candidateDocuments.add(docId);
            scoringData[docId].fuzzyScores[query] = {
              ...(scoringData[docId].fuzzyScores[query] || {}),
              titleFuzzy: true,
              similarity: Math.max(
                scoringData[docId].fuzzyScores[query]?.similarity || 0,
                similarity
              ),
              boost: 1.5,
            };
            scoringData[docId].matchedFields.add("fuzzy-title");
          }
        });
      });
    }
  };

  // Semantic search implementation (simplified vector similarity)
  const performSemanticSearch = async (
    queries: string[],
    candidateDocuments: Set<string>,
    scoringData: any,
    stats: any
  ) => {
    if (!searchIndex) return;

    // Simplified semantic similarity using co-occurrence and context
    const semanticRelations: { [key: string]: string[] } = {
      machine: ["learning", "computer", "algorithm", "ai", "technology"],
      learning: ["machine", "ai", "algorithm", "neural", "training"],
      energy: ["power", "electricity", "renewable", "solar", "wind"],
      climate: ["environment", "weather", "temperature", "global", "change"],
      quantum: ["computing", "physics", "algorithm", "cryptography", "bits"],
      development: ["programming", "software", "coding", "application", "web"],
      security: ["safety", "protection", "encryption", "privacy", "defense"],
    };

    for (const query of queries) {
      const relatedTerms = semanticRelations[query] || [];

      // Search for semantically related terms
      relatedTerms.forEach((relatedTerm) => {
        if (searchIndex.terms[relatedTerm]) {
          Object.keys(searchIndex.terms[relatedTerm]).forEach((docId) => {
            candidateDocuments.add(docId);
            scoringData[docId].termScores[query] = {
              ...(scoringData[docId].termScores[query] || {}),
              semanticMatch: true,
              relatedTerm: relatedTerm,
              boost: 0.8, // Lower boost for semantic matches
            };
            scoringData[docId].matchedFields.add("semantic");
          });
        }
      });

      // Context-based matching (words appearing together)
      if (searchIndex.terms[query]) {
        const queryDocs = Object.keys(searchIndex.terms[query]);

        queryDocs.forEach((docId) => {
          candidateDocuments.add(docId);

          // Check for context words in the same document
          let contextScore = 0;
          Object.keys(searchIndex.terms).forEach((term) => {
            if (
              term !== query &&
              searchIndex.terms[term][docId] &&
              relatedTerms.includes(term)
            ) {
              contextScore += 0.1;
            }
          });

          scoringData[docId].termScores[query] = {
            ...(scoringData[docId].termScores[query] || {}),
            contextScore: contextScore,
            semanticBoost: contextScore > 0 ? 1.2 : 1.0,
          };
        });
      }
    }
  };

  // Hybrid search combining multiple approaches
  const performHybridSearch = async (
    queries: string[],
    candidateDocuments: Set<string>,
    scoringData: any,
    stats: any
  ) => {
    // Combine exact, fuzzy, and semantic search results
    await performExactSearch(queries, candidateDocuments, scoringData, stats);
    await performFuzzySearch(queries, candidateDocuments, scoringData, stats);
    await performSemanticSearch(
      queries,
      candidateDocuments,
      scoringData,
      stats
    );

    // Apply hybrid scoring adjustments
    candidateDocuments.forEach((docId) => {
      const hasExact = Object.keys(scoringData[docId].termScores).some(
        (term) => scoringData[docId].termScores[term].exactMatch
      );
      const hasFuzzy = Object.keys(scoringData[docId].fuzzyScores).length > 0;
      const hasSemantic = Object.keys(scoringData[docId].termScores).some(
        (term) => scoringData[docId].termScores[term].semanticMatch
      );

      // Boost documents that match multiple search types
      let hybridBoost = 1.0;
      if (hasExact && (hasFuzzy || hasSemantic)) hybridBoost += 0.3;
      if (hasExact && hasFuzzy && hasSemantic) hybridBoost += 0.2;

      scoringData[docId].boostScores.hybrid = hybridBoost;
    });
  };

  // Complex filtering system
  const applyComplexFilters = async (
    candidateDocuments: Set<string>,
    criteria: SearchCriteria,
    stats: any
  ): Promise<Set<string>> => {
    if (!searchIndex) return candidateDocuments;

    let filteredDocuments = new Set(candidateDocuments);

    // Category filtering
    if (criteria.filters.category.length > 0) {
      stats.filterApplications++;
      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          return criteria.filters.category.includes(doc.category);
        })
      );
    }

    // Date range filtering
    if (criteria.filters.dateRange.start || criteria.filters.dateRange.end) {
      stats.filterApplications++;
      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          const docDate = new Date(doc.createdDate);

          if (
            criteria.filters.dateRange.start &&
            docDate < criteria.filters.dateRange.start
          ) {
            return false;
          }
          if (
            criteria.filters.dateRange.end &&
            docDate > criteria.filters.dateRange.end
          ) {
            return false;
          }
          return true;
        })
      );
    }

    // Priority range filtering
    if (
      criteria.filters.priority.min > 1 ||
      criteria.filters.priority.max < 5
    ) {
      stats.filterApplications++;
      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          return (
            doc.priority >= criteria.filters.priority.min &&
            doc.priority <= criteria.filters.priority.max
          );
        })
      );
    }

    // Status filtering
    if (criteria.filters.status.length > 0) {
      stats.filterApplications++;
      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          return criteria.filters.status.includes(doc.status);
        })
      );
    }

    // Tag inclusion filtering
    if (criteria.filters.tags.include.length > 0) {
      stats.filterApplications++;
      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          return criteria.filters.tags.include.some((tag) =>
            doc.tags.includes(tag)
          );
        })
      );
    }

    // Tag exclusion filtering
    if (criteria.filters.tags.exclude.length > 0) {
      stats.filterApplications++;
      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          return !criteria.filters.tags.exclude.some((tag) =>
            doc.tags.includes(tag)
          );
        })
      );
    }

    // Numeric range filtering
    if (
      criteria.filters.numericRange.min !== null ||
      criteria.filters.numericRange.max !== null
    ) {
      stats.filterApplications++;
      const field = criteria.filters.numericRange.field;

      filteredDocuments = new Set(
        [...filteredDocuments].filter((docId) => {
          const doc = searchIndex.documents[docId];
          let value: number;

          switch (field) {
            case "priority":
              value = doc.priority;
              break;
            case "popularity":
              value = doc.popularity;
              break;
            case "wordCount":
              value = doc.metadata.wordCount;
              break;
            case "readingTime":
              value = doc.metadata.readingTime;
              break;
            default:
              return true;
          }

          if (
            criteria.filters.numericRange.min !== null &&
            value < criteria.filters.numericRange.min
          ) {
            return false;
          }
          if (
            criteria.filters.numericRange.max !== null &&
            value > criteria.filters.numericRange.max
          ) {
            return false;
          }
          return true;
        })
      );
    }

    return filteredDocuments;
  };

  // Complex scoring algorithm
  const calculateComplexScores = async (
    candidateDocuments: Set<string>,
    scoringData: any,
    criteria: SearchCriteria,
    stats: any
  ): Promise<SearchResult[]> => {
    if (!searchIndex) return [];

    const results: SearchResult[] = [];

    for (const docId of candidateDocuments) {
      stats.scoringCalculations++;
      const doc = { ...searchIndex.documents[docId] };
      const scoring = scoringData[docId];

      let totalScore = 0;

      // Term frequency scoring
      let termScore = 0;
      Object.values(scoring.termScores).forEach((termData: any) => {
        let score = Math.log(1 + (termData.frequency || 1));

        if (termData.exactMatch) score *= 2.0;
        if (termData.titleMatch) score *= criteria.boost.titleBoost;
        if (termData.tagMatch) score *= criteria.boost.tagBoost;
        if (termData.semanticMatch) score *= termData.semanticBoost || 1.0;

        termScore += score;
      });

      // Fuzzy matching scoring
      let fuzzyScore = 0;
      Object.values(scoring.fuzzyScores).forEach((fuzzyData: any) => {
        let score = fuzzyData.similarity * (fuzzyData.frequency || 1);
        if (fuzzyData.titleFuzzy) score *= 1.5;
        fuzzyScore += score;
      });

      // Phrase matching bonus
      let phraseScore = 0;
      Object.values(scoring.phraseScores).forEach((phraseData: any) => {
        if (phraseData.ngramMatch) phraseScore += phraseData.boost;
      });

      // Popularity and freshness scoring
      const popularityScore =
        (doc.popularity / 100) * criteria.boost.popularityBoost;

      const daysSinceCreation =
        (Date.now() - doc.createdDate.getTime()) / (1000 * 60 * 60 * 24);
      const freshnessScore =
        Math.exp(-daysSinceCreation / 30) * criteria.boost.freshnessBoost;

      // Priority scoring
      const priorityScore = (doc.priority / 5) * 0.5;

      // Combine all scores
      totalScore =
        termScore +
        fuzzyScore +
        phraseScore +
        popularityScore +
        freshnessScore +
        priorityScore;

      // Apply hybrid boost
      if (scoring.boostScores.hybrid) {
        totalScore *= scoring.boostScores.hybrid;
      }

      // Content quality adjustments
      const wordCountScore = Math.min(doc.metadata.wordCount / 1000, 2) * 0.1;
      totalScore += wordCountScore;

      // Adjust for document type
      switch (doc.metadata.contentType) {
        case "research":
          totalScore *= 1.2;
          break;
        case "tutorial":
          totalScore *= 1.1;
          break;
        case "academic":
          totalScore *= 1.15;
          break;
      }

      doc.relevanceScore = Math.max(0, totalScore);
      doc.matchedFields = Array.from(scoring.matchedFields);

      results.push(doc);
    }

    return results;
  };

  // Multi-criteria sorting
  const performMultiCriteriaSorting = async (
    results: SearchResult[],
    criteria: SearchCriteria,
    stats: any
  ): Promise<SearchResult[]> => {
    return results.sort((a, b) => {
      // Primary sorting
      let comparison = compareByField(
        a,
        b,
        criteria.sorting.primary.field,
        criteria.sorting.primary.direction
      );

      if (comparison === 0 && criteria.sorting.secondary) {
        // Secondary sorting
        comparison = compareByField(
          a,
          b,
          criteria.sorting.secondary.field,
          criteria.sorting.secondary.direction
        );

        if (comparison === 0 && criteria.sorting.tertiary) {
          // Tertiary sorting
          comparison = compareByField(
            a,
            b,
            criteria.sorting.tertiary.field,
            criteria.sorting.tertiary.direction
          );
        }
      }

      return comparison;
    });
  };

  // Helper function for field comparison
  const compareByField = (
    a: SearchResult,
    b: SearchResult,
    field: string,
    direction: "asc" | "desc"
  ): number => {
    let valueA: any, valueB: any;

    switch (field) {
      case "relevanceScore":
        valueA = a.relevanceScore;
        valueB = b.relevanceScore;
        break;
      case "createdDate":
        valueA = a.createdDate.getTime();
        valueB = b.createdDate.getTime();
        break;
      case "updatedDate":
        valueA = a.updatedDate.getTime();
        valueB = b.updatedDate.getTime();
        break;
      case "priority":
        valueA = a.priority;
        valueB = b.priority;
        break;
      case "popularity":
        valueA = a.popularity;
        valueB = b.popularity;
        break;
      case "title":
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case "wordCount":
        valueA = a.metadata.wordCount;
        valueB = b.metadata.wordCount;
        break;
      default:
        return 0;
    }

    let comparison = 0;
    if (valueA < valueB) comparison = -1;
    else if (valueA > valueB) comparison = 1;

    return direction === "desc" ? -comparison : comparison;
  };

  // Pagination and highlighting
  const applyPaginationAndHighlighting = async (
    results: SearchResult[],
    criteria: SearchCriteria,
    queries: string[],
    stats: any
  ): Promise<SearchResult[]> => {
    const startIndex =
      (criteria.pagination.page - 1) * criteria.pagination.pageSize;
    const endIndex = startIndex + criteria.pagination.pageSize;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Apply text highlighting
    paginatedResults.forEach((result) => {
      let highlightedContent = result.content;

      queries.forEach((query) => {
        if (query.length > 2) {
          const regex = new RegExp(`\\b(${query})\\b`, "gi");
          highlightedContent = highlightedContent.replace(
            regex,
            "<mark>$1</mark>"
          );
        }
      });

      result.highlightedContent = highlightedContent;
    });

    return paginatedResults;
  };

  // Debounced search execution
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performComplexSearch(searchCriteria).then(setSearchResults);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchCriteria, performComplexSearch]);

  // Generate search suggestions
  const generateSuggestions = useCallback(
    (query: string) => {
      if (!searchIndex || query.length < 2) {
        setSuggestions([]);
        return;
      }

      const suggestions: string[] = [];
      const queryLower = query.toLowerCase();

      // Term suggestions
      Object.keys(searchIndex.terms).forEach((term) => {
        if (term.startsWith(queryLower) && term !== queryLower) {
          suggestions.push(term);
        }
      });

      // Tag suggestions
      Object.keys(searchIndex.tags).forEach((tag) => {
        if (tag.includes(queryLower)) {
          suggestions.push(tag);
        }
      });

      // Category suggestions
      Object.keys(searchIndex.categories).forEach((category) => {
        if (category.includes(queryLower)) {
          suggestions.push(category);
        }
      });

      setSuggestions(suggestions.slice(0, 10));
    },
    [searchIndex]
  );

  // Calculate facets for filtering
  const calculateFacets = useMemo(() => {
    if (!searchIndex) return {};

    const facets: any = {
      categories: {},
      tags: {},
      status: {},
      contentType: {},
      authors: {},
    };

    Object.values(searchIndex.documents).forEach((doc) => {
      // Category facets
      facets.categories[doc.category] =
        (facets.categories[doc.category] || 0) + 1;

      // Tag facets
      doc.tags.forEach((tag) => {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      });

      // Status facets
      facets.status[doc.status] = (facets.status[doc.status] || 0) + 1;

      // Content type facets
      facets.contentType[doc.metadata.contentType] =
        (facets.contentType[doc.metadata.contentType] || 0) + 1;

      // Author facets
      facets.authors[doc.metadata.author] =
        (facets.authors[doc.metadata.author] || 0) + 1;
    });

    return facets;
  }, [searchIndex]);

  useEffect(() => {
    setFacets(calculateFacets);
  }, [calculateFacets]);

  return (
    <div className="min-h-screen bg-[#303030] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Complex Search Engine
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Demonstrates extremely high cognitive complexity (30+) and cyclomatic
          complexity (40+) search algorithms
        </p>

        {/* Search Interface */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Query */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Search Query
              </label>
              <Input
                type="text"
                value={searchCriteria.textQuery}
                onChange={(e) => {
                  setSearchCriteria((prev) => ({
                    ...prev,
                    textQuery: e.target.value,
                  }));
                  generateSuggestions(e.target.value);
                }}
                className="bg-gray-700 text-white border-gray-600"
                placeholder="Enter search terms, use quotes for exact phrases..."
              />

              {suggestions.length > 0 && (
                <div className="mt-2 bg-gray-700 rounded border border-gray-600 max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-sm"
                      onClick={() => {
                        setSearchCriteria((prev) => ({
                          ...prev,
                          textQuery: suggestion,
                        }));
                        setSuggestions([]);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Search Mode
              </label>
              <select
                value={searchCriteria.searchMode}
                onChange={(e) =>
                  setSearchCriteria((prev) => ({
                    ...prev,
                    searchMode: e.target.value as any,
                  }))
                }
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2"
              >
                <option value="hybrid">Hybrid</option>
                <option value="exact">Exact Match</option>
                <option value="fuzzy">Fuzzy Search</option>
                <option value="semantic">Semantic Search</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Categories
              </label>
              <select
                multiple
                value={searchCriteria.filters.category}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setSearchCriteria((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, category: selected },
                  }));
                }}
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2 h-24"
              >
                {Object.keys(facets.categories || {}).map((category) => (
                  <option key={category} value={category}>
                    {category} ({facets.categories[category]})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                multiple
                value={searchCriteria.filters.status}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setSearchCriteria((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, status: selected },
                  }));
                }}
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2 h-24"
              >
                {Object.keys(facets.status || {}).map((status) => (
                  <option key={status} value={status}>
                    {status} ({facets.status[status]})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Priority Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={searchCriteria.filters.priority.min}
                  onChange={(e) =>
                    setSearchCriteria((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        priority: {
                          ...prev.filters.priority,
                          min: parseInt(e.target.value) || 1,
                        },
                      },
                    }))
                  }
                  className="bg-gray-700 text-white border-gray-600 text-sm"
                  placeholder="Min"
                />
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={searchCriteria.filters.priority.max}
                  onChange={(e) =>
                    setSearchCriteria((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        priority: {
                          ...prev.filters.priority,
                          max: parseInt(e.target.value) || 5,
                        },
                      },
                    }))
                  }
                  className="bg-gray-700 text-white border-gray-600 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={searchCriteria.sorting.primary.field}
                onChange={(e) =>
                  setSearchCriteria((prev) => ({
                    ...prev,
                    sorting: {
                      ...prev.sorting,
                      primary: {
                        ...prev.sorting.primary,
                        field: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full bg-gray-700 text-white border-gray-600 rounded px-3 py-2"
              >
                <option value="relevanceScore">Relevance</option>
                <option value="createdDate">Date Created</option>
                <option value="updatedDate">Date Updated</option>
                <option value="priority">Priority</option>
                <option value="popularity">Popularity</option>
                <option value="title">Title</option>
                <option value="wordCount">Word Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Statistics */}
        {searchStats.searchTime > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">Search Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {searchResults.length}
                </div>
                <div className="text-gray-400">Results</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {searchStats.searchTime}ms
                </div>
                <div className="text-gray-400">Search Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {searchStats.termMatches}
                </div>
                <div className="text-gray-400">Term Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {searchStats.fuzzyMatches}
                </div>
                <div className="text-gray-400">Fuzzy Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {searchStats.filterApplications}
                </div>
                <div className="text-gray-400">Filters Applied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">
                  {searchStats.scoringCalculations}
                </div>
                <div className="text-gray-400">Score Calculations</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Faceted Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-4 rounded-lg sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Refine Results</h3>

              {/* Categories Facet */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Categories</h4>
                {Object.entries(facets.categories || {}).map(
                  ([category, count]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center text-sm mb-1"
                    >
                      <span className="text-gray-300">{category}</span>
                      <span className="text-gray-500">({count})</span>
                    </div>
                  )
                )}
              </div>

              {/* Content Types Facet */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Content Types</h4>
                {Object.entries(facets.contentType || {}).map(
                  ([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center text-sm mb-1"
                    >
                      <span className="text-gray-300">{type}</span>
                      <span className="text-gray-500">({count})</span>
                    </div>
                  )
                )}
              </div>

              {/* Authors Facet */}
              <div>
                <h4 className="font-medium mb-2">Authors</h4>
                {Object.entries(facets.authors || {})
                  .slice(0, 5)
                  .map(([author, count]) => (
                    <div
                      key={author}
                      className="flex justify-between items-center text-sm mb-1"
                    >
                      <span className="text-gray-300 truncate">{author}</span>
                      <span className="text-gray-500">({count})</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="lg:col-span-3">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="text-2xl">Searching...</div>
                <div className="text-gray-400">
                  Processing complex search algorithms
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {searchResults.map((result) => (
                  <div key={result.id} className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-blue-400">
                        {result.title}
                      </h3>
                      <div className="text-right text-sm">
                        <div className="text-green-400 font-bold">
                          Score: {result.relevanceScore.toFixed(2)}
                        </div>
                        <div className="text-gray-400">
                          Priority: {result.priority}/5
                        </div>
                      </div>
                    </div>

                    <div className="text-gray-300 mb-3">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            result.highlightedContent.substring(0, 300) + "...",
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                        {result.category}
                      </span>
                      {result.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          result.status === "published"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400">
                      <div>
                        By {result.metadata.author} •{" "}
                        {result.metadata.wordCount} words •
                        {result.metadata.readingTime} min read
                      </div>
                      <div>
                        Created: {result.createdDate.toLocaleDateString()} •
                        Matched: {result.matchedFields.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-2xl mb-2">No results found</div>
                    <div className="text-gray-400">
                      Try adjusting your search criteria
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {searchResults.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setSearchCriteria((prev) => ({
                        ...prev,
                        pagination: {
                          ...prev.pagination,
                          page: Math.max(1, prev.pagination.page - 1),
                        },
                      }))
                    }
                    disabled={searchCriteria.pagination.page === 1}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Previous
                  </Button>

                  <span className="px-4 py-2 bg-gray-700 rounded">
                    Page {searchCriteria.pagination.page}
                  </span>

                  <Button
                    onClick={() =>
                      setSearchCriteria((prev) => ({
                        ...prev,
                        pagination: {
                          ...prev.pagination,
                          page: prev.pagination.page + 1,
                        },
                      }))
                    }
                    disabled={
                      searchResults.length < searchCriteria.pagination.pageSize
                    }
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
