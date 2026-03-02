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

// Helper: safely read duration which may be a number (old) or object (new)
const readDuration = (project) => {
  if (typeof project?.duration === 'object' && project?.duration !== null) return project.duration;
  return null;
};
const readDurationNum = (project) => {
  if (typeof project?.duration === 'number') return project.duration;
  return null;
};

// Initial form state — mirrors NEW_PROYECT_FORMAT.md
export const getInitialForm = (project) => {
  const durObj = readDuration(project);
  const durNum = readDurationNum(project);

  return {
    // ─── General ──────────────────────────────────
    general: {
      name: project?.general?.name || project?.name || '',
      description: project?.general?.description || project?.description || '',
      body: project?.general?.body || project?.body || '',
      category: project?.general?.category || project?.category || '',
      type: project?.general?.type || project?.type || 'fixed',
      status: project?.general?.status || project?.status || 'draft',
      visibleToUsers: project?.general?.visibleToUsers ?? project?.visibleToUsers ?? true,
      investable: project?.general?.investable ?? project?.investable ?? false,
    },

    // ─── Location ─────────────────────────────────
    location: {
      country: project?.location?.country || '',
      region: project?.location?.region || '',
      city: project?.location?.city || '',
      assetType: project?.location?.assetType || '',
      operator: project?.location?.operator || '',
    },

    // ─── Financials ───────────────────────────────
    financials: {
      targetAmount: project?.financials?.targetAmount || project?.finance?.targetAmount || project?.targetAmount || '',
      capitalRecaudado: project?.financials?.capitalRecaudado || project?.charts?.capitalRecaudado || project?.totalInvested || '',
      capitalObjetivo: project?.financials?.capitalObjetivo || project?.charts?.capitalObjetivo || project?.targetAmount || '',
      minInvestment: project?.financials?.minInvestment || project?.restrictions?.minInvestment || project?.minInvestment || '',
      maxInvestment: project?.financials?.maxInvestment || project?.restrictions?.maxInvestment || project?.maxInvestment || '',
      totalInvested: project?.financials?.totalInvested || project?.totalInvested || 0,
      totalInvestment: project?.financials?.totalInvestment || project?.totalInvestment || 0,
    },

    // ─── Returns ──────────────────────────────────
    returns: {
      expectedROI: project?.returns?.expectedROI || project?.metrics?.expectedROI || project?.expectedROI || '',
      roiAnual: project?.returns?.roiAnual || project?.charts?.roiAnual || '',
      roiAcumulado: project?.returns?.roiAcumulado || project?.charts?.roiAcumulado || '',
      totalROI: project?.returns?.totalROI || project?.metrics?.totalROI || '',
      estimatedIRR: project?.returns?.estimatedIRR || project?.metrics?.estimatedIRR || '',
      paybackPeriod: project?.returns?.paybackPeriod || project?.metrics?.paybackPeriod || '',
      paymentFrequency: project?.returns?.paymentFrequency || project?.metrics?.paymentFrequency || 'monthly',
      returnExpected: project?.returns?.returnExpected || project?.charts?.returnExpected || '',
    },

    // ─── Risk ─────────────────────────────────────
    risk: {
      riskScore: project?.risk?.riskScore || project?.charts?.riskLevel || 3,
      riskLevel: project?.risk?.riskLevel || project?.risks?.riskLevel || project?.riskLevel || 'medium',
      countryRisk: project?.risk?.countryRisk ?? project?.risks?.countryRisk ?? false,
      regulatoryRisk: project?.risk?.regulatoryRisk ?? project?.risks?.regulatoryRisk ?? false,
      hasGuarantee: project?.risk?.hasGuarantee ?? project?.risks?.hasGuarantee ?? false,
      guaranteeType: project?.risk?.guaranteeType || project?.risks?.guaranteeType || '',
      guaranteeValue: project?.risk?.guaranteeValue || project?.risks?.guaranteeValue || '',
    },

    // ─── Capital Distribution ─────────────────────
    capitalDistribution: project?.capitalDistribution || project?.charts?.capitalDistribution || {
      infraestructura: 35,
      operacion: 25,
      beneficio: 25,
      reserva: 15,
    },

    // ─── Cost Structure ───────────────────────────
    costStructure: {
      initialCapex: project?.costStructure?.initialCapex || project?.finance?.initialCapex || '',
      minViableCapital: project?.costStructure?.minViableCapital || project?.finance?.minViableCapital || '',
      monthlyOperatingCost: project?.costStructure?.monthlyOperatingCost || project?.finance?.monthlyOperatingCost || '',
    },

    // ─── Projections ──────────────────────────────
    projections: {
      scenario: project?.projections?.scenario || 'base',
      monthlyRevenue: project?.projections?.monthlyRevenue || '',
      monthlyCosts: project?.projections?.monthlyCosts || '',
      operatingMargin: project?.projections?.operatingMargin || '',
      contingencyFund: project?.projections?.contingencyFund || '',
    },

    // ─── Duration ─────────────────────────────────
    duration: {
      months: durObj?.months || project?.metrics?.duration || durNum || '',
      durationMeses: durObj?.durationMeses || project?.charts?.duracionMeses || '',
    },

    // ─── Controls ─────────────────────────────────
    controls: {
      manualControl: project?.controls?.manualControl ?? project?.manualControl ?? true,
      autoLockOnTarget: project?.controls?.autoLockOnTarget ?? project?.autoLockOnTarget ?? true,
      kycRequired: project?.controls?.kycRequired ?? project?.restrictions?.kycRequired ?? true,
    },

    // ─── Restrictions ─────────────────────────────
    restrictions: {
      minInvestment: project?.restrictions?.minInvestment || project?.minInvestment || '',
      maxInvestment: project?.restrictions?.maxInvestment || project?.maxInvestment || '',
      maxInvestors: project?.restrictions?.maxInvestors || '',
      maxPercentPerInvestor: project?.restrictions?.maxPercentPerInvestor || '',
    },

    // ─── Payment Calendar ─────────────────────────
    paymentCalendar: project?.paymentCalendar || project?.charts?.paymentCalendar || [],
  };
};
