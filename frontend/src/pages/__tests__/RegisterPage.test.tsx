import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RegisterPage from '../RegisterPage'
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
const mockRegister = vi.fn()
const mockNavigate = vi.fn()

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  it('should render registration form', () => {
    renderWithRouter(<RegisterPage />)

    expect(screen.getByText('auth.register')).toBeInTheDocument()
    expect(screen.getByText('auth.createAccount')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.fullName')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.username')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.email')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.role')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.location')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.confirmPassword')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth.registerButton' })).toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    mockRegister.mockResolvedValue(undefined)

    renderWithRouter(<RegisterPage />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('auth.fullName'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('auth.username'), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), {
      target: { value: 'password123' },
    })

    // Select role and location
    const roleSelect = screen.getByLabelText('auth.role')
    fireEvent.mouseDown(roleSelect)
    fireEvent.click(screen.getByText('roles.teacher'))

    const locationSelect = screen.getByLabelText('auth.location')
    fireEvent.mouseDown(locationSelect)
    fireEvent.click(screen.getByText('ភ្នំពេញ'))

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'teacher',
        locationScope: 'phnom-penh',
      })
    })
  })

  it('should show validation errors for empty required fields', async () => {
    renderWithRouter(<RegisterPage />)

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument()
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      expect(screen.getByText('Role is required')).toBeInTheDocument()
      expect(screen.getByText('Location scope is required')).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should validate password strength requirements', async () => {
    renderWithRouter(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'weakpass' },
    })

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one lowercase letter, one uppercase letter, and one number')).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should validate username format', async () => {
    renderWithRouter(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('auth.username'), {
      target: { value: 'invalid user!' },
    })

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username can only contain letters, numbers, dots, hyphens, and underscores')).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should validate full name format', async () => {
    renderWithRouter(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('auth.fullName'), {
      target: { value: 'Invalid123Name' },
    })

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full name can only contain letters, spaces, and Khmer characters')).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should show error when passwords do not match', async () => {
    renderWithRouter(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), {
      target: { value: 'differentpassword' },
    })

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should display error message on registration failure', async () => {
    const errorMessage = 'Username already exists'
    mockRegister.mockRejectedValue({
      response: { data: { message: errorMessage } },
    })

    renderWithRouter(<RegisterPage />)

    // Fill out form with valid data
    fireEvent.change(screen.getByLabelText('auth.fullName'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('auth.username'), {
      target: { value: 'existinguser' },
    })
    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), {
      target: { value: 'password123' },
    })

    const submitButton = screen.getByRole('button', { name: 'auth.registerButton' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should redirect when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isAuthenticated: true,
      isLoading: false,
    })

    renderWithRouter(<RegisterPage />)

    // The useEffect should trigger navigation
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('should show link to login page', () => {
    renderWithRouter(<RegisterPage />)

    expect(screen.getByText('auth.alreadyHaveAccount')).toBeInTheDocument()
  })

  it('should disable submit button while loading', () => {
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
      isLoading: true,
    })

    renderWithRouter(<RegisterPage />)

    const submitButton = screen.getByRole('button', { name: 'common.loading' })
    expect(submitButton).toBeDisabled()
  })
})