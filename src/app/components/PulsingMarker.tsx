/**
 * Custom Pulsing Map Marker Component
 * Creates beautiful animated pulses for Givers and Receivers
 */

import L from 'leaflet';

export function createPulsingMarker(color: string, isHighlighted: boolean = false) {
  const size = isHighlighted ? 50 : 40;
  const pulseSize = isHighlighted ? 80 : 60;
  
  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      <!-- Outer pulse ring (animated) -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${pulseSize}px;
        height: ${pulseSize}px;
        margin-left: -${pulseSize/2}px;
        margin-top: -${pulseSize/2}px;
        background: ${color};
        border-radius: 50%;
        opacity: 0;
        animation: pulse 2s ease-out infinite;
      "></div>
      
      <!-- Middle pulse ring -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${pulseSize * 0.7}px;
        height: ${pulseSize * 0.7}px;
        margin-left: -${pulseSize * 0.7 / 2}px;
        margin-top: -${pulseSize * 0.7 / 2}px;
        background: ${color};
        border-radius: 50%;
        opacity: 0;
        animation: pulse 2s ease-out 0.5s infinite;
      "></div>
      
      <!-- Glow ring -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${size * 1.2}px;
        height: ${size * 1.2}px;
        margin-left: -${size * 1.2 / 2}px;
        margin-top: -${size * 1.2 / 2}px;
        background: ${color};
        border-radius: 50%;
        opacity: 0.3;
        filter: blur(8px);
      "></div>
      
      <!-- Core dot -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${size}px;
        height: ${size}px;
        margin-left: -${size/2}px;
        margin-top: -${size/2}px;
        background: linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 20px ${color}80;
        animation: ${isHighlighted ? 'bounce 1s ease-in-out infinite' : 'none'};
      "></div>
      
      ${isHighlighted ? `
        <!-- Star indicator for top matches -->
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background: #73C6D9;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 10px rgba(115, 198, 217, 0.5);
        ">⭐</div>
      ` : ''}
    </div>
    
    <style>
      @keyframes pulse {
        0% {
          transform: scale(0.5);
          opacity: 0.8;
        }
        100% {
          transform: scale(1.2);
          opacity: 0;
        }
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }
    </style>
  `;
  
  return L.divIcon({
    html: html,
    className: 'custom-pulsing-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

// Helper to adjust color brightness
function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

// Color constants for different marker types
export const MARKER_COLORS = {
  giver: '#126DA6',
  receiver: '#EF4444',
  highlighted: '#73C6D9'
};
