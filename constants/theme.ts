/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FFD700'; // A bright, primary yellow
const tintColorDark = '#FFFFFF'; // White for text and icons on dark backgrounds

export const Colors = {
  light: {
    text: '#3A3A3A', // Dark grey for readability
    background: '#FFFACD', // Lemon chiffon for a light, airy background
    tint: tintColorLight,
    icon: '#B8860B', // Dark goldenrod for icons
    tabIconDefault: '#B8860B',
    tabIconSelected: tintColorLight,
    primary: '#FFD700', // Bright yellow for primary actions
    secondary: '#FFA500', // Orange for secondary actions
    card: '#FFFFFF', // White for card backgrounds
    tabBar: '#FFD700', // Bright yellow for the tab bar
  },
  dark: {
    text: '#ECEDEE', // Light grey for text on dark backgrounds
    background: '#282828', // Dark grey for the background
    tint: tintColorDark,
    icon: '#FFD700', // Bright yellow for icons
    tabIconDefault: '#B8860B', // Dark goldenrod for inactive tab icons
    tabIconSelected: tintColorDark,
    primary: '#FFD700', // Bright yellow for primary actions
    secondary: '#FFA500', // Orange for secondary actions
    card: '#3A3A3A', // Dark grey for card backgrounds
    tabBar: '#282828', // Dark grey for the tab bar
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