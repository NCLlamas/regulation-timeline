import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface TimelineFiltersProps {
  filterType: string;
  onFilter: (type: string) => void;
  totalEpisodes: number;
}

export default function TimelineFilters({ filterType, onFilter, totalEpisodes }: TimelineFiltersProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  const filters = [
    { id: "podcast", label: "Podcast Episodes", color: "blue" },
    { id: "draft", label: "Drafts", color: "green" },
    { id: "watchalong", label: "Watchalongs", color: "purple" },
    { id: "sausage-talk", label: "Sausage Talk", color: "orange" },
    { id: "blindside", label: "Blindside", color: "teal" },
    { id: "bonus", label: "Supplemental", color: "red" },
  ];

  // Sync with parent component's filterType
  useEffect(() => {
    if (filterType === "all") {
      setSelectedTypes([]);
    } else if (!selectedTypes.includes(filterType) && filterType) {
      setSelectedTypes([filterType]);
    }
  }, [filterType]);

  const handleAddFilter = (value: string) => {
    if (value && !selectedTypes.includes(value)) {
      const newSelected = [...selectedTypes, value];
      setSelectedTypes(newSelected);
      // For now, just pass the first selected type to maintain compatibility
      onFilter(newSelected.length > 0 ? newSelected[0] : "all");
    }
  };

  const handleRemoveFilter = (typeToRemove: string) => {
    const newSelected = selectedTypes.filter(type => type !== typeToRemove);
    setSelectedTypes(newSelected);
    onFilter(newSelected.length > 0 ? newSelected[0] : "all");
  };

  const getFilterStyles = (color: string, isSelected: boolean) => {
    const baseClasses = "dark:text-white";
    
    switch (color) {
      case "blue":
        return isSelected 
          ? `bg-blue-100 dark:bg-blue-900 text-primary ${baseClasses} border-primary dark:border-white hover:bg-blue-200 dark:hover:bg-blue-800`
          : `bg-blue-100 dark:bg-blue-900 text-primary ${baseClasses} border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800`;
      case "red":
        return isSelected
          ? `bg-red-100 dark:bg-red-900 text-secondary ${baseClasses} border-secondary dark:border-white hover:bg-red-200 dark:hover:bg-red-800`
          : `bg-red-100 dark:bg-red-900 text-secondary ${baseClasses} border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800`;
      case "green":
        return isSelected
          ? `bg-green-100 dark:bg-green-900 text-green-600 ${baseClasses} border-green-600 dark:border-white hover:bg-green-200 dark:hover:bg-green-800`
          : `bg-green-100 dark:bg-green-900 text-green-600 ${baseClasses} border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800`;
      case "purple":
        return isSelected
          ? `bg-purple-100 dark:bg-purple-900 text-purple-600 ${baseClasses} border-purple-600 dark:border-white hover:bg-purple-200 dark:hover:bg-purple-800`
          : `bg-purple-100 dark:bg-purple-900 text-purple-600 ${baseClasses} border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-800`;
      case "orange":
        return isSelected
          ? `bg-orange-100 dark:bg-orange-900 text-orange-600 ${baseClasses} border-orange-600 dark:border-white hover:bg-orange-200 dark:hover:bg-orange-800`
          : `bg-orange-100 dark:bg-orange-900 text-orange-600 ${baseClasses} border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-800`;
      case "teal":
        return isSelected
          ? `bg-teal-100 dark:bg-teal-900 text-teal-600 ${baseClasses} border-teal-600 dark:border-white hover:bg-teal-200 dark:hover:bg-teal-800`
          : `bg-teal-100 dark:bg-teal-900 text-teal-600 ${baseClasses} border-teal-200 dark:border-teal-800 hover:bg-teal-200 dark:hover:bg-teal-800`;
      default:
        return isSelected
          ? `bg-gray-100 dark:bg-gray-800 text-gray-700 ${baseClasses} border-gray-700 dark:border-white hover:bg-gray-200 dark:hover:bg-gray-700`
          : `bg-gray-100 dark:bg-gray-800 text-gray-700 ${baseClasses} border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700`;
    }
  };

  return (
    <div className="bg-card-light dark:bg-card-dark shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by type:
            </span>
            
            {/* Dropdown for adding filters */}
            <Select onValueChange={handleAddFilter} value="">
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder={selectedTypes.length === 0 ? "All Episodes" : "Add filter..."} />
              </SelectTrigger>
              <SelectContent>
                {filters.map((filter) => (
                  <SelectItem 
                    key={filter.id} 
                    value={filter.id}
                    disabled={selectedTypes.includes(filter.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        filter.color === "blue" ? "bg-primary" : 
                        filter.color === "red" ? "bg-secondary" :
                        filter.color === "green" ? "bg-green-500" :
                        filter.color === "purple" ? "bg-purple-500" :
                        filter.color === "orange" ? "bg-orange-500" :
                        filter.color === "teal" ? "bg-teal-500" :
                        "bg-gray-400"
                      }`} />
                      {filter.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected filter chips */}
            <div className="flex flex-wrap gap-2">
              {selectedTypes.map((typeId) => {
                const filter = filters.find(f => f.id === typeId);
                if (!filter) return null;
                
                return (
                  <Badge
                    key={typeId}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getFilterStyles(filter.color, true)
                    }`}
                    data-testid={`chip-filter-${typeId}`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      filter.color === "blue" ? "bg-primary" : 
                      filter.color === "red" ? "bg-secondary" :
                      filter.color === "green" ? "bg-green-500" :
                      filter.color === "purple" ? "bg-purple-500" :
                      filter.color === "orange" ? "bg-orange-500" :
                      filter.color === "teal" ? "bg-teal-500" :
                      "bg-gray-400"
                    }`} />
                    {filter.label}
                    <button
                      onClick={() => handleRemoveFilter(typeId)}
                      className="ml-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
                      data-testid={`button-remove-${typeId}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-episode-count">
            <span>{totalEpisodes}</span> regulation releases found
          </div>
        </div>
      </div>
    </div>
  );
}
