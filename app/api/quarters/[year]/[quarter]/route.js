import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuarterData from '@/lib/models/QuarterData';

// GET /api/quarters/[year]/[quarter]
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupNumber = parseInt(searchParams.get('groupNumber') || '1');
    const companyNumber = parseInt(searchParams.get('companyNumber') || '1');
    const year = parseInt(params.year);
    const quarter = parseInt(params.quarter);

    const data = await QuarterData.findOne({
      groupNumber, companyNumber, year, quarter,
    }).lean();

    if (!data) {
      return NextResponse.json({ error: 'Quarter not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/quarters/[year]/[quarter]
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupNumber = parseInt(searchParams.get('groupNumber') || '1');
    const companyNumber = parseInt(searchParams.get('companyNumber') || '1');
    const year = parseInt(params.year);
    const quarter = parseInt(params.quarter);

    const result = await QuarterData.findOneAndDelete({
      groupNumber, companyNumber, year, quarter,
    });

    if (!result) {
      return NextResponse.json({ error: 'Quarter not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Quarter deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
