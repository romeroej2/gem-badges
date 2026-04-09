'use client'

import { useState } from 'react'
import {
  GemBadge,
  type DiamondCut,
  type GemBadgeStone,
  type GemBadgeRenderMode,
  type GemView,
} from '../components/GemBadge'

const ALL_BADGE_STONES: GemBadgeStone[] = ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']
const ALL_DIAMOND_CUTS: DiamondCut[] = ['round', 'princess', 'oval', 'emerald', 'heart', 'marquise']

// ─── MOCK TOOLBAR ─────────────────────────────────────────────────────────────
function MockToolbar({
  glow,
  glowIntensity,
  cut,
  renderMode,
  stone,
  rotation,
  view,
}: {
  glow: boolean
  glowIntensity: number
  cut: DiamondCut
  renderMode: GemBadgeRenderMode
  stone: GemBadgeStone
  rotation: number
  view: GemView
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
        renderMode={renderMode}
        size={58}
        view={view}
        rotation={rotation}
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
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.50)',
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 160ms ease',
  },
  tabActive: {
    background: 'rgba(93,140,255,0.20)',
    color: '#dceaff',
  },
}

export default function Page() {
  const [selectedStone, setSelectedStone] = useState<GemBadgeStone>('diamond')
  const [selectedCut, setSelectedCut] = useState<DiamondCut>('round')
  const [selectedRenderMode, setSelectedRenderMode] = useState<GemBadgeRenderMode>('webgl')
  const [selectedView, setSelectedView] = useState<GemView>('top')
  const [selectedRotation, setSelectedRotation] = useState(0)
  const [glowEnabled, setGlowEnabled] = useState(true)
  const [glowIntensity, setGlowIntensity] = useState(0.28)
  const [activeTab, setActiveTab] = useState<string>('stones')
  const previewModeLabel = selectedRenderMode === 'webgl'
    ? 'library webgl'
    : 'dom'

  const TABS = [
    { id: 'stones', label: 'All Stones' },
    { id: 'sizes', label: 'Sizes' },
    { id: 'cuts', label: 'Cuts' },
    { id: 'view', label: 'View' },
    { id: 'glow', label: 'Glow' },
  ]

  return (
    <div style={s.page}>

      {/* HEADER */}
      <header style={s.head}>
        <h1 style={s.title}>Gem Badge Lab</h1>
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

            <div style={s.controlRow}>
              {(['webgl', 'dom'] as GemBadgeRenderMode[]).map(mode => (
                <TogglePill
                  key={mode}
                  active={selectedRenderMode === mode}
                  onClick={() => setSelectedRenderMode(mode)}
                >
                  {mode}
                </TogglePill>
              ))}
            </div>

            <div style={s.controlRow}>
              {(['top', 'front'] as GemView[]).map(view => (
                <TogglePill
                  key={view}
                  active={selectedView === view}
                  onClick={() => setSelectedView(view as GemView)}
                >
                  {view}
                </TogglePill>
              ))}
            </div>

            <div style={{ ...s.center, gap: 10 }}>
              <span style={s.controlLabel}>Rotation: {selectedRotation}°</span>
              <input
                type="range"
                min="0"
                max="315"
                step="45"
                value={selectedRotation}
                onChange={(event) => setSelectedRotation(Number(event.target.value))}
                style={s.slider}
              />
            </div>

            <div style={{ ...s.center, gap: 16 }}>
              <GemBadge
                stone={selectedStone}
                cut={selectedCut}
                renderMode={selectedRenderMode}
                view={selectedView}
                rotation={selectedRotation}
                size={124}
                glow={glowEnabled}
                glowIntensity={glowIntensity}
              />
              <span style={s.badgeLabel}>
                {selectedStone} preview ({previewModeLabel})
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

          {/* Tabs */}
          <div style={s.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...s.tab,
                  ...(activeTab === tab.id ? s.tabActive : {}),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* All stones hero row */}
          {activeTab === 'stones' && (
            <div style={{ ...s.row, justifyContent: 'center' }}>
              {ALL_BADGE_STONES.map(stone => (
                <div key={stone} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <GemBadge
                    stone={stone}
                    cut={selectedCut}
                    renderMode="webgl"
                    size={80}
                    glow={glowEnabled}
                    glowIntensity={glowIntensity}
                  />
                  <span style={s.badgeLabel}>{stone.charAt(0).toUpperCase() + stone.slice(1)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sizes — diamond */}
          {activeTab === 'sizes' && (
            <div>
              <p style={{ ...s.badgeLabel, marginBottom: 16 }}>sizes</p>
              <div style={{ ...s.row, justifyContent: 'center' }}>
                {[28, 36, 48, 64, 80, 100].map(sz => (
                  <div key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <GemBadge
                      stone={selectedStone}
                      cut={selectedCut}
                      renderMode="webgl"
                      size={sz}
                      glow={glowEnabled}
                      glowIntensity={glowIntensity}
                    />
                    <span style={s.badgeLabel}>{sz}px</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cuts */}
          {activeTab === 'cuts' && (
            <div>
              <p style={{ ...s.badgeLabel, marginBottom: 16 }}>{selectedStone} cuts</p>
              <div style={{ ...s.row, justifyContent: 'center' }}>
                {ALL_DIAMOND_CUTS.map(cut => (
                  <div key={cut} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <GemBadge
                      stone={selectedStone}
                      cut={cut}
                      renderMode="webgl"
                      size={92}
                      glow={glowEnabled}
                      glowIntensity={glowIntensity}
                    />
                    <span style={s.badgeLabel}>{cut}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View & Rotation */}
          {activeTab === 'view' && (
            <div>
              <p style={{ ...s.badgeLabel, marginBottom: 16 }}>view angle</p>
              <div style={{ ...s.row, justifyContent: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={92} view="top" />
                  <span style={s.badgeLabel}>top</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={92} view="front" />
                  <span style={s.badgeLabel}>front</span>
                </div>
              </div>
              <p style={{ ...s.badgeLabel, marginBottom: 16 }}>rotation angles</p>
              <div style={{ ...s.row, justifyContent: 'center' }}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map(rot => (
                  <div key={rot} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={72} rotation={rot} />
                    <span style={s.badgeLabel}>{rot}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Glow comparison */}
          {activeTab === 'glow' && (
            <div>
              <p style={{ ...s.badgeLabel, marginBottom: 16 }}>glow comparison</p>
              <div style={{ ...s.row, justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={92} glow={false} />
                  <span style={s.badgeLabel}>off</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={92} glow glowIntensity={0.45} />
                  <span style={s.badgeLabel}>soft</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={92} glow glowIntensity={0.9} />
                  <span style={s.badgeLabel}>medium</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <GemBadge stone={selectedStone} cut={selectedCut} renderMode="webgl" size={92} glow glowIntensity={1.35} />
                  <span style={s.badgeLabel}>strong</span>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar context - always visible */}
          <div>
            <p style={{ ...s.badgeLabel, marginBottom: 14 }}>in a toolbar</p>
            <MockToolbar
              glow={glowEnabled}
              glowIntensity={glowIntensity}
              cut={selectedCut}
              renderMode={selectedRenderMode}
              stone={selectedStone}
              rotation={selectedRotation}
              view={selectedView}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
