'use client'

import React, { useEffect, useRef } from 'react'
import type { GemButtonProps, GemSize } from '../../types'
import { GEM_CONFIGS } from '../../gem-configs'
import { mountGemWebGL } from '../../utils/create-gem-webgl'
import { injectGemStyles } from '../../utils/inject-styles'

type GemButtonStyle = React.CSSProperties & {
  '--fb-gem-size'?: string
}

const SIZE_MAP: Record<GemSize, GemButtonStyle> = {
  sm: {
    padding:    '7px 16px 7px 12px',
    fontSize:   '11px',
    minHeight:  '38px',
    minWidth:   '98px',
    borderRadius: '999px',
    letterSpacing: '0.06em',
    gap: '10px',
    '--fb-gem-size': '24px',
  },
  md: {
    padding:    '9px 20px 9px 14px',
    fontSize:   '13px',
    minHeight:  '46px',
    minWidth:   '122px',
    borderRadius: '999px',
    letterSpacing: '0.07em',
    gap: '12px',
    '--fb-gem-size': '28px',
  },
  lg: {
    padding:    '11px 26px 11px 16px',
    fontSize:   '15px',
    minHeight:  '56px',
    minWidth:   '150px',
    borderRadius: '999px',
    letterSpacing: '0.07em',
    gap: '14px',
    '--fb-gem-size': '34px',
  },
  xl: {
    padding:    '14px 32px 14px 18px',
    fontSize:   '18px',
    minHeight:  '66px',
    minWidth:   '190px',
    borderRadius: '999px',
    letterSpacing: '0.08em',
    gap: '16px',
    '--fb-gem-size': '40px',
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cfg = GEM_CONFIGS[gem]

  useEffect(() => {
    injectGemStyles()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    return mountGemWebGL(canvas, {
      gradientTop: cfg.gradientTop,
      gradientMid: cfg.gradientMid,
      gradientBottom: cfg.gradientBottom,
      glowClose: cfg.glowClose,
      facetHighlight: cfg.facetHighlight,
      glow,
      pulse,
      disabled,
    })
  }, [cfg, disabled, glow, pulse])

  const sizeStyle = SIZE_MAP[size]
  const label = children ?? gem.charAt(0).toUpperCase() + gem.slice(1)

  const cssVars = {
    '--fb-glow-close': cfg.glowClose,
    '--fb-glow-diffuse': cfg.glowDiffuse,
    '--fb-shimmer': cfg.shimmer,
    '--fb-facet-overlay': cfg.facetOverlay,
  } as React.CSSProperties

  const computedStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: `1px solid color-mix(in srgb, ${cfg.gradientTop} 42%, rgba(255,255,255,0.14))`,
    fontFamily: 'inherit',
    fontWeight: 700,
    textTransform: 'uppercase',
    overflow: 'hidden',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    isolation: 'isolate',
    background: [
      'radial-gradient(circle at 14% 50%, rgba(255,255,255,0.11), transparent 22%)',
      'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.01) 40%, rgba(0,0,0,0.16))',
      'linear-gradient(135deg, rgba(17,20,29,0.98) 0%, rgba(7,10,17,0.98) 100%)',
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.18)',
      'inset 0 -10px 16px rgba(0,0,0,0.36)',
      glow ? `0 0 18px -4px ${cfg.glowClose}` : '0 0 0 transparent',
      glow ? `0 0 36px -8px ${cfg.glowDiffuse}` : '0 0 0 transparent',
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

  const classes = [
    'fb-btn',
    pulse ? 'fb-pulse' : '',
    glow ? '' : 'fb-no-glow',
    className ?? '',
  ]
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
      <span className="fb-btn__rim" aria-hidden="true" />
      <span className="fb-btn__underlight" aria-hidden="true" />
      <span className="fb-btn__gem-wrap" aria-hidden="true">
        <span className="fb-btn__gem-halo" />
        <canvas ref={canvasRef} className="fb-btn__gem-canvas" />
      </span>
      <span className="fb-btn__label">{label}</span>
      <span className="fb-btn__shine" aria-hidden="true" />
    </button>
  )
}
