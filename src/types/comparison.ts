/**
 * Canonical comparison types for the 700-URL programmatic architecture.
 *
 * `personaData` is optional so existing CSV-backed rows keep compiling while
 * new generator output can attach sub-niche feature specs without a schema
 * break. Every persona feature object uses `FeatureSpec`: a boolean for
 * presence plus a short technical specification string for GEO/LLM extraction.
 */

export interface FeatureMatrixEntry {
  a: boolean;
  b: boolean;
}

/** One capability: whether it is supported, plus a concise technical spec. */
export interface FeatureSpec {
  supported: boolean;
  /** Short technical note (coverage, SLA, pricing unit, legal vehicle). */
  spec: string;
}

export type ComparisonSubNiche = 'globalPayroll' | 'ats' | 'performanceMgmt';

export interface GlobalPayrollFeatures {
  ownedLocalEntities: FeatureSpec;
  eorCountryCoverage: FeatureSpec;
  contractorPayments: FeatureSpec;
  nativePayrollFilings: FeatureSpec;
  fxAndMultiCurrency: FeatureSpec;
  statutoryBenefits: FeatureSpec;
  ipAndWorkProductAssignment: FeatureSpec;
  onboardingSla: FeatureSpec;
}

export interface GlobalPayrollPersonaData {
  startupFeatures: GlobalPayrollFeatures;
  scaleupFeatures: GlobalPayrollFeatures;
  agencyFeatures: GlobalPayrollFeatures;
  latamFeatures: GlobalPayrollFeatures;
  web3Features: GlobalPayrollFeatures;
  contractorFeatures: GlobalPayrollFeatures;
  ukEuropeFeatures: GlobalPayrollFeatures;
  enterpriseFeatures: GlobalPayrollFeatures;
}

export interface AtsFeatures {
  structuredScorecards: FeatureSpec;
  sourcingCrm: FeatureSpec;
  interviewScheduling: FeatureSpec;
  careerSiteAndJobBoards: FeatureSpec;
  complianceAndEeoc: FeatureSpec;
  reportingAndAnalytics: FeatureSpec;
  integrations: FeatureSpec;
  seatOrUsagePricing: FeatureSpec;
}

export interface AtsPersonaData {
  startupFeatures: AtsFeatures;
  scaleupFeatures: AtsFeatures;
  agencyFeatures: AtsFeatures;
  remoteFeatures: AtsFeatures;
  hourlyFeatures: AtsFeatures;
  enterpriseFeatures: AtsFeatures;
}

export interface PerformanceMgmtFeatures {
  okrsAndGoals: FeatureSpec;
  continuousFeedback: FeatureSpec;
  structuredReviews: FeatureSpec;
  calibration: FeatureSpec;
  engagementSurveys: FeatureSpec;
  compensation: FeatureSpec;
  managerCadence: FeatureSpec;
  ssoAndHrisIntegrations: FeatureSpec;
}

export interface PerformanceMgmtPersonaData {
  startupFeatures: PerformanceMgmtFeatures;
  scaleupFeatures: PerformanceMgmtFeatures;
  peopleOpsFeatures: PerformanceMgmtFeatures;
  remoteFeatures: PerformanceMgmtFeatures;
  engineeringFeatures: PerformanceMgmtFeatures;
  agencyFeatures: PerformanceMgmtFeatures;
  enterpriseFeatures: PerformanceMgmtFeatures;
}

/**
 * Sub-niche persona packs. There is no `for-tech-startups` key: startup
 * buyer-group specs live on `startupFeatures` inside each category object.
 */
export interface PersonaData {
  globalPayroll?: GlobalPayrollPersonaData;
  ats?: AtsPersonaData;
  performanceMgmt?: PerformanceMgmtPersonaData;
}

export interface Comparison {
  slug: string;
  niche_id: string;
  niche_name: string;
  niche_audience_phrase: string;
  target_audience: string;
  tool_a_id: string;
  tool_a_name: string;
  /** Sub-niche positioning tag, e.g. "Best for US SMBs (1–50)". */
  tool_a_badge: string;
  tool_a_logo_url: string;
  tool_a_rating: string;
  tool_a_starting_price: string;
  tool_a_pricing_model: string;
  /** Fine print behind the headline price: add-ons, FX spreads, module gating. */
  tool_a_pricing_nuance: string;
  tool_a_free_trial: string;
  tool_a_affiliate_url: string;
  tool_a_key_features: string;
  tool_a_pros: string;
  tool_a_cons: string;
  tool_b_id: string;
  tool_b_name: string;
  tool_b_badge: string;
  tool_b_logo_url: string;
  tool_b_rating: string;
  tool_b_starting_price: string;
  tool_b_pricing_model: string;
  tool_b_pricing_nuance: string;
  tool_b_free_trial: string;
  tool_b_affiliate_url: string;
  tool_b_key_features: string;
  tool_b_pros: string;
  tool_b_cons: string;
  winner_id: string;
  winner_category: string;
  winner_label: string;
  winner_bullets: string;
  winner_reason: string;
  verdict_summary: string;
  /** Two-sentence editorial takeaway rendered as the "The HR Stack Guide Take" blockquote. */
  hr_stack_take: string;
  feature_matrix_json: string;
  meta_title: string;
  meta_description: string;
  /**
   * Optional persona feature packs for the three sub-niches. Absent on CSV-only
   * rows; populated by the programmatic generator when a pairing has
   * audience-specific specs.
   */
  personaData?: PersonaData;
}
