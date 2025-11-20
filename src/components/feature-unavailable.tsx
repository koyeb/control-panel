export function FeatureUnavailable({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-md border p-6">
      {children}
      <Background className="absolute right-2 bottom-0 h-full max-lg:hidden" />
    </div>
  );
}

function Background({ className }: { className?: string }) {
  return (
    <svg
      width="307"
      height="234"
      viewBox="0 0 307 234"
      xmlns="http://www.w3.org/2000/svg"
      fill="#00bc7d"
      fillOpacity="0.05"
      stroke="#00bc7d"
      strokeOpacity="0.15"
      className={className}
    >
      <rect x="0" y="140" width="75" height="75" />
      <rect x="130" y="-30" width="100" height="100" strokeWidth="6" />
      <path
        d="M304 231L245 290L186 231L245 172L304 231ZM198 231L243 276L245 278L246 276L290 232L292 231L290 229L245 184L198 231ZM279 231L245 265L211 231L245 197L279 231Z"
        strokeWidth="4"
      />
    </svg>
  );
}
