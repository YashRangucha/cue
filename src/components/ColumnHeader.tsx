'use client';

interface ColumnHeaderProps {
  number: string;
  title: string;
  statusLabel: React.ReactNode;
  children?: React.ReactNode;
}

export default function ColumnHeader({
  number,
  title,
  statusLabel,
  children,
}: ColumnHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-[#2a2a2a] bg-[#111111]">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
          {number}. {title}
        </span>
        <span className="text-xs font-mono text-zinc-500">
          {statusLabel}
        </span>
      </div>

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
