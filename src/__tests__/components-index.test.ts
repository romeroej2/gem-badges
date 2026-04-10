import { describe, expect, it } from 'vitest'
import { GemBadge as GemBadgeFromBarrel, GemButton as GemButtonFromBarrel } from '../components'
import { GemBadge } from '../components/GemBadge'
import { GemButton } from '../components/GemButton'

describe('components barrel', () => {
  it('re-exports the public components', () => {
    expect(GemBadgeFromBarrel).toBe(GemBadge)
    expect(GemButtonFromBarrel).toBe(GemButton)
  })
})
