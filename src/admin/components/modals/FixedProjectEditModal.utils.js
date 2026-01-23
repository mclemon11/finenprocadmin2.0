export const toISODateInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    // Accept already-correct YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const maybeDate = new Date(value);
    if (!Number.isNaN(maybeDate.getTime())) return maybeDate.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return '';
};

export const makeClientId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const formatBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  const mb = n / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  const kb = n / 1024;
  return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
};

// Initial form state
export const getInitialForm = (project) => ({
  // General
  name: project?.name || '',
  category: project?.category || '',
  status: project?.status || 'draft',
  visibleToUsers: project?.visibleToUsers ?? true,

  // Location
  location: {
    country: project?.location?.country || '',
    region: project?.location?.region || '',
    city: project?.location?.city || '',
    assetType: project?.location?.assetType || '',
    operator: project?.location?.operator || '',
  },

  // Finance
  finance: {
    targetAmount: project?.finance?.targetAmount || project?.targetAmount || '',
    minViableCapital: project?.finance?.minViableCapital || '',
    initialCapex: project?.finance?.initialCapex || '',
    monthlyOperatingCost: project?.finance?.monthlyOperatingCost || '',
  },

  // Metrics
  metrics: {
    expectedROI: project?.metrics?.expectedROI || project?.expectedROI || '',
    totalROI: project?.metrics?.totalROI || '',
    duration: project?.metrics?.duration || project?.duration || '',
    paymentFrequency: project?.metrics?.paymentFrequency || 'monthly',
    estimatedIRR: project?.metrics?.estimatedIRR || '',
    paybackPeriod: project?.metrics?.paybackPeriod || '',
  },

  // Risks
  risks: {
    riskLevel: project?.risks?.riskLevel || project?.riskLevel || 'medium',
    countryRisk: project?.risks?.countryRisk ?? false,
    regulatoryRisk: project?.risks?.regulatoryRisk ?? false,
    hasGuarantee: project?.risks?.hasGuarantee ?? false,
    guaranteeType: project?.risks?.guaranteeType || '',
    guaranteeValue: project?.risks?.guaranteeValue || '',
  },

  // Restrictions
  restrictions: {
    minInvestment: project?.restrictions?.minInvestment || project?.minInvestment || '',
    maxInvestment: project?.restrictions?.maxInvestment || '',
    maxPercentPerInvestor: project?.restrictions?.maxPercentPerInvestor || '',
    maxInvestors: project?.restrictions?.maxInvestors || '',
    kycRequired: project?.restrictions?.kycRequired ?? true,
  },

  // Projections (internal)
  projections: {
    monthlyRevenue: project?.projections?.monthlyRevenue || '',
    monthlyCosts: project?.projections?.monthlyCosts || '',
    operatingMargin: project?.projections?.operatingMargin || '',
    contingencyFund: project?.projections?.contingencyFund || '',
    scenario: project?.projections?.scenario || 'base',
  },

  // Charts data (for users)
  charts: {
    // Chart 1 - Progress
    capitalObjetivo: project?.charts?.capitalObjetivo || project?.targetAmount || '',
    capitalRecaudado: project?.charts?.capitalRecaudado || project?.totalInvested || '',
    porcentajeCompletado: project?.charts?.porcentajeCompletado || project?.progress || '',

    // Chart 2 - ROI
    roiAnual: project?.charts?.roiAnual || '',
    roiAcumulado: project?.charts?.roiAcumulado || '',
    duracionMeses: project?.charts?.duracionMeses || '',

    // Chart 3 - Capital Distribution
    capitalDistribution: project?.charts?.capitalDistribution || {
      operacion: 25,
      infraestructura: 35,
      reserva: 15,
      beneficio: 25,
    },

    // Chart 4 - Payment Calendar
    paymentCalendar: project?.charts?.paymentCalendar || [],

    // Chart 5 - Risk vs Return
    riskLevel: project?.charts?.riskLevel || 3,
    returnExpected: project?.charts?.returnExpected || '',
  },
});
