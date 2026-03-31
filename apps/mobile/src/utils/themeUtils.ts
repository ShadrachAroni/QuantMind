/**
 * Converts a hex color string to an RGBA string with the given opacity.
 * Supports both #RRGGBB and #RGB formats.
 */
export const hexToRgba = (hex: string, opacity: number): string => {
  let r = 0, g = 0, b = 0;

  // Handle #RGB
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  // Handle #RRGGBB
  else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
