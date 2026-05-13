import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuarterData from '@/lib/models/QuarterData';

// POST /api/reset
export async function POST(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupNumber = parseInt(searchParams.get('groupNumber') || '1');
    const companyNumber = parseInt(searchParams.get('companyNumber') || '1');

    await QuarterData.deleteMany({
      groupNumber, companyNumber,
    });

    return NextResponse.json({ message: 'Simulation reset successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
