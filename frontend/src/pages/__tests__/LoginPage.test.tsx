import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginPage from '../LoginPage'
import { useAuth } from '../../contexts/AuthContext'

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockUseAuth = useAuth as any
const mockLogin = vi.fn()
const mockNavigate = vi.fn()

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  it('should render login form', () => {
    renderWithRouter(<LoginPage />)

    expect(screen.getByText('app.title')).toBeInTheDocument()
    expect(screen.getByText('app.subtitle')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.username')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth.loginButton' })).toBeInTheDocument()
  })

  it('should handle form submission with valid credentials', async () => {
    mockLogin.mockResolvedValue(undefined)

    renderWithRouter(<LoginPage />)

    const usernameInput = screen.getByLabelText('auth.username')
    const passwordInput = screen.getByLabelText('auth.password')
    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      })
    })
  })

  it('should show validation errors for empty fields', async () => {
    renderWithRouter(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should display error message on login failure', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue({
      response: { data: { message: errorMessage } },
    })

    renderWithRouter(<LoginPage />)

    const usernameInput = screen.getByLabelText('auth.username')
    const passwordInput = screen.getByLabelText('auth.password')
    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should handle different error types correctly', async () => {
    // Test 401 error
    mockLogin.mockRejectedValue({
      response: { status: 401 },
    })

    renderWithRouter(<LoginPage />)

    const usernameInput = screen.getByLabelText('auth.username')
    const passwordInput = screen.getByLabelText('auth.password')
    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.invalidCredentials')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    mockLogin.mockRejectedValue({
      code: 'NETWORK_ERROR',
    })

    renderWithRouter(<LoginPage />)

    const usernameInput = screen.getByLabelText('auth.username')
    const passwordInput = screen.getByLabelText('auth.password')
    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.networkError')).toBeInTheDocument()
    })
  })

  it('should handle server errors', async () => {
    mockLogin.mockRejectedValue({
      response: { status: 500 },
    })

    renderWithRouter(<LoginPage />)

    const usernameInput = screen.getByLabelText('auth.username')
    const passwordInput = screen.getByLabelText('auth.password')
    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.serverError')).toBeInTheDocument()
    })
  })

  it('should disable submit button while loading', async () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: true,
    })

    renderWithRouter(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: 'common.loading' })
    expect(submitButton).toBeDisabled()
  })

  it('should redirect when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: true,
      isLoading: false,
    })

    renderWithRouter(<LoginPage />)

    // The useEffect should trigger navigation
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('should show forgot password link', () => {
    renderWithRouter(<LoginPage />)

    expect(screen.getByText('auth.forgotPassword')).toBeInTheDocument()
  })
})