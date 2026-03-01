import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

interface WhiteLabelConfig {
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
}

interface WhiteLabelContextType extends WhiteLabelConfig {
  loading: boolean;
}

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  primaryColor: null,
  secondaryColor: null,
  logoUrl: null,
  loading: false,
});

export const useWhiteLabel = () => useContext(WhiteLabelContext);

/** Convert a hex color (#rrggbb) to HSL string "h s% l%" */
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Generate a foreground color (light or dark) for contrast */
function foregroundForHsl(hslStr: string): string {
  const parts = hslStr.split(/\s+/);
  const l = parseFloat(parts[2]);
  return l > 55 ? '222.2 47.4% 11.2%' : '210 40% 98%';
}

export const WhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedOrganization } = useOrganization();
  const [config, setConfig] = useState<WhiteLabelConfig>({
    primaryColor: null,
    secondaryColor: null,
    logoUrl: null,
  });

  useEffect(() => {
    if (!selectedOrganization) {
      // Reset to defaults
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-foreground');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--sidebar-primary');
      setConfig({ primaryColor: null, secondaryColor: null, logoUrl: null });
      return;
    }

    const org = selectedOrganization as any;
    const primaryColor = org.primary_color || null;
    const secondaryColor = org.secondary_color || null;
    const logoUrl = org.logo_url || null;

    setConfig({ primaryColor, secondaryColor, logoUrl });

    // Apply CSS variables dynamically
    if (primaryColor) {
      const hsl = hexToHsl(primaryColor);
      if (hsl) {
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--primary-foreground', foregroundForHsl(hsl));
        document.documentElement.style.setProperty('--ring', hsl);
        document.documentElement.style.setProperty('--sidebar-primary', hsl);
      }
    } else {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-foreground');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--sidebar-primary');
    }
  }, [selectedOrganization]);

  return (
    <WhiteLabelContext.Provider value={{ ...config, loading: false }}>
      {children}
    </WhiteLabelContext.Provider>
  );
};
