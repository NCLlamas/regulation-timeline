import { Search, Mic, Moon, Sun, RefreshCw } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimelineHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function TimelineHeader({ 
  searchQuery, 
  onSearch, 
  onRefresh, 
  isRefreshing 
}: TimelineHeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              <img src="https://regulationstore.com/cdn/shop/files/regpod-apple-logo.png" className="inline w-5 text-primary mr-2 mb-2 dark:invert" />
              Regulation Timeline
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            
            {/* Refresh Button */}
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Dark Mode Toggle */}
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
