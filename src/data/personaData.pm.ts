import type { PerformanceMgmtFeatures, PerformanceMgmtPersonaData } from '../types/comparison';
import { spec } from './personaSpec';

function pm(base: PerformanceMgmtFeatures, patch: Partial<PerformanceMgmtFeatures> = {}): PerformanceMgmtFeatures {
  return { ...base, ...patch };
}

const fifteenBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'OKR cascading on Perform/Total Platform tiers with lightweight reviews rather than Lattice-grade talent calibration.'),
  continuousFeedback: spec(true, 'Weekly check-ins are the core cadence; manager coaching prompts sit in the same loop.'),
  structuredReviews: spec(true, '360 reviews exist; the product is still check-in-led rather than a compensation-tied review OS.'),
  calibration: spec(false, 'No Lattice-style compensation calibration. Talent reviews are lighter than enterprise talent-day workflows.'),
  engagementSurveys: spec(true, 'Engagement pulses ship; scientific benchmark depth trails Culture Amp.'),
  compensation: spec(false, 'Compensation bands and merit calibration are not a 15Five system of record.'),
  managerCadence: spec(true, '1:1 agendas plus manager coaching are the buying reason for first-time People teams.'),
  ssoAndHrisIntegrations: spec(true, 'Slack/Teams check-ins plus HRIS connectors; SAML SSO on higher tiers. GitHub/Jira are not native review sources.'),
};

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

const leapsomeBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'Goals/OKRs as a paid module alongside Reviews, Engagement, and Learning.'),
  continuousFeedback: spec(true, 'Continuous feedback plus AI writing assist for reviews and goal drafts.'),
  structuredReviews: spec(true, 'Modular reviews with 360 support and learning paths in the same suite.'),
  calibration: spec(true, 'Calibration and compensation modules exist; packaging is per-module so full-suite cost stacks.'),
  engagementSurveys: spec(true, 'Engagement surveys with a strong EU GDPR posture versus US-only survey tools.'),
  compensation: spec(true, 'Compensation calibration is a module, not the Lattice-only reason to buy, but it is in-suite.'),
  managerCadence: spec(true, '1:1s plus learning paths give managers a development loop, not only a review form.'),
  ssoAndHrisIntegrations: spec(true, 'Slack/Teams, SAML, and EU data handling. GitHub/Jira via integrations rather than native eng performance graphs.'),
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

const reflektiveBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'Goals and review cycles in the PeopleFluent/Workday-era packaging; lighter than Lattice OKR suites.'),
  continuousFeedback: spec(true, 'Real-time feedback and recognition feed, including Slack-native loops from the Reflektive heritage UX.'),
  structuredReviews: spec(true, 'Review cycles exist; 360 is supported. Implementation feels legacy versus Leapsome/Lattice.'),
  calibration: spec(false, 'No modern compensation calibration module comparable to Lattice Compensation.'),
  engagementSurveys: spec(false, 'Not a Culture Amp engagement platform. Recognition ≠ engagement science.'),
  compensation: spec(false, 'No compensation-band product. Comp stays in HRIS/Workday.'),
  managerCadence: spec(false, 'No 15Five-style 1:1 agenda OS. Cadence is feedback/recognition rather than weekly check-ins.'),
  ssoAndHrisIntegrations: spec(true, 'Slack-native feedback plus enterprise SSO in PeopleFluent packaging. GitHub/Jira are not native.'),
};

const clearcompanyBase: PerformanceMgmtFeatures = {
  okrsAndGoals: spec(true, 'Goal alignment inside the talent suite that also includes ATS/onboarding—not a specialist OKR product.'),
  continuousFeedback: spec(true, 'Feedback exists; depth trails 15Five weekly check-ins and Lattice continuous feedback.'),
  structuredReviews: spec(true, 'Configurable reviews connected to the same suite as hiring/onboarding handoff.'),
  calibration: spec(false, 'No Lattice-style compensation calibration. Talent reviews are suite-adjacent, not a talent-day OS.'),
  engagementSurveys: spec(true, 'Engagement surveys in-suite; people-science benchmarks trail Culture Amp.'),
  compensation: spec(false, 'Compensation is not a first-class module. Best value only when buying the broader talent suite.'),
  managerCadence: spec(false, 'No dedicated 1:1 coaching product. Manager tools are review-workflow, not weekly cadence.'),
  ssoAndHrisIntegrations: spec(true, 'SSO on suite contracts; Slack/Teams present. GitHub/Jira are not engineering-native. ATS handoff is the integration win.'),
};

export const performancePersonaByToolId: Record<string, PerformanceMgmtPersonaData> = {
  '15five': {
    startupFeatures: pm(fifteenBase, {
      managerCadence: spec(true, 'Weekly check-ins and published ~$4/user pricing with a free trial for a first People process.'),
    }),
    scaleupFeatures: pm(fifteenBase, {
      okrsAndGoals: spec(true, 'OKR cascading on Perform once the company outgrows Google Docs goals but is not ready for Lattice Compensation.'),
    }),
    peopleOpsFeatures: pm(fifteenBase, {
      managerCadence: spec(true, 'Manager coaching prompts give People Ops a lightweight enablement layer without Culture Amp survey science.'),
    }),
    remoteFeatures: pm(fifteenBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack/Teams check-in workflows for distributed teams; async updates replace hallway 1:1s.'),
    }),
    engineeringFeatures: pm(fifteenBase, {
      ssoAndHrisIntegrations: spec(false, 'No native GitHub/Jira contribution graph in reviews. Eng performance is manager check-ins, not PR telemetry.'),
    }),
    agencyFeatures: pm(fifteenBase, {
      structuredReviews: spec(false, 'No client-project billable review object. Agencies use check-ins, not utilization-tied reviews.'),
    }),
    enterpriseFeatures: pm(fifteenBase, {
      calibration: spec(false, 'SAML SSO on higher tiers; compensation calibration and talent reviews still trail Lattice for global enterprises.'),
    }),
  },
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
  leapsome: {
    startupFeatures: pm(leapsomeBase, {
      okrsAndGoals: spec(true, 'Modular $8/user starting point with a free trial; full Reviews+Goals+Engagement+Learning stack costs more than 15Five.'),
    }),
    scaleupFeatures: pm(leapsomeBase, {
      structuredReviews: spec(true, 'Reviews plus learning paths for scaleups professionalizing manager quality without a Lattice-only purchase.'),
    }),
    peopleOpsFeatures: pm(leapsomeBase, {
      engagementSurveys: spec(true, 'Engagement plus learning in one GDPR-friendly suite for European People Ops teams.'),
    }),
    remoteFeatures: pm(leapsomeBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack/Teams plus EU data residency for remote-first EU/UK companies.'),
    }),
    engineeringFeatures: pm(leapsomeBase, {
      ssoAndHrisIntegrations: spec(true, 'Competency frameworks suit eng orgs; GitHub/Jira remain integrations, not native PR-based reviews.'),
    }),
    agencyFeatures: pm(leapsomeBase, {
      structuredReviews: spec(false, 'No billable client-project review module. Agencies buy reviews/learning, not utilization reviews.'),
    }),
    enterpriseFeatures: pm(leapsomeBase, {
      ssoAndHrisIntegrations: spec(true, 'SAML 2.0 SSO, GDPR, and modular enterprise packaging; compensation exists but Lattice still wins large US calibration RFPs.'),
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
  reflektive: {
    startupFeatures: pm(reflektiveBase, {
      continuousFeedback: spec(true, 'Lightweight Slack feedback if a team is already on a PeopleFluent/Reflektive footprint; not a greenfield startup pick.'),
    }),
    scaleupFeatures: pm(reflektiveBase, {
      continuousFeedback: spec(true, 'Recognition plus goals for mid-market teams migrating off legacy Reflektive, not a Lattice displacement.'),
    }),
    peopleOpsFeatures: pm(reflektiveBase, {
      engagementSurveys: spec(false, 'People Ops looking for survey science should be on Culture Amp; this is a feedback/review remnant stack.'),
    }),
    remoteFeatures: pm(reflektiveBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack-native feedback loops for distributed teams that already live in chat.'),
    }),
    engineeringFeatures: pm(reflektiveBase, {
      ssoAndHrisIntegrations: spec(false, 'No GitHub/Jira native reviews. Engineering feedback is Slack comments, not repo telemetry.'),
    }),
    agencyFeatures: pm(reflektiveBase, {
      structuredReviews: spec(false, 'No billable client-project review module.'),
    }),
    enterpriseFeatures: pm(reflektiveBase, {
      ssoAndHrisIntegrations: spec(true, 'Enterprise SSO inside PeopleFluent/Workday-era packaging; fewer AI and compensation modules than Lattice/Leapsome.'),
    }),
  },
  clearcompany: {
    startupFeatures: pm(clearcompanyBase, {
      structuredReviews: spec(true, 'Makes sense only if the startup already bought the ClearCo talent suite (ATS + onboarding + reviews).'),
    }),
    scaleupFeatures: pm(clearcompanyBase, {
      structuredReviews: spec(true, 'Hiring-to-performance handoff for scaleups standardizing on one talent suite rather than Lattice + Greenhouse.'),
    }),
    peopleOpsFeatures: pm(clearcompanyBase, {
      structuredReviews: spec(true, 'People Ops gets ATS-to-review continuity; HRBP survey science still lives in Culture Amp if needed.'),
    }),
    remoteFeatures: pm(clearcompanyBase, {
      ssoAndHrisIntegrations: spec(true, 'Slack/Teams on suite tenants; remote 1:1 cadence is weaker than 15Five.'),
    }),
    engineeringFeatures: pm(clearcompanyBase, {
      ssoAndHrisIntegrations: spec(false, 'No GitHub/Jira-native engineering reviews. Performance is HR-suite, not eng-tooling.'),
    }),
    agencyFeatures: pm(clearcompanyBase, {
      structuredReviews: spec(true, 'Talent-suite reviews can track delivery staff; true client-project billable reviews still need PSA/finance tools.'),
    }),
    enterpriseFeatures: pm(clearcompanyBase, {
      ssoAndHrisIntegrations: spec(true, 'SSO on enterprise suite deals; performance depth still trails dedicated Lattice/Leapsome RFPs.'),
    }),
  },
};
