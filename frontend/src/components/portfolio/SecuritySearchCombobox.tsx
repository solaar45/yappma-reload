import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/api/client';
import { useDebounce } from '@/hooks/use-debounce';

interface SecurityResult {
  ticker: string;
  name: string;
  exchange?: string;
  exchange_short?: string;
  currency?: string;
  type?: string;
}

interface SecuritySearchComboboxProps {
  value?: SecurityResult;
  onSelect: (security: SecurityResult) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SecuritySearchCombobox({
  value,
  onSelect,
  disabled = false,
  placeholder = 'Search by ticker or company name...',
}: SecuritySearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SecurityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search function
  const searchSecurities = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.post<{ results: SecurityResult[] }>(
        'securities/search',
        { query }
      );
      
      const securities = response.results || [];
      setResults(securities);
    } catch (error) {
      console.error('Security search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    searchSecurities(debouncedQuery);
  }, [debouncedQuery, searchSecurities]);

  // Format display label
  const getDisplayLabel = (security?: SecurityResult) => {
    if (!security) return placeholder;
    return `${security.ticker} - ${security.name}`;
  };

  // Format result item with exchange info
  const formatResultItem = (security: SecurityResult) => {
    const parts = [
      security.ticker,
      security.name,
    ];
    
    if (security.exchange_short || security.exchange) {
      parts.push(`(${security.exchange_short || security.exchange})`);
    }
    
    return parts.join(' ');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {getDisplayLabel(value)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </CommandEmpty>
          {results.length > 0 && (
            <CommandGroup>
              {results.map((security) => (
                <CommandItem
                  key={`${security.ticker}-${security.exchange_short || security.exchange}`}
                  value={security.ticker}
                  onSelect={() => {
                    onSelect(security);
                    setSearchQuery('');
                    setOpen(false);
                  }}
                  className="flex items-start gap-2"
                >
                  <Check
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0',
                      value?.ticker === security.ticker && 
                      value?.exchange_short === security.exchange_short
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{security.ticker}</span>
                      {security.type && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {security.type}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {security.name}
                    </div>
                    {(security.exchange_short || security.exchange) && (
                      <div className="text-xs text-muted-foreground">
                        {security.exchange_short || security.exchange}
                        {security.currency && ` • ${security.currency}`}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
