import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GemBadge } from '../components/GemBadge'

const {
  cleanupMock,
  mountGemBadgeWebGLMock,
  setRotationMock,
} = vi.hoisted(() => ({
  cleanupMock: vi.fn(),
  setRotationMock: vi.fn(),
  mountGemBadgeWebGLMock: vi.fn(),
}))

vi.mock('../utils/create-gem-badge-webgl', () => ({
  mountGemBadgeWebGL: mountGemBadgeWebGLMock,
}))

describe('GemBadge', () => {
  beforeEach(() => {
    cleanupMock.mockReset()
    setRotationMock.mockReset()
    mountGemBadgeWebGLMock.mockReset()
    mountGemBadgeWebGLMock.mockReturnValue({
      cleanup: cleanupMock,
      setRotation: setRotationMock,
    })
  })

  it('mounts WebGL with merged default and custom config', () => {
    render(
      <GemBadge
        data-testid="gem-badge"
        config={{
          material: 'ruby',
          cut: 'heart',
          renderMode: 'dom',
          view: 'front',
          rotation: 45,
          glowIntensity: 1.6,
          animate: true,
          size: 96,
        }}
      />,
    )

    expect(screen.getByTestId('gem-badge')).toHaveStyle({
      width: '96px',
      height: '96px',
    })
    expect(mountGemBadgeWebGLMock).toHaveBeenCalledWith(
      expect.any(HTMLSpanElement),
      expect.objectContaining({
        material: 'ruby',
        cut: 'heart',
        glow: true,
        glowIntensity: 1.6,
        animate: true,
        force2d: true,
        disabled: false,
        view: 'front',
        rotation: 45,
      }),
    )
  })

  it('updates controller rotation when the config changes', () => {
    const { rerender } = render(
      <GemBadge data-testid="gem-badge" config={{ rotation: 0 }} />,
    )

    expect(setRotationMock).toHaveBeenCalledWith(0)

    rerender(<GemBadge data-testid="gem-badge" config={{ rotation: 180 }} />)

    expect(setRotationMock).toHaveBeenLastCalledWith(180)
    expect(mountGemBadgeWebGLMock).toHaveBeenCalledTimes(2)
  })

  it('behaves like a keyboard-accessible button when clickable', () => {
    const handleClick = vi.fn()

    render(<GemBadge data-testid="gem-badge" onClick={handleClick} />)

    const badge = screen.getByTestId('gem-badge')

    expect(badge).toHaveAttribute('role', 'button')
    expect(badge).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(badge, { key: 'Enter' })
    fireEvent.keyDown(badge, { key: ' ' })

    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('adjusts the glow halo on hover', () => {
    const { container } = render(<GemBadge data-testid="gem-badge" />)

    const badge = screen.getByTestId('gem-badge')
    const halo = container.querySelector('[aria-hidden="true"]')

    expect(halo).toHaveStyle({ opacity: '0.32' })

    fireEvent.mouseEnter(badge)
    expect(halo).toHaveStyle({ opacity: '0.4' })

    fireEvent.mouseLeave(badge)
    expect(halo).toHaveStyle({ opacity: '0.32' })
  })

  it('cleans up the mounted WebGL controller on unmount', () => {
    const { unmount } = render(<GemBadge data-testid="gem-badge" />)

    unmount()

    expect(cleanupMock).toHaveBeenCalledTimes(1)
  })
})
