/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#B8860B'; // Dark Goldenrod
const tintColorDark = '#FFD700'; // Gold

export const Colors = {
  light: {
    text: '#9E8719',
    background: '#FFFFFF', // White
    tint: tintColorLight,
    icon: '#B8860B', // Dark Goldenrod
    tabIconDefault: '#B8860B',
    tabIconSelected: tintColorLight,
    primary: '#FFD700', // Gold
    secondary: '#FFA500', // Orange
    card: '#FFFFFF', // White
    tabBar: '#FFFFFF', // White
    shadow: '#FFD700', // Gold for shadows
  },
  dark: {
    text: '#9E8719',
    background: '#FFFFFF', // White
    tint: tintColorDark,
    icon: '#FFD700', // Gold
    tabIconDefault: '#B8860B', // Dark Goldenrod
    tabIconSelected: tintColorDark,
    primary: '#FFD700', // Gold
    secondary: '#FFA500', // Orange
    card: '#1E1E1E', // A bit lighter than background
    tabBar: '#121212', // Very dark grey
    shadow: '#FFD700', // Gold for shadows
  },
};

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