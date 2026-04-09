const STYLE_ID = 'fancy-buttons-styles'

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
    transform: translateY(-3px) scale(1.05);
  }

  .fb-btn:active {
    transform: translateY(1px) scale(0.97);
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

  /* Top-left specular highlight stripe */
  .fb-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 48%;
    background: linear-gradient(
      180deg,
      var(--fb-facet-overlay, rgba(255,255,255,0.30)) 0%,
      transparent 100%
    );
    border-radius: inherit;
    pointer-events: none;
  }

  /* Diagonal facet shine + shimmer on hover */
  .fb-btn::after {
    content: '';
    position: absolute;
    top: -10%;
    left: -25%;
    width: 35%;
    height: 120%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--fb-shimmer, rgba(255,255,255,0.40)) 50%,
      transparent 100%
    );
    transform: translateX(-140%) skewX(-20deg);
    pointer-events: none;
    will-change: transform;
  }

  .fb-btn:hover::after {
    animation: fb-shimmer 0.65s ease forwards;
  }

  .fb-pulse {
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
