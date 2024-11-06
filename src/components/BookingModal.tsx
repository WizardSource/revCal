import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format, parseISO, isValid } from 'date-fns'
import { Booking, TimeSlot } from '@/types/booking'

interface BookingModalProps {
  slot?: TimeSlot
  bookings?: Booking[]
  onClose: () => void
  onSubmit?: (name: string, email: string) => void
  onCancel?: (id: string) => void
}

export function BookingModal({ slot, bookings, onClose, onSubmit, onCancel }: BookingModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) {
      console.warn('No date string provided for formatting');
      return 'No date available';
    }

    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid date';
      }
      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date format';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {slot ? 'Book Appointment' : 'Your Upcoming Bookings'}
          </DialogTitle>
          <DialogDescription>
            {slot 
              ? 'Enter your details to confirm your booking'
              : 'View and manage your upcoming appointments'}
          </DialogDescription>
        </DialogHeader>

        {slot ? (
          <form onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.(name, email)
          }} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Booking for {formatDateTime(slot.startTime)}
              </p>
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Book</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {bookings && bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {booking?.starts_at ? formatDateTime(booking.starts_at) : 'No date available'}
                    </p>
                    {booking?.meeting?.duration && (
                      <p className="text-sm text-gray-500">
                        Duration: {booking.meeting.duration} minutes
                      </p>
                    )}
                    {booking?.name && (
                      <p className="text-sm text-gray-500">
                        Booked for: {booking.name}
                      </p>
                    )}
                    {booking?.email && (
                      <p className="text-sm text-gray-500">
                        {booking.email}
                      </p>
                    )}
                    {booking?.meeting?.spot_in_person_location && (
                      <p className="text-sm text-gray-500">
                        Location: {booking.meeting.spot_in_person_location}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => booking?.sid && onCancel?.(booking.sid)}
                    className="ml-4"
                  >
                    Cancel
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No upcoming bookings</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}