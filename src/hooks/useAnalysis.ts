import { useQuery } from '@tanstack/react-query';
import AnalysisService from '../services/analysis';
import { useResultsStore } from '../stores/resultsStore';
import type { AnalysisResult } from '../types';

interface UseAnalysisOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  onSuccess?: (data: AnalysisResult) => void;
  onError?: (error: Error) => void;
}

export function useAnalysisResult(
  analysisId: string | null,
  options: UseAnalysisOptions = {}
) {
  const { setResult } = useResultsStore();
  const {
    enabled = true,
    refetchInterval = 2000,
    onSuccess,
  } = options;

  const query = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      if (!analysisId) throw new Error('No analysis ID provided');
      const result = await AnalysisService.getAnalysisResult(analysisId);
      
      // Store result in Zustand
      setResult(analysisId, result);
      
      return result;
    },
    enabled: enabled && !!analysisId,
    refetchInterval: (query) => {
      // Stop polling if analysis is completed or failed
      const resultData = query.state.data;
      if (!resultData) return refetchInterval;
      if (resultData.status === 'completed' || resultData.status === 'failed') {
        // Call onSuccess ONE final time when status changes to completed
        if (resultData.status === 'completed' && onSuccess && !query.state.error) {
          // Use setTimeout to avoid calling during render
          setTimeout(() => onSuccess(resultData), 0);
        }
        return false;
      }
      return refetchInterval;
    },
    retry: 3,
    retryDelay: 1000,
  });

  return {
    result: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isPolling: query.isFetching && !query.isLoading,
  };
}

export function useMultiVideoResults(
  analysisId: string | null,
  options: UseAnalysisOptions = {}
) {
  const { setMultiResult } = useResultsStore();
  const {
    enabled = true,
    refetchInterval = 2000,
    onSuccess,
  } = options;

  const query = useQuery({
    queryKey: ['multi-analysis', analysisId],
    queryFn: async () => {
      if (!analysisId) throw new Error('No analysis ID provided');
      const result = await AnalysisService.getMultiVideoResults(analysisId);
      
      // Store result in Zustand
      setMultiResult(analysisId, result);
      
      return result;
    },
    enabled: enabled && !!analysisId,
    refetchInterval: (query) => {
      // Stop polling if analysis is completed or failed
      const resultData = query.state.data;
      if (!resultData) return refetchInterval;
      if (resultData.status === 'completed' || resultData.status === 'failed') {
        // Call onSuccess ONE final time when status changes to completed
        if (resultData.status === 'completed' && onSuccess && !query.state.error) {
          // Use setTimeout to avoid calling during render
          setTimeout(() => onSuccess(resultData as any), 0);
        }
        return false;
      }
      return refetchInterval;
    },
    retry: 3,
    retryDelay: 1000,
  });

  return {
    result: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isPolling: query.isFetching && !query.isLoading,
  };
}
