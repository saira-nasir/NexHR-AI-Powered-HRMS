import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MonthYearPickerProps {
    value?: Date;
    onChange?: (date: Date) => void;
    className?: string;
    placeholder?: string;
}

export function MonthYearPicker({
    value,
    onChange,
    className,
    placeholder = "Select month and year"
}: MonthYearPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [displayDate, setDisplayDate] = React.useState(value || new Date());

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(displayDate.getFullYear(), monthIndex, 1);
        setDisplayDate(newDate);
        onChange?.(newDate);
        setOpen(false);
    };

    const handleYearChange = (year: number) => {
        const newDate = new Date(year, displayDate.getMonth(), 1);
        setDisplayDate(newDate);
    };

    const navigateYear = (direction: 'prev' | 'next') => {
        const newYear = displayDate.getFullYear() + (direction === 'next' ? 1 : -1);
        setDisplayDate(new Date(newYear, displayDate.getMonth(), 1));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "MMMM yyyy") : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                    {/* Year selector */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => navigateYear('prev')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <select
                            value={displayDate.getFullYear()}
                            onChange={(e) => handleYearChange(Number(e.target.value))}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => navigateYear('next')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Month grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month, index) => {
                            const isSelected = value &&
                                value.getMonth() === index &&
                                value.getFullYear() === displayDate.getFullYear();
                            const isCurrent = new Date().getMonth() === index &&
                                new Date().getFullYear() === displayDate.getFullYear();

                            return (
                                <Button
                                    key={month}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "h-9 text-xs",
                                        isCurrent && !isSelected && "border-blue-500 border-2",
                                        isSelected && "bg-blue-600 hover:bg-blue-700"
                                    )}
                                    onClick={() => handleMonthSelect(index)}
                                >
                                    {month.slice(0, 3)}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
