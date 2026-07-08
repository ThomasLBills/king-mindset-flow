import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function extractCurriculumStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^(videos|audios|files|images)\//.test(value)) return value;
  const publicMatch = value.match(/\/storage\/v1\/object\/public\/curriculum-files\/(.+)$/);
  if (publicMatch) return decodeURIComponent(publicMatch[1]);
  const signMatch = value.match(/\/storage\/v1\/object\/sign\/curriculum-files\/([^?]+)/);
  if (signMatch) return decodeURIComponent(signMatch[1]);
  return null;
}

export function useSignedAssetUrl(storagePath: string | null, lessonId: string | undefined) {
  return useQuery({
    queryKey: ["signed-asset-url", lessonId, storagePath],
    enabled: !!storagePath && !!lessonId,
    staleTime: 8 * 60 * 1000,
    gcTime: 9 * 60 * 1000,
    retry: (failureCount, err: any) => {
      const status = err?.context?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-lesson-asset-url", {
        body: { path: storagePath, lessonId },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No URL returned");
      return data.url as string;
    },
  });
}