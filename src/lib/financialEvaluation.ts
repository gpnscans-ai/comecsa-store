export type ProjectionYear = {
  revenue: number; // Ingresos
  variable_costs: number; // Costos variables
  fixed_costs: number; // Costos fijos operativos
  depreciation: number; // Depreciación
  amortization: number; // Amortización de gastos de constitución
  loan_interest: number; // Intereses del préstamo (afecta la utilidad)
  loan_payment: number; // Abono a capital del préstamo (NO afecta la utilidad, solo el flujo de caja)
  salvage_value: number; // Valor de salvamento (normalmente solo Año 5)
};

export type IncomeStatementYear = {
  revenue: number;
  variableCosts: number;
  contributionMargin: number;
  fixedCosts: number;
  depreciation: number;
  amortization: number;
  operatingIncome: number;
  loanInterest: number;
  incomeBeforeProfitSharing: number;
  profitSharing: number;
  incomeBeforeTax: number;
  incomeTax: number;
  netIncome: number;
};

export function computeIncomeStatement(
  year: ProjectionYear,
  profitSharingPct: number,
  incomeTaxPct: number
): IncomeStatementYear {
  const contributionMargin = year.revenue - year.variable_costs;
  const operatingIncome = contributionMargin - year.fixed_costs - year.depreciation - year.amortization;
  const incomeBeforeProfitSharing = operatingIncome - year.loan_interest;
  const profitSharing = incomeBeforeProfitSharing > 0 ? (incomeBeforeProfitSharing * profitSharingPct) / 100 : 0;
  const incomeBeforeTax = incomeBeforeProfitSharing - profitSharing;
  const incomeTax = incomeBeforeTax > 0 ? (incomeBeforeTax * incomeTaxPct) / 100 : 0;
  const netIncome = incomeBeforeTax - incomeTax;

  return {
    revenue: year.revenue,
    variableCosts: year.variable_costs,
    contributionMargin,
    fixedCosts: year.fixed_costs,
    depreciation: year.depreciation,
    amortization: year.amortization,
    operatingIncome,
    loanInterest: year.loan_interest,
    incomeBeforeProfitSharing,
    profitSharing,
    incomeBeforeTax,
    incomeTax,
    netIncome,
  };
}

export type CashFlowResult = {
  netCashFlow: number[]; // por año (1..n)
  accumulatedFlow: number[]; // por año (1..n)
};

export function computeCashFlow(
  initialInvestment: number,
  years: ProjectionYear[],
  incomeStatements: IncomeStatementYear[]
): CashFlowResult {
  const netCashFlow = years.map(
    (y, i) => incomeStatements[i].netIncome + y.depreciation + y.amortization - y.loan_payment + y.salvage_value
  );

  let running = -initialInvestment;
  const accumulatedFlow = netCashFlow.map((flow) => {
    running += flow;
    return running;
  });

  return { netCashFlow, accumulatedFlow };
}

export function computeVAN(initialInvestment: number, netCashFlow: number[], discountRatePct: number): number {
  const r = discountRatePct / 100;
  const pv = netCashFlow.reduce((sum, flow, i) => sum + flow / Math.pow(1 + r, i + 1), 0);
  return Math.round((pv - initialInvestment) * 100) / 100;
}

function vanAtRate(initialInvestment: number, netCashFlow: number[], r: number): number {
  const pv = netCashFlow.reduce((sum, flow, i) => sum + flow / Math.pow(1 + r, i + 1), 0);
  return pv - initialInvestment;
}

// TIR por bisección: busca la tasa donde el VAN cruza cero. Devuelve null si el
// flujo no tiene un cruce claro (ej. nunca se recupera la inversión).
export function computeTIR(initialInvestment: number, netCashFlow: number[]): number | null {
  let low = -0.99;
  let high = 10; // 1000%
  const vanLow = vanAtRate(initialInvestment, netCashFlow, low);
  let vanHigh = vanAtRate(initialInvestment, netCashFlow, high);

  if (vanLow * vanHigh > 0) {
    high = 50;
    vanHigh = vanAtRate(initialInvestment, netCashFlow, high);
    if (vanLow * vanHigh > 0) return null;
  }

  let mid = 0;
  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    const vanMid = vanAtRate(initialInvestment, netCashFlow, mid);
    if (Math.abs(vanMid) < 0.01) break;
    if (vanAtRate(initialInvestment, netCashFlow, low) * vanMid < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return Math.round(mid * 10000) / 100; // porcentaje con 2 decimales
}

// Relación Beneficio/Costo = valor presente de los flujos futuros / inversión inicial.
export function computeRBC(initialInvestment: number, netCashFlow: number[], discountRatePct: number): number | null {
  if (initialInvestment <= 0) return null;
  const r = discountRatePct / 100;
  const pv = netCashFlow.reduce((sum, flow, i) => sum + flow / Math.pow(1 + r, i + 1), 0);
  return Math.round((pv / initialInvestment) * 100) / 100;
}

// Periodo de Recuperación de la Inversión, en años fraccionarios (interpola dentro
// del año en que el flujo acumulado deja de ser negativo). null si nunca se recupera.
export function computePRI(initialInvestment: number, netCashFlow: number[]): number | null {
  let cumulative = -initialInvestment;
  for (let i = 0; i < netCashFlow.length; i++) {
    const prevCumulative = cumulative;
    cumulative += netCashFlow[i];
    if (cumulative >= 0) {
      const fraction = netCashFlow[i] !== 0 ? Math.abs(prevCumulative) / netCashFlow[i] : 0;
      return Math.round((i + fraction) * 100) / 100;
    }
  }
  return null;
}

export function priToYearsMonths(pri: number | null): string {
  if (pri === null) return "No se recupera en el horizonte evaluado";
  const years = Math.floor(pri);
  const months = Math.round((pri - years) * 12);
  const carriedYears = months === 12 ? years + 1 : years;
  const finalMonths = months === 12 ? 0 : months;
  return `${carriedYears} año${carriedYears === 1 ? "" : "s"}, ${finalMonths} mes${finalMonths === 1 ? "" : "es"}`;
}
