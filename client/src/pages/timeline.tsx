import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type Episode } from "@shared/schema";
import TimelineHeader from "@/components/timeline-header";
import TimelineFilters from "@/components/timeline-filters";
import TimelineContent from "@/components/timeline-content";
import { useToast } from "@/hooks/use-toast";

export default function Timeline() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  // Fetch episodes
  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.append("type", filterType);
    if (searchQuery) params.append("search", searchQuery);
    const queryString = params.toString();
    return `/api/episodes${queryString ? `?${queryString}` : ""}`;
  };

  const { data: episodes = [], isLoading, error, refetch } = useQuery<Episode[]>({
    queryKey: ['episodes', filterType, searchQuery],
    queryFn: async () => {
      const response = await fetch(buildQueryUrl());
      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }
      return response.json();
    },refetchOnMount: true,
  });

  // Refresh episodes from RSS feed
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/episodes/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to refresh episodes");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Use the refetch function directly instead of invalidating the query
      // This ensures we immediately get fresh data from the server
      refetch();
      
      toast({
        title: "Episodes refreshed",
        description: `Successfully loaded ${data.episodes?.length || 0} episodes from RSS feed`,
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Failed to refresh episodes",
        variant: "destructive",
      });
    },
  });

  // No need to auto-refresh on mount anymore
  // The episodes endpoint will automatically fetch from RSS if the database is empty

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (type: string) => {
    setFilterType(type);
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch = !searchQuery || 
      episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (episode.description && episode.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === "all" || episode.episodeType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <TimelineHeader 
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        isRefreshing={refreshMutation.isPending}
      />
      
      <TimelineFilters 
        filterType={filterType}
        onFilter={handleFilter}
        totalEpisodes={filteredEpisodes.length}
      />
      
      <TimelineContent 
        episodes={filteredEpisodes}
        isLoading={isLoading || refreshMutation.isPending}
        error={error instanceof Error ? error.message : null}
        searchQuery={searchQuery}
      />
    </div>
  );
}
