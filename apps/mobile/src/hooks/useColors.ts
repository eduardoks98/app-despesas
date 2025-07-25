import { useTheme } from '../contexts/ThemeContext';
import { lightColors, darkColors } from '../styles/colors';

export const useColors = () => {
  const { isDarkMode } = useTheme();
  return isDarkMode ? darkColors : lightColors;
};