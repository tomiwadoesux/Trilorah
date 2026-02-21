import { useEffect, useState } from "react";
import { toFileUrl, toLegacyFileUrl } from "../../utils/slideToken";

interface LocalSlideImageProps {
  path: string;
  alt: string;
  className?: string;
  mode?: "auto" | "data";
}

export default function LocalSlideImage({
  path,
  alt,
  className,
  mode = "auto",
}: LocalSlideImageProps) {
  const [src, setSrc] = useState(() => toFileUrl(path));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (mode === "data") {
      setAttempt(2);
      setSrc("");
      (async () => {
        try {
          const dataUrl = await window.api?.readImageDataUrl(path);
          if (dataUrl) {
            setSrc(dataUrl);
          } else {
            setSrc(toLegacyFileUrl(path));
          }
        } catch {
          setSrc(toLegacyFileUrl(path));
        }
      })();
      return;
    }

    setSrc(toFileUrl(path));
    setAttempt(0);
  }, [path, mode]);

  const handleError = async () => {
    if (attempt === 0) {
      setAttempt(1);
      setSrc(toLegacyFileUrl(path));
      return;
    }

    if (attempt === 1) {
      setAttempt(2);
      try {
        const dataUrl = await window.api?.readImageDataUrl(path);
        if (dataUrl) {
          setSrc(dataUrl);
        }
      } catch {
        // Final fallback is broken image state.
      }
    }
  };

  return <img src={src} alt={alt} className={className} onError={handleError} />;
}
