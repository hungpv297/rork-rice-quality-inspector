import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { ScanResult } from '@/types';

const SCANS_STORAGE_KEY = '@ricequality_scans';
const MAX_SCANS = 100;

export const [ScanProvider, useScans] = createContextHook(() => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const queryClient = useQueryClient();

  const scansQuery = useQuery({
    queryKey: ['scan-history'],
    queryFn: async () => {
      console.log('[ScanContext] Loading scan history from storage');
      const stored = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ScanResult[];
        console.log('[ScanContext] Loaded', parsed.length, 'scans');
        return parsed;
      }
      return [];
    },
  });

  useEffect(() => {
    if (scansQuery.data) {
      setScans(scansQuery.data);
    }
  }, [scansQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (updatedScans: ScanResult[]) => {
      await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updatedScans));
      return updatedScans;
    },
    onSuccess: (updatedScans) => {
      setScans(updatedScans);
      queryClient.setQueryData(['scan-history'], updatedScans);
    },
  });

  const addScan = useCallback(
    (scan: ScanResult) => {
      console.log('[ScanContext] Adding scan:', scan.id);
      const updated = [scan, ...scans].slice(0, MAX_SCANS);
      saveMutation.mutate(updated);
    },
    [scans, saveMutation]
  );

  const deleteScan = useCallback(
    (id: string) => {
      console.log('[ScanContext] Deleting scan:', id);
      const updated = scans.filter((s) => s.id !== id);
      saveMutation.mutate(updated);
    },
    [scans, saveMutation]
  );

  const clearAllScans = useCallback(() => {
    console.log('[ScanContext] Clearing all scans');
    saveMutation.mutate([]);
  }, [saveMutation]);

  const getScanById = useCallback(
    (id: string) => scans.find((s) => s.id === id) ?? null,
    [scans]
  );

  const stats = useMemo(() => {
    const totalScans = scans.length;
    const avgBroken = totalScans > 0
      ? scans.reduce((sum, s) => sum + s.brokenPercent, 0) / totalScans
      : 0;
    const premiumCount = scans.filter(
      (s) => s.classifications.millingGrade === 'Premium'
    ).length;
    return { totalScans, avgBroken: Math.round(avgBroken * 10) / 10, premiumCount };
  }, [scans]);

  return {
    scans,
    isLoading: scansQuery.isLoading,
    addScan,
    deleteScan,
    clearAllScans,
    getScanById,
    stats,
  };
});
