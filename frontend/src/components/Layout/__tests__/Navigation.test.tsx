import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Navigation from '../Navigation'
import { useAuth } from '../../../contexts/AuthContext'

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockUseAuth = useAuth as any
const mockLogout = vi.fn()
const mockNavigate = vi.fn()

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

const mockUser = {
  id: '1',
  fullName: 'Test User',
  role: {
    name: 'teacher',
    permissions: [],
  },
}

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    })
  })

  it('should render user profile section', () => {
    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={vi.fn()} />
    )

    expect(screen.getAllByText('Test User')).toHaveLength(2) // Mobile and desktop
    expect(screen.getAllByText('roles.teacher')).toHaveLength(2)
    expect(screen.getAllByText('T')).toHaveLength(2) // Avatar initial
  })

  it('should render navigation items for teacher role', () => {
    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={vi.fn()} />
    )

    expect(screen.getAllByText('navigation.dashboard')).toHaveLength(2) // Mobile and desktop
    expect(screen.getAllByText('navigation.observations')).toHaveLength(2)
    expect(screen.getAllByText('navigation.settings')).toHaveLength(2)
    expect(screen.getAllByText('auth.logout')).toHaveLength(2)

    // Teacher should not see reports and users
    expect(screen.queryByText('navigation.reports')).not.toBeInTheDocument()
    expect(screen.queryByText('navigation.users')).not.toBeInTheDocument()
  })

  it('should render all navigation items for administrator role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        ...mockUser,
        role: {
          name: 'administrator',
          permissions: [],
        },
      },
      logout: mockLogout,
    })

    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={vi.fn()} />
    )

    expect(screen.getAllByText('navigation.dashboard')).toHaveLength(2)
    expect(screen.getAllByText('navigation.observations')).toHaveLength(2)
    expect(screen.getAllByText('navigation.reports')).toHaveLength(2)
    expect(screen.getAllByText('navigation.users')).toHaveLength(2)
    expect(screen.getAllByText('navigation.settings')).toHaveLength(2)
  })

  it('should handle navigation item clicks', () => {
    const mockOnClose = vi.fn()

    renderWithRouter(
      <Navigation open={false} onClose={mockOnClose} onToggle={vi.fn()} />
    )

    const dashboardItems = screen.getAllByText('navigation.dashboard')
    fireEvent.click(dashboardItems[0]) // Click first one (mobile or desktop)

    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle logout', () => {
    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={vi.fn()} />
    )

    const logoutItems = screen.getAllByText('auth.logout')
    fireEvent.click(logoutItems[0]) // Click first one (mobile or desktop)

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should show mobile menu button', () => {
    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={vi.fn()} />
    )

    const menuButton = screen.getByLabelText('open drawer')
    expect(menuButton).toBeInTheDocument()
  })

  it('should handle mobile menu toggle', () => {
    const mockOnToggle = vi.fn()

    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={mockOnToggle} />
    )

    const menuButton = screen.getByLabelText('open drawer')
    fireEvent.click(menuButton)

    expect(mockOnToggle).toHaveBeenCalled()
  })

  it('should filter navigation items based on role permissions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        ...mockUser,
        role: {
          name: 'observer',
          permissions: [],
        },
      },
      logout: mockLogout,
    })

    renderWithRouter(
      <Navigation open={false} onClose={vi.fn()} onToggle={vi.fn()} />
    )

    // Observer should see dashboard, observations, and settings
    expect(screen.getAllByText('navigation.dashboard')).toHaveLength(2)
    expect(screen.getAllByText('navigation.observations')).toHaveLength(2)
    expect(screen.getAllByText('navigation.settings')).toHaveLength(2)

    // Observer should not see reports and users
    expect(screen.queryByText('navigation.reports')).not.toBeInTheDocument()
    expect(screen.queryByText('navigation.users')).not.toBeInTheDocument()
  })
})