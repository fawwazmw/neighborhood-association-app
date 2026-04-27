import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Mock the API module
const mockGetUser = vi.fn()
const mockLogin = vi.fn()
const mockLogout = vi.fn()

vi.mock('@/lib/api', () => ({
  authApi: {
    getUser: (...args) => mockGetUser(...args),
    login: (...args) => mockLogin(...args),
    logout: (...args) => mockLogout(...args),
  },
}))

// Helper component that exposes auth context values for testing
function AuthConsumer() {
  const { user, loading, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <button onClick={() => login('test@test.com', 'password').catch(() => {})}>Login</button>
      <button onClick={() => logout().catch(() => {})}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides loading as true and user as null initially', async () => {
    // getUser never resolves during this test's assertion window
    mockGetUser.mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('fetches user on mount via authApi.getUser', async () => {
    mockGetUser.mockResolvedValue({ data: { success: true, data: { id: 1, name: 'Admin' } } })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledTimes(1)
    })
  })

  it('sets user after successful getUser response', async () => {
    const userData = { id: 1, name: 'Admin', email: 'admin@test.com' }
    mockGetUser.mockResolvedValue({ data: { success: true, data: userData } })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(userData))
    })

    // Loading should be false after fetch completes
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('sets user to null and loading to false when getUser fails', async () => {
    mockGetUser.mockRejectedValue(new Error('Unauthenticated'))

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('sets user to null when getUser returns success: false', async () => {
    mockGetUser.mockResolvedValue({ data: { success: false } })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('login updates user state on success', async () => {
    const user = userEvent.setup()
    const userData = { id: 1, name: 'Admin' }

    // Initial mount: no user
    mockGetUser.mockRejectedValue(new Error('Unauthenticated'))
    // Login succeeds
    mockLogin.mockResolvedValue({ data: { success: true, data: userData } })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('null')

    // Click login
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(userData))
    })

    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' })
  })

  it('logout clears user state', async () => {
    const user = userEvent.setup()
    const userData = { id: 1, name: 'Admin' }

    // Initial mount: user is authenticated
    mockGetUser.mockResolvedValue({ data: { success: true, data: userData } })
    mockLogout.mockResolvedValue({})

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // Wait for user to be set
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(userData))
    })

    // Click logout
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('logout clears user state even when authApi.logout rejects', async () => {
    const user = userEvent.setup()
    const userData = { id: 1, name: 'Admin' }

    mockGetUser.mockResolvedValue({ data: { success: true, data: userData } })
    mockLogout.mockRejectedValue(new Error('Network error'))

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(userData))
    })

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    // User should still be cleared because of the finally block
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for the expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<AuthConsumer />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
