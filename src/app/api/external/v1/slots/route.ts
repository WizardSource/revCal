import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeZone = searchParams.get('time_zone');
    const startDate = new Date(searchParams.get('start_date') || '');
    
    if (!timeZone || !startDate) {
      return NextResponse.json(
        { error: 'time_zone and start_date are required' },
        { status: 400 }
      );
    }

    // Make one request per month
    const response = await fetch(
      `https://salesrevv-challenge.neetocal.com/api/external/v1/slots/personal-training-session`,
      {
        method: 'GET',
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_NEETOCAL_API_KEY || '',
          'Content-Type': 'application/json',
        },
        // Use the documented query parameters
        cache: 'no-store',
        next: { revalidate: 0 },
        body: JSON.stringify({
          time_zone: timeZone,
          year: startDate.getFullYear(),
          month: startDate.getMonth() + 1
        })
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in slots API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
} 