import React, { useState, useEffect, useRef } from "react";
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
  const buildQueryUrl = (includeRefresh = false) => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.append("type", filterType);
    if (searchQuery) params.append("search", searchQuery);
    
    // Include refresh=true when explicitly requested
    if (includeRefresh) params.append("refresh", "true");
    
    const queryString = params.toString();
    return `/api/episodes${queryString ? `?${queryString}` : ""}`;
  };

  // Use a ref to track initial load without causing re-renders
  const isFirstRender = useRef(true);

  const { data: episodes = [], isLoading, error, refetch } = useQuery<Episode[]>({
    queryKey: ['episodes', filterType, searchQuery],
    queryFn: async () => {
      // On first render, include refresh=true
      const shouldRefresh = isFirstRender.current;
      const url = buildQueryUrl(shouldRefresh);
      
      // Reset the flag immediately to prevent future refreshes
      if (isFirstRender.current) {
        isFirstRender.current = false;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }
      
      return response.json();
    },
    refetchOnMount: true,
  });

  // Refresh episodes by resetting filters and using refresh parameter
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Reset search and filter state
      setSearchQuery("");
      setFilterType("all");
      
      // Fetch fresh data with the refresh parameter
      const response = await fetch("/api/episodes?refresh=true");
      if (!response.ok) {
        throw new Error("Failed to refresh episodes");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update the query cache with the fresh data
      queryClient.setQueryData(["episodes", "all", ""], data);
      
      toast({
        title: "Episodes refreshed",
        description: `Successfully loaded ${Array.isArray(data) ? data.length : 0} episodes`,
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
