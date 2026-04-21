import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface-2)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--color-text)';
        e.currentTarget.style.borderColor = 'var(--color-border-hover)';
        e.currentTarget.style.background = 'var(--color-surface)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--color-text-muted)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.background = 'var(--color-surface-2)';
      }}
    >
      {isDark
        ? <Sun size={18} style={{ color: '#fbbf24' }} />
        : <Moon size={18} style={{ color: '#6366f1' }} />
      }
    </button>
  );
}
