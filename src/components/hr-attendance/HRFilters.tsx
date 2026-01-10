import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, RotateCcw, Filter } from 'lucide-react';
import { format } from 'date-fns';

export interface FilterOptions {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface HRFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export function HRFilters({ filters, onFilterChange, onReset }: HRFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-gradient-to-r from-purple-300/80 via-violet-200/70 to-purple-300/80 dark:from-purple-700/40 dark:via-violet-600/30 dark:to-purple-700/40 rounded-xl border border-purple-400/50 dark:border-purple-500/40 shadow-sm">
      {/* Filter Icon & Label */}
      <div className="flex items-center gap-2 text-muted-foreground pb-2">
        <Filter className="w-4 h-4" />
        <span className="font-medium text-sm hidden sm:inline">Filter by:</span>
      </div>

      {/* Date Range - From */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[180px] justify-start text-left font-normal bg-background hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {filters.dateFrom ? (
                <span className="text-foreground">{format(filters.dateFrom, 'MMM dd, yyyy')}</span>
              ) : (
                <span className="text-muted-foreground">Select date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) => onFilterChange({ ...filters, dateFrom: date })}
              initialFocus
              disabled={filters.dateTo ? { after: filters.dateTo } : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Separator Arrow */}
      <div className="hidden md:flex items-center text-muted-foreground/50 pb-0.5">
        <span className="text-lg">→</span>
      </div>

      {/* Date Range - To */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[180px] justify-start text-left font-normal bg-background hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {filters.dateTo ? (
                <span className="text-foreground">{format(filters.dateTo, 'MMM dd, yyyy')}</span>
              ) : (
                <span className="text-muted-foreground">Select date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => onFilterChange({ ...filters, dateTo: date })}
              initialFocus
              disabled={filters.dateFrom ? { before: filters.dateFrom } : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-all"
      >
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Reset
      </Button>
    </div>
  );
}
