export interface BookingState {
  date: Date | null;
  availableSlots: TimeSlot[];
  upcomingBookings: Booking[];
  loading: boolean;
  error: string | null;
  reschedulingBooking: Booking | null;
  showBookingModal: boolean;
  selectedSlot: TimeSlot | null;
}

interface Meeting {
  id: string
  name: string
  duration: number
  spot_in_person_location?: string
  description?: string
}

export interface Booking {
  id: string
  sid: string
  starts_at: string
  ends_at: string
  name: string
  email: string
  status: string
  time_zone: string
  meeting?: Meeting
  host_name: string
  host_email: string
  client_booking_url: string
}

export type BookingAction = 
  | { type: 'SET_DATE'; payload: Date | null }
  | { type: 'SET_SLOTS'; payload: TimeSlot[] }
  | { type: 'SET_UPCOMING_BOOKINGS'; payload: Booking[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESCHEDULING_BOOKING'; payload: Booking | null }
  | { type: 'SET_SHOW_BOOKING_MODAL'; payload: boolean }
  | { type: 'SET_SELECTED_SLOT'; payload: TimeSlot | null };

export interface TimeSlot {
  id: string;
  sid: string;
  startTime: string;
  endTime: string;
  available: boolean;
  isBooked?: boolean;
}

export interface TimeSlotGridProps {
  slots: TimeSlot[];
  bookings: Booking[]; 
  onSlotClick: (slot: TimeSlot) => void;
}

export const initialState: BookingState = {
  date: null,
  availableSlots: [],
  upcomingBookings: [],
  loading: false,
  error: null,
  reschedulingBooking: null,
  showBookingModal: false,
  selectedSlot: null,
}