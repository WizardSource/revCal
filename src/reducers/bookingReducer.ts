import { BookingAction, BookingState, TimeSlot } from "@/types/booking"

export const initialState: BookingState = {
  date: null,
  availableSlots: [],
  upcomingBookings: [],
  loading: false,
  error: null,
  reschedulingBooking: null,
  showBookingModal: false,
  selectedSlot: null
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, date: action.payload }
    case 'SET_SLOTS':
      return { ...state, availableSlots: action.payload }
    case 'SET_UPCOMING_BOOKINGS':
      return { ...state, upcomingBookings: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_RESCHEDULING_BOOKING':
      return { ...state, reschedulingBooking: action.payload }
    case 'SET_SHOW_BOOKING_MODAL':
      return { ...state, showBookingModal: action.payload }
    case 'SET_SELECTED_SLOT':
      return { ...state, selectedSlot: action.payload }
    default:
      return state
  }
} 