import type { IconName } from "../data/companyData";
export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    code: (
      <>
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" />
      </>
    ),
    cloud: (
      <>
        <path d="M7 18a5 5 0 0 1-1-9.9 6 6 0 0 1 11.7-1A5.5 5.5 0 0 1 18 18" />
        <path d="M12 12v9m-3-6 3-3 3 3" />
      </>
    ),
    design: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16M9 9v11m4-5 3-3 2 2-3 3-3 1z" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 10 5-10 5L2 8 12 3Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        n
      </span>
      nuvra<span className="brand-dot">.</span>
    </span>
  );
}
