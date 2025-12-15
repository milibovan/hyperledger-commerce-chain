export type ColorScheme = 'purple' | 'pink' | 'cyan' | 'green' | 'indigo' | 'blue' | 'red' | 'gray';

// Base button styles (common across all buttons)
const baseButtonStyle = "flex items-center justify-center gap-3 rounded border-2 transition-all font-semibold";

// Generate color-specific classes
export const getColorClasses = (scheme: ColorScheme) => ({
  text: `text-${scheme}-300`,
  textBold: `font-bold text-${scheme}-300`,
  textSemibold: `font-semibold text-${scheme}-300`,
  border: `border-${scheme}-400`,
  borderThick: `border-${scheme}-500`,
  shadow: `hover:shadow-${scheme}-400/50`,
  shadowStrong: `shadow-${scheme}-500/50`,
  button: `bg-${scheme}-600 hover:bg-${scheme}-500 border-${scheme}-400`,
  title: `text-${scheme}-400`,
  loading: `text-${scheme}-300`,
});

// Button style generators
export const getButtonStyle = (scheme: ColorScheme, size: 'sm' | 'md' | 'lg' = 'md') => {
  const colors = getColorClasses(scheme);
  const sizes = {
    sm: 'p-2',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  };
  
  return `${baseButtonStyle} ${sizes[size]} ${colors.button} text-white`;
};

// Create button with shadow
export const getCreateButtonStyle = (scheme: ColorScheme) => {
  const colors = getColorClasses(scheme);
  return `flex items-center gap-2 px-6 py-3 ${colors.button} text-white font-semibold rounded border-2 transition-all duration-200 hover:shadow-lg ${colors.shadow}`;
};

// List container style
export const getListContainerStyle = (scheme: ColorScheme) => {
  const colors = getColorClasses(scheme);
  return {
    border: colors.borderThick,
    shadow: colors.shadowStrong,
    title: colors.title,
    itemBorder: colors.border,
    itemShadow: colors.shadow,
    loading: colors.loading,
    button: `${colors.button} ${colors.shadow}`,
  };
};

// Predefined button styles
export const addButtonStyle = getButtonStyle('green', 'md');
export const updateButtonStyle = getButtonStyle('blue', 'md');
export const deleteButtonStyle = getButtonStyle('red', 'md');

export const addButtonSm = getButtonStyle('green', 'sm');
export const updateButtonSm = getButtonStyle('blue', 'sm');
export const deleteButtonSm = getButtonStyle('red', 'sm');

// Modal styles
export const modalDialogClassName = "backdrop:bg-black/80 bg-gray-800 border-2 rounded-lg p-8 shadow-2xl max-w-2xl w-full";
export const modalCancelButtonStyle = getButtonStyle('gray', 'lg');
export const modalConfirmButtonStyle = `${getButtonStyle('red', 'lg')} hover:shadow-lg hover:shadow-red-400/50`;

// Entity-specific styles
export const traderFontSemibold = getColorClasses('pink').textSemibold;
export const traderFontBold = getColorClasses('pink').textBold;
export const userFontSemibold = getColorClasses('purple').textSemibold;
export const userFontBold = getColorClasses('purple').textBold;
export const receiptFontSemibold = getColorClasses('green').textSemibold;
export const receiptFontBold = getColorClasses('green').textBold;
export const orderFontSemibold = getColorClasses('indigo').textSemibold;
export const orderFontBold = getColorClasses('indigo').textBold;

export const createUserButton = getCreateButtonStyle('purple');
export const createTraderButton = getCreateButtonStyle('pink');
export const createReceiptButton = getCreateButtonStyle('green');

// Common styles
export const entitiesNotFound = "text-center text-gray-400 py-8";
export const SECTION_BORDER = "border-2 p-3 border-green-400";
export const GRID_RESPONSIVE = "grid-cols-1 sm:grid-cols-2";

// Backward compatibility: export old color schemes as generated objects
export const colorSchemes = {
  purple: getColorClasses('purple'),
  pink: getColorClasses('pink'),
  green: getColorClasses('green'),
  cyan: getColorClasses('cyan'),
  indigo: getColorClasses('indigo'),
};

export const ListColorSchemes = {
  purple: getListContainerStyle('purple'),
  pink: getListContainerStyle('pink'),
  cyan: getListContainerStyle('cyan'),
  green: getListContainerStyle('green'),
  indigo: getListContainerStyle('indigo'),
};