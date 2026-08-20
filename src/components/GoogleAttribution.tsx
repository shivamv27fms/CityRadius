import type { GooglePhotoAttribution } from "../types";

export function GoogleAttribution({ attributions }: { attributions?: GooglePhotoAttribution[] }) {
  if (!attributions?.length) return <span className="google-attribution">Photo via Google</span>;
  return (
    <span className="google-attribution">
      Photo by{" "}
      {attributions.map((attribution, index) => (
        <span key={`${attribution.displayName}-${index}`}>
          {index > 0 ? ", " : ""}
          {attribution.uri ? (
            <a href={attribution.uri} target="_blank" rel="noreferrer">
              {attribution.displayName}
            </a>
          ) : (
            attribution.displayName
          )}
        </span>
      ))}
      {" · Google"}
    </span>
  );
}
