'use client'

import React, { useEffect } from 'react'
import type { GemButtonProps, GemSize } from '../../types'
import { GEM_CONFIGS } from '../../gem-configs'
import { injectGemStyles } from '../../utils/inject-styles'

const SIZE_MAP: Record<GemSize, React.CSSProperties> = {
  sm: {
    padding:    '6px 16px',
    fontSize:   '11px',
    minHeight:  '32px',
    minWidth:   '80px',
    borderRadius: '6px',
    letterSpacing: '0.06em',
  },
  md: {
    padding:    '10px 24px',
    fontSize:   '13px',
    minHeight:  '42px',
    minWidth:   '110px',
    borderRadius: '8px',
    letterSpacing: '0.07em',
  },
  lg: {
    padding:    '14px 32px',
    fontSize:   '15px',
    minHeight:  '52px',
    minWidth:   '140px',
    borderRadius: '10px',
    letterSpacing: '0.07em',
  },
  xl: {
    padding:    '18px 44px',
    fontSize:   '18px',
    minHeight:  '64px',
    minWidth:   '180px',
    borderRadius: '12px',
    letterSpacing: '0.08em',
  },
}

export function GemButton({
  gem,
  size = 'md',
  glow = true,
  pulse = false,
  children,
  className,
  style: userStyle,
  disabled,
  ...rest
}: GemButtonProps) {
  useEffect(() => {
    injectGemStyles()
  }, [])

  const cfg = GEM_CONFIGS[gem]
  const sizeStyle = SIZE_MAP[size]

  const cssVars = {
    '--fb-glow-close':    cfg.glowClose,
    '--fb-glow-diffuse':  cfg.glowDiffuse,
    '--fb-shimmer':       cfg.shimmer,
    '--fb-facet-overlay': cfg.facetOverlay,
  } as React.CSSProperties

  const computedStyle: React.CSSProperties = {
    // Layout & base
    position:        'relative',
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    cursor:          disabled ? 'not-allowed' : 'pointer',
    border:          cfg.border,
    fontFamily:      'inherit',
    fontWeight:      700,
    textTransform:   'uppercase',
    overflow:        'hidden',
    userSelect:      'none',
    whiteSpace:      'nowrap',

    // Gem appearance — multi-stop gradient simulating internal depth
    background: [
      // Subtle diagonal facet plane overlay
      `linear-gradient(35deg, transparent 25%, ${cfg.facetOverlay} 50%, transparent 75%)`,
      // Primary depth gradient
      `linear-gradient(145deg, ${cfg.gradientTop} 0%, ${cfg.gradientMid} 45%, ${cfg.gradientBottom} 100%)`,
    ].join(', '),

    // Layered box-shadow: inset facets + outer glow + drop shadow
    boxShadow: [
      `inset 2px 3px 8px ${cfg.facetHighlight}`,
      `inset -2px -3px 8px ${cfg.facetShadow}`,
      `0 0 14px 3px ${cfg.glowClose}`,
      `0 0 36px 8px ${cfg.glowDiffuse}`,
      '0 4px 18px rgba(0,0,0,0.45)',
    ].join(', '),

    color: cfg.textColor,
    textShadow: cfg.textColor === '#ffffff'
      ? '0 1px 3px rgba(0,0,0,0.6)'
      : '0 1px 2px rgba(255,255,255,0.6)',

    ...sizeStyle,
    ...cssVars,
    ...userStyle,
  }

  const classes = ['fb-btn', pulse ? 'fb-pulse' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      data-gem={gem}
      className={classes}
      style={computedStyle}
      disabled={disabled}
      {...rest}
    >
      {children ?? gem.charAt(0).toUpperCase() + gem.slice(1)}
    </button>
  )
}
