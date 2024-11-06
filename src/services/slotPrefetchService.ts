import { TimeSlot } from '@/types/booking';
import { startOfMonth, endOfMonth, addMonths, format, parseISO } from 'date-fns';

interface SlotCache {
  [date: string]: TimeSlot[];
}

class SlotPrefetchService {
  private cache: SlotCache = {};
  private API_KEY = process.env.NEXT_PUBLIC_NEETOL_API_KEY || '';
  private isLoading: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  async prefetchMonth(date: Date): Promise<void> {
    const monthKey = format(date, 'yyyy-MM');
    
    // If already loading, wait for that to finish
    if (this.loadingPromise) {
      await this.loadingPromise;
    }

    // If we already have this month cached, skip
    if (this.cache[monthKey]) {
      return;
    }

    this.isLoading = true;
    this.loadingPromise = this.fetchMonthSlots(date);
    
    try {
      await this.loadingPromise;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  private async fetchMonthSlots(date: Date): Promise<void> {
    const monthKey = format(date, 'yyyy-MM');
    const params = new URLSearchParams({
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString(),
    });

    try {
      const response = await fetch(
        `https://salesrevv-challenge.neetocal.com/api/external/v1/slots/personal-training-session?${params}`,
        {
          headers: { 'X-Api-Key': this.API_KEY }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform and cache the data
      if (data.slots && Array.isArray(data.slots)) {
        data.slots.forEach((day: any) => {
          const dateKey = day.date;
          if (day.slots && Object.keys(day.slots).length > 0) {
            this.cache[dateKey] = this.transformSlots(day, dateKey);
          } else {
            this.cache[dateKey] = [];
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching slots for ${monthKey}:`, error);
      throw error;
    }
  }

  private transformSlots(dayData: any, dateStr: string): TimeSlot[] {
    if (!dayData?.slots) return [];

    return Object.entries(dayData.slots).map(([key, slot]: [string, any]) => ({
      sid: key,
      id: key,
      startTime: `${dateStr}T${this.parseTimeStr(slot.start_time)}`,
      endTime: `${dateStr}T${this.parseTimeStr(slot.end_time)}`,
      available: slot.is_available
    }));
  }

  private parseTimeStr(timeStr: string): string {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  }

  hasAvailableSlots(date: Date): boolean {
    const dateKey = format(date, 'yyyy-MM-dd');
    return !!this.cache[dateKey]?.some(slot => slot.available);
  }

  getSlotsForDate(date: Date): TimeSlot[] {
    const dateKey = format(date, 'yyyy-MM-dd');
    return this.cache[dateKey] || [];
  }
}

export const slotPrefetchService = new SlotPrefetchService(); 