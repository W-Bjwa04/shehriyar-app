import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuarterData from '@/lib/models/QuarterData';
import { getDefaultDecisions, getDefaultPreviousResults } from '@/lib/services/simulationEngine';

// POST /api/seed
export async function POST() {
  try {
    await dbConnect();
    const groupNumber = 1;
    const companyNumber = 1;
    const numProducts = 3;

    const existing = await QuarterData.findOne({ groupNumber, companyNumber, isSeedData: true });
    if (existing) {
      return NextResponse.json({ message: 'Seed data already exists' });
    }

    const decisions = getDefaultDecisions(numProducts);
    const results = getDefaultPreviousResults(numProducts);

    const seedData = new QuarterData({
      simulationCode: 'GM05',
      groupNumber,
      companyNumber,
      identityNumber: 'SEED',
      year: 2006,
      quarter: 3,
      status: 2,
      numProducts,
      decisions,
      results,
      isProcessed: true,
      isSeedData: true,
    });

    await seedData.save();
    return NextResponse.json({ message: 'Seed data created successfully: 2006 Q3' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
