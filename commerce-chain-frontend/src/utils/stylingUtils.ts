export type ColorScheme = 'purple' | 'pink' | 'cyan' | 'green' | 'indigo' | 'blue' | 'red' | 'gray' | 'amber';

// Base button styles (common across all buttons)
const baseButtonStyle = "relative overflow-hidden flex items-center justify-center gap-3 rounded-lg border-2 transition-all duration-300 font-semibold";

// Static color classes - Tailwind needs complete class names
const colorClassesMap: Record<ColorScheme, {
  text: string;
  textBold: string;
  textSemibold: string;
  border: string;
  borderThick: string;
  shadow: string;
  shadowStrong: string;
  button: string;
  buttonHover: string;
  accentGradient: string;
  title: string;
  loading: string;
}> = {
  purple: {
    text: 'text-purple-300',
    textBold: 'font-bold text-purple-300',
    textSemibold: 'font-semibold text-purple-300',
    border: 'border-purple-400',
    borderThick: 'border-purple-500',
    shadow: 'hover:shadow-purple-400/50',
    shadowStrong: 'shadow-purple-500/50',
    button: 'bg-gradient-to-br from-purple-600 to-purple-700',
    buttonHover: 'hover:from-purple-500 hover:to-purple-600',
    accentGradient: 'from-purple-400 to-purple-300',
    title: 'text-purple-400',
    loading: 'text-purple-300',
  },
  pink: {
    text: 'text-pink-300',
    textBold: 'font-bold text-pink-300',
    textSemibold: 'font-semibold text-pink-300',
    border: 'border-pink-400',
    borderThick: 'border-pink-500',
    shadow: 'hover:shadow-pink-400/50',
    shadowStrong: 'shadow-pink-500/50',
    button: 'bg-gradient-to-br from-pink-600 to-pink-700',
    buttonHover: 'hover:from-pink-500 hover:to-pink-600',
    accentGradient: 'from-pink-400 to-pink-300',
    title: 'text-pink-400',
    loading: 'text-pink-300',
  },
  cyan: {
    text: 'text-cyan-300',
    textBold: 'font-bold text-cyan-300',
    textSemibold: 'font-semibold text-cyan-300',
    border: 'border-cyan-400',
    borderThick: 'border-cyan-500',
    shadow: 'hover:shadow-cyan-400/50',
    shadowStrong: 'shadow-cyan-500/50',
    button: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
    buttonHover: 'hover:from-cyan-500 hover:to-cyan-600',
    accentGradient: 'from-cyan-400 to-cyan-300',
    title: 'text-cyan-400',
    loading: 'text-cyan-300',
  },
  green: {
    text: 'text-green-300',
    textBold: 'font-bold text-green-300',
    textSemibold: 'font-semibold text-green-300',
    border: 'border-green-400',
    borderThick: 'border-green-500',
    shadow: 'hover:shadow-green-400/50',
    shadowStrong: 'shadow-green-500/50',
    button: 'bg-gradient-to-br from-green-600 to-green-700',
    buttonHover: 'hover:from-green-500 hover:to-green-600',
    accentGradient: 'from-green-400 to-green-300',
    title: 'text-green-400',
    loading: 'text-green-300',
  },
  indigo: {
    text: 'text-indigo-300',
    textBold: 'font-bold text-indigo-300',
    textSemibold: 'font-semibold text-indigo-300',
    border: 'border-indigo-400',
    borderThick: 'border-indigo-500',
    shadow: 'hover:shadow-indigo-400/50',
    shadowStrong: 'shadow-indigo-500/50',
    button: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
    buttonHover: 'hover:from-indigo-500 hover:to-indigo-600',
    accentGradient: 'from-indigo-400 to-indigo-300',
    title: 'text-indigo-400',
    loading: 'text-indigo-300',
  },
  blue: {
    text: 'text-blue-300',
    textBold: 'font-bold text-blue-300',
    textSemibold: 'font-semibold text-blue-300',
    border: 'border-blue-400',
    borderThick: 'border-blue-500',
    shadow: 'hover:shadow-blue-400/50',
    shadowStrong: 'shadow-blue-500/50',
    button: 'bg-gradient-to-br from-blue-600 to-blue-700',
    buttonHover: 'hover:from-blue-500 hover:to-blue-600',
    accentGradient: 'from-blue-400 to-blue-300',
    title: 'text-blue-400',
    loading: 'text-blue-300',
  },
  red: {
    text: 'text-red-300',
    textBold: 'font-bold text-red-300',
    textSemibold: 'font-semibold text-red-300',
    border: 'border-red-400',
    borderThick: 'border-red-500',
    shadow: 'hover:shadow-red-400/50',
    shadowStrong: 'shadow-red-500/50',
    button: 'bg-gradient-to-br from-red-600 to-red-700',
    buttonHover: 'hover:from-red-500 hover:to-red-600',
    accentGradient: 'from-red-400 to-red-300',
    title: 'text-red-400',
    loading: 'text-red-300',
  },
  gray: {
    text: 'text-gray-300',
    textBold: 'font-bold text-gray-300',
    textSemibold: 'font-semibold text-gray-300',
    border: 'border-gray-400',
    borderThick: 'border-gray-500',
    shadow: 'hover:shadow-gray-400/50',
    shadowStrong: 'shadow-gray-500/50',
    button: 'bg-gradient-to-br from-gray-600 to-gray-700',
    buttonHover: 'hover:from-gray-500 hover:to-gray-600',
    accentGradient: 'from-gray-400 to-gray-300',
    title: 'text-gray-400',
    loading: 'text-gray-300',
  },
  amber: {
    text: 'text-amber-300',
    textBold: 'font-bold text-amber-300',
    textSemibold: 'font-semibold text-amber-300',
    border: 'border-amber-400',
    borderThick: 'border-amber-500',
    shadow: 'hover:shadow-amber-400/50',
    shadowStrong: 'shadow-amber-500/50',
    button: 'bg-gradient-to-br from-amber-600 to-amber-700',
    buttonHover: 'hover:from-amber-500 hover:to-amber-600',
    accentGradient: 'from-amber-400 to-amber-300',
    title: 'text-amber-400',
    loading: 'text-amber-300',
  },
};

// Get color classes from the map
export const getColorClasses = (scheme: ColorScheme) => colorClassesMap[scheme];

// Button size classes map
const buttonSizeMap = {
  sm: 'p-2',
  md: 'px-4 py-2',
  lg: 'px-6 py-3'
};

// Accent line component (to be added inside buttons)
// const getAccentLine = (scheme: ColorScheme) => {
//   const colors = colorClassesMap[scheme];
//   return `<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colors.accentGradient}"></div>`;
// };

// Button style generators with modern design
export const getButtonStyle = (scheme: ColorScheme, size: 'sm' | 'md' | 'lg' = 'md') => {
  const colors = colorClassesMap[scheme];
  return `${baseButtonStyle} ${buttonSizeMap[size]} ${colors.button} ${colors.buttonHover} ${colors.border} text-white hover:shadow-xl ${colors.shadow} hover:scale-105`;
};

// Create button with shadow
export const getCreateButtonStyle = (scheme: ColorScheme) => {
  const colors = colorClassesMap[scheme];
  return `${baseButtonStyle} px-6 py-3 ${colors.button} ${colors.buttonHover} ${colors.border} text-white hover:shadow-xl ${colors.shadow} hover:scale-105`;
};

// List container style
export const getListContainerStyle = (scheme: ColorScheme) => {
  const colors = colorClassesMap[scheme];
  return {
    border: colors.borderThick,
    shadow: colors.shadowStrong,
    title: colors.title,
    itemBorder: colors.border,
    itemShadow: colors.shadow,
    loading: colors.loading,
    button: `${colors.button} ${colors.buttonHover} ${colors.shadow}`,
  };
};

// Predefined button styles with modern design
export const addButtonStyle = getButtonStyle('green', 'md');
export const updateButtonStyle = getButtonStyle('blue', 'md');
export const deleteButtonStyle = getButtonStyle('red', 'md');

export const addButtonSm = getButtonStyle('green', 'sm');
export const updateButtonSm = getButtonStyle('blue', 'sm');
export const deleteButtonSm = getButtonStyle('red', 'sm');

// Modal styles
export const modalDialogClassName = "backdrop:bg-black/80 bg-gray-800 border-2 rounded-lg p-8 shadow-2xl max-w-2xl w-full";
export const modalCancelButtonStyle = getButtonStyle('gray', 'lg');
export const modalConfirmButtonStyle = getButtonStyle('red', 'lg');

// Entity-specific styles
export const traderFontSemibold = colorClassesMap.pink.textSemibold;
export const traderFontBold = colorClassesMap.pink.textBold;
export const userFontSemibold = colorClassesMap.purple.textSemibold;
export const userFontBold = colorClassesMap.purple.textBold;
export const receiptFontSemibold = colorClassesMap.green.textSemibold;
export const receiptFontBold = colorClassesMap.green.textBold;
export const orderFontSemibold = colorClassesMap.indigo.textSemibold;
export const orderFontBold = colorClassesMap.indigo.textBold;
export const requestFontSemibold = colorClassesMap.amber.textSemibold;
export const requestFontBold = colorClassesMap.amber.textBold;

export const createUserButton = getCreateButtonStyle('purple');
export const createTraderButton = getCreateButtonStyle('pink');
export const createReceiptButton = getCreateButtonStyle('green');

// Common styles
export const entitiesNotFound = "text-center text-gray-400 py-8";
export const SECTION_BORDER = "border-2 p-3 border-green-400";
export const GRID_RESPONSIVE = "grid-cols-1 sm:grid-cols-2";

// Backward compatibility: export color schemes
export const colorSchemes = colorClassesMap;

// Generate ListColorSchemes for all color schemes
export const ListColorSchemes: Record<ColorScheme, ReturnType<typeof getListContainerStyle>> = {
  purple: getListContainerStyle('purple'),
  pink: getListContainerStyle('pink'),
  cyan: getListContainerStyle('cyan'),
  green: getListContainerStyle('green'),
  indigo: getListContainerStyle('indigo'),
  blue: getListContainerStyle('blue'),
  red: getListContainerStyle('red'),
  gray: getListContainerStyle('gray'),
  amber: getListContainerStyle('amber'),
};