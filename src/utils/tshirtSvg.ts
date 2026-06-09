import { TShirtColor, TShirtView } from '../types';

// SVG t-shirt mockups for front view per color
export const TSHIRT_COLORS: { value: TShirtColor; label: string; hex: string }[] = [
  { value: 'black', label: 'Black', hex: '#111111' },
  { value: 'white', label: 'White', hex: '#f5f5f5' },
  { value: 'navy', label: 'Navy', hex: '#1a237e' },
  { value: 'red', label: 'Red', hex: '#c62828' },
  { value: 'gray', label: 'Gray', hex: '#616161' },
];

// Print area bounds on the canvas (relative to stage)
export const PRINT_AREA = {
  front: { x: 155, y: 120, width: 190, height: 220 },
  back:  { x: 155, y: 110, width: 190, height: 230 },
};

// Canvas dimensions
export const CANVAS_WIDTH  = 500;
export const CANVAS_HEIGHT = 560;

// T-Shirt SVG paths per view
export function getTshirtSVG(color: TShirtColor, view: TShirtView): string {
  const fill = TSHIRT_COLORS.find(c => c.value === color)?.hex ?? '#111111';
  const shadow = color === 'white' ? '#cccccc' : 'rgba(0,0,0,0.35)';
  const highlight = color === 'white' ? '#ffffff' : 'rgba(255,255,255,0.06)';
  const stroke = color === 'white' ? '#d0d0d0' : 'rgba(255,255,255,0.08)';

  if (view === 'front') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 560" width="500" height="560">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="${shadow}" flood-opacity="0.7"/>
    </filter>
    <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${highlight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${fill};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="sleeveGradL" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${fill};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${shadow};stop-opacity:0.5" />
    </linearGradient>
    <linearGradient id="sleeveGradR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${fill};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${shadow};stop-opacity:0.5" />
    </linearGradient>
  </defs>

  <!-- Left sleeve (Boxy) -->
  <path d="M110,130 L195,60 L40,220 L60,260 L120,200 Z"
        fill="url(#sleeveGradL)" stroke="${stroke}" stroke-width="1"/>
  <!-- Right sleeve (Boxy) -->
  <path d="M390,130 L305,60 L460,220 L440,260 L380,200 Z"
        fill="url(#sleeveGradR)" stroke="${stroke}" stroke-width="1"/>

  <!-- Body (Boxy: wider, dropped shoulders) -->
  <path d="M110,130 L120,200 L120,520 L380,520 L380,200 L390,130 L305,60 Q270,30 250,28 Q230,30 195,60 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="url(#shadow)"/>

  <!-- Collar -->
  <path d="M195,60 Q215,75 250,78 Q285,75 305,60 Q275,95 250,96 Q225,95 195,60 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="1"/>

  <!-- Fold/crease subtle lines -->
  <line x1="250" y1="100" x2="250" y2="510" stroke="${highlight}" stroke-width="1" opacity="0.4"/>

  <!-- Hem line -->
  <line x1="123" y1="516" x2="377" y2="516" stroke="${stroke}" stroke-width="1.5"/>

  <!-- Sleeve seams -->
  <line x1="120" y1="202" x2="110" y2="132" stroke="${stroke}" stroke-width="1" opacity="0.6"/>
  <line x1="380" y1="202" x2="390" y2="132" stroke="${stroke}" stroke-width="1" opacity="0.6"/>
</svg>`;
  }

  // Back view (Boxy)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 560" width="500" height="560">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="${shadow}" flood-opacity="0.7"/>
    </filter>
    <linearGradient id="shirtGradB" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${highlight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${fill};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Left sleeve back -->
  <path d="M110,130 L195,60 L40,220 L60,260 L120,200 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="1" opacity="0.9"/>
  <!-- Right sleeve back -->
  <path d="M390,130 L305,60 L460,220 L440,260 L380,200 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="1" opacity="0.9"/>

  <!-- Body back -->
  <path d="M110,130 L120,200 L120,520 L380,520 L380,200 L390,130 L305,60 Q270,35 250,33 Q230,35 195,60 Z"
        fill="url(#shirtGradB)" stroke="${stroke}" stroke-width="1.5" filter="url(#shadow)"/>

  <!-- Back collar (small curve) -->
  <path d="M200,62 Q250,72 300,62"
        fill="none" stroke="${stroke}" stroke-width="1.5"/>

  <!-- Back center seam -->
  <line x1="250" y1="68" x2="250" y2="510" stroke="${highlight}" stroke-width="0.8" opacity="0.3"/>

  <!-- Hem -->
  <line x1="123" y1="516" x2="377" y2="516" stroke="${stroke}" stroke-width="1.5"/>
  <line x1="120" y1="202" x2="110" y2="132" stroke="${stroke}" stroke-width="1" opacity="0.6"/>
  <line x1="380" y1="202" x2="390" y2="132" stroke="${stroke}" stroke-width="1" opacity="0.6"/>
</svg>`;
}
