import { useState, useEffect, useCallback } from "react";
import { type Episode } from "@shared/schema";
import EpisodeCard from "@/components/episode-card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronUp, Calendar } from "lucide-react";

interface TimelineContentProps {
  episodes: Episode[];
  isLoading: boolean;
  error: string | null;
  searchQuery?: string;
}

export default function TimelineContent({ episodes, isLoading, error, searchQuery }: TimelineContentProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleEpisodes, setVisibleEpisodes] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleScroll = useCallback(() => {
    setShowBackToTop(window.pageYOffset > 300);
    
    // Check if user has scrolled to near the bottom
    if (
      window.innerHeight + document.documentElement.scrollTop >= 
      document.documentElement.offsetHeight - 1000 && 
      !isLoadingMore && 
      visibleEpisodes < episodes.length
    ) {
      setIsLoadingMore(true);
      // Small delay to show loading state
      setTimeout(() => {
        setVisibleEpisodes(prev => prev + 20);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, visibleEpisodes, episodes.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Group episodes by month/year for date headers
  const groupedEpisodes = episodes.slice(0, visibleEpisodes).reduce((groups, episode) => {
    const date = new Date(episode.pubDate);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(episode);
    return groups;
  }, {} as Record<string, Episode[]>);

  if (isLoading && episodes.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading episodes...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12" data-testid="error-state">
          <div className="text-red-500 mb-4">
            <span className="text-lg font-semibold">Failed to load episodes</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </main>
    );
  }

  if (episodes.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12" data-testid="empty-state">
          <div className="text-gray-500 mb-4">
            <span className="text-lg font-semibold">No episodes found</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria, or refresh to load episodes from the RSS feed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
        
        {Object.entries(groupedEpisodes).map(([monthYear, monthEpisodes]) => (
          <div key={monthYear}>
            {/* Date Header */}
            <div className="sticky top-20 z-10 mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {monthYear}
              </div>
            </div>

            {/* Episodes for this month */}
            {monthEpisodes.map((episode, index) => (
              <EpisodeCard key={episode.id} episode={episode} searchQuery={searchQuery} />
            ))}
          </div>
        ))}

        {/* Infinite Scroll Loading Indicator */}
        {isLoadingMore && visibleEpisodes < episodes.length && (
          <div className="flex items-center justify-center py-8" data-testid="loading-more-state">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading more episodes...</span>
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 ${
            showBackToTop ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          data-testid="button-back-to-top"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </main>
  );
}
