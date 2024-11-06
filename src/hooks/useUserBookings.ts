import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/types/booking';

export function useUserBookings() {
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userBookings'],
    queryFn: async () => {
      const response = await fetch(
        'https://salesrevv-challenge.neetocal.com/api/external/v1/bookings?type=upcoming', {
          headers: {
            'X-Api-Key': process.env.NEXT_PUBLIC_NEETO_API_KEY || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Raw booking data:', data);
      
      const bookingsArray = data.bookings || [];
      console.log('Processed bookings:', bookingsArray);
      
      return bookingsArray;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const addBooking = (booking: Booking) => {
    queryClient.setQueryData<Booking[]>(['userBookings'], (oldBookings) => {
      const currentBookings = oldBookings || [];
      return [...currentBookings, booking];
    });
  };

  return {
    bookings,
    loading: isLoading,
    error,
    addBooking,
    refreshBookings: refetch,
  };
}
