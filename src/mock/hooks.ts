/**
 * TanStack Query hooks over the mock service layer. UI consumes only these,
 * so pointing them at real Supabase services later is a drop-in change.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { CheckIn, RhythmKind } from "./types";

export const qk = {
  standard: ["standard"] as const,
  path: ["path"] as const,
  verseOfDay: ["verse-of-day"] as const,
  sideVerse: ["side-verse"] as const,
  fightingVerses: ["fighting-verses"] as const,
  group: ["group"] as const,
  banner: ["banner"] as const,
  weekStats: ["week-stats"] as const,
  channels: ["channels"] as const,
  dms: ["dms"] as const,
  messages: (threadId: string) => ["messages", threadId] as const,
  weeks: ["weeks"] as const,
  lesson: (id: string) => ["lesson", id] as const,
  rhythms: ["rhythms"] as const,
  billing: ["billing"] as const,
  declarations: ["declarations"] as const,
};

export const useStandard = () => useQuery({ queryKey: qk.standard, queryFn: api.getStandard });
export const usePath = () => useQuery({ queryKey: qk.path, queryFn: api.getPath });
export const useVerseOfDay = () => useQuery({ queryKey: qk.verseOfDay, queryFn: api.getVerseOfDay });
export const useSideVerse = () => useQuery({ queryKey: qk.sideVerse, queryFn: api.getSideVerse });
export const useFightingVerses = () =>
  useQuery({ queryKey: qk.fightingVerses, queryFn: api.getFightingVerses });
export const useGroup = () => useQuery({ queryKey: qk.group, queryFn: api.getGroup });
export const useBanner = () => useQuery({ queryKey: qk.banner, queryFn: api.getBanner });
export const useWeekStats = () => useQuery({ queryKey: qk.weekStats, queryFn: api.getWeekStats });
export const useChannels = () => useQuery({ queryKey: qk.channels, queryFn: api.getChannels });
export const useDms = () => useQuery({ queryKey: qk.dms, queryFn: api.getDms });
export const useMessages = (threadId: string | null) =>
  useQuery({
    queryKey: qk.messages(threadId ?? "none"),
    queryFn: () => api.getMessages(threadId!),
    enabled: !!threadId,
  });
export const useWeeks = () => useQuery({ queryKey: qk.weeks, queryFn: api.getWeeks });
export const useLesson = (id: string | undefined) =>
  useQuery({ queryKey: qk.lesson(id ?? "none"), queryFn: () => api.getLesson(id!), enabled: !!id });
export const useRhythms = () => useQuery({ queryKey: qk.rhythms, queryFn: api.getRhythms });
export const useBilling = () => useQuery({ queryKey: qk.billing, queryFn: api.getBilling });

export const useCompleteCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CheckIn, "dateISO">) => api.completeCheckIn(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.path }),
  });
};

export const useCompleteReflection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.completeReflection,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.path }),
  });
};

export const useSendStrength = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sendStrength,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.banner });
      qc.invalidateQueries({ queryKey: qk.weekStats });
    },
  });
};

export const useRaiseBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brotherIds, template }: { brotherIds: string[]; template: string }) =>
      api.raiseBanner(brotherIds, template),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.weekStats }),
  });
};

export const useDeclarations = () =>
  useQuery({ queryKey: qk.declarations, queryFn: api.getDeclarations });

export const useAddDeclaration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.addDeclaration(text),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.declarations }),
  });
};

export const useRecordFall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.recordFall,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.standard }),
  });
};

export const useLogRedirect = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.logRedirect,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.weekStats }),
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      threadId,
      body,
      author,
    }: {
      threadId: string;
      body: string;
      author: { name: string; initials: string };
    }) => api.sendMessage(threadId, body, author),
    onSuccess: (_msg, { threadId }) => {
      qc.invalidateQueries({ queryKey: qk.messages(threadId) });
      qc.invalidateQueries({ queryKey: qk.dms });
    },
  });
};

export const useMarkThreadRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => api.markThreadRead(threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.channels });
      qc.invalidateQueries({ queryKey: qk.dms });
    },
  });
};

export const useCompleteLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeLesson(id),
    onSuccess: (_lesson, id) => {
      qc.invalidateQueries({ queryKey: qk.lesson(id) });
      qc.invalidateQueries({ queryKey: qk.weeks });
      qc.invalidateQueries({ queryKey: qk.path });
      qc.invalidateQueries({ queryKey: qk.weekStats });
    },
  });
};

export const useCompleteRhythm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: RhythmKind) => api.completeRhythm(kind),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rhythms }),
  });
};
