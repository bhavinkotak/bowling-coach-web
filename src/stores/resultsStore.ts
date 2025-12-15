import { create } from 'zustand';
import type { AnalysisResult, MultiVideoAnalysisResult } from '../types';

interface ResultsStore {
  results: Record<string, AnalysisResult>;
  multiResults: Record<string, MultiVideoAnalysisResult>;
  currentAnalysisId: string | null;
  
  setResult: (analysisId: string, result: AnalysisResult) => void;
  setMultiResult: (analysisId: string, result: MultiVideoAnalysisResult) => void;
  getResult: (analysisId: string) => AnalysisResult | undefined;
  getMultiResult: (analysisId: string) => MultiVideoAnalysisResult | undefined;
  setCurrentAnalysisId: (id: string | null) => void;
  clearResults: () => void;
}

export const useResultsStore = create<ResultsStore>((set, get) => ({
  results: {},
  multiResults: {},
  currentAnalysisId: null,
  
  setResult: (analysisId, result) =>
    set((state) => ({
      results: { ...state.results, [analysisId]: result },
    })),
  
  setMultiResult: (analysisId, result) =>
    set((state) => ({
      multiResults: { ...state.multiResults, [analysisId]: result },
    })),
  
  getResult: (analysisId) => get().results[analysisId],
  
  getMultiResult: (analysisId) => get().multiResults[analysisId],
  
  setCurrentAnalysisId: (id) => set({ currentAnalysisId: id }),
  
  clearResults: () => set({ results: {}, multiResults: {}, currentAnalysisId: null }),
}));
