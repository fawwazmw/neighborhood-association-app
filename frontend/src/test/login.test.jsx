import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'

// Mock useAuth — we control what it returns per test
const mockLogin = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}))

// Helper to render Login with MemoryRouter
function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Login />
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: not authenticated, not loading
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
    })
  })

  // ── Rendering ───────────────────────────────────────────────────────────
  it('renders the app title "Neighborhood Admin"', () => {
    renderLogin()
    expect(screen.getByText('Neighborhood Admin')).toBeInTheDocument()
  })

  it('renders the sign in card title', () => {
    renderLogin()
    // "Sign In" appears in both the card title and the button.
    // The card title uses data-slot="card-title".
    const allSignIn = screen.getAllByText('Sign In')
    expect(allSignIn.length).toBeGreaterThanOrEqual(1)
    const cardTitle = allSignIn.find(
      (el) => el.getAttribute('data-slot') === 'card-title'
    )
    expect(cardTitle).toBeInTheDocument()
  })

  it('renders the description text', () => {
    renderLogin()
    expect(
      screen.getByText('Enter your credentials to access the dashboard')
    ).toBeInTheDocument()
  })

  it('renders an email input field', () => {
    renderLogin()
    const emailInput = screen.getByLabelText('Email Address')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('renders a password input field', () => {
    renderLogin()
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('renders a sign in button', () => {
    renderLogin()
    const button = screen.getByRole('button', { name: 'Sign In' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('renders the version footer text', () => {
    renderLogin()
    expect(
      screen.getByText('Neighborhood Administration System v1.0.0')
    ).toBeInTheDocument()
  })

  it('renders email placeholder', () => {
    renderLogin()
    expect(
      screen.getByPlaceholderText('admin@neighborhood.com')
    ).toBeInTheDocument()
  })

  // ── Redirect when authenticated ─────────────────────────────────────────
  it('redirects to / if user is already authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Admin' },
      loading: false,
      login: mockLogin,
    })

    renderLogin()

    // When Navigate to="/" is rendered, the login form should NOT be present
    expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument()
  })

  // ── Form interaction ────────────────────────────────────────────────────
  it('allows typing in email and password fields', async () => {
    const user = userEvent.setup()
    renderLogin()

    const emailInput = screen.getByLabelText('Email Address')
    const passwordInput = screen.getByLabelText('Password')

    await user.type(emailInput, 'admin@test.com')
    await user.type(passwordInput, 'secret123')

    expect(emailInput).toHaveValue('admin@test.com')
    expect(passwordInput).toHaveValue('secret123')
  })

  it('calls login function with email and password on form submit', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ data: { success: true, data: { id: 1 } } })

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'admin@test.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'secret123')
    })
  })

  it('shows "Signing in..." text while submitting', async () => {
    const user = userEvent.setup()
    // Login never resolves so we stay in submitting state
    mockLogin.mockReturnValue(new Promise(() => {}))

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'admin@test.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })
  })

  it('disables the submit button while submitting', async () => {
    const user = userEvent.setup()
    mockLogin.mockReturnValue(new Promise(() => {}))

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'admin@test.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      // The button should be disabled (it now shows "Signing in...")
      const button = screen.getByText('Signing in...').closest('button')
      expect(button).toBeDisabled()
    })
  })

  it('shows error message when login fails with response message', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'wrong@test.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows fallback error message when login fails without response message', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Network Error'))

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'test@test.com')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(
        screen.getByText('Login failed. Please try again.')
      ).toBeInTheDocument()
    })
  })

  it('re-enables the submit button after a failed login', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'test@test.com')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    // Wait for error to appear (means submitting is done)
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    // Button should be re-enabled with original text
    const button = screen.getByRole('button', { name: 'Sign In' })
    expect(button).not.toBeDisabled()
  })

  it('clears previous error when submitting again', async () => {
    const user = userEvent.setup()

    // First call fails, second call succeeds
    mockLogin
      .mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } },
      })
      .mockResolvedValueOnce({ data: { success: true, data: { id: 1 } } })

    renderLogin()

    await user.type(screen.getByLabelText('Email Address'), 'test@test.com')
    await user.type(screen.getByLabelText('Password'), 'password')

    // First submit — fails
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    // Second submit — succeeds, error should be cleared
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })
})
