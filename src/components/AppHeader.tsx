'use client';

interface AppHeaderProps {
  onExport: () => void;
  onSettingsOpen: () => void;
}

export default function AppHeader({
  onExport,
  onSettingsOpen,
}: AppHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-11 bg-[#0a0a0a] border-b border-[#2a2a2a] flex items-center justify-between px-4 z-40">
      <span className="font-mono text-sm font-medium text-zinc-300">
        Cue
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="text-xs font-mono border border-[#2a2a2a] hover:border-zinc-500 text-zinc-500 hover:text-zinc-200 px-3 py-1 rounded transition-colors"
        >
          Export Session
        </button>

        <button
          onClick={onSettingsOpen}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1a.5.5 0 0 1 .5.5v.75a5.003 5.003 0 0 1
              2.388 1.388l.65-.375a.5.5 0 0 1 .683.183l.5.866a.5.5
              0 0 1-.183.683l-.65.375A5.01 5.01 0 0 1 11.5 7.5c0
              .448-.059.882-.168 1.3l.65.375a.5.5 0 0 1 .183.683l-.5.866a.5.5
              0 0 1-.683.183l-.65-.375A5.003 5.003 0 0 1 8 11.75v.75a.5.5
              0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-.75a5.003 5.003 0 0
              1-2.388-1.388l-.65.375a.5.5 0 0 1-.683-.183l-.5-.866a.5.5
              0 0 1 .183-.683l.65-.375A5.01 5.01 0 0 1 3.5 7.5c0-.448.059-.882.168-1.3l-.65-.375a.5.5
              0 0 1-.183-.683l.5-.866a.5.5 0 0 1 .683-.183l.65.375A5.003
              5.003 0 0 1 7 2.25V1.5a.5.5 0 0 1 .5-.5h1zM7.5 5a2.5 2.5
              0 1 0 0 5 2.5 2.5 0 0 0 0-5z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
