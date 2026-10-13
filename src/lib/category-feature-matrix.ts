export interface CategoryMatrixColumn {
  key: string;
  label: string;
}

export interface CategoryMatrixRow {
  platform: string;
  cells: Record<string, string>;
}

export interface CategoryMatrix {
  heading: string;
  caption: string;
  columns: CategoryMatrixColumn[];
  rows: CategoryMatrixRow[];
}

export const PERFORMANCE_FEATURE_MATRIX: CategoryMatrix = {
  heading: 'Performance Management Feature Matrix',
  caption: 'A quick comparison of review cycles and goal tracking across top performance management platforms.',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'specialty', label: 'Core Specialty' },
    { key: 'reviews', label: 'Review Cadence' },
    { key: 'okrs', label: 'OKR Support' },
  ],
  rows: [
    {
      platform: 'PerformYard',
      cells: {
        specialty: 'Configurable reviews and 360s',
        reviews: 'Annual, quarterly, 360, and 1:1s',
        okrs: 'Goals cascade into reviews',
      },
    },
    {
      platform: 'Lattice',
      cells: {
        specialty: 'Reviews, OKRs, and pay calibration',
        reviews: 'Formal cycles plus continuous feedback',
        okrs: 'Dedicated Goals & OKRs module',
      },
    },
    {
      platform: 'Culture Amp',
      cells: {
        specialty: 'Engagement surveys and benchmarks',
        reviews: 'Perform module; surveys are the buy',
        okrs: 'Goals in Perform/Develop bundles',
      },
    },
  ],
};

export const PAYROLL_FEATURE_MATRIX: CategoryMatrix = {
  heading: 'Global Payroll & EOR Feature Matrix',
  caption: 'A quick comparison of core capabilities across top global payroll and EOR platforms.',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'specialty', label: 'Core Specialty' },
    { key: 'entities', label: 'Entity Model' },
    { key: 'contractors', label: 'Contractor Pricing' },
  ],
  rows: [
    {
      platform: 'Deel',
      cells: {
        specialty: 'Global EOR & contractor payroll',
        entities: 'Owned entities in 150+ countries',
        contractors: '$49/mo flat fee',
      },
    },
    {
      platform: 'Remote',
      cells: {
        specialty: 'Owned-entity EOR',
        entities: 'Owned entities; no partner agencies',
        contractors: 'From $29/mo',
      },
    },
    {
      platform: 'Rippling',
      cells: {
        specialty: 'US HR, payroll, and IT in one record',
        entities: 'EOR sold as a paid module',
        contractors: 'Quoted with the workforce graph',
      },
    },
    {
      platform: 'Oyster HR',
      cells: {
        specialty: 'Mid-market global employment',
        entities: 'Owned plus local partners (180+)',
        contractors: '$29/mo after 30-day trial',
      },
    },
    {
      platform: 'Papaya Global',
      cells: {
        specialty: 'Multi-country payroll reporting',
        entities: 'Your entities plus Papaya EOR',
        contractors: '$25 to $30/mo',
      },
    },
    {
      platform: 'Multiplier',
      cells: {
        specialty: 'APAC and EMEA EOR',
        entities: 'Direct depth in India, Singapore, Vietnam, UAE',
        contractors: 'From $40/mo',
      },
    },
  ],
};

export const ATS_FEATURE_MATRIX: CategoryMatrix = {
  heading: 'Applicant Tracking System Feature Matrix',
  caption: 'A quick comparison of candidate sourcing and hiring workflows across top applicant tracking systems.',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'specialty', label: 'Core Specialty' },
    { key: 'fit', label: 'Best For' },
    { key: 'price', label: 'Pricing Tier' },
  ],
  rows: [
    {
      platform: 'Ashby',
      cells: {
        specialty: 'Funnel analytics ATS, no recruiter seats',
        fit: 'Scaleups of 50 to 250',
        price: 'From $400/mo by company size',
      },
    },
    {
      platform: 'Lever',
      cells: {
        specialty: 'Outbound sourcing and nurture (LeverTRM)',
        fit: 'Mid-market talent teams',
        price: 'Custom annual quote',
      },
    },
    {
      platform: 'Greenhouse',
      cells: {
        specialty: 'Structured hiring and interview kits',
        fit: 'Enterprise TA with audit needs',
        price: 'Custom annual quote',
      },
    },
    {
      platform: 'Workable',
      cells: {
        specialty: 'SMB ATS with 200+ job-board posts',
        fit: 'SMB and early mid-market',
        price: 'Standard from $299/mo',
      },
    },
    {
      platform: 'Recruitee',
      cells: {
        specialty: 'EU hiring with GDPR by default',
        fit: 'EU and multi-national SMBs',
        price: 'Launch from $199/mo',
      },
    },
    {
      platform: 'JazzHR',
      cells: {
        specialty: 'SMB ATS with unlimited interviewer seats',
        fit: 'US small teams',
        price: 'From about $75/mo',
      },
    },
    {
      platform: 'Breezy HR',
      cells: {
        specialty: 'Kanban pipeline with video screening',
        fit: 'Startups that want a free tier',
        price: 'Free, then about $157/mo',
      },
    },
  ],
};
