export const traderFontSemibold = "font-semibold text-pink-300"
export const traderFontBold = "font-bold text-pink-300"
export const addButtonStyle = "flex items-center px-4 py-2 gap-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all text-white font-semibold"
export const updateButtonStyle = "flex items-center justify-center px-4 py-2 gap-3 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all  text-white font-semibold"
export const deleteButtonStyle = "flex items-center justify-center px-4 py-2 gap-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all  text-white font-semibold"

export const addButtonSm = "p-2 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all"
export const updateButtonSm = "p-2 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all"
export const deleteButtonSm = "p-2 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all"
export const entitiesNotFound = "text-center text-gray-400 py-8"

export const modalDialogClassName = "backdrop:bg-black/80 bg-gray-800 border-2 rounded-lg p-8 shadow-2xl max-w-2xl w-full"
export const modalCancelButtonStyle = "px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 font-semibold"
export const modalConfirmButtonStyle = "px-6 py-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all duration-200 hover:shadow-lg hover:shadow-red-400/50 text-white font-semibold"

export const userFontSemibold = "font-semibold text-purple-300"
export const userFontBold = "font-bold text-purple-300"
export const createUserButton = "flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50"
export const createReceiptButton = "flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50"
export const receiptFontSemibold = "font-semibold text-green-300"
export const receiptFontBold = "font-bold text-green-300"

export const createTraderButton = "flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50"

export const SECTION_BORDER = "border-2 p-3 border-green-400";
export const GRID_RESPONSIVE = "grid-cols-1 sm:grid-cols-2";

export const orderFontSemibold = "font-semibold text-indigo-300"
export const orderFontBold = "font-bold text-indigo-300"

export const colorSchemes = {
  purple: {
    text: 'text-purple-300',
    border: 'border-purple-400',
    shadow: 'hover:shadow-purple-400/50',
    button: 'bg-purple-600 hover:bg-purple-500 border-purple-400',
  },
  pink: {
    text: 'text-pink-300',
    border: 'border-pink-400',
    shadow: 'hover:shadow-pink-400/50',
    button: 'bg-pink-600 hover:bg-pink-500 border-pink-400',
  },
  green: {
    text: 'text-green-300',
    border: 'border-green-400',
    shadow: 'hover:shadow-green-400/50',
    button: 'bg-green-600 hover:bg-green-500 border-green-400',
  },
  cyan: {
    text: 'text-cyan-300',
    border: 'border-cyan-400',
    shadow: 'hover:shadow-cyan-400/50',
    button: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400',
  },
  indigo: {
    text: 'text-indigo-300',
    border: 'border-indigo-400',
    shadow: 'hover:shadow-indigo-400/50',
    button: 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400',
  },
};

export const ListColorSchemes = {
  purple: {
    border: 'border-purple-500',
    shadow: 'shadow-purple-500/50',
    title: 'text-purple-400',
    itemBorder: 'border-purple-400',
    itemShadow: 'hover:shadow-purple-400/50',
    loading: 'text-purple-300',
    button: 'bg-purple-600 hover:bg-purple-500 border-purple-400 shadow-purple-400/50',
  },
  pink: {
    border: 'border-pink-500',
    shadow: 'shadow-pink-500/50',
    title: 'text-pink-400',
    itemBorder: 'border-pink-400',
    itemShadow: 'hover:shadow-pink-400/50',
    loading: 'text-pink-300',
    button: 'bg-pink-600 hover:bg-pink-500 border-pink-400 shadow-pink-400/50',
  },
  cyan: {
    border: 'border-cyan-500',
    shadow: 'shadow-cyan-500/50',
    title: 'text-cyan-400',
    itemBorder: 'border-cyan-400',
    itemShadow: 'hover:shadow-cyan-400/50',
    loading: 'text-cyan-300',
    button: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400 shadow-cyan-400/50',
  },
  green: {
    border: 'border-green-500',
    shadow: 'shadow-green-500/50',
    title: 'text-green-400',
    itemBorder: 'border-green-400',
    itemShadow: 'hover:shadow-green-400/50',
    loading: 'text-green-300',
    button: 'bg-green-600 hover:bg-green-500 border-green-400 shadow-green-400/50',
  },
  indigo: {
    border: 'border-indigo-500',
    shadow: 'shadow-indigo-500/50',
    title: 'text-indigo-400',
    itemBorder: 'border-indigo-400',
    itemShadow: 'hover:shadow-indigo-400/50',
    loading: 'text-indigo-300',
    button: 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 shadow-indigo-400/50',
  },
};

export type ColorScheme = 'purple' | 'pink' | 'cyan' | 'green' | 'indigo';