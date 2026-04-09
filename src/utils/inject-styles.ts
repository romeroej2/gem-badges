const STYLE_ID = 'gem-badges-styles'

const CSS = `
  @keyframes fb-glow-pulse {
    0%, 100% { filter: brightness(1) drop-shadow(0 0 6px var(--fb-glow-close)); }
    50%       { filter: brightness(1.15) drop-shadow(0 0 14px var(--fb-glow-close)); }
  }

  @keyframes fb-shimmer {
    0%   { transform: translateX(-140%) skewX(-20deg); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(240%) skewX(-20deg); opacity: 0; }
  }

  .fb-btn {
    transition:
      transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.15s ease,
      filter 0.15s ease;
    -webkit-font-smoothing: antialiased;
  }

  .fb-btn:hover {
    transform: translateY(-2px) scale(1.02);
    filter: saturate(1.08);
  }

  .fb-btn:active {
    transform: translateY(1px) scale(0.985);
    transition-duration: 0.08s;
  }

  .fb-btn:focus-visible {
    outline: 2px solid var(--fb-glow-close);
    outline-offset: 3px;
  }

  .fb-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
    filter: none !important;
    animation: none !important;
  }

  .fb-btn__rim,
  .fb-btn__underlight,
  .fb-btn__shine {
    position: absolute;
    border-radius: inherit;
    pointer-events: none;
  }

  .fb-btn__rim {
    inset: 1px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.10), transparent 34%, rgba(0,0,0,0.22) 100%);
    opacity: 0.9;
    z-index: 0;
  }

  .fb-btn__underlight {
    inset: auto 14px 3px 14px;
    height: 42%;
    border-radius: 999px;
    background:
      radial-gradient(circle at 18% 40%, var(--fb-glow-diffuse, rgba(170,210,255,0.22)), transparent 28%),
      linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 100%);
    opacity: 0.92;
    filter: blur(10px);
    z-index: 0;
  }

  .fb-btn__gem-wrap {
    position: relative;
    flex: 0 0 auto;
    width: var(--fb-gem-size, 28px);
    height: var(--fb-gem-size, 28px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .fb-btn__gem-halo {
    position: absolute;
    inset: -34%;
    border-radius: 50%;
    background:
      radial-gradient(circle, var(--fb-glow-close, rgba(170,210,255,0.72)) 0%, var(--fb-glow-diffuse, rgba(170,210,255,0.20)) 36%, transparent 72%);
    filter: blur(8px);
    opacity: 0.88;
    transform: scale(0.94);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  }

  .fb-no-glow .fb-btn__gem-halo {
    opacity: 0.28;
  }

  .fb-btn__gem-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 50%;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.18),
      0 8px 18px rgba(0,0,0,0.35);
    transform: rotate(-9deg);
  }

  .fb-btn__label {
    position: relative;
    z-index: 1;
    line-height: 1;
  }

  .fb-btn__shine {
    top: -18%;
    left: -16%;
    width: 34%;
    height: 136%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--fb-shimmer, rgba(255,255,255,0.42)) 50%,
      transparent 100%
    );
    transform: translateX(-180%) skewX(-18deg);
    pointer-events: none;
    will-change: transform;
    z-index: 1;
  }

  .fb-btn:hover .fb-btn__shine {
    animation: fb-shimmer 0.65s ease forwards;
  }

  .fb-btn:hover .fb-btn__gem-halo {
    opacity: 1;
    transform: scale(1.02);
  }

  .fb-btn:hover .fb-btn__gem-canvas {
    transform: rotate(-7deg) scale(1.04);
  }

  .fb-pulse {
    animation: fb-glow-pulse 2.2s ease-in-out infinite !important;
  }

  .fb-pulse .fb-btn__gem-halo {
    animation: fb-glow-pulse 2.2s ease-in-out infinite !important;
  }
`

let injected = false

export function injectGemStyles(): void {
  if (injected || typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) {
    injected = true
    return
  }
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
  injected = true
}
