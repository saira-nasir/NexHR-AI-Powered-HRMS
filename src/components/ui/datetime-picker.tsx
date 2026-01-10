import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  error?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  minDate,
  disabled = false,
  error = false,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [hours, setHours] = React.useState<string>(
    value ? format(new Date(value), "HH") : "00"
  );
  const [minutes, setMinutes] = React.useState<string>(
    value ? format(new Date(value), "mm") : "00"
  );

  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      setDate(d);
      setHours(format(d, "HH"));
      setMinutes(format(d, "mm"));
    }
  }, [value]);

  const updateDateTime = (newDate?: Date, newHours?: string, newMinutes?: string) => {
    const currentDate = newDate || date;
    const currentHours = newHours !== undefined ? newHours : hours;
    const currentMinutes = newMinutes !== undefined ? newMinutes : minutes;

    if (!currentDate) return;

    const updatedDate = new Date(currentDate);
    updatedDate.setHours(parseInt(currentHours) || 0, parseInt(currentMinutes) || 0, 0, 0);
    
    // Format as datetime-local: YYYY-MM-DDTHH:mm
    const year = updatedDate.getFullYear();
    const month = String(updatedDate.getMonth() + 1).padStart(2, '0');
    const day = String(updatedDate.getDate()).padStart(2, '0');
    const hour = String(updatedDate.getHours()).padStart(2, '0');
    const minute = String(updatedDate.getMinutes()).padStart(2, '0');
    
    onChange?.(`${year}-${month}-${day}T${hour}:${minute}`);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      onChange?.("");
      return;
    }

    setDate(selectedDate);
    updateDateTime(selectedDate, hours, minutes);
  };

  const handleHoursChange = (value: string) => {
    setHours(value);
    updateDateTime(date, value, minutes);
  };

  const handleMinutesChange = (value: string) => {
    setMinutes(value);
    updateDateTime(date, hours, value);
  };

  // Generate hours (00-23) and minutes (00-59)
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-red-500"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate) {
                return date < minDate;
              }
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="flex gap-1 items-center">
        <Select
          value={hours}
          onValueChange={handleHoursChange}
          disabled={disabled || !date}
        >
          <SelectTrigger className={cn("w-[70px]", error && "border-red-500")}>
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select
          value={minutes}
          onValueChange={handleMinutesChange}
          disabled={disabled || !date}
        >
          <SelectTrigger className={cn("w-[70px]", error && "border-red-500")}>
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {minuteOptions.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Clock className="ml-1 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
