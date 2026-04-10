import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('injectGemStyles', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    vi.resetModules()
  })

  it('injects the shared stylesheet once', async () => {
    const { injectGemStyles } = await import('../utils/inject-styles')

    injectGemStyles()
    injectGemStyles()

    const styleElements = document.head.querySelectorAll('#gem-badges-styles')

    expect(styleElements).toHaveLength(1)
    expect(styleElements[0]?.textContent).toContain('.fb-btn')
  })

  it('reuses an existing stylesheet node without duplicating it', async () => {
    const existingStyle = document.createElement('style')
    existingStyle.id = 'gem-badges-styles'
    document.head.appendChild(existingStyle)

    const { injectGemStyles } = await import('../utils/inject-styles')

    injectGemStyles()

    expect(document.head.querySelectorAll('#gem-badges-styles')).toHaveLength(1)
  })
})
