export default function RoomLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse-soft rounded-lg bg-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse-soft rounded bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="h-24 animate-pulse-soft rounded-2xl border border-line bg-surface p-4">
          <div className="h-3 w-1/2 rounded bg-surface-2" />
          <div className="mt-2.5 h-7 w-12 rounded bg-surface-2" />
        </div>
        <div className="h-24 animate-pulse-soft rounded-2xl border border-line bg-surface p-4">
          <div className="h-3 w-1/2 rounded bg-surface-2" />
          <div className="mt-2.5 h-7 w-12 rounded bg-surface-2" />
        </div>
        <div className="h-24 animate-pulse-soft rounded-2xl border border-line bg-surface p-4">
          <div className="h-3 w-1/2 rounded bg-surface-2" />
          <div className="mt-2.5 h-7 w-12 rounded bg-surface-2" />
        </div>
        <div className="h-24 animate-pulse-soft rounded-2xl border border-line bg-surface p-4">
          <div className="h-3 w-1/2 rounded bg-surface-2" />
          <div className="mt-2.5 h-7 w-12 rounded bg-surface-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-44 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
          <div className="h-4 w-2/5 rounded bg-surface-2" />
          <div className="h-3 w-3/5 rounded bg-surface-2" />
        </div>
        <div className="h-44 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
          <div className="h-4 w-2/5 rounded bg-surface-2" />
          <div className="h-3 w-3/5 rounded bg-surface-2" />
        </div>
        <div className="h-44 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
          <div className="h-4 w-2/5 rounded bg-surface-2" />
          <div className="h-3 w-3/5 rounded bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
