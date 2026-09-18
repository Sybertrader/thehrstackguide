import type { PerformanceMgmtFeatures, PerformanceMgmtPersonaData } from '../types/comparison';
import { spec } from './personaSpec';

function pm(base: PerformanceMgmtFeatures, patch: Partial<PerformanceMgmtFeatures> = {}): PerformanceMgmtFeatures {
  return { ...base, ...patch };
}

const performyardBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'Goals exist inside configurable review cycles; OKR cascading is less opinionated than Lattice or 15Five.'),
  continuousFeedback: spec(true, 'Continuous feedback plus 1:1 agendas without a heavy implementation project.'),
  structuredReviews: spec(true, 'Highly configurable review templates (annual, quarterly, project) are the PerformYard center of gravity.'),
  calibration: spec(true, 'Calibration exists for mid-market talent reviews; less compensation-tied than Lattice Compensation.'),
  engagementSurveys: spec(true, 'Engagement surveys included; people-science benchmarks trail Culture Amp.'),
  compensation: spec(true, 'Compensation modules are available; depth still trails Lattice compensation bands for large enterprises.'),
  managerCadence: spec(true, '1:1 meeting tools plus AI review-writing assists for HR admins running custom cycles.'),
  ssoAndHrisIntegrations: spec(true, 'Slack/Teams plus HRIS; SAML on mid-market/enterprise. GitHub/Jira are not first-party engineering review sources.'),
};

const latticeBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'Goals from $8/user/month; Performance from $10/user/month. OKRs and talent reviews are mature.'),
  continuousFeedback: spec(true, 'Feedback, 1:1s, and updates in Slack/Teams; Grow and Engagement are separate modules.'),
  structuredReviews: spec(true, 'Enterprise review cycles plus talent reviews for succession, not just annual forms.'),
  calibration: spec(true, 'Talent calibration and compensation calibration tied to performance data is the Lattice enterprise wedge.'),
  engagementSurveys: spec(true, 'Engagement module is add-on; survey science is solid but not Culture Amp’s primary identity.'),
  compensation: spec(true, 'Compensation bands, merit, and equity-adjacent calibration sit in the Compensation module (extra seat cost).'),
  managerCadence: spec(true, '1:1 agendas plus Grow career pathing as paid modules on top of Performance.'),
  ssoAndHrisIntegrations: spec(true, 'SAML 2.0 SSO, HRIS, Slack/Teams. GitHub/Jira are partner integrations, not a native engineering scorecard.'),
};

const cultureAmpBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'Goals exist in Perform; Culture Amp is still bought first for engagement science, not OKR software.'),
  continuousFeedback: spec(true, 'Feedback in Perform/Develop; 1:1 meeting tools are not a 15Five-level product.'),
  structuredReviews: spec(true, 'Performance reviews plus development plans; less compensation-tied than Lattice.'),
  calibration: spec(false, 'No Lattice-grade compensation calibration. Talent decisions are insight-led from survey science.'),
  engagementSurveys: spec(true, 'Science-backed engagement surveys and external benchmarks are the category-defining module.'),
  compensation: spec(false, 'Compensation is not the system of record. HRBPs export insights into a separate comp process.'),
  managerCadence: spec(false, 'Manager action planning from surveys, not a weekly check-in OS. 1:1 agendas are not first-class.'),
  ssoAndHrisIntegrations: spec(true, 'SAML SSO, HRIS, Slack/Teams. HRBP analytics dashboards are the integration story, not GitHub/Jira reviews.'),
};

export const performancePersonaByToolId: Record<string, PerformanceMgmtPersonaData> = {
  performyard: {
    startupFeatures: pm(performyardBase, {
      structuredReviews: spec(true, '$5/user configurable reviews without a sales-heavy Lattice implementation; no free trial.'),
    }),
    scaleupFeatures: pm(performyardBase, {
      structuredReviews: spec(true, 'Custom quarterly/annual/project cycles for 50–250 employee People teams that outgrew spreadsheets.'),
    }),
    peopleOpsFeatures: pm(performyardBase, {
      managerCadence: spec(true, 'HR admin-friendly cycle configuration plus AI insights without standing up a full Lattice module stack.'),
    }),
    remoteFeatures: pm(performyardBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack/Teams feedback for distributed reviewers; not a 15Five weekly remote OS.'),
    }),
    engineeringFeatures: pm(performyardBase, {
      ssoAndHrisIntegrations: spec(false, 'No GitHub/Jira-native engineering reviews. Custom forms can reference tickets only as attached text.'),
    }),
    agencyFeatures: pm(performyardBase, {
      structuredReviews: spec(true, 'Project-shaped review cycles can approximate client-project reviews; there is no billable-hour object.'),
    }),
    enterpriseFeatures: pm(performyardBase, {
      compensation: spec(true, 'SAML plus mid-market compensation modules; still not Lattice Compensation for 1,000+ employee calibration.'),
    }),
  },
  lattice: {
    startupFeatures: pm(latticeBase, {
      ssoAndHrisIntegrations: spec(false, 'No free trial and module stacking ($8–$11+ per module) is usually too much platform for a 20-person startup.'),
    }),
    scaleupFeatures: pm(latticeBase, {
      okrsAndGoals: spec(true, 'OKRs plus Performance become the scaleup people OS once manager count justifies the seat cost.'),
    }),
    peopleOpsFeatures: pm(latticeBase, {
      calibration: spec(true, 'HRBP talent reviews, compensation calibration, and people analytics are the Lattice People Ops console.'),
    }),
    remoteFeatures: pm(latticeBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack/Teams updates and 1:1s for distributed ICs; Grow is the remote career-pathing add-on.'),
    }),
    engineeringFeatures: pm(latticeBase, {
      ssoAndHrisIntegrations: spec(true, 'GitHub/Jira via marketplace integrations can attach work artifacts to reviews; not a native eng productivity graph.'),
    }),
    agencyFeatures: pm(latticeBase, {
      structuredReviews: spec(false, 'No client-billable project review object. Agencies overbuy Lattice unless they run internal talent reviews like a product company.'),
    }),
    enterpriseFeatures: pm(latticeBase, {
      compensation: spec(true, 'SAML 2.0 SSO, compensation calibration, and talent reviews for global enterprises; total seat cost includes Engagement/Grow/Comp add-ons.'),
    }),
  },
  'culture-amp': {
    startupFeatures: pm(cultureAmpBase, {
      engagementSurveys: spec(false, 'Custom-quote Engage packaging is usually too heavy until there is a People team to act on survey results.'),
    }),
    scaleupFeatures: pm(cultureAmpBase, {
      engagementSurveys: spec(true, 'First statistically useful engagement census once headcount supports anonymity thresholds.'),
    }),
    peopleOpsFeatures: pm(cultureAmpBase, {
      engagementSurveys: spec(true, 'HRBP analytics dashboards, external benchmarks, and action planning are the Culture Amp reason-to-buy.'),
    }),
    remoteFeatures: pm(cultureAmpBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack/Teams survey reminders for distributed orgs; not a weekly check-in replacement.'),
    }),
    engineeringFeatures: pm(cultureAmpBase, {
      ssoAndHrisIntegrations: spec(false, 'No GitHub/Jira performance graph. Eng orgs use Culture Amp for engagement, not code-review scoring.'),
    }),
    agencyFeatures: pm(cultureAmpBase, {
      engagementSurveys: spec(true, 'Culture surveys can run across delivery teams; there is no client-project billable review tool.'),
    }),
    enterpriseFeatures: pm(cultureAmpBase, {
      ssoAndHrisIntegrations: spec(true, 'SAML 2.0 SSO and people-science benchmarks for global HRBPs; Perform is secondary to Engage in most enterprise deals.'),
    }),
  },
};
