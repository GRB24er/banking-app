export const colors = {
  // Core backgrounds
  background: '#0B0D11',
  surface: '#141720',
  surfaceLight: '#1C2030',
  surfaceElevated: '#222738',

  // Borders
  border: '#2A2F40',
  borderLight: '#363C50',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A8C0',
  textMuted: '#5A6280',

  // Brand gold
  gold: '#C9A962',
  goldDark: '#A88B45',
  goldLight: '#E0C878',
  goldSubtle: 'rgba(201, 169, 98, 0.12)',
  goldMedium: 'rgba(201, 169, 98, 0.25)',

  // Account types
  checking: '#6366F1',
  savings: '#10B981',
  investment: '#F59E0B',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Gradients (as arrays for LinearGradient)
  gradientGold: ['#C9A962', '#A88B45'] as const,
  gradientDark: ['#141720', '#0B0D11'] as const,
  gradientCard: ['#1C2030', '#141720'] as const,
  gradientPremium: ['#C9A962', '#B8962E', '#8B7332'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#C9A962',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
