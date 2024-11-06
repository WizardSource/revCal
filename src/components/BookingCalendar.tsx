'use client'

import { useState, useEffect, Key, AwaitedReactNode, JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBookingService } from '@/hooks/useBookingService'
import { useUserBookings } from '@/hooks/useUserBookings'
import { BookingModal } from '@/components/BookingModal'
import { TimeSlot } from '@/types/booking'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isSameDay } from 'date-fns'
import { slotPrefetchService } from '@/services/slotPrefetchService'


// Move this outside the component or memoize it
const formatBookedSlots = (date: Date | undefined, bookings: any[]) => {
  if (!date || !bookings.length) return [];
  
  return bookings
    .filter(booking => {
      const bookingDate = new Date(booking.starts_at);
      return isSameDay(bookingDate, date);
    })
    .map(booking => ({
      id: booking.booking_sid || booking.sid, // Ensure we always have an ID
      time: format(new Date(booking.starts_at), 'h:mm a')
    }));
};

export function BookingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>()
  const [showUpcomingBookings, setShowUpcomingBookings] = useState(false)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  
  const bookingService = useBookingService()
  const { bookings, refreshBookings, addBooking } = useUserBookings()

  // Fetch slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!date) return
      try {
        const slots = await bookingService.fetchAvailableSlots(date)
        console.log('Fetched slots:', slots)
        setAvailableSlots(slots)
      } catch (error) {
        console.error('Error fetching slots:', error)
        setAvailableSlots([])
        toast({
          variant: "destructive",
          title: "Error fetching slots",
          description: "Please try again later"
        })
      }
    }

    fetchSlots()
  }, [date]) // Change this to depend on date directly

  // Add this effect to prefetch initial data
  useEffect(() => {
    const prefetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Prefetch current month and next month
        const currentMonth = new Date();
        await slotPrefetchService.prefetchMonth(currentMonth);
        await slotPrefetchService.prefetchMonth(addMonths(currentMonth, 1));
      } catch (error) {
        console.error('Error prefetching data:', error);
        toast({
          variant: "destructive",
          title: "Error loading calendar",
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };

    prefetchInitialData();
  }, []);

  // Add this useEffect to refresh bookings when component mounts
  useEffect(() => {
    refreshBookings();
  }, []);

  const isDateDisabled = (date: Date) => {
    if (!date) return false;

    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Disable dates with no available slots
    return !slotPrefetchService.hasAvailableSlots(date);
  };

  const handleBookingSubmit = async (name: string, email: string) => {
    if (!selectedSlot) return
    try {
      const response = await bookingService.bookAppointment(selectedSlot, name, email)
      if (response) {
        const newBooking = {
          id: response.id, 
          sid: response.sid, 
          booking_sid: response.sid,
          starts_at: selectedSlot.startTime,
          ends_at: selectedSlot.endTime,
          status: 'confirmed',
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          name,
          email,
          host_name: "Bhargav Patel", 
          host_email: "bhargav@salesrevv.com", 
          client_booking_url: response.client_booking_url || "https://salesrevv-challenge.neetocal.com/booking/uajgwpe" // Add required client_booking_url field
        }
        addBooking(newBooking)
        setSelectedSlot(undefined)
        await refreshBookings()
        
        toast({
          title: "Booking Confirmed! 🎉",
          description: `Your session has been booked for ${new Date(selectedSlot.startTime).toLocaleDateString()} at ${new Date(selectedSlot.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : 'Failed to book appointment',
        variant: "destructive",
      })
    }
  }

  // Modify the useEffect for fetching slots
  useEffect(() => {
    if (!date) return;
    
    const fetchData = async () => {
      try {
        // First, get the slots for the date
        const slots = await bookingService.fetchAvailableSlots(date);
        
        // Then get the bookings
        await refreshBookings();
        
        // Mark slots that are booked
        const slotsWithBookingStatus = slots.map(slot => {
          const isBooked = bookings.some((booking: { starts_at: string | number | Date }) => {
            const bookingTime = new Date(booking.starts_at);
            const slotTime = new Date(slot.startTime);
            return (
              bookingTime.getFullYear() === slotTime.getFullYear() &&
              bookingTime.getMonth() === slotTime.getMonth() &&
              bookingTime.getDate() === slotTime.getDate() &&
              bookingTime.getHours() === slotTime.getHours() &&
              bookingTime.getMinutes() === slotTime.getMinutes()
            );
          });

          return {
            ...slot,
            isBooked
          };
        });

        setAvailableSlots(slotsWithBookingStatus);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAvailableSlots([]);
      }
    };

    fetchData();
  }, [date, bookings]); // Add bookings to dependencies

  const getExistingBookingForSlot = (slot: TimeSlot) => {
    // Add debug logging
    console.log('Checking bookings:', {
      bookings: bookings,
      currentSlot: slot.startTime
    });

    return bookings.find((booking: { starts_at: string | number | Date }) => {
      // Normalize both dates to ISO strings for comparison
      const bookingTime = new Date(booking.starts_at).toISOString();
      const slotTime = new Date(slot.startTime).toISOString();
      
      // Debug log
      console.log('Comparing times:', {
        bookingTime,
        slotTime,
        isMatch: bookingTime === slotTime
      });

      return bookingTime === slotTime;
    });
  };

  // Function to check if selected date has any bookings
  const hasBookingsForDate = (selectedDate: Date) => {
    return bookings.some((booking: { starts_at: string | number | Date }) => {
      const bookingDate = new Date(booking.starts_at);
      return isSameDay(bookingDate, selectedDate);
    });
  };

  const legend = (
    <div className="mt-4 flex gap-4 justify-center text-sm text-muted-foreground">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-white border border-gray-200"></div>
      <span>Available</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-50 border border-blue-200"></div>
      <span>Your Booking</span>
    </div>
  </div>);

  // Use useMemo for booked slots
  const bookedSlots = useMemo(() => {
    return formatBookedSlots(date, bookings);
  }, [date, bookings]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Book a Training Session</CardTitle>
            <CardDescription>Select a date and time for your training session</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setShowUpcomingBookings(true)}>
            View Upcoming Bookings
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              Loading calendar...
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={isDateDisabled}
              className="rounded-md border"
              fromDate={new Date()}
              showOutsideDays={false}
              fixedWeeks
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium mb-4">
              Available Times for {date?.toLocaleDateString()}
            </h3>
            
            {/* Updated booked slots section */}
            {bookedSlots.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm text-muted-foreground mb-2">Your Bookings:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {bookedSlots.map((bookedSlot) => (
                    <div
                      key={`booked-${bookedSlot.id}`}
                      className="w-full p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center"
                    >
                      <span className="flex items-center justify-center">
                        {bookedSlot.time}
                        <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                          Booked
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Then show available slots as before */}
            {availableSlots.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots
                    .filter(slot => {
                      if (!date) return false;
                      const slotDate = format(parseISO(slot.startTime), 'yyyy-MM-dd');
                      const selectedDate = format(date, 'yyyy-MM-dd');
                      return slotDate === selectedDate;
                    })
                    .map((slot) => (
                      <Button
                        key={slot.id}
                        variant="outline"
                        className="w-full relative"
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.available}
                      >
                        <span className="flex items-center justify-center">
                          {format(parseISO(slot.startTime), 'h:mm a')}
                        </span>
                      </Button>
                    ))}
                </div>
                {date && hasBookingsForDate(date) && legend}
              </>
            ) : (
              <p className="text-center text-muted-foreground mt-4">
                No slots available for this date. Please select another date.
              </p>
            )}
          </div>
        </div>
      </CardContent>

      {showUpcomingBookings && (
        <BookingModal
          bookings={bookings}
          onClose={() => setShowUpcomingBookings(false)}
          onCancel={async (bookingSid) => {
            try {
              await bookingService.cancelAppointment(bookingSid);
              await refreshBookings();
              toast({
                title: "Booking Cancelled",
                description: "Your appointment has been successfully cancelled.",
                duration: 3000,
              });
            } catch (error) {
              console.error('Error canceling booking:', error);
              toast({
                title: "Cancellation Failed",
                description: error instanceof Error ? error.message : "Failed to cancel booking",
                variant: "destructive",
                duration: 5000,
              });
            }
          }}
        />
      )}

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(undefined)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </Card>
  )
}