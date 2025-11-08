// Script to add dark mode classes to admin and worker pages
// This script can be run to automatically add dark mode classes to all pages

import * as fs from 'fs';
import * as path from 'path';

// Common dark mode patterns
const darkModePatterns = [
  // Background patterns
  { from: /bg-white/g, to: 'bg-white dark:bg-[#0a0a0a]' },
  { from: /bg-gray-50/g, to: 'bg-gray-50 dark:bg-[#0a0a0a]' },
  { from: /bg-gray-100/g, to: 'bg-gray-100 dark:bg-[#1a1a1a]' },
  
  // Text patterns  
  { from: /text-gray-500/g, to: 'text-gray-500 dark:text-gray-400' },
  { from: /text-gray-600/g, to: 'text-gray-600 dark:text-gray-400' },
  { from: /text-gray-700/g, to: 'text-gray-700 dark:text-gray-300' },
  { from: /text-gray-800/g, to: 'text-gray-800 dark:text-gray-300' },
  { from: /text-gray-900/g, to: 'text-gray-900 dark:text-white' },
  
  // Border patterns
  { from: /border(?![-\w])/g, to: 'border dark:border-white/10' },
  { from: /border-gray-200/g, to: 'border-gray-200 dark:border-white/10' },
  { from: /border-gray-300/g, to: 'border-gray-300 dark:border-white/20' },
  
  // Divide patterns
  { from: /divide-gray-200/g, to: 'divide-gray-200 dark:divide-white/10' },
  
  // Hover patterns
  { from: /hover:bg-gray-50/g, to: 'hover:bg-gray-50 dark:hover:bg-white/5' },
];

// Note: This is a helper script. Manual updates are more reliable for complex patterns.

