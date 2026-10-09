"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
      <p className="text-lg font-semibold text-slate-800">This page couldn&apos;t load</p>
      <p className="max-w-md text-sm text-slate-500">{error.message || "Reload to try again."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Reload
      </button>
    </div>
  );
}
