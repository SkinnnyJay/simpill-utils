import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setCurrentTheme] = useState<Theme>(() => {
    // Try localStorage first, fall back to sessionStorage, then default
    try {
      return (
        (localStorage.getItem(storageKey) as Theme) ||
        (sessionStorage.getItem(storageKey) as Theme) ||
        defaultTheme
      )
    } catch (_e) {
      // Storage unavailable (incognito/privacy mode) - use default
      return defaultTheme
    }
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (nextTheme: Theme) => {
      // Try to persist to localStorage, fall back to sessionStorage
      try {
        localStorage.setItem(storageKey, nextTheme)
      } catch (_e) {
        // localStorage unavailable (incognito) - use sessionStorage
        try {
          sessionStorage.setItem(storageKey, nextTheme)
        } catch (_err) {
          // Storage unavailable in this browser context; keep in-memory state.
        }
      }
      setCurrentTheme(nextTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
