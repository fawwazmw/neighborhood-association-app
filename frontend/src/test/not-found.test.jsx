import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  )
}

describe('NotFound page', () => {
  it('renders the 404 status code', () => {
    renderNotFound()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders "Page Not Found" heading', () => {
    renderNotFound()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
  })

  it('renders a description message', () => {
    renderNotFound()
    expect(
      screen.getByText("The page you're looking for doesn't exist.")
    ).toBeInTheDocument()
  })

  it('renders a "Back to Dashboard" link', () => {
    renderNotFound()
    const link = screen.getByRole('link', { name: 'Back to Dashboard' })
    expect(link).toBeInTheDocument()
  })

  it('link points to "/"', () => {
    renderNotFound()
    const link = screen.getByRole('link', { name: 'Back to Dashboard' })
    expect(link).toHaveAttribute('href', '/')
  })
})
