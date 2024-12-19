import { Platform } from 'react-native';

const Typography = {
  // System fonts
  fonts: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
    }),
    heavy: Platform.select({
      ios: 'System',
      android: 'Roboto-Black',
    }),
  },

  // Font weights (use these instead of direct numbers for consistency)
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  }
};

export default Typography; 