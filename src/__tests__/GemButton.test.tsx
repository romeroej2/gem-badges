import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GemButton } from '../components/GemButton'

const {
  cleanupMock,
  injectGemStylesMock,
  mountGemWebGLMock,
} = vi.hoisted(() => ({
  injectGemStylesMock: vi.fn(),
  cleanupMock: vi.fn(),
  mountGemWebGLMock: vi.fn(),
}))

vi.mock('../utils/inject-styles', () => ({
  injectGemStyles: injectGemStylesMock,
}))

vi.mock('../utils/create-gem-webgl', () => ({
  mountGemWebGL: mountGemWebGLMock,
}))

describe('GemButton', () => {
  beforeEach(() => {
    injectGemStylesMock.mockReset()
    cleanupMock.mockReset()
    mountGemWebGLMock.mockReset()
    mountGemWebGLMock.mockReturnValue(cleanupMock)
  })

  it('renders the default label and mounts the gem renderer', () => {
    render(<GemButton gem="ruby" />)

    const button = screen.getByRole('button', { name: 'Ruby' })
    const canvas = button.querySelector('canvas')

    expect(button).toHaveAttribute('data-gem', 'ruby')
    expect(injectGemStylesMock).toHaveBeenCalledTimes(1)
    expect(mountGemWebGLMock).toHaveBeenCalledWith(
      canvas,
      expect.objectContaining({
        glow: true,
        pulse: false,
        disabled: undefined,
      }),
    )
  })

  it('supports custom labels, size presets, and visual state classes', () => {
    render(
      <GemButton
        gem="topaz"
        size="lg"
        glow={false}
        pulse
        className="cta"
        disabled
      >
        Claim Prize
      </GemButton>,
    )

    const button = screen.getByRole('button', { name: 'Claim Prize' })

    expect(button.className).toContain('fb-btn')
    expect(button.className).toContain('fb-pulse')
    expect(button.className).toContain('fb-no-glow')
    expect(button.className).toContain('cta')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle({
      cursor: 'not-allowed',
      minHeight: '56px',
      minWidth: '150px',
      '--fb-gem-size': '34px',
    })
  })

  it('cleans up the WebGL renderer on unmount', () => {
    const { unmount } = render(<GemButton gem="diamond" />)

    unmount()

    expect(cleanupMock).toHaveBeenCalledTimes(1)
  })
})
