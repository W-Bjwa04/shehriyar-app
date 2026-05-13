import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuarterData from '@/lib/models/QuarterData';

// GET /api/quarters?groupNumber=1&companyNumber=1
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupNumber = parseInt(searchParams.get('groupNumber') || '1');
    const companyNumber = parseInt(searchParams.get('companyNumber') || '1');

    const quarters = await QuarterData.find({ groupNumber, companyNumber })
      .sort({ year: 1, quarter: 1 })
      .lean();

    return NextResponse.json(quarters);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
