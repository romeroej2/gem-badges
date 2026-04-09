'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { GEM_BADGE_MATERIALS } from '../../gem-badge-configs'
import type { GemBadgeConfig, GemBadgeProps } from '../../types'
import { mountGemBadgeWebGL } from '../../utils/create-gem-badge-webgl'

const DEFAULT_CONFIG: Required<GemBadgeConfig> = {
  size: 72,
  material: 'diamond',
  cut: 'round',
  renderMode: 'auto',
  glow: true,
  glowIntensity: 1,
  animate: false,
}

export function GemBadge({
  config,
  className,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  style,
  tabIndex,
  role,
  ...rest
}: GemBadgeProps) {
  const resolved = { ...DEFAULT_CONFIG, ...config }
  const material = GEM_BADGE_MATERIALS[resolved.material]
  const rootRef = useRef<HTMLSpanElement>(null)
  const [hovered, setHovered] = useState(false)
  const disabled = rest['aria-disabled'] === true

  useEffect(() => {
    const container = rootRef.current
    if (!container) return

    return mountGemBadgeWebGL(container, {
      material: resolved.material,
      cut: resolved.cut,
      glow: resolved.glow,
      glowIntensity: resolved.glowIntensity,
      animate: resolved.animate,
      force2d: resolved.renderMode === 'dom',
      disabled,
    })
  }, [
    disabled,
    resolved.animate,
    resolved.cut,
    resolved.glow,
    resolved.glowIntensity,
    resolved.material,
    resolved.renderMode,
  ])

  const interactive = typeof onClick === 'function'
  const computedRole = role ?? (interactive ? 'button' : undefined)
  const computedTabIndex = interactive ? (tabIndex ?? 0) : tabIndex
  const haloOpacity = resolved.glow
    ? 0.22 + resolved.glowIntensity * (hovered ? 0.18 : 0.10)
    : 0

  const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
    onKeyDown?.(event)

    if (
      !event.defaultPrevented &&
      interactive &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault()
      onClick?.(event as unknown as React.MouseEvent<HTMLSpanElement>)
    }
  }

  const wrapperStyle = useMemo<React.CSSProperties>(() => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: resolved.size,
    height: resolved.size,
    isolation: 'isolate',
    lineHeight: 0,
    cursor: interactive ? 'pointer' : 'default',
    outline: 'none',
    userSelect: 'none',
    transform: hovered ? 'scale(1.04)' : 'scale(1)',
    transition: 'transform 160ms ease, filter 160ms ease',
    filter: haloOpacity > 0
      ? `drop-shadow(0 8px 22px rgba(0,0,0,0.26))`
      : 'drop-shadow(0 8px 18px rgba(0,0,0,0.16))',
    ...style,
  }), [haloOpacity, hovered, interactive, resolved.size, style])

  return (
    <span
      {...rest}
      ref={rootRef}
      className={className}
      role={computedRole}
      tabIndex={computedTabIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(event) => {
        setHovered(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setHovered(false)
        onMouseLeave?.(event)
      }}
      style={wrapperStyle}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-8%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%, ${material.glowColor} 0%, transparent 60%)`,
          opacity: haloOpacity,
          filter: 'blur(14px)',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'opacity 160ms ease, transform 160ms ease',
          pointerEvents: 'none',
        }}
      />

    </span>
  )
}
