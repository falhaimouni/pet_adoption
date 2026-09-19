import { ImgHTMLAttributes, useEffect, useState } from "react";
import { useAuthenticatedFileUrl } from "../lib/fileAccess";

interface AuthenticatedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback?: string;
}

export default function AuthenticatedImage({
  src,
  fallback = "",
  onError,
  ...props
}: AuthenticatedImageProps) {
  const resolvedSrc = useAuthenticatedFileUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc, fallback]);

  return (
    <img
      {...props}
      src={failed ? fallback : resolvedSrc || fallback}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
