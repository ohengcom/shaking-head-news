/**
 * Color utility functions for theme validation
 * Used for WCAG contrast ratio calculations
 */

/**
 * Converts HSL values to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB values as [r, g, b] (0-255)
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // Normalize values
  const hNorm = h / 360
  const sNorm = s / 100
  const lNorm = l / 100

  if (sNorm === 0) {
    const gray = Math.round(lNorm * 255)
    return [gray, gray, gray]
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm
  const p = 2 * lNorm - q

  const r = hue2rgb(p, q, hNorm + 1 / 3)
  const g = hue2rgb(p, q, hNorm)
  const b = hue2rgb(p, q, hNorm - 1 / 3)

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * Calculates relative luminance of a color
 * Based on WCAG 2.1 formula
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const mapped = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })

  const rs = mapped[0] ?? 0
  const gs = mapped[1] ?? 0
  const bs = mapped[2] ?? 0

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculates WCAG contrast ratio between two colors
 * @param color1 - First color as [r, g, b]
 * @param color2 - Second color as [r, g, b]
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const l1 = getRelativeLuminance(...color1)
  const l2 = getRelativeLuminance(...color2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Parses HSL string from CSS variable format
 * @param hslString - HSL string like "210 40% 98%" or "222.2 84% 4.9%"
 * @returns [h, s, l] values
 */
export function parseHslString(hslString: string): [number, number, number] {
  const parts = hslString.trim().split(/\s+/)
  const h = parseFloat(parts[0] || '0')
  const s = parseFloat((parts[1] || '0%').replace('%', ''))
  const l = parseFloat((parts[2] || '0%').replace('%', ''))
  return [h, s, l]
}

/**
 * Checks if contrast ratio meets WCAG AA standard
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if meets WCAG AA
 */
export function meetsWcagAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Checks if contrast ratio meets WCAG AAA standard
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether the text is large
 * @returns true if meets WCAG AAA
 */
export function meetsWcagAAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}
