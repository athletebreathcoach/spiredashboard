import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const Layout = {
  window: {
    width,
    height,
  },
  // Minimum touch target size (44x44 points)
  minTouchSize: 44,
  
  // Text sizes (11pt minimum)
  text: {
    tiny: 12,
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },
  
  // Standard spacing
  spacing: {
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48,
  },
  
  // Border radius
  borderRadius: {
    small: 6,
    medium: 12,
    large: 16,
  }
};

export default Layout; 