import { Link } from "@tanstack/react-router";

export function NetworkBar({ property }: { property: string }) {
  return (
    <div className="border-b border-border bg-surface/90 text-xs text-muted backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
        <p>
          <span className="text-fg">MultiNicheADS</span>
          <span className="text-subtle"> · </span>
          {property}
        </p>
        <Link to="/" className="text-fg underline-offset-2 hover:underline">
          Back to exchange
        </Link>
      </div>
    </div>
  );
}
