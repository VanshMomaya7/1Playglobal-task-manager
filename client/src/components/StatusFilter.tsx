interface Props {
  current: string;
  counts: Record<string, number>;
  onChange: (status: string) => void;
}

const TABS: { value: string; label: string; emoji: string }[] = [
  { value: 'all',         label: 'All',         emoji: '◈' },
  { value: 'todo',        label: 'To Do',        emoji: '○' },
  { value: 'in-progress', label: 'In Progress',  emoji: '◑' },
  { value: 'done',        label: 'Done',         emoji: '●' },
];

export default function StatusFilter({ current, counts, onChange }: Props) {
  const total = (counts.todo ?? 0) + (counts['in-progress'] ?? 0) + (counts.done ?? 0);

  return (
    <div className="filter-section">
      <div className="section-label">
        <div className="section-label-line" />
        <span className="section-label-text">Filter</span>
      </div>
      <div className="filter-tabs">
        {TABS.map((tab) => {
          const count = tab.value === 'all' ? total : (counts[tab.value] ?? 0);
          return (
            <button
              key={tab.value}
              id={`filter-${tab.value}`}
              className={`filter-tab${current === tab.value ? ' active' : ''}`}
              onClick={() => onChange(tab.value)}
            >
              <span>{tab.emoji}</span>
              {tab.label}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
