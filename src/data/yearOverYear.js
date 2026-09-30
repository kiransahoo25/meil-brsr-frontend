export const YOY_YEARS = ['FY23', 'FY24', 'FY25', 'FY26']

export const YOY_METRICS = {
  scope1: {
    label: 'Scope 1 Emissions',
    unit: 'tCO2e',
    color: '#10B981',
    data: [742000, 708000, 668000, 642000],
    delta: -3.9,
    trend: 'down',
  },
  scope2: {
    label: 'Scope 2 Emissions',
    unit: 'tCO2e',
    color: '#0EA5E9',
    data: [198000, 188000, 178000, 168000],
    delta: -5.6,
    trend: 'down',
  },
  water: {
    label: 'Water Withdrawal',
    unit: 'ML',
    color: '#8B5CF6',
    data: [68.4, 65.2, 62.1, 58.4],
    delta: -6.0,
    trend: 'down',
  },
  energy: {
    label: 'Energy Consumption',
    unit: 'GJ (000)',
    color: '#F59E0B',
    data: [10420, 9860, 9240, 8640],
    delta: -6.5,
    trend: 'down',
  },
  waste: {
    label: 'Waste Recycled',
    unit: '%',
    color: '#22C55E',
    data: [58.2, 61.8, 65.1, 68.4],
    delta: 5.1,
    trend: 'up',
  },
  ltifr: {
    label: 'LTIFR',
    unit: 'per 1M hrs',
    color: '#EF4444',
    data: [0.62, 0.54, 0.46, 0.38],
    delta: -17.4,
    trend: 'down',
  },
}

export const YOY_REVENUE = {
  label: 'Revenue',
  unit: 'Rs Cr',
  data: [28400, 31200, 34800, 38600],
}
