import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlightSearchText(text: string, searchQuery?: string, episodeType?: string): string {
  if (!searchQuery || !text) return text;
  
  const getHighlightClass = (type?: string) => {
    switch (type) {
      case "podcast":
        return "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100";
      case "draft":
        return "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100";
      case "watchalong":
        return "bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100";
      case "sausage-talk":
        return "bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100";
      case "blindside":
        return "bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100";
      case "bonus":
        return "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100";
      default:
        return "bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100";
    }
  };
  
  const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
  const highlightClass = getHighlightClass(episodeType);
  return text.replace(regex, `<mark class="${highlightClass} px-1 rounded">$1</mark>`);
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function textContainsSearch(text: string, searchQuery?: string): boolean {
  if (!searchQuery || !text) return false;
  return text.toLowerCase().includes(searchQuery.toLowerCase());
}
