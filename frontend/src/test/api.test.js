import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so the mock instance is available when vi.mock runs (hoisted above imports)
const { mockInstance, mockAxiosGet } = vi.hoisted(() => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  const mockAxiosGet = vi.fn()
  return { mockInstance, mockAxiosGet }
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockInstance),
    get: mockAxiosGet,
  },
}))

import axios from 'axios'
import api, {
  getCsrfCookie,
  authApi,
  residentApi,
  houseApi,
  paymentApi,
  expenseApi,
  reportApi,
} from '@/lib/api'

// These tests check the module-level axios.create call that happens at import time.
// They run in a separate describe block BEFORE any clearAllMocks.
describe('axios instance creation', () => {
  it('creates an axios instance with withCredentials: true', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ withCredentials: true })
    )
  })

  it('creates an axios instance with baseURL /api', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: '/api' })
    )
  })

  it('creates an axios instance with JSON content type headers', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    )
  })

  it('exports the created instance as default', () => {
    expect(api).toBe(mockInstance)
  })
})

describe('API module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getCsrfCookie ─────────────────────────────────────────────────────────
  describe('getCsrfCookie', () => {
    it('calls axios.get with /sanctum/csrf-cookie and withCredentials', () => {
      getCsrfCookie()
      expect(mockAxiosGet).toHaveBeenCalledWith('/sanctum/csrf-cookie', {
        withCredentials: true,
      })
    })
  })

  // ── Auth API ──────────────────────────────────────────────────────────────
  describe('authApi', () => {
    it('login fetches CSRF cookie then posts credentials', async () => {
      mockAxiosGet.mockResolvedValue({})
      mockInstance.post.mockResolvedValue({ data: { success: true } })

      const credentials = { email: 'test@test.com', password: 'password' }
      await authApi.login(credentials)

      // Should fetch CSRF cookie first
      expect(mockAxiosGet).toHaveBeenCalledWith('/sanctum/csrf-cookie', {
        withCredentials: true,
      })
      // Then post login
      expect(mockInstance.post).toHaveBeenCalledWith('/login', credentials)
    })

    it('logout calls POST /logout', () => {
      mockInstance.post.mockResolvedValue({})
      authApi.logout()
      expect(mockInstance.post).toHaveBeenCalledWith('/logout')
    })

    it('getUser calls GET /user', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      authApi.getUser()
      expect(mockInstance.get).toHaveBeenCalledWith('/user')
    })
  })

  // ── Resident API ──────────────────────────────────────────────────────────
  describe('residentApi', () => {
    it('getAll calls GET /residents with params', () => {
      const params = { page: 1, search: 'John' }
      mockInstance.get.mockResolvedValue({ data: [] })
      residentApi.getAll(params)
      expect(mockInstance.get).toHaveBeenCalledWith('/residents', { params })
    })

    it('getAll calls GET /residents without params', () => {
      mockInstance.get.mockResolvedValue({ data: [] })
      residentApi.getAll()
      expect(mockInstance.get).toHaveBeenCalledWith('/residents', {
        params: undefined,
      })
    })

    it('getById calls GET /residents/:id', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      residentApi.getById(5)
      expect(mockInstance.get).toHaveBeenCalledWith('/residents/5')
    })

    it('create calls POST /residents with FormData', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { name: 'John', phone: '123' }
      residentApi.create(data)

      expect(mockInstance.post).toHaveBeenCalledWith(
        '/residents',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    })

    it('create excludes null and undefined values from FormData', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { name: 'John', phone: null, email: undefined, age: 30 }
      residentApi.create(data)

      const formData = mockInstance.post.mock.calls[0][1]
      expect(formData.get('name')).toBe('John')
      expect(formData.get('age')).toBe('30')
      expect(formData.has('phone')).toBe(false)
      expect(formData.has('email')).toBe(false)
    })

    it('update calls POST /residents/:id with FormData and _method PUT', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { name: 'Jane' }
      residentApi.update(3, data)

      expect(mockInstance.post).toHaveBeenCalledWith(
        '/residents/3',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      const formData = mockInstance.post.mock.calls[0][1]
      expect(formData.get('_method')).toBe('PUT')
      expect(formData.get('name')).toBe('Jane')
    })

    it('delete calls DELETE /residents/:id', () => {
      mockInstance.delete.mockResolvedValue({})
      residentApi.delete(7)
      expect(mockInstance.delete).toHaveBeenCalledWith('/residents/7')
    })
  })

  // ── House API ─────────────────────────────────────────────────────────────
  describe('houseApi', () => {
    it('getAll calls GET /houses with params', () => {
      const params = { page: 2 }
      mockInstance.get.mockResolvedValue({ data: [] })
      houseApi.getAll(params)
      expect(mockInstance.get).toHaveBeenCalledWith('/houses', { params })
    })

    it('getById calls GET /houses/:id', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      houseApi.getById(10)
      expect(mockInstance.get).toHaveBeenCalledWith('/houses/10')
    })

    it('create calls POST /houses with data', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { address: '123 Main St' }
      houseApi.create(data)
      expect(mockInstance.post).toHaveBeenCalledWith('/houses', data)
    })

    it('update calls PUT /houses/:id with data', () => {
      mockInstance.put.mockResolvedValue({ data: {} })
      const data = { address: '456 Oak Ave' }
      houseApi.update(2, data)
      expect(mockInstance.put).toHaveBeenCalledWith('/houses/2', data)
    })

    it('assignResident calls POST /houses/:id/assign-resident', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { resident_id: 5 }
      houseApi.assignResident(3, data)
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/houses/3/assign-resident',
        data
      )
    })

    it('removeResident calls POST /houses/:id/remove-resident', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      houseApi.removeResident(4)
      expect(mockInstance.post).toHaveBeenCalledWith('/houses/4/remove-resident')
    })

    it('history calls GET /houses/:id/history', () => {
      mockInstance.get.mockResolvedValue({ data: [] })
      houseApi.history(6)
      expect(mockInstance.get).toHaveBeenCalledWith('/houses/6/history')
    })
  })

  // ── Payment API ───────────────────────────────────────────────────────────
  describe('paymentApi', () => {
    it('getAll calls GET /payments with params', () => {
      const params = { status: 'paid' }
      mockInstance.get.mockResolvedValue({ data: [] })
      paymentApi.getAll(params)
      expect(mockInstance.get).toHaveBeenCalledWith('/payments', { params })
    })

    it('getById calls GET /payments/:id', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      paymentApi.getById(1)
      expect(mockInstance.get).toHaveBeenCalledWith('/payments/1')
    })

    it('create calls POST /payments with data', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { amount: 100 }
      paymentApi.create(data)
      expect(mockInstance.post).toHaveBeenCalledWith('/payments', data)
    })

    it('createBulk calls POST /payments-bulk with data', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { payments: [{ amount: 100 }, { amount: 200 }] }
      paymentApi.createBulk(data)
      expect(mockInstance.post).toHaveBeenCalledWith('/payments-bulk', data)
    })

    it('update calls PUT /payments/:id with data', () => {
      mockInstance.put.mockResolvedValue({ data: {} })
      const data = { amount: 150 }
      paymentApi.update(8, data)
      expect(mockInstance.put).toHaveBeenCalledWith('/payments/8', data)
    })

    it('delete calls DELETE /payments/:id', () => {
      mockInstance.delete.mockResolvedValue({})
      paymentApi.delete(9)
      expect(mockInstance.delete).toHaveBeenCalledWith('/payments/9')
    })

    it('generateBills calls POST /payments-generate with data', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { month: 6, year: 2024 }
      paymentApi.generateBills(data)
      expect(mockInstance.post).toHaveBeenCalledWith('/payments-generate', data)
    })
  })

  // ── Expense API ───────────────────────────────────────────────────────────
  describe('expenseApi', () => {
    it('getAll calls GET /expenses with params', () => {
      const params = { page: 1 }
      mockInstance.get.mockResolvedValue({ data: [] })
      expenseApi.getAll(params)
      expect(mockInstance.get).toHaveBeenCalledWith('/expenses', { params })
    })

    it('getById calls GET /expenses/:id', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      expenseApi.getById(12)
      expect(mockInstance.get).toHaveBeenCalledWith('/expenses/12')
    })

    it('create calls POST /expenses with data', () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const data = { description: 'Office supplies', amount: 50 }
      expenseApi.create(data)
      expect(mockInstance.post).toHaveBeenCalledWith('/expenses', data)
    })

    it('update calls PUT /expenses/:id with data', () => {
      mockInstance.put.mockResolvedValue({ data: {} })
      const data = { amount: 75 }
      expenseApi.update(12, data)
      expect(mockInstance.put).toHaveBeenCalledWith('/expenses/12', data)
    })

    it('delete calls DELETE /expenses/:id', () => {
      mockInstance.delete.mockResolvedValue({})
      expenseApi.delete(12)
      expect(mockInstance.delete).toHaveBeenCalledWith('/expenses/12')
    })
  })

  // ── Report API ────────────────────────────────────────────────────────────
  describe('reportApi', () => {
    it('summary calls GET /reports/summary with year param', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      reportApi.summary(2024)
      expect(mockInstance.get).toHaveBeenCalledWith('/reports/summary', {
        params: { year: 2024 },
      })
    })

    it('detail calls GET /reports/detail with month and year params', () => {
      mockInstance.get.mockResolvedValue({ data: {} })
      reportApi.detail(6, 2024)
      expect(mockInstance.get).toHaveBeenCalledWith('/reports/detail', {
        params: { month: 6, year: 2024 },
      })
    })
  })
})
