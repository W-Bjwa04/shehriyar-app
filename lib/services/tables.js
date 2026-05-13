/**
 * TOPAZ SIMULATION - FIXED PARAMETERS & TABLES
 */

export const GENERAL = {
  MAX_PRODUCTS: 8,
  WEEKS_PER_QUARTER: 12,
  HOURS_PER_WEEK_WORKER: 48,
  MAX_ASSEMBLY_HOURS_PER_WORKER: 576,
  MACHINISTS_PER_MACHINE_PER_SHIFT: 4,
  MIN_MACHINIST_HOURS: 100,
  SHARES_ISSUED: 2000000,
  PROPERTY_VALUE: 300000,
};

export const BUSINESS_INTELLIGENCE = {
  companyInfo: 5000,
  marketShares: 5000,
};

export const PRODUCT_SPECS = [
  { machineTime: 1.0,  materialContent: 1, baseAssemblyTime: 120, scrapValue: 15, guaranteeCost: 30, basePrice: 170 },
  { machineTime: 1.5,  materialContent: 2, baseAssemblyTime: 165, scrapValue: 25, guaranteeCost: 45, basePrice: 290 },
  { machineTime: 3.0,  materialContent: 4, baseAssemblyTime: 330, scrapValue: 50, guaranteeCost: 90, basePrice: 580 },
  { machineTime: 1.2,  materialContent: 1, baseAssemblyTime: 130, scrapValue: 18, guaranteeCost: 35, basePrice: 200 },
  { machineTime: 1.8,  materialContent: 2, baseAssemblyTime: 180, scrapValue: 30, guaranteeCost: 50, basePrice: 320 },
  { machineTime: 2.5,  materialContent: 3, baseAssemblyTime: 250, scrapValue: 40, guaranteeCost: 70, basePrice: 450 },
  { machineTime: 3.5,  materialContent: 5, baseAssemblyTime: 360, scrapValue: 60, guaranteeCost: 100, basePrice: 650 },
  { machineTime: 4.0,  materialContent: 6, baseAssemblyTime: 400, scrapValue: 75, guaranteeCost: 120, basePrice: 750 },
];

export const MAINTENANCE = {
  normalCostPerHour: 60,
  overtimeCostPerHour: 90,
  breakdownRateBase: 0.02,
  breakdownReductionPerHour: 0.001,
};

export const MACHINE_HOURS_PER_SHIFT = { 1: 576, 2: 1092, 3: 1440 };

export const SHIFT_PREMIUMS = { 1: 1.0, 2: 1.25, 3: 1.5 };

export const MACHINE_RUNNING = {
  overheadPerMachine: 2000,
  supervisionPerShift: 1500,
  hourlyRate: 8,
  planningChargePerUnit: 2,
};

export const TRANSPORT = {
  vehicleFixedCost: 5000,
  vehicleRunningCostPerDay: 150,
  hiredTransportPerDay: 300,
  vehicleCapacity: 500,
  deliveryDaysPerQuarter: 60,
  vehiclePurchasePrice: 25000,
  vehicleSaleValue: 12000,
  vehicleDepreciationRate: 0.0625,
  vehicleAgingFactor: 1.05,
};

export const WAREHOUSING = {
  factoryStorageCost: 3000,
  purchasingAdmin: 500,
  productWarehouseCostPerUnit: 2,
  materialStorage: { capacity: 5000, excessCostPerUnit: 1 },
};

export const PERSONNEL_COSTS = {
  salespeople: {
    recruitCost: 3000, dismissCost: 5000, trainCost: 2000,
    expenses: 1500, leaverRate: 0.03,
  },
  assemblyWorkers: {
    recruitCost: 1500, dismissCost: 2500, trainCost: 1500, leaverRate: 0.03,
  },
  machinists: { baseCostPerHour: 8.50, leaverRate: 0.03 },
};

export const STRIKE = { hoursLostPerWorkerPerWeek: 48 };

export const DEPRECIATION = {
  machineRate: 0.025,
  vehicleRate: 0.0625,
  machinePurchasePrice: 100000,
  machineInstallPayment1: 50000,
  machineInstallPayment2: 50000,
  machineSaleValue: 0.5,
};

export const OVERDRAFT = { assetFraction: 0.40, minLimit: 100000 };

export const FINANCE = {
  overdraftInterestRate: 0.02,
  unsecuredLoanRate: 0.03,
  depositRate: 0.01,
  taxRate: 0.30,
  creditControlBase: 5000,
  creditControlRate: 0.005,
  miscCostsFixed: 5000,
  miscCostsRate: 0.01,
  salesOfficeRate: 0.01,
};

export const PRODUCT_VALUATIONS = [35, 55, 95, 40, 60, 80, 110, 130];

export const PAYMENT_TERMS = {
  wages: 1.0,
  materials: 0.5,
  overheads: 0.7,
  creditDaysTarget: 30,
  receiptRate: 0.85,
};

export const MARKET = {
  baseMarketSize: {
    export: [3000, 1500, 600],
    south:  [300, 250, 120],
    west:   [150, 100, 90],
    north:  [700, 400, 150],
  },
  priceElasticity: -1.5,
  advertisingEffect: 0.3,
  salesforceEffect: 0.2,
  qualityEffect: 0.15,
  seasonalFactors: { 1: 0.90, 2: 1.00, 3: 1.05, 4: 1.10 },
  baseRejectionRate: 0.03,
  minRejectionRate: 0.01,
  maxRejectionRate: 0.10,
  baseServiceRate: 0.015,
};
