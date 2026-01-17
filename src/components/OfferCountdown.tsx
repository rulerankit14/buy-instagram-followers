import * as React from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function OfferCountdown({ minutes = 10 }: { minutes?: number }) {
  const [end] = React.useState(() => Date.now() + minutes * 60_000);
  const [left, setLeft] = React.useState(() => Math.max(0, end - Date.now()));

  React.useEffect(() => {
    const t = window.setInterval(() => {
      setLeft(Math.max(0, end - Date.now()));
    }, 1000);
    return () => window.clearInterval(t);
  }, [end]);

  const totalSeconds = Math.floor(left / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;

  return (
    <div className="w-full rounded-lg bg-destructive px-4 py-3 text-center shadow-soft">
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-medium text-destructive-foreground/90">Offer ends in:</span>
        <span className="font-display text-lg tracking-wider text-destructive-foreground">
          {pad(mm)}:{pad(ss)}
        </span>
      </div>
    </div>
  );
}
