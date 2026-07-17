"use client";

export default function SettledToast({
  activityUrl,
  onClose,
}: {
  activityUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="animate-pop pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-4 shadow-lg">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-money">Settled on Arbitrum ✓</span>
          <a
            href={activityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand underline underline-offset-2"
          >
            View receipt ↗
          </a>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-muted transition hover:bg-background hover:text-foreground"
        >
          ×
        </button>
      </div>
    </div>
  );
}
