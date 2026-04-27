import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

// Helper component that exposes theme context values for testing
function ThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classes
    document.documentElement.classList.remove('light', 'dark')
  })

  it('defaults to dark theme when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('adds dark class to document.documentElement by default', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'light')

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleTheme switches from dark to light', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleTheme switches from light to dark', async () => {
    const user = userEvent.setup()
    localStorage.setItem('theme', 'light')

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('toggleTheme can toggle back and forth', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    // dark → light
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    // light → dark
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('persists theme to localStorage when theme changes', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    // Default dark should be persisted
    expect(localStorage.getItem('theme')).toBe('dark')

    // Toggle to light
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))
    expect(localStorage.getItem('theme')).toBe('light')

    // Toggle back to dark
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('removes the previous theme class when switching', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    // Initially dark
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))

    // After toggle: only light, no dark
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme allows setting theme directly', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    await user.click(screen.getByRole('button', { name: 'Set Light' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    await user.click(screen.getByRole('button', { name: 'Set Dark' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('throws error when useTheme is used outside ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<ThemeConsumer />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
