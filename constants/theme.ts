/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FF7E5F';

const lightTheme = {
  text: '#1F2A37',
  mutedText: '#4B5563',
  background: '#FFF8F0',
  tint: tintColorLight,
  icon: '#FF8C42',
  tabIconDefault: '#FF8C42',
  tabIconSelected: tintColorLight,
  primary: '#FF7E5F',
  secondary: '#06B6D4',
  card: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.85)',
  border: 'rgba(255, 255, 255, 0.4)',
  tabBar: '#FFFFFF',
  shadow: 'rgba(255, 115, 82, 0.35)',
};

export const Colors = {
  light: lightTheme,
  dark: lightTheme,
};

export const Gradients = {
  sunrise: ['#FF9A9E', '#FAD0C4'],
  rainforest: ['#11998E', '#38EF7D'],
  ocean: ['#4FACFE', '#00F2FE'],
  dusk: ['#4776E6', '#8E54E9'],
} as const;

export type GradientStops = (typeof Gradients)[keyof typeof Gradients];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
