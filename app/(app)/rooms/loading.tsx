export default function RoomsLoading() {
  return (
    <>
      <div className="h-16 border-b border-line bg-surface">
        <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8" />
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-7 w-40 animate-pulse-soft rounded-lg bg-surface-2" />
            <div className="h-4 w-72 max-w-full animate-pulse-soft rounded bg-surface-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="h-36 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
              <div className="h-4 w-2/5 rounded bg-surface-2" />
              <div className="h-3 w-3/5 rounded bg-surface-2" />
            </div>
            <div className="h-36 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
              <div className="h-4 w-2/5 rounded bg-surface-2" />
              <div className="h-3 w-3/5 rounded bg-surface-2" />
            </div>
            <div className="h-36 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
              <div className="h-4 w-2/5 rounded bg-surface-2" />
              <div className="h-3 w-3/5 rounded bg-surface-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-72 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
              <div className="h-4 w-1/3 rounded bg-surface-2" />
              <div className="h-9 rounded-lg bg-surface-2" />
              <div className="h-9 rounded-lg bg-surface-2" />
            </div>
            <div className="h-72 animate-pulse-soft space-y-3 rounded-2xl border border-line bg-surface p-5">
              <div className="h-4 w-1/3 rounded bg-surface-2" />
              <div className="h-9 rounded-lg bg-surface-2" />
              <div className="h-9 rounded-lg bg-surface-2" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
