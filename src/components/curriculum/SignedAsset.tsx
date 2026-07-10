import { ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { extractCurriculumStoragePath, useSignedAssetUrl } from "@/hooks/useSignedAssetUrl";
import { Button } from "@/components/ui/button";

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
  const { data: url, isLoading, isError, isFetching, refetch } = useSignedAssetUrl(
    storagePath,
    lessonId,
  );
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !url) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border border-line bg-raised p-3 text-sm text-muted-foreground"
      >
        <span>This file couldn't be loaded.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={isFetching}
          onClick={() => refetch()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }
  return <>{children(url)}</>;
}