'use client'

import { useState } from 'react'
import { GemBadge, type DiamondCut, type GemBadgeStone } from '../components/GemBadge'
import { GemButton, type GemType } from 'fancy-buttons'

const ALL_BADGE_STONES: GemBadgeStone[] = ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']
const ALL_DIAMOND_CUTS: DiamondCut[] = ['round', 'princess', 'oval', 'emerald', 'heart', 'marquise']

// ─── MOCK TOOLBAR ─────────────────────────────────────────────────────────────
function MockToolbar({
  glow,
  glowIntensity,
  cut,
  stone,
}: {
  glow: boolean
  glowIntensity: number
  cut: DiamondCut
  stone: GemBadgeStone
}) {
  return (
    <div style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            18,
      padding:        '14px 18px',
      background:     'linear-gradient(180deg, rgba(22,22,24,0.96), rgba(12,12,14,0.98))',
      border:         '1px solid rgba(255,255,255,0.05)',
      borderRadius:   999,
      boxShadow:      '0 18px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
      backdropFilter: 'blur(16px)',
    }}>
      <GemBadge
        stone={stone}
        cut={cut}
        size={58}
        glow={glow}
        glowIntensity={glowIntensity}
        onClick={() => alert('gem clicked')}
      />
      {['Home', 'Explore', 'Create', 'Profile'].map(label => (
        <button key={label} style={{
          display:        'flex',
          alignItems:     'center',
          gap:            10,
          padding:        '12px 18px',
          background:     'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))',
          border:         '1px solid rgba(255,255,255,0.035)',
          borderRadius:   999,
          boxShadow:      'inset 0 1px 0 rgba(255,255,255,0.025)',
          color:          'rgba(255,255,255,0.60)',
          fontSize:       14,
          fontFamily:     'inherit',
          cursor:         'pointer',
          whiteSpace:     'nowrap',
        }}>
          <span style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.40)',
            opacity: 0.7,
          }} />
          {label}
        </button>
      ))}
    </div>
  )
}

function TogglePill({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: active ? '1px solid rgba(120,180,255,0.55)' : '1px solid rgba(255,255,255,0.10)',
        background: active ? 'rgba(70,120,255,0.18)' : 'rgba(255,255,255,0.04)',
        color: active ? '#dceaff' : 'rgba(255,255,255,0.72)',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth:    960,
    margin:      '0 auto',
    padding:     '60px 24px 100px',
  },
  head: {
    textAlign:   'center',
    marginBottom: 72,
  },
  title: {
    fontSize:    'clamp(26px, 5vw, 46px)',
    fontWeight:  800,
    letterSpacing: '0.11em',
    textTransform: 'uppercase',
    background:  'linear-gradient(135deg, #add8ff 0%, #fff 30%, #ccaaff 55%, #ffcc66 80%, #add8ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: 10,
  },
  sub: {
    fontSize:    13,
    letterSpacing: '0.20em',
    textTransform: 'uppercase',
    color:       'rgba(255,255,255,0.32)',
  },
  divider: {
    border:      'none',
    borderTop:   '1px solid rgba(255,255,255,0.07)',
    margin:      '0 0 56px',
  },
  section: {
    marginBottom: 64,
  },
  sectionLabel: {
    fontSize:    11,
    fontWeight:  700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color:       'rgba(255,255,255,0.28)',
    marginBottom: 28,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap:     24,
    alignItems: 'center',
  },
  center: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            24,
  },
  badgeLabel: {
    textAlign:   'center',
    fontSize:    11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color:       'rgba(255,255,255,0.30)',
    marginTop:   4,
  },
  controlsCard: {
    width: 'min(100%, 760px)',
    display: 'grid',
    gap: 18,
    padding: 24,
    background: 'linear-gradient(180deg, rgba(26,26,30,0.94), rgba(16,16,20,0.92))',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 28,
    boxShadow: '0 24px 44px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)',
    backdropFilter: 'blur(18px)',
  },
  controlRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.34)',
  },
  slider: {
    width: 'min(100%, 320px)',
    accentColor: '#5d8cff',
  },
}

const ALL_CSS_GEMS: GemType[] = ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']

export default function Page() {
  const [selectedStone, setSelectedStone] = useState<GemBadgeStone>('diamond')
  const [selectedCut, setSelectedCut] = useState<DiamondCut>('round')
  const [glowEnabled, setGlowEnabled] = useState(true)
  const [glowIntensity, setGlowIntensity] = useState(0.28)

  return (
    <div style={s.page}>

      {/* HEADER */}
      <header style={s.head}>
        <h1 style={s.title}>Fancy Buttons</h1>
        <p style={s.sub}>Precious Stone Collection</p>
      </header>

      <hr style={s.divider} />

      {/* ── 3D GEM BADGES ─────────────────────────────────────────────────── */}
      <section style={s.section}>
        <p style={s.sectionLabel}>3D Gem Badges</p>
        <div style={s.center}>

          <div style={s.controlsCard}>
            <div style={s.controlRow}>
              {ALL_BADGE_STONES.map(stone => (
                <TogglePill
                  key={stone}
                  active={selectedStone === stone}
                  onClick={() => setSelectedStone(stone)}
                >
                  {stone}
                </TogglePill>
              ))}
            </div>

            <div style={s.controlRow}>
              {ALL_DIAMOND_CUTS.map(cut => (
                <TogglePill
                  key={cut}
                  active={selectedCut === cut}
                  onClick={() => setSelectedCut(cut)}
                >
                  {cut}
                </TogglePill>
              ))}
            </div>

            <div style={{ ...s.center, gap: 16 }}>
              <GemBadge
                stone={selectedStone}
                cut={selectedCut}
                size={124}
                glow={glowEnabled}
                glowIntensity={glowIntensity}
              />
              <span style={s.badgeLabel}>
                {selectedStone} preview
              </span>
            </div>

            <div style={s.controlRow}>
              <TogglePill active={glowEnabled} onClick={() => setGlowEnabled(true)}>
                Glow On
              </TogglePill>
              <TogglePill active={!glowEnabled} onClick={() => setGlowEnabled(false)}>
                Glow Off
              </TogglePill>
            </div>

            <div style={{ ...s.center, gap: 10 }}>
              <span style={s.controlLabel}>Glow Intensity: {glowIntensity.toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={glowIntensity}
                onChange={(event) => setGlowIntensity(Number(event.target.value))}
                style={s.slider}
                disabled={!glowEnabled}
              />
            </div>
          </div>

          {/* All stones hero row */}
          <div style={{ ...s.row, justifyContent: 'center' }}>
            {ALL_BADGE_STONES.map(stone => (
              <div key={stone} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <GemBadge
                  stone={stone}
                  cut={selectedCut}
                  size={80}
                  glow={glowEnabled}
                  glowIntensity={glowIntensity}
                />
                <span style={s.badgeLabel}>{stone.charAt(0).toUpperCase() + stone.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Toolbar context */}
          <div>
            <p style={{ ...s.badgeLabel, marginBottom: 14 }}>in a toolbar</p>
            <MockToolbar
              glow={glowEnabled}
              glowIntensity={glowIntensity}
              cut={selectedCut}
              stone={selectedStone}
            />
          </div>

          {/* Sizes — diamond */}
          <div>
            <p style={{ ...s.badgeLabel, marginBottom: 16 }}>sizes</p>
            <div style={{ ...s.row, justifyContent: 'center' }}>
              {[28, 36, 48, 64, 80, 100].map(sz => (
                <div key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge
                    stone={selectedStone}
                    cut={selectedCut}
                    size={sz}
                    glow={glowEnabled}
                    glowIntensity={glowIntensity}
                  />
                  <span style={s.badgeLabel}>{sz}px</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ ...s.badgeLabel, marginBottom: 16 }}>{selectedStone} cuts</p>
            <div style={{ ...s.row, justifyContent: 'center' }}>
              {ALL_DIAMOND_CUTS.map(cut => (
                <div key={cut} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge
                    stone={selectedStone}
                    cut={cut}
                    size={92}
                    glow={glowEnabled}
                    glowIntensity={glowIntensity}
                  />
                  <span style={s.badgeLabel}>{cut}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ ...s.badgeLabel, marginBottom: 16 }}>glow comparison</p>
            <div style={{ ...s.row, justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <GemBadge stone={selectedStone} cut={selectedCut} size={92} glow={false} />
                <span style={s.badgeLabel}>off</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <GemBadge stone={selectedStone} cut={selectedCut} size={92} glow glowIntensity={0.45} />
                <span style={s.badgeLabel}>soft</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <GemBadge stone={selectedStone} cut={selectedCut} size={92} glow glowIntensity={0.9} />
                <span style={s.badgeLabel}>medium</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <GemBadge stone={selectedStone} cut={selectedCut} size={92} glow glowIntensity={1.35} />
                <span style={s.badgeLabel}>strong</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr style={s.divider} />

      {/* ── CSS GEM BUTTONS ───────────────────────────────────────────────── */}
      <section style={s.section}>
        <p style={s.sectionLabel}>CSS Gem Buttons</p>
        <div style={s.row}>
          {ALL_CSS_GEMS.map(gem => (
            <GemButton key={gem} gem={gem} size="md">
              {gem.charAt(0).toUpperCase() + gem.slice(1)}
            </GemButton>
          ))}
        </div>
      </section>

      <section style={s.section}>
        <p style={s.sectionLabel}>Sizes</p>
        <div style={{ ...s.row, alignItems: 'flex-end' }}>
          <GemButton gem="sapphire" size="sm">Small</GemButton>
          <GemButton gem="sapphire" size="md">Medium</GemButton>
          <GemButton gem="sapphire" size="lg">Large</GemButton>
          <GemButton gem="sapphire" size="xl">Extra Large</GemButton>
        </div>
      </section>

      <section style={s.section}>
        <p style={s.sectionLabel}>States</p>
        <div style={s.row}>
          <GemButton gem="ruby"     size="md" glow={false}>No Glow</GemButton>
          <GemButton gem="amethyst" size="md" pulse>Pulsing</GemButton>
          <GemButton gem="emerald"  size="md" disabled>Disabled</GemButton>
        </div>
      </section>

    </div>
  )
}
