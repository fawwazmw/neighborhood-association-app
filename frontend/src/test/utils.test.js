import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn() utility', () => {
  it('merges multiple class names into a single string', () => {
    const result = cn('foo', 'bar', 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('handles conditional classes via object syntax', () => {
    const isActive = true
    const isDisabled = false
    const result = cn('base', { active: isActive, disabled: isDisabled })
    expect(result).toBe('base active')
  })

  it('handles array inputs', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('resolves tailwind conflicts by keeping the last value', () => {
    // tailwind-merge should keep px-4 and drop px-2
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('resolves conflicting tailwind color utilities', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('resolves conflicting padding on the same axis', () => {
    const result = cn('py-2 px-4', 'py-6')
    expect(result).toBe('px-4 py-6')
  })

  it('keeps non-conflicting tailwind classes', () => {
    const result = cn('px-2', 'py-4', 'mt-2')
    expect(result).toBe('px-2 py-4 mt-2')
  })

  it('filters out undefined values', () => {
    const result = cn('foo', undefined, 'bar')
    expect(result).toBe('foo bar')
  })

  it('filters out null values', () => {
    const result = cn('foo', null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('filters out false values', () => {
    const result = cn('foo', false, 'bar')
    expect(result).toBe('foo bar')
  })

  it('filters out empty strings', () => {
    const result = cn('foo', '', 'bar')
    expect(result).toBe('foo bar')
  })

  it('returns empty string when called with no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('returns empty string when all values are falsy', () => {
    const result = cn(null, undefined, false, '')
    expect(result).toBe('')
  })

  it('handles mixed clsx and tailwind-merge scenarios', () => {
    const isActive = true
    const result = cn(
      'text-sm font-medium',
      isActive && 'text-blue-500',
      'text-red-500'
    )
    // clsx resolves the conditional, then tailwind-merge resolves the text color conflict
    expect(result).toBe('text-sm font-medium text-red-500')
  })
})
