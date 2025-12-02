'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Tag,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Film,
  Brain,
  Monitor,
  Globe,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react';
import type {
  SearchResultItem,
  DetailViewData,
  EpisodeWithSnapshots,
  SimilarItem,
} from '@/types/memoir-api.types';
import memoryService from '@/services/memoryService';

interface DetailViewProps {
  result: SearchResultItem;
  onSimilarClick?: (item: SimilarItem) => void;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeOnly(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getEntityTypeIcon(item: { snapshot_id?: string; episode_id?: string | null; memory_id?: string }) {
  if (item.episode_id) return Film;
  return Brain;
}

export default function DetailView({ result, onSimilarClick }: DetailViewProps) {
  const [data, setData] = useState<DetailViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisodeSnapshot, setSelectedEpisodeSnapshot] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const detailData = await memoryService.loadDetailViewData(result);
        setData(detailData);
        // Default to current snapshot in episode timeline
        if (result.snapshot_id) {
          setSelectedEpisodeSnapshot(result.snapshot_id);
        }
      } catch (err) {
        console.error('Failed to load detail view data:', err);
        setError('Failed to load details');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [result]);

  const handleSimilarClick = (item: SimilarItem) => {
    if (onSimilarClick) {
      onSimilarClick(item);
    }
  };

  // Close lightbox on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageExpanded) {
        setIsImageExpanded(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageExpanded]);

  const snapshot = data?.snapshot || result;
  const TypeIcon = getEntityTypeIcon(result);

  const hasSimilar = data?.similar && data.similar.length > 0;

  return (
    <div className="flex flex-col animate-in fade-in duration-200">
      {/* Header - no card */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground line-clamp-2">
          {snapshot.title || 'Memory Detail'}
        </h2>
        {snapshot.timestamp && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <Clock className="w-3 h-3" />
            {formatTimestamp(snapshot.timestamp)}
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading details...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${hasSimilar ? 'lg:grid-cols-3' : ''} gap-6`}>
          {/* Main content - takes 2 cols on large screens if similar exists */}
          <div className={hasSimilar ? 'lg:col-span-2' : ''}>
                {/* Screenshot - centered with expand on hover */}
                {data?.imageUrl && (
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={() => setIsImageExpanded(true)}
                      className="relative group cursor-zoom-in"
                    >
                      <img
                        src={data.imageUrl}
                        alt={snapshot.title || 'Screenshot'}
                        className="max-w-full max-h-[400px] rounded-xl"
                      />
                      {/* Expand button overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-2 rounded-lg">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Summary & Bullets - no card wrapper */}
                <div className="space-y-6">
                  {/* Summary */}
                  {snapshot.summary && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">Summary</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {snapshot.summary}
                      </p>
                    </div>
                  )}

                  {/* Bullets */}
                  {snapshot.bullets && snapshot.bullets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">Key Points</h3>
                      <ul className="space-y-1.5">
                        {snapshot.bullets.map((bullet, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metadata row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {snapshot.app && (
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5" />
                        <span>{snapshot.app}</span>
                      </div>
                    )}
                    {snapshot.url && (
                      <a
                        href={snapshot.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="max-w-[200px] truncate">{snapshot.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Tags */}
                  {snapshot.tags && snapshot.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {snapshot.entities && snapshot.entities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Entities
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.entities.map((entity, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded-full"
                          >
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Episode Timeline */}
                {data?.episode && data.episode.snapshots && data.episode.snapshots.length > 0 && (
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-violet-500" />
                      Episode Timeline
                      <span className="text-xs text-muted-foreground ml-2">
                        ({data.episode.snapshots.length} snapshots)
                      </span>
                    </h3>
                    <EpisodeTimeline
                      episode={data.episode}
                      selectedSnapshotId={selectedEpisodeSnapshot}
                      onSelectSnapshot={setSelectedEpisodeSnapshot}
                    />
                  </div>
                )}
              </div>

              {/* Sidebar - Similar Items - only show if there are similar items */}
              {hasSimilar && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Similar Memories
                  </h3>
                  <div className="space-y-3">
                    {data.similar.map((item, i) => (
                      <SimilarItemCard
                        key={item.snapshot_id || item.memory_id || i}
                        item={item}
                        onClick={() => handleSimilarClick(item)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

      {/* Image Lightbox */}
      {isImageExpanded && data?.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsImageExpanded(false)}
        >
          <button
            onClick={() => setIsImageExpanded(false)}
            className="absolute top-10 right-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={data.imageUrl}
            alt={snapshot.title || 'Screenshot'}
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// Sub-component for episode timeline
interface EpisodeTimelineProps {
  episode: EpisodeWithSnapshots;
  selectedSnapshotId: string | null;
  onSelectSnapshot: (id: string) => void;
}

function EpisodeTimeline({ episode, selectedSnapshotId, onSelectSnapshot }: EpisodeTimelineProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      {/* Scroll buttons */}
      <button
        onClick={() => scrollTo('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-card/90 border border-border rounded-full shadow-lg hover:bg-muted transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={() => scrollTo('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-card/90 border border-border rounded-full shadow-lg hover:bg-muted transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Timeline track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-8"
      >
        {episode.snapshots.map((snap, i) => (
          <button
            key={snap.snapshot_id}
            onClick={() => onSelectSnapshot(snap.snapshot_id)}
            className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
              selectedSnapshotId === snap.snapshot_id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-transparent hover:border-border'
            }`}
          >
            {snap.image_path ? (
              <img
                src={memoryService.getImageUrl({ filename: snap.image_path.split('/').pop() || '' })}
                alt={snap.title || `Snapshot ${i + 1}`}
                className="w-full h-16 object-cover"
              />
            ) : (
              <div className="w-full h-16 bg-muted flex items-center justify-center">
                <Film className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="p-1.5 bg-card">
              <p className="text-[10px] text-muted-foreground truncate">
                {snap.timestamp ? formatTimeOnly(snap.timestamp) : `#${i + 1}`}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Timeline connector line */}
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -z-10" />
    </div>
  );
}

// Sub-component for similar items
interface SimilarItemCardProps {
  item: SimilarItem;
  onClick: () => void;
}

function SimilarItemCard({ item, onClick }: SimilarItemCardProps) {
  const TypeIcon = getEntityTypeIcon(item);
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border/60 rounded-lg overflow-hidden hover:border-border hover:bg-muted/30 transition-all group"
    >
      {item.image_path && (
        <img
          src={memoryService.getImageUrl({ filename: item.image_path.split('/').pop() || '' })}
          alt={item.title || 'Similar memory'}
          className="w-full h-20 object-cover"
        />
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <TypeIcon className="w-3 h-3 text-muted-foreground" />
          {item.similarity !== undefined && (
            <span className="text-[10px] text-muted-foreground/70">
              {(item.similarity * 100).toFixed(0)}% match
            </span>
          )}
        </div>
        <p className="text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {item.title || item.summary?.slice(0, 60) || 'Memory'}
        </p>
        {item.timestamp && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {formatTimeOnly(item.timestamp)}
          </p>
        )}
      </div>
    </button>
  );
}

