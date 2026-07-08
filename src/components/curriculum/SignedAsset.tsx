import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { extractCurriculumStoragePath, useSignedAssetUrl } from "@/hooks/useSignedAssetUrl";

type Props = {
  rawValue: string | null | undefined;
  lessonId: string | undefined;
  children: (resolvedUrl: string) => ReactNode;
  fallback?: ReactNode;
};

export function SignedAsset({ rawValue, lessonId, children, fallback = null }: Props) {
  const storagePath = extractCurriculumStoragePath(rawValue ?? null);
  if (rawValue && !storagePath) return <>{children(rawValue)}</>;
  if (!storagePath || !lessonId) return <>{fallback}</>;
  return (
    <SignedAssetInner storagePath={storagePath} lessonId={lessonId}>
      {children}
    </SignedAssetInner>
  );
}

function SignedAssetInner({
  storagePath,
  lessonId,
  children,
}: {
  storagePath: string;
  lessonId: string;
  children: (url: string) => ReactNode;
}) {
  const { data: url, isLoading, isError } = useSignedAssetUrl(storagePath, lessonId);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !url) {
    return <div className="text-sm text-muted-foreground">Asset unavailable.</div>;
  }
  return <>{children(url)}</>;
}