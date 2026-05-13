/**
 * TOPAZ SIMULATION ENGINE
 * Processes decisions and previous quarter data to generate the management report.
 */

import * as T from './tables.js';

export function processQuarter(decisions, prevQuarter, prevPrevQuarter) {
  const numProducts = decisions.numProducts || prevQuarter?.numProducts || 3;
  const prev = prevQuarter?.results || getDefaultPreviousResults(numProducts);
  const prevDec = prevQuarter?.decisions || getDefaultDecisions(numProducts);
  const prevPrev = prevPrevQuarter?.results || getDefaultPreviousResults(numProducts);
  const prevPrevDec = prevPrevQuarter?.decisions || getDefaultDecisions(numProducts);

  const results = {};

  // 1. MACHINES AND VEHICLES
  const machinesAvailableLastQ = prev.machines?.availableNextQuarter || 10;
  const machinesToSell = Math.min(decisions.machinesToSell || 0, machinesAvailableLastQ);
  const machinesInUse = machinesAvailableLastQ - machinesToSell;
  const machinesInstalled = prevDec.newMachinesToOrder || 0;
  const machinesAvailableNext = machinesInUse + machinesInstalled;

  results.machines = {
    availableLastQuarter: machinesAvailableLastQ,
    decommissioned: machinesToSell,
    inUse: machinesInUse,
    installed: machinesInstalled,
    availableNextQuarter: machinesAvailableNext,
  };

  const prevVehicles = prev.vehicles?.availableLastQuarter || 17;
  const vehiclesAvailable = prevVehicles + (decisions.vansToBuy || 0) - Math.min(decisions.vansToSell || 0, prevVehicles);
  results.vehicles = { availableLastQuarter: vehiclesAvailable };

  // 2. ASSEMBLY WORKERS AND HOURS
  const prevSalespeople = prev.personnel?.salespeople?.availableNext || 18;
  const prevAssemblyWorkers = prev.personnel?.assemblyWorkers?.availableNext || 36;
  const prevMachinists = prev.personnel?.machinists?.availableNext || 76;

  const assemblyWorkersAtStart = prevAssemblyWorkers;
  const strikeWeeks = prev.assemblyHours?.strikeWeeksNext || 0;
  const assemblyHoursAvailable = assemblyWorkersAtStart *
    (T.GENERAL.MAX_ASSEMBLY_HOURS_PER_WORKER - strikeWeeks * T.STRIKE.hoursLostPerWorkerPerWeek);

  const absenteeismRate = 0.002 + Math.random() * 0.003;
  const absenteeism = Math.round(assemblyHoursAvailable * absenteeismRate);

  // 3. MACHINE HOURS
  const shiftLevel = decisions.shiftLevel || 1;
  const machineHoursAvailable = machinesInUse * (T.MACHINE_HOURS_PER_SHIFT[shiftLevel] || 576);
  const contractedMaintenancePerMachine = decisions.maintenanceHours || 0;
  const totalMaintenanceHours = contractedMaintenancePerMachine * machinesInUse;
  const breakdownRate = Math.max(0.005,
    T.MAINTENANCE.breakdownRateBase - contractedMaintenancePerMachine * T.MAINTENANCE.breakdownReductionPerHour
  );
  const breakdownTime = Math.round(machineHoursAvailable * breakdownRate);

  // 4. PRODUCTION SCHEDULING & CAPACITY
  const scheduled = [];
  for (let p = 0; p < numProducts; p++) {
    const exp = (decisions.deliverySchedule?.export?.[p]) || 0;
    const south = (decisions.deliverySchedule?.south?.[p]) || 0;
    const west = (decisions.deliverySchedule?.west?.[p]) || 0;
    const north = (decisions.deliverySchedule?.north?.[p]) || 0;
    scheduled.push(exp + south + west + north);
  }

  let totalMachineHoursNeeded = 0;
  for (let p = 0; p < numProducts; p++) {
    totalMachineHoursNeeded += scheduled[p] * (T.PRODUCT_SPECS[p]?.machineTime || 1);
  }
  let totalAssemblyHoursNeeded = 0;
  for (let p = 0; p < numProducts; p++) {
    totalAssemblyHoursNeeded += scheduled[p] * ((decisions.assemblyTime?.[p] || 120) / 60);
  }
  let totalMaterialNeeded = 0;
  for (let p = 0; p < numProducts; p++) {
    totalMaterialNeeded += scheduled[p] * (T.PRODUCT_SPECS[p]?.materialContent || 1);
  }

  const productionMachineHours = machineHoursAvailable - breakdownTime;
  const availableAssemblyHours = assemblyHoursAvailable - absenteeism;
  const materialOpening = prev.materials?.closingStock || 2280;
  const materialDelivered = prevDec.materials?.unitsToOrder || 10000;
  const materialAvailable = materialOpening + materialDelivered;

  const machineCapacityRatio = totalMachineHoursNeeded > 0 ? productionMachineHours / totalMachineHoursNeeded : 1;
  const assemblyCapacityRatio = totalAssemblyHoursNeeded > 0 ? availableAssemblyHours / totalAssemblyHoursNeeded : 1;
  const materialCapacityRatio = totalMaterialNeeded > 0 ? materialAvailable / totalMaterialNeeded : 1;
  const productionRatio = Math.min(1, machineCapacityRatio, assemblyCapacityRatio, materialCapacityRatio);

  const produced = [];
  const rejected = [];
  const actualProduced = [];

  for (let p = 0; p < numProducts; p++) {
    const rawProduced = Math.floor(scheduled[p] * productionRatio);
    const assemblyTime = decisions.assemblyTime?.[p] || T.PRODUCT_SPECS[p]?.baseAssemblyTime || 120;
    const baseTime = T.PRODUCT_SPECS[p]?.baseAssemblyTime || 120;
    const qualityFactor = assemblyTime / baseTime;
    let rejectionRate = T.MARKET.baseRejectionRate / qualityFactor;
    rejectionRate = Math.max(T.MARKET.minRejectionRate, Math.min(T.MARKET.maxRejectionRate, rejectionRate));
    const rejects = Math.round(rawProduced * rejectionRate);
    produced.push(rawProduced);
    rejected.push(rejects);
    actualProduced.push(rawProduced - rejects);
  }

  let machineHoursUsed = 0;
  for (let p = 0; p < numProducts; p++) {
    machineHoursUsed += produced[p] * (T.PRODUCT_SPECS[p]?.machineTime || 1);
  }
  let assemblyHoursWorked = 0;
  for (let p = 0; p < numProducts; p++) {
    assemblyHoursWorked += produced[p] * ((decisions.assemblyTime?.[p] || 120) / 60);
  }
  let theoreticalMachineHours = 0;
  for (let p = 0; p < numProducts; p++) {
    theoreticalMachineHours += produced[p] * (T.PRODUCT_SPECS[p]?.machineTime || 1);
  }
  const machineEfficiency = machineHoursUsed > 0 ? (theoreticalMachineHours / machineHoursUsed) * 100 : 100;

  results.machineHours = {
    available: machineHoursAvailable, breakdownTime,
    used: Math.round(machineHoursUsed), maintenanceHours: totalMaintenanceHours,
    efficiency: Math.round(machineEfficiency * 10) / 10,
  };
  results.assemblyHours = {
    available: assemblyHoursAvailable, absenteeism,
    worked: Math.round(assemblyHoursWorked), strikeWeeksNext: 0,
  };

  let materialUsed = 0;
  for (let p = 0; p < numProducts; p++) {
    materialUsed += produced[p] * (T.PRODUCT_SPECS[p]?.materialContent || 1);
  }
  const materialClosing = Math.max(0, materialAvailable - materialUsed);
  const materialOnOrder = decisions.materials?.unitsToOrder || 0;
  results.materials = {
    openingStock: materialOpening, delivered: materialDelivered, used: materialUsed,
    closingStock: materialClosing, onOrder: materialOnOrder, availableNext: materialClosing + materialOnOrder,
  };

  // 5. DELIVERIES, ORDERS, SALES
  const areas = ['export', 'south', 'west', 'north'];
  const delivered = { export: [], south: [], west: [], north: [] };
  for (let p = 0; p < numProducts; p++) {
    let totalScheduledProduct = scheduled[p];
    let available = actualProduced[p];
    for (const area of areas) {
      const areaScheduled = decisions.deliverySchedule?.[area]?.[p] || 0;
      if (totalScheduledProduct > 0) {
        delivered[area].push(Math.floor(available * (areaScheduled / totalScheduledProduct)));
      } else {
        delivered[area].push(0);
      }
    }
  }

  const orders = { export: [], south: [], west: [], north: [] };
  const sales = { export: [], south: [], west: [], north: [] };
  const backlog = { export: [], south: [], west: [], north: [] };
  const stocks = { export: [], south: [], west: [], north: [] };

  const quarter = decisions.quarter || 3;
  const seasonFactor = T.MARKET.seasonalFactors[quarter] || 1.0;
  const gdpFactor = (prev.economic?.gdp || 734) / 700;

  for (let p = 0; p < numProducts; p++) {
    for (const area of areas) {
      const baseMarket = T.MARKET.baseMarketSize[area]?.[p] ||
        (T.MARKET.baseMarketSize[area]?.[0] || 500) / (p + 1);
      const price = area === 'export'
        ? (decisions.prices?.export?.[p] || T.PRODUCT_SPECS[p]?.basePrice || 170)
        : (decisions.prices?.home?.[p] || T.PRODUCT_SPECS[p]?.basePrice || 150);
      const basePrice = T.PRODUCT_SPECS[p]?.basePrice || 170;
      const priceRatio = basePrice / Math.max(price, 1);
      const priceEffect = Math.pow(priceRatio, Math.abs(T.MARKET.priceElasticity));
      const adSpend = ((decisions.advertising?.tradePress?.[p] || 0) +
        (decisions.advertising?.pressTV?.[p] || 0) +
        (decisions.advertising?.merchandising?.[p] || 0)) * 1000;
      const adEffect = 1 + T.MARKET.advertisingEffect * Math.log(1 + adSpend / 10000);
      const salesInArea = decisions.salespeople?.[area] || 0;
      const salesEffect = 1 + T.MARKET.salesforceEffect * Math.sqrt(salesInArea);
      const rdSpend = (decisions.researchExpenditure?.[p] || 0) * 1000;
      const qualityEffect = 1 + T.MARKET.qualityEffect * Math.log(1 + rdSpend / 10000);
      let orderQty = Math.round(baseMarket * priceEffect * adEffect * salesEffect * qualityEffect * seasonFactor * gdpFactor);
      orderQty = Math.round(orderQty * (0.95 + Math.random() * 0.10));
      orderQty = Math.max(0, orderQty);
      orders[area].push(orderQty);

      const prevBacklog = prev.productStats?.backlog?.[area]?.[p] || 0;
      const prevStock = prev.productStats?.stocks?.[area]?.[p] || 0;
      const deliveredHere = delivered[area][p] || 0;
      const totalDemand = orderQty + prevBacklog;
      const totalSupply = deliveredHere + prevStock;
      const salesQty = Math.min(totalDemand, totalSupply);
      sales[area].push(salesQty);
      const unsatisfied = Math.max(0, totalDemand - totalSupply);
      backlog[area].push(Math.floor(unsatisfied * 0.5));
      const stockQty = Math.max(0, totalSupply - salesQty);
      stocks[area].push(stockQty);
    }
  }

  const serviced = [];
  for (let p = 0; p < numProducts; p++) {
    let prevSales = 0;
    for (const area of areas) { prevSales += prev.productStats?.sales?.[area]?.[p] || 0; }
    serviced.push(Math.round(prevSales * T.MARKET.baseServiceRate));
  }

  const productImprovements = [];
  for (let p = 0; p < numProducts; p++) {
    const rdSpend = (decisions.researchExpenditure?.[p] || 0) * 1000;
    if (rdSpend > 30000) productImprovements.push(Math.random() > 0.5 ? 'MAJOR' : 'MINOR');
    else if (rdSpend > 10000) productImprovements.push(Math.random() > 0.7 ? 'MINOR' : 'NONE');
    else productImprovements.push('NONE');
  }

  results.productStats = { scheduled, produced, rejected, serviced, delivered, orders, sales, backlog, stocks, productImprovements };

  // 6. PERSONNEL
  const spAtStart = prevSalespeople;
  const spRecruited = decisions.personnel?.salespeople?.recruit || 0;
  const spDismissed = Math.min(decisions.personnel?.salespeople?.dismiss || 0, spAtStart);
  const spTrainees = decisions.personnel?.salespeople?.train || 0;
  const spLeavers = Math.round(spAtStart * T.PERSONNEL_COSTS.salespeople.leaverRate);
  const spAvailableNext = spAtStart + spRecruited + spTrainees - spDismissed - spLeavers;

  const awAtStart = prevAssemblyWorkers;
  const awRecruited = decisions.personnel?.assemblyWorkers?.recruit || 0;
  const awDismissed = Math.min(decisions.personnel?.assemblyWorkers?.dismiss || 0, awAtStart);
  const awTrainees = decisions.personnel?.assemblyWorkers?.train || 0;
  const awLeavers = Math.round(awAtStart * T.PERSONNEL_COSTS.assemblyWorkers.leaverRate);
  const awAvailableNext = awAtStart + awRecruited + awTrainees - awDismissed - awLeavers;

  const machinistsNeeded = machinesInUse * T.GENERAL.MACHINISTS_PER_MACHINE_PER_SHIFT * shiftLevel;
  const mcAtStart = prevMachinists;
  let mcRecruited = Math.max(0, machinistsNeeded - mcAtStart);
  const surplusMachinists = Math.max(0, mcAtStart - machinistsNeeded);
  const mcDismissed = Math.floor(surplusMachinists / 2);
  const mcLeavers = Math.round(mcAtStart * T.PERSONNEL_COSTS.machinists.leaverRate);
  const mcAvailableNext = mcAtStart + mcRecruited - mcDismissed - mcLeavers;

  results.personnel = {
    salespeople: { atStart: spAtStart, recruited: spRecruited, trainees: spTrainees, dismissed: spDismissed, leavers: spLeavers, availableNext: Math.max(0, spAvailableNext) },
    assemblyWorkers: { atStart: awAtStart, recruited: awRecruited, trainees: awTrainees, dismissed: awDismissed, leavers: awLeavers, availableNext: Math.max(0, awAvailableNext) },
    machinists: { atStart: mcAtStart, recruited: mcRecruited, dismissed: mcDismissed, leavers: mcLeavers, availableNext: Math.max(0, mcAvailableNext) },
  };

  // 7. ACCOUNTS - REVENUE
  let salesRevenue = 0;
  for (let p = 0; p < numProducts; p++) {
    for (const area of areas) {
      const price = area === 'export'
        ? (decisions.prices?.export?.[p] || T.PRODUCT_SPECS[p]?.basePrice || 170)
        : (decisions.prices?.home?.[p] || T.PRODUCT_SPECS[p]?.basePrice || 150);
      salesRevenue += (sales[area][p] || 0) * price;
    }
    salesRevenue += (rejected[p] || 0) * (T.PRODUCT_SPECS[p]?.scrapValue || 15);
  }

  // 8. COST OF SALES
  const openingStockValue = prev.profitAndLoss?.closingStockValue || 0;
  const materialPrice = prev.economic?.materialPrice || 50231;
  const materialsPurchased = Math.round(materialDelivered * materialPrice / 1000);
  const basicRate = decisions.assemblyWageRate || 6.95;
  const assemblyWages = Math.round(assemblyHoursWorked * basicRate);
  const machinistsWorking = Math.max(mcAtStart, machinistsNeeded);
  // Each machinist's hours = total available machine-hours ÷ (machines × machinists-per-machine)
  // This prevents the bug of multiplying by MACHINISTS_PER_MACHINE_PER_SHIFT which gave ~2700 hrs/machinist
  const machinistHoursEach = Math.max(T.GENERAL.MIN_MACHINIST_HOURS,
    machinesInUse > 0
      ? machineHoursAvailable / (machinesInUse * T.GENERAL.MACHINISTS_PER_MACHINE_PER_SHIFT)
      : T.GENERAL.MIN_MACHINIST_HOURS);
  const machinistsWages = Math.round(machinistsWorking * machinistHoursEach * T.PERSONNEL_COSTS.machinists.baseCostPerHour * T.SHIFT_PREMIUMS[shiftLevel]);
  const machineRunningCosts = Math.round(
    machinesInUse * T.MACHINE_RUNNING.overheadPerMachine +
    shiftLevel * T.MACHINE_RUNNING.supervisionPerShift +
    machineHoursUsed * T.MACHINE_RUNNING.hourlyRate +
    scheduled.reduce((s, v) => s + v, 0) * T.MACHINE_RUNNING.planningChargePerUnit
  );

  const materialStockValue = Math.round(materialClosing * materialPrice / 1000 * 0.5);
  let productStockValue = 0;
  for (let p = 0; p < numProducts; p++) {
    let totalStock = 0;
    for (const area of areas) { totalStock += stocks[area][p] || 0; }
    productStockValue += totalStock * (T.PRODUCT_VALUATIONS[p] || 35);
  }
  const closingStockValue = materialStockValue + productStockValue;
  const costOfSales = openingStockValue + materialsPurchased + assemblyWages + machinistsWages + machineRunningCosts - closingStockValue;
  const grossProfit = salesRevenue - costOfSales;

  // 9. OVERHEAD COSTS
  let advertisingTotal = 0;
  for (let p = 0; p < numProducts; p++) {
    advertisingTotal += ((decisions.advertising?.tradePress?.[p] || 0) + (decisions.advertising?.pressTV?.[p] || 0) + (decisions.advertising?.merchandising?.[p] || 0)) * 1000;
  }
  const totalSalespeople = (decisions.salespeople?.export || 0) + (decisions.salespeople?.south || 0) + (decisions.salespeople?.west || 0) + (decisions.salespeople?.north || 0);
  const quarterlySalary = (decisions.salespeopleRemuneration?.quarterlySalary || 0) * 100;
  const commissionRate = (decisions.salespeopleRemuneration?.salesCommission || 0) / 100;
  const salesForceSalary = Math.round(totalSalespeople * quarterlySalary + salesRevenue * commissionRate + totalSalespeople * T.PERSONNEL_COSTS.salespeople.expenses);

  let totalOrderValue = 0;
  for (let p = 0; p < numProducts; p++) {
    for (const area of areas) {
      const price = area === 'export' ? (decisions.prices?.export?.[p] || 170) : (decisions.prices?.home?.[p] || 150);
      totalOrderValue += (orders[area][p] || 0) * price;
    }
  }
  const salesOffice = Math.round(totalOrderValue * T.FINANCE.salesOfficeRate);

  let guaranteeServicing = 0;
  for (let p = 0; p < numProducts; p++) { guaranteeServicing += serviced[p] * (T.PRODUCT_SPECS[p]?.guaranteeCost || 30); }

  let totalDeliveries = 0;
  for (let p = 0; p < numProducts; p++) { for (const area of areas) { totalDeliveries += delivered[area][p] || 0; } }
  const vehicleDaysNeeded = Math.ceil(totalDeliveries / T.TRANSPORT.vehicleCapacity);
  const ownVehicleDays = Math.min(vehicleDaysNeeded, vehiclesAvailable * T.TRANSPORT.deliveryDaysPerQuarter);
  const hiredVehicleDays = Math.max(0, vehicleDaysNeeded - ownVehicleDays);
  const transportFleet = Math.round(vehiclesAvailable * T.TRANSPORT.vehicleFixedCost + ownVehicleDays * T.TRANSPORT.vehicleRunningCostPerDay);
  const hiredTransport = Math.round(hiredVehicleDays * T.TRANSPORT.hiredTransportPerDay);

  let productResearch = 0;
  for (let p = 0; p < numProducts; p++) { productResearch += (decisions.researchExpenditure?.[p] || 0) * 1000; }

  const personnelDept = Math.round(
    spRecruited * T.PERSONNEL_COSTS.salespeople.recruitCost + spDismissed * T.PERSONNEL_COSTS.salespeople.dismissCost +
    spTrainees * T.PERSONNEL_COSTS.salespeople.trainCost + awRecruited * T.PERSONNEL_COSTS.assemblyWorkers.recruitCost +
    awDismissed * T.PERSONNEL_COSTS.assemblyWorkers.dismissCost + awTrainees * T.PERSONNEL_COSTS.assemblyWorkers.trainCost
  );

  const maintenanceCost = Math.round(totalMaintenanceHours * T.MAINTENANCE.normalCostPerHour + breakdownTime * T.MAINTENANCE.overtimeCostPerHour);

  let avgProductsInAreas = 0;
  for (let p = 0; p < numProducts; p++) {
    for (const area of areas) { avgProductsInAreas += ((prev.productStats?.stocks?.[area]?.[p] || 0) + (stocks[area][p] || 0)) / 2; }
  }
  const numMaterialOrders = decisions.materials?.numDeliveries || 1;
  const materialOverCapacity = Math.max(0, materialClosing - T.WAREHOUSING.materialStorage.capacity);
  const warehousing = Math.round(T.WAREHOUSING.factoryStorageCost + T.WAREHOUSING.purchasingAdmin * numMaterialOrders + avgProductsInAreas * T.WAREHOUSING.productWarehouseCostPerUnit + materialOverCapacity * T.WAREHOUSING.materialStorage.excessCostPerUnit);

  let businessIntelligence = 0;
  if (decisions.infoOnCompanies) businessIntelligence += T.BUSINESS_INTELLIGENCE.companyInfo;
  if (decisions.infoOnMarketShares) businessIntelligence += T.BUSINESS_INTELLIGENCE.marketShares;

  const managementBudget = (decisions.managementBudget || 0) * 1000;
  const prevDebtors = prev.balanceSheet?.assets?.debtors || 604478;
  const creditControl = Math.round(T.FINANCE.creditControlBase + prevDebtors * T.FINANCE.creditControlRate);

  const subtotalOverheads = advertisingTotal + salesForceSalary + salesOffice + guaranteeServicing + transportFleet + hiredTransport + productResearch + personnelDept + maintenanceCost + warehousing + businessIntelligence + managementBudget + creditControl;
  const otherMiscCosts = Math.round(T.FINANCE.miscCostsFixed + subtotalOverheads * T.FINANCE.miscCostsRate);
  const totalOverheads = subtotalOverheads + otherMiscCosts;

  results.overheads = {
    advertising: advertisingTotal, salesForceSalary, salesOffice, guaranteeServicing,
    transportFleet, hiredTransport, productResearch, personnelDept,
    maintenance: maintenanceCost, warehousing, businessIntelligence,
    managementBudget, creditControl, otherMiscCosts, totalOverheads,
  };

  // 10. PROFIT & LOSS
  const prevMachineValue = prev.balanceSheet?.assets?.machines || 1594818;
  const prevVehicleValue = prev.balanceSheet?.assets?.vehicles || 175758;
  const machineSaleValue = machinesToSell > 0 ? Math.round(prevMachineValue / machinesAvailableLastQ * machinesToSell * T.DEPRECIATION.machineSaleValue) : 0;
  const vehicleSaleValue = (decisions.vansToSell || 0) > 0 ? Math.round(prevVehicleValue / prevVehicles * (decisions.vansToSell || 0)) : 0;
  const depreciation = Math.round(prevMachineValue * T.DEPRECIATION.machineRate + prevVehicleValue * T.DEPRECIATION.vehicleRate + machinesInstalled * T.DEPRECIATION.machineInstallPayment2 * T.DEPRECIATION.machineRate - machineSaleValue * T.DEPRECIATION.machineRate);

  const prevOverdraft = prev.balanceSheet?.liabilities?.overdraft || 0;
  const prevCash = prev.balanceSheet?.assets?.cashInvested || 0;
  const prevLoans = prev.balanceSheet?.liabilities?.unsecuredLoans || 0;
  const interestReceived = prevCash > 0 ? Math.round(prevCash * T.FINANCE.depositRate) : 0;
  const interestPaid = Math.round(prevOverdraft * T.FINANCE.overdraftInterestRate + prevLoans * T.FINANCE.unsecuredLoanRate);

  const prevTaxPL = prev.taxableProfitLoss || 0;
  const currentTaxPL = prevTaxPL + grossProfit + interestReceived - interestPaid - totalOverheads - depreciation;
  let taxAssessed = 0;
  if (quarter === 4 && currentTaxPL > 0) { taxAssessed = Math.round(currentTaxPL * T.FINANCE.taxRate); }
  results.taxableProfitLoss = quarter === 4 ? 0 : currentTaxPL;

  const dividendRate = (decisions.dividendRate || 0) / 100;
  const dividendPaid = Math.round(T.GENERAL.SHARES_ISSUED * dividendRate);
  const netProfit = grossProfit + interestReceived - interestPaid - totalOverheads - depreciation - taxAssessed;
  const transferredToReserves = netProfit - dividendPaid;

  results.profitAndLoss = {
    salesRevenue, openingStockValue, materialsPurchased, assemblyWages, machinistsWages,
    machineRunningCosts, closingStockValue, costOfSales, grossProfit, interestReceived,
    interestPaid, overheads: totalOverheads, depreciation, taxAssessed, netProfit,
    dividendPaid, transferredToReserves,
  };

  // 11. BALANCE SHEET
  const propertyValue = T.GENERAL.PROPERTY_VALUE;
  const newMachineValue = machinesInstalled * T.DEPRECIATION.machinePurchasePrice;
  const machineValue = Math.round(prevMachineValue * (1 - T.DEPRECIATION.machineRate) + newMachineValue - machineSaleValue);
  const newVehicleValue = (decisions.vansToBuy || 0) * T.TRANSPORT.vehiclePurchasePrice;
  const vehicleValue = Math.round((prevVehicleValue + newVehicleValue - vehicleSaleValue) * (1 - T.DEPRECIATION.vehicleRate));

  const tradingReceipts = Math.round((prevDebtors + salesRevenue) * T.PAYMENT_TERMS.receiptRate);
  const debtors = Math.round(prevDebtors + salesRevenue - tradingReceipts);
  const prevCreditors = prev.balanceSheet?.liabilities?.creditors || 561432;
  const immediatePayments = assemblyWages + machinistsWages;
  const creditItems = materialsPurchased * (1 - T.PAYMENT_TERMS.materials) + totalOverheads * (1 - T.PAYMENT_TERMS.overheads) + machineRunningCosts * 0.3;
  const creditors = Math.round(creditItems);
  const tradingPayments = Math.round(prevCreditors + immediatePayments + materialsPurchased * T.PAYMENT_TERMS.materials + totalOverheads * T.PAYMENT_TERMS.overheads + machineRunningCosts * 0.7);

  const taxPaid = quarter === 2 ? (prev.balanceSheet?.liabilities?.taxAssessedDue || 0) : 0;
  const capitalPayments = Math.round((decisions.newMachinesToOrder || 0) * T.DEPRECIATION.machineInstallPayment1 + machinesInstalled * T.DEPRECIATION.machineInstallPayment2 + (decisions.vansToBuy || 0) * T.TRANSPORT.vehiclePurchasePrice);
  const capitalReceipts = machineSaleValue + vehicleSaleValue;

  const operatingCashFlow = tradingReceipts - tradingPayments - taxPaid;
  const investingCashFlow = interestReceived + capitalReceipts - capitalPayments;
  const financingCashFlow = -(interestPaid + dividendPaid);
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  const prevNetBank = prevCash - prevOverdraft - prevLoans;
  const newNetBank = prevNetBank + netCashFlow;

  let cashInvested = 0;
  let overdraft = 0;
  let unsecuredLoans = 0;
  if (newNetBank >= 0) {
    cashInvested = newNetBank;
  } else {
    const totalAssets = propertyValue + machineValue + vehicleValue + productStockValue + materialStockValue + debtors;
    const overdraftLimit = Math.max(T.OVERDRAFT.minLimit, Math.round(totalAssets * T.OVERDRAFT.assetFraction));
    if (Math.abs(newNetBank) <= overdraftLimit) { overdraft = Math.abs(newNetBank); }
    else { overdraft = overdraftLimit; unsecuredLoans = Math.abs(newNetBank) - overdraftLimit; }
  }

  let taxDue = 0;
  if (quarter === 4) taxDue = taxAssessed;
  else if (quarter === 1) taxDue = prev.balanceSheet?.liabilities?.taxAssessedDue || 0;

  const totalAssetsValue = propertyValue + machineValue + vehicleValue + productStockValue + materialStockValue + debtors + cashInvested;
  const totalLiabilities = taxDue + creditors + overdraft + unsecuredLoans;
  const netAssets = totalAssetsValue - totalLiabilities;
  const prevReserves = prev.balanceSheet?.reserves || 65116;
  const reserves = prevReserves + transferredToReserves;
  const ordinaryCapital = T.GENERAL.SHARES_ISSUED;
  const totalFunding = ordinaryCapital + reserves;

  results.balanceSheet = {
    assets: { property: propertyValue, machines: machineValue, vehicles: vehicleValue, productStocks: productStockValue, materialStock: materialStockValue, debtors, cashInvested },
    liabilities: { taxAssessedDue: taxDue, creditors, overdraft, unsecuredLoans },
    netAssets, ordinaryCapital, reserves, totalFunding,
  };

  const overdraftLimitNext = Math.max(T.OVERDRAFT.minLimit, Math.round(totalAssetsValue * T.OVERDRAFT.assetFraction));
  results.cashFlow = {
    tradingReceipts, tradingPayments, taxPaid, operatingCashFlow,
    interestReceived, capitalReceipts, capitalPayments, investingCashFlow,
    interestPaid, dividendPaid, financingCashFlow, netCashFlow, overdraftLimitNext,
  };

  // 12. SHARE PRICE & BUSINESS INTELLIGENCE
  const eps = netProfit / T.GENERAL.SHARES_ISSUED;
  const prevSharePrice = prev.sharePrice || 116;
  const dividendYield = dividendPaid / T.GENERAL.SHARES_ISSUED;
  let sharePrice = prevSharePrice;
  if (netProfit > 0) sharePrice += (eps * 10);
  else sharePrice += (eps * 15);
  sharePrice += (dividendYield * 5);
  sharePrice = Math.max(10, Math.round(sharePrice * 10) / 10);
  results.sharePrice = sharePrice;
  results.dividendPercent = dividendRate * 100;

  const prevGDP = prev.economic?.gdp || 734;
  results.economic = {
    gdp: Math.round(prevGDP * (0.98 + Math.random() * 0.04)),
    unemploymentRate: Math.max(2, Math.min(12, (prev.economic?.unemploymentRate || 5) + (Math.random() - 0.5) * 0.5)),
    centralBankRate: Math.max(1, Math.min(10, (prev.economic?.centralBankRate || 5) + (Math.random() - 0.5) * 0.5)),
    materialPrice: Math.round((prev.economic?.materialPrice || 50231) * (0.98 + Math.random() * 0.04)),
  };

  return results;
}

export function getDefaultPreviousResults(numProducts = 3) {
  const zeros = new Array(numProducts).fill(0);
  return {
    machines: { availableNextQuarter: 10, decommissioned: 0, inUse: 10, installed: 0 },
    vehicles: { availableLastQuarter: 17 },
    assemblyHours: { available: 21168, absenteeism: 54, worked: 18340, strikeWeeksNext: 0 },
    machineHours: { available: 10920, breakdownTime: 37, used: 8671, maintenanceHours: 500, efficiency: 95.4 },
    materials: { openingStock: 3051, delivered: 10000, used: 10771, closingStock: 2280, onOrder: 12000, availableNext: 14280 },
    personnel: {
      salespeople: { atStart: 18, recruited: 0, trainees: 1, dismissed: 0, leavers: 1, availableNext: 18 },
      assemblyWorkers: { atStart: 36, recruited: 0, trainees: 1, dismissed: 0, leavers: 1, availableNext: 36 },
      machinists: { atStart: 76, recruited: 4, dismissed: 0, leavers: 3, availableNext: 77 },
    },
    productStats: {
      scheduled: [3700, 2025, 900].slice(0, numProducts), produced: [3809, 2089, 928].slice(0, numProducts),
      rejected: [109, 64, 28].slice(0, numProducts), serviced: [62, 38, 14].slice(0, numProducts),
      delivered: { export: [2800, 1400, 600].slice(0, numProducts), south: [200, 200, 100].slice(0, numProducts), west: [100, 75, 75].slice(0, numProducts), north: [600, 350, 125].slice(0, numProducts) },
      orders: { export: [2827, 1482, 589].slice(0, numProducts), south: [244, 179, 96].slice(0, numProducts), west: [102, 88, 68].slice(0, numProducts), north: [574, 328, 134].slice(0, numProducts) },
      sales: { export: [2800, 1482, 589].slice(0, numProducts), south: [244, 179, 96].slice(0, numProducts), west: [102, 88, 68].slice(0, numProducts), north: [574, 328, 125].slice(0, numProducts) },
      backlog: { export: [34, 0, 0].slice(0, numProducts), south: zeros, west: zeros, north: [0, 0, 4].slice(0, numProducts) },
      stocks: { export: zeros, south: [56, 36, 4].slice(0, numProducts), west: [75, 16, 7].slice(0, numProducts), north: [82, 35, 0].slice(0, numProducts) },
      productImprovements: ['NONE', 'MAJOR', 'NONE'].slice(0, numProducts),
    },
    overheads: { advertising: 110000, salesForceSalary: 178224, salesOffice: 17112, guaranteeServicing: 11080, transportFleet: 167386, hiredTransport: 0, productResearch: 45000, personnelDept: 13500, maintenance: 30000, warehousing: 11425, businessIntelligence: 5000, managementBudget: 120000, creditControl: 10012, otherMiscCosts: 11821, totalOverheads: 730560 },
    taxableProfitLoss: -5914,
    profitAndLoss: { salesRevenue: 1728020, openingStockValue: 126459, materialsPurchased: 401677, assemblyWages: 139333, machinistsWages: 213535, machineRunningCosts: 107322, closingStockValue: 87151, costOfSales: 901175, grossProfit: 826845, interestReceived: 0, interestPaid: 1615, overheads: 730560, depreciation: 50044, taxAssessed: 0, netProfit: 44626, dividendPaid: 80000, transferredToReserves: -35374 },
    balanceSheet: {
      assets: { property: 300000, machines: 1594818, vehicles: 175758, productStocks: 33440, materialStock: 53711, debtors: 604478, cashInvested: 0 },
      liabilities: { taxAssessedDue: 0, creditors: 561432, overdraft: 135657, unsecuredLoans: 0 },
      netAssets: 2065116, ordinaryCapital: 2000000, reserves: 65116, totalFunding: 2065116,
    },
    cashFlow: { tradingReceipts: 1713264, tradingPayments: 1657686, taxPaid: 0, operatingCashFlow: 55578, interestReceived: 0, capitalReceipts: 0, capitalPayments: 100000, investingCashFlow: -100000, interestPaid: 1615, dividendPaid: 80000, financingCashFlow: -81615, netCashFlow: -126037, overdraftLimitNext: 761000 },
    sharePrice: 116.0, dividendPercent: 4,
    economic: { gdp: 734, unemploymentRate: 5, centralBankRate: 5, materialPrice: 50231 },
  };
}

export function getDefaultDecisions(numProducts = 3) {
  return {
    majorProductImprovement: new Array(numProducts).fill(false),
    prices: { export: [170, 290, 580, 200, 320, 450, 650, 750].slice(0, numProducts), home: [150, 270, 550, 180, 300, 420, 620, 720].slice(0, numProducts) },
    advertising: { tradePress: [10, 10, 18].concat(new Array(5).fill(10)).slice(0, numProducts), pressTV: [12, 14, 20].concat(new Array(5).fill(12)).slice(0, numProducts), merchandising: [8, 8, 10].concat(new Array(5).fill(8)).slice(0, numProducts) },
    assemblyTime: [118, 165, 330, 130, 180, 250, 360, 400].slice(0, numProducts),
    salespeople: { export: 13, south: 1, west: 1, north: 3 },
    salespeopleRemuneration: { quarterlySalary: 50, salesCommission: 2 },
    assemblyWageRate: 6.95, shiftLevel: 2, maintenanceHours: 50,
    deliverySchedule: { export: [2800, 1400, 600].concat(new Array(5).fill(0)).slice(0, numProducts), south: [200, 200, 100].concat(new Array(5).fill(0)).slice(0, numProducts), west: [100, 75, 75].concat(new Array(5).fill(0)).slice(0, numProducts), north: [600, 350, 125].concat(new Array(5).fill(0)).slice(0, numProducts) },
    managementBudget: 120, dividendRate: 4, daysCreditAllowed: 30,
    machinesToSell: 0, newMachinesToOrder: 1, vansToBuy: 0, vansToSell: 0,
    infoOnCompanies: true, infoOnMarketShares: false,
    researchExpenditure: [15, 15, 15].concat(new Array(5).fill(10)).slice(0, numProducts),
    personnel: { salespeople: { recruit: 0, dismiss: 0, train: 1 }, assemblyWorkers: { recruit: 0, dismiss: 0, train: 1 } },
    materials: { unitsToOrder: 12000, supplierNo: 2, numDeliveries: 6 },
  };
}
