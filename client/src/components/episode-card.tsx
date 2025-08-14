import { type Episode } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { highlightSearchText, textContainsSearch } from "@/lib/utils";

interface EpisodeCardProps {
  episode: Episode;
  searchQuery?: string;
}

export default function EpisodeCard({ episode, searchQuery }: EpisodeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Check if search query matches description content that would be hidden
  const descriptionContainsSearch = textContainsSearch(episode.description || '', searchQuery);
  const titleContainsSearch = textContainsSearch(episode.title, searchQuery);
  
  const getEpisodeTypeConfig = (type: string) => {
    switch (type) {
      case "podcast":
        return { 
          label: "Podcast Episode", 
          dotColor: "bg-primary", 
          hoverColor: "group-hover:border-primary/30 group-hover:text-primary",
          badgeColor: "bg-blue-100 dark:bg-blue-900 text-primary dark:text-white"
        };
      case "draft":
        return { 
          label: "Draft", 
          dotColor: "bg-green-500", 
          hoverColor: "group-hover:border-green-500/30 group-hover:text-green-600",
          badgeColor: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-white"
        };
      case "watchalong":
        return { 
          label: "Watchalong", 
          dotColor: "bg-purple-500", 
          hoverColor: "group-hover:border-purple-500/30 group-hover:text-purple-600",
          badgeColor: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-white"
        };
      case "sausage-talk":
        return { 
          label: "Sausage Talk", 
          dotColor: "bg-orange-500", 
          hoverColor: "group-hover:border-orange-500/30 group-hover:text-orange-600",
          badgeColor: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-white"
        };
      case "blindside":
        return { 
          label: "Blindside", 
          dotColor: "bg-teal-500", 
          hoverColor: "group-hover:border-teal-500/30 group-hover:text-teal-600",
          badgeColor: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-white"
        };
      default: // bonus
        return { 
          label: "Supplemental", 
          dotColor: "bg-secondary", 
          hoverColor: "group-hover:border-secondary/30 group-hover:text-secondary",
          badgeColor: "bg-red-100 dark:bg-red-900 text-secondary dark:text-white"
        };
    }
  };

  const episodeConfig = getEpisodeTypeConfig(episode.episodeType);
  const { dotColor, hoverColor, badgeColor } = episodeConfig;
  const [hoverBorderColor, titleHoverColor] = hoverColor.split(' ');  

  useEffect(() => {
    if (contentRef.current && episode.description) {
      const checkHeight = () => {
        const element = contentRef.current?.querySelector('[data-testid="text-description"]') as HTMLElement;
        if (element) {
          // Temporarily remove line-clamp to measure full height
          element.style.display = '-webkit-box';
          element.style.webkitLineClamp = 'unset';
          const fullHeight = element.scrollHeight;
          
          // Reset to clamped state
          element.style.webkitLineClamp = '2';
          const clampedHeight = element.offsetHeight;
          
          setShowToggle(fullHeight > clampedHeight);
        }
      };
      
      // Small delay to ensure content is rendered
      setTimeout(checkHeight, 100);
    }
  }, [episode.description]);
  
  // Auto-expand if search matches are in the description
  useEffect(() => {
    if (descriptionContainsSearch && searchQuery) {
      setIsExpanded(true);
    }
  }, [descriptionContainsSearch, searchQuery]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const decodeHtmlEntities = (text: string) => {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };

  return (
    <div className="relative mb-8 group" data-testid={`card-episode-${episode.id}`}>
      {/* Content Badge (Left) */}
      <div className={`absolute left-6 w-4 h-4 ${dotColor} rounded-full border-4 border-surface-light dark:border-surface-dark z-20`} />
      <div className={`absolute left-0 top-0 w-6 h-6 ${dotColor}/20 rounded-full animate-pulse`} />
      
      {/* Episode Content (Right) */}
      <Card className={`ml-16 bg-card-light dark:bg-card-dark shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 ${hoverBorderColor}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Badge 
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
                data-testid={`badge-type-${episode.episodeType}`}
              >
                <Circle className="w-2 h-2 mr-1 fill-current" />
                {episodeConfig.label}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-date">
                {formatDate(episode.pubDate)}
              </span>
            </div>
            <a 
              href={episode.link} 
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-400 transition-colors duration-200 ${
                episode.episodeType === "podcast" ? "hover:text-primary" : "hover:text-secondary"
              }`}
              data-testid="link-external"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200 ${titleHoverColor}`}>
            <a 
              href={episode.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
              data-testid="link-title"
            >
              <span
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchText(decodeHtmlEntities(episode.title), searchQuery, episode.episodeType) 
                }}
              />
            </a>
          </h3>
          
          {episode.description && (
            <div ref={contentRef}>
              <div 
                className={`text-gray-600 dark:text-gray-400 text-sm leading-relaxed prose prose-sm max-w-none transition-all duration-300 ${
                  !isExpanded ? 'line-clamp-2' : ''
                }`}
                data-testid="text-description"
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchText(decodeHtmlEntities(episode.description), searchQuery, episode.episodeType) 
                }}
              />
              {showToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 h-6 px-2 py-0 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid={isExpanded ? "button-show-less" : "button-show-more"}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          
          <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
            {episode.duration && (
              <span data-testid="text-duration">
                <Clock className="w-3 h-3 mr-1 inline" />
                {episode.duration}
              </span>
            )}
            {episode.episodeNumber && (
              <span data-testid="text-episode-number">
                Episode {episode.episodeNumber}
              </span>
            )}
            {episode.isExplicit && (
              <Badge variant="outline" className="text-xs px-2 py-0 dark:text-white dark:border-white">
                Explicit
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}