import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuarterData from '@/lib/models/QuarterData';
import { getDefaultDecisions, getDefaultPreviousResults } from '@/lib/services/simulationEngine';

// GET /api/defaults?groupNumber=1&companyNumber=1&numProducts=3
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupNumber = parseInt(searchParams.get('groupNumber') || '1');
    const companyNumber = parseInt(searchParams.get('companyNumber') || '1');
    const np = parseInt(searchParams.get('numProducts') || '3');

    const latest = await QuarterData.findOne({
      groupNumber, companyNumber, isProcessed: true,
    }).sort({ year: -1, quarter: -1 }).lean();

    if (latest) {
      const nextQuarter = latest.quarter === 4 ? 1 : latest.quarter + 1;
      const nextYear = latest.quarter === 4 ? latest.year + 1 : latest.year;
      return NextResponse.json({
        decisions: latest.decisions,
        numProducts: latest.numProducts,
        year: nextYear,
        quarter: nextQuarter,
        previousResults: latest.results,
      });
    } else {
      return NextResponse.json({
        decisions: getDefaultDecisions(np),
        numProducts: np,
        year: 2006,
        quarter: 4,
        previousResults: getDefaultPreviousResults(np),
      });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
