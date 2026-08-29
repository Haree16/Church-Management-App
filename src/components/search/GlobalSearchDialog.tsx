import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  searchService,
  GlobalSearchResultItem,
} from '@/services/searchService';
import {
  Search,
  Users,
  HeartHandshake,
  UserCheck,
  Layers,
  Church as ChurchIcon,
  Calendar,
  Heart,
  MessageSquare,
  Baby,
  Sparkles,
  Megaphone,
  ArrowRight,
  Command,
  CornerDownLeft,
} from 'lucide-react';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const { activeChurch, currentRole, user } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchService.globalSearch(churchId, query, currentRole, user?.id);
        setResults(res);
        setSelectedIndex(0);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, churchId, currentRole, user?.id]);

  const handleSelect = (item: GlobalSearchResultItem) => {
    onClose();
    navigate(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'member':
        return <Users className="h-4 w-4 text-sky-600" />;
      case 'family':
        return <HeartHandshake className="h-4 w-4 text-emerald-600" />;
      case 'visitor':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'ministry':
        return <Layers className="h-4 w-4 text-purple-600" />;
      case 'group':
        return <ChurchIcon className="h-4 w-4 text-amber-600" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-indigo-600" />;
      case 'prayer':
        return <Heart className="h-4 w-4 text-rose-600" />;
      case 'follow_up':
        return <MessageSquare className="h-4 w-4 text-amber-600" />;
      case 'child':
        return <Baby className="h-4 w-4 text-emerald-600" />;
      case 'youth':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-sky-600" />;
      default:
        return <Search className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Church Search</DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search members, families, visitors, groups, events, prayers, youth..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching database...</div>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.category}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg transition-colors text-xs ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 ring-1 ring-sky-200 dark:ring-sky-800'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <Badge
                              variant={item.badgeVariant || 'outline'}
                              className="text-[9px] px-1 py-0 capitalize shrink-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.subtitle && (
                          <span className="text-[11px] text-slate-400 truncate block">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2 opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <p>Type at least 2 characters to search across the entire ChurchOS database.</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Members</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Visitors</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Ministries</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Prayers</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Children</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800">↵</kbd> Select
            </span>
          </div>
          <span>Press ESC to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
