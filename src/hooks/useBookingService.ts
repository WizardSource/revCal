import { TimeSlot } from '@/types/booking';
import { apiThrottler } from '../utils/apiThrottler';
import { format } from 'date-fns';

import { useMemo } from 'react';
import { fetchWithCache } from '../services/cacheService';

const API_KEY = process.env.NEXT_PUBLIC_NEETO_API_KEY || '';

export interface BookingService {
  cancelAppointment(id: string): unknown;
  fetchAvailableSlots: (selectedDate: Date) => Promise<TimeSlot[]>;
  fetchAvailableDates: (startDate: Date, endDate: Date) => Promise<Date[]>;
  bookAppointment: (slot: TimeSlot, name: string, email: string) => Promise<any>;
  fetchAvailableSlotsForRange: (startDate: Date, endDate: Date) => Promise<TimeSlot[]>;
}

export function useBookingService(): BookingService {
  const slotsCache = useMemo(() => new Map<string, TimeSlot[]>(), []);

  const fetchAvailableSlots = async (selectedDate: Date) => {
    return apiThrottler.enqueue(async () => {
      const params = new URLSearchParams({
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: selectedDate.getFullYear().toString(),
        month: (selectedDate.getMonth() + 1).toString(),
        date: selectedDate.getDate().toString()
      });

      console.log('Fetching slots with params:', Object.fromEntries(params));

      const response = await fetch(
        `https://salesrevv-challenge.neetocal.com/api/external/v1/slots/personal-training-session?${params}`,
        {
          headers: { 'X-Api-Key': API_KEY }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.slots || !Array.isArray(data.slots)) {
        console.log('No slots in response');
        return [];
      }

      // Find the day data for the selected date
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayData = data.slots.find((day: any) => day.date === selectedDateStr);

      if (!dayData) {
        console.log('No data found for date:', selectedDateStr);
        return [];
      }

      const slots = transformSlots(dayData, selectedDateStr);
      console.log('Transformed slots:', slots);
      return slots;
    });
  };

  const bookAppointment = async (slot: TimeSlot, name: string, email: string) => {
    return apiThrottler.enqueue(async () => {
      const startTime = new Date(slot.startTime);
      const response = await fetch('https://salesrevv-challenge.neetocal.com/api/external/v1/bookings', {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meeting_slug: 'personal-training-session',
          name,
          email,
          slot_id: slot.id,
          slot_date: format(startTime, 'yyyy-MM-dd'),
          slot_start_time: format(startTime, 'hh:mm a'),
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Booking failed: ${response.status}${errorData.message ? ` - ${errorData.message}` : ''}`);
      }

      return response.json();
    });
  };

  const fetchAvailableDates = async (startDate: Date, endDate: Date) => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Simulate some random availability (for testing)
      if (Math.random() > 0.5) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const cancelAppointment = async (bookingSid: string, cancelReason?: string) => {
    return apiThrottler.enqueue(async () => {
      const response = await fetch(
        `https://salesrevv-challenge.neetocal.com/api/external/v1/bookings/${bookingSid}/cancel`,
        {
          method: 'POST',
          headers: {
            'X-Api-Key': API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: cancelReason ? `cancel_reason=${encodeURIComponent(cancelReason)}` : ''
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cancellation failed: ${response.status}${errorData.message ? ` - ${errorData.message}` : ''}`);
      }

      return response.json();
    });
  };

  const fetchAvailableSlotsForRange = async (startDate: Date, endDate: Date) => {
    // Debug logging
    console.log('Input dates:', { 
      startDate: startDate?.toString(), 
      endDate: endDate?.toString() 
    });

    // Validate dates
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    // Ensure we're working with Date objects
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    // Validate the date objects
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format provided');
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Format dates safely
    const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    
    console.log('Formatted month key:', monthKey);

    const allSlots: TimeSlot[] = [];

    try {
      const url = `https://salesrevv-challenge.neetocal.com/api/external/v1/slots/personal-training-session?` +
        new URLSearchParams({
          time_zone: timeZone,
          year: start.getFullYear().toString(),
          month: String(start.getMonth() + 1).padStart(2, '0')
        });

      console.log('Fetching URL:', url);
      
      const response = await fetchWithCache(url);
      
      // Check if response has slots array
      if (response?.slots && Array.isArray(response.slots)) {
        // Transform each day's slots
        response.slots.forEach((day: any) => {
          if (!day.slots || Object.keys(day.slots).length === 0) return;
          
          const slots = transformSlots(day, day.date);
          allSlots.push(...slots);
        });
      }

    } catch (error) {
      console.error(`Error fetching slots for ${monthKey}:`, error);
      throw error;
    }

    // Filter slots within the date range
    return allSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= startDate && slotDate <= endDate;
    });
  };

  return {
    fetchAvailableSlots,
    fetchAvailableDates,
    bookAppointment,
    cancelAppointment,
    fetchAvailableSlotsForRange
  };
}

function transformSlots(dayData: any, selectedDateStr: string): TimeSlot[] {
  if (!dayData?.slots) return [];

  return Object.entries(dayData.slots).map(([key, slot]: [string, any]) => ({
    sid: key,
    id: key,
    startTime: `${selectedDateStr}T${parseTimeStr(slot.start_time)}`,
    endTime: `${selectedDateStr}T${parseTimeStr(slot.end_time)}`,
    isBooked: !slot.is_available,
    available: slot.is_available
  }));
}

function parseTimeStr(timeStr: string): string {
  const [time, period] = timeStr.split(' ')
  const [hours, minutes] = time.split(':')
  let hour = parseInt(hours)
  
  if (period === 'PM' && hour !== 12) {
    hour += 12
  } else if (period === 'AM' && hour === 12) {
    hour = 0
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`
} 