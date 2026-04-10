import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  AmethystButton,
  DiamondButton,
  EmeraldButton,
  RubyButton,
  SapphireButton,
  TopazButton,
} from '../index'

vi.mock('../utils/inject-styles', () => ({
  injectGemStyles: vi.fn(),
}))

vi.mock('../utils/create-gem-webgl', () => ({
  mountGemWebGL: vi.fn(() => vi.fn()),
}))

describe('factory exports', () => {
  it.each([
    ['Diamond', DiamondButton, 'diamond'],
    ['Ruby', RubyButton, 'ruby'],
    ['Emerald', EmeraldButton, 'emerald'],
    ['Sapphire', SapphireButton, 'sapphire'],
    ['Amethyst', AmethystButton, 'amethyst'],
    ['Topaz', TopazButton, 'topaz'],
  ])('renders %sButton with the matching gem prop', (_label, Component, gem) => {
    render(<Component />)

    expect(screen.getByRole('button', { name: new RegExp(gem, 'i') })).toHaveAttribute(
      'data-gem',
      gem,
    )
  })
})
