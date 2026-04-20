import { Search, X } from 'lucide-react'

/**
 * SearchBar — controlled input component
 * Demonstrates one-way data flow: parent owns state, passes value + onChange down
 * Props:
 *   value: string (controlled from parent)
 *   onChange: (val: string) => void
 *   onClear: () => void
 *   placeholder: string
 */
export default function SearchBar({ value, onChange, onClear, placeholder = 'Search...' }) {
  return (
    <div className="list-search">
      <Search size={14} strokeWidth={2} className="list-search-icon" />
      {/* Controlled input — value always comes from parent */}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Escape' && onClear()}
      />
      {value && (
        <button className="clear-search" onClick={onClear} title="Clear search">
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
