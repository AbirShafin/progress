type S141LogoProps = {
  className?: string;
};

const lightningPath = "M40 5 14 35h14l-6 24 28-35H36z";

export function S141Logo({ className }: S141LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="S141"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter
          id="s141-logo-glow"
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
        >
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <path id="s141-logo-path" d={lightningPath} />
      </defs>

      <path
        className="s141-logo-flash"
        d={lightningPath}
        pathLength="1"
        filter="url(#s141-logo-glow)"
      />
    </svg>
  );
}
