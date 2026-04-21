'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-3 animate-pulse">
      <div className="h-4 w-24 bg-zinc-700 rounded-full mb-3" />
      <div className="h-4 w-3/4 bg-zinc-700 rounded mb-2" />
      <div className="h-3 w-full bg-zinc-700 rounded mb-1" />
      <div className="h-3 w-2/3 bg-zinc-700 rounded" />
    </div>
  );
}
