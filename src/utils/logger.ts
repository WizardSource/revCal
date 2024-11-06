export const log = async (message: string, data?: any) => {
  // Log to browser console
  console.log(message, data)
  
  // Also log to server
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, data, timestamp: new Date().toISOString() }),
    })
  } catch (error) {
    console.error('Failed to send log to server:', error)
  }
} 