import { useState, useEffect, useMemo } from "react";

interface DailyContentState<T> {
  date: string;
  selectedIndex: number;
  recentIndices: number[]; // Last 21 used indices
}

interface UseDailyContentOptions<T> {
  key: string; // localStorage key
  items: T[];
  recentWindowSize?: number; // Default 21
}

interface UseDailyContentReturn<T> {
  todayContent: T;
  isLoading: boolean;
}

const getLocalDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const selectRandomIndex = (totalItems: number, recentIndices: number[]): number => {
  // Get available indices (not used in recent window)
  const availableIndices = Array.from({ length: totalItems }, (_, i) => i)
    .filter((i) => !recentIndices.includes(i));

  // If all items have been used recently, pick from all
  const pool = availableIndices.length > 0 ? availableIndices : Array.from({ length: totalItems }, (_, i) => i);
  
  return pool[Math.floor(Math.random() * pool.length)];
};

export function useDailyContent<T>({
  key,
  items,
  recentWindowSize = 21,
}: UseDailyContentOptions<T>): UseDailyContentReturn<T> {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<DailyContentState<T> | null>(null);

  useEffect(() => {
    const storageKey = `faith-daily-${key}`;
    const today = getLocalDateString();

    try {
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed: DailyContentState<T> = JSON.parse(stored);
        
        // If it's still the same day, use stored content
        if (parsed.date === today) {
          setState(parsed);
          setIsLoading(false);
          return;
        }
      }

      // New day - select new content
      const previousState: DailyContentState<T> | null = stored ? JSON.parse(stored) : null;
      const recentIndices = previousState?.recentIndices || [];
      
      const newIndex = selectRandomIndex(items.length, recentIndices);
      
      // Update recent indices (keep last N, add new one)
      const updatedRecent = [...recentIndices, newIndex].slice(-recentWindowSize);

      const newState: DailyContentState<T> = {
        date: today,
        selectedIndex: newIndex,
        recentIndices: updatedRecent,
      };

      localStorage.setItem(storageKey, JSON.stringify(newState));
      setState(newState);
      setIsLoading(false);
    } catch (error) {
      console.error(`Error loading daily content for ${key}:`, error);
      // Fallback: just pick random
      setState({
        date: today,
        selectedIndex: Math.floor(Math.random() * items.length),
        recentIndices: [],
      });
      setIsLoading(false);
    }
  }, [key, items.length, recentWindowSize]);

  const todayContent = useMemo(() => {
    if (!state) return items[0];
    return items[state.selectedIndex] || items[0];
  }, [state, items]);

  return { todayContent, isLoading };
}

// Hook for daily completion tracking
interface DailyCompletionState {
  date: string;
  completed: Record<string, boolean>;
}

interface UseDailyCompletionReturn {
  isCompleted: (itemId: string) => boolean;
  markCompleted: (itemId: string) => void;
  completedCount: number;
  totalItems: number;
}

export function useDailyCompletion(
  storageKey: string,
  itemIds: string[]
): UseDailyCompletionReturn {
  const [state, setState] = useState<DailyCompletionState>(() => {
    const today = getLocalDateString();
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: DailyCompletionState = JSON.parse(stored);
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading completion state:", error);
    }
    
    // New day or no data
    return { date: today, completed: {} };
  });

  const isCompleted = (itemId: string): boolean => {
    return state.completed[itemId] === true;
  };

  const markCompleted = (itemId: string): void => {
    const today = getLocalDateString();
    
    setState((prev) => {
      // Check if it's a new day
      if (prev.date !== today) {
        const newState = { date: today, completed: { [itemId]: true } };
        localStorage.setItem(storageKey, JSON.stringify(newState));
        return newState;
      }
      
      const newState = {
        ...prev,
        completed: { ...prev.completed, [itemId]: true },
      };
      localStorage.setItem(storageKey, JSON.stringify(newState));
      return newState;
    });
  };

  const completedCount = itemIds.filter((id) => isCompleted(id)).length;

  return {
    isCompleted,
    markCompleted,
    completedCount,
    totalItems: itemIds.length,
  };
}
