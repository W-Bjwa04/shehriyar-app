import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuarterData from '@/lib/models/QuarterData';
import { processQuarter, getDefaultDecisions, getDefaultPreviousResults } from '@/lib/services/simulationEngine';

// POST /api/submit
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      simulationCode, groupNumber = 1, companyNumber = 1,
      identityNumber, year, quarter, status, numProducts = 3, decisions
    } = body;

    if (!year || !quarter) {
      return NextResponse.json({ error: 'Year and Quarter are required' }, { status: 400 });
    }
    if (quarter < 1 || quarter > 4) {
      return NextResponse.json({ error: 'Quarter must be between 1 and 4' }, { status: 400 });
    }
    if (numProducts < 1 || numProducts > 8) {
      return NextResponse.json({ error: 'Number of products must be between 1 and 8' }, { status: 400 });
    }

    const gn = parseInt(groupNumber);
    const cn = parseInt(companyNumber);
    const yr = parseInt(year);
    const qr = parseInt(quarter);
    const np = parseInt(numProducts);

    const existing = await QuarterData.findOne({ groupNumber: gn, companyNumber: cn, year: yr, quarter: qr });
    if (existing && existing.isProcessed) {
      return NextResponse.json({ error: 'This quarter has already been processed. Cannot resubmit.' }, { status: 409 });
    }

    const prevQr = qr === 1 ? 4 : qr - 1;
    const prevYr = qr === 1 ? yr - 1 : yr;
    let prevQuarter = await QuarterData.findOne({ groupNumber: gn, companyNumber: cn, year: prevYr, quarter: prevQr, isProcessed: true }).lean();

    const ppQr = prevQr === 1 ? 4 : prevQr - 1;
    const ppYr = prevQr === 1 ? prevYr - 1 : prevYr;
    let prevPrevQuarter = await QuarterData.findOne({ groupNumber: gn, companyNumber: cn, year: ppYr, quarter: ppQr, isProcessed: true }).lean();

    const prevData = prevQuarter || { numProducts: np, decisions: getDefaultDecisions(np), results: getDefaultPreviousResults(np) };
    const prevPrevData = prevPrevQuarter || null;

    const decisionsWithMeta = { ...decisions, quarter: qr, numProducts: np };
    const results = processQuarter(decisionsWithMeta, prevData, prevPrevData);

    const quarterData = existing || new QuarterData();
    quarterData.simulationCode = simulationCode || '';
    quarterData.groupNumber = gn;
    quarterData.companyNumber = cn;
    quarterData.identityNumber = identityNumber || '';
    quarterData.year = yr;
    quarterData.quarter = qr;
    quarterData.status = status || 0;
    quarterData.numProducts = np;
    quarterData.decisions = decisions;
    quarterData.results = results;
    quarterData.isProcessed = true;

    await quarterData.save();

    return NextResponse.json({
      message: `Quarter ${qr} of ${yr} processed successfully`,
      data: quarterData.toObject(),
    });
  } catch (err) {
    console.error('Submit error:', err);
    if (err.code === 11000) {
      return NextResponse.json({ error: 'This quarter has already been submitted' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
