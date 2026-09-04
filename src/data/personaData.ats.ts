import type { AtsFeatures, AtsPersonaData } from '../types/comparison';
import { spec } from './personaSpec';

function ats(base: AtsFeatures, patch: Partial<AtsFeatures> = {}): AtsFeatures {
  return { ...base, ...patch };
}

const ashbyBase: AtsFeatures = {
  structuredScorecards: spec(true, 'Structured scorecards plus AI interview summaries; scorecard rigor is configurable rather than Greenhouse-hardcoded methodology.'),
  sourcingCrm: spec(true, 'Native sourcing CRM, pipeline analytics, and unlimited seats on Foundations (flat fee to 100 employees).'),
  interviewScheduling: spec(true, 'Multi-time-zone self-scheduling with interviewer load analytics; not a separate Calendly dependency.'),
  careerSiteAndJobBoards: spec(false, 'No one-click 200-board syndication like Workable. Career site is first-party; job boards are integrations.'),
  complianceAndEeoc: spec(true, 'GDPR tools shipped; OFCCP/EEO reporting is lighter than Greenhouse’s dedicated DEI compliance suite.'),
  reportingAndAnalytics: spec(true, 'Recruiting analytics are the product: funnel conversion, source ROI, and pipeline velocity in-product.'),
  integrations: spec(true, 'Modern HRIS/assessment connectors; Checkr is not a native matrix item—background checks are partner/integration, not Greenhouse-deep.'),
  seatOrUsagePricing: spec(true, '$400/month Foundations flat fee to 100 employees, unlimited recruiter seats, no published free trial.'),
};

const greenhouseBase: AtsFeatures = {
  structuredScorecards: spec(true, 'Structured Hiring scorecards are the methodology: every interview stage is auditable for later OFCCP review.'),
  sourcingCrm: spec(false, 'CRM is not the core Greenhouse motion; outbound nurture trails Lever/Ashby.'),
  interviewScheduling: spec(true, 'Self-scheduling plus interview kit enforcement; global language support on career sites.'),
  careerSiteAndJobBoards: spec(true, 'Global job-board postings and branded career site as a first-class enterprise module.'),
  complianceAndEeoc: spec(true, 'Best-in-class EEO/OFCCP and DEI reporting for US federal contractors and audit-ready hiring files.'),
  reportingAndAnalytics: spec(true, 'Standard recruiting reports plus compliance dashboards; less “productized analytics” than Ashby.'),
  integrations: spec(true, '400+ native integrations including Checkr background checks, HRIS, and assessments.'),
  seatOrUsagePricing: spec(true, 'Quote-only annual contracts; no unlimited-seat Foundations SKU and no self-serve free trial.'),
};

const leverBase: AtsFeatures = {
  structuredScorecards: spec(true, 'Scorecards exist but are secondary to CRM nurture; less audit-rigid than Greenhouse Structured Hiring.'),
  sourcingCrm: spec(true, 'Candidate CRM, silver-medalist rediscovery, and automated nurture campaigns are the Lever differentiator.'),
  interviewScheduling: spec(true, 'Visual pipeline plus scheduling; multi-language career sites are not a Recruitee-level strength.'),
  careerSiteAndJobBoards: spec(false, 'No Workable-style one-click 200-board blast; sourcing is CRM-led rather than syndication-led.'),
  complianceAndEeoc: spec(true, 'GDPR tooling shipped; OFCCP depth trails Greenhouse. Checkr is integration, not a native matrix win.'),
  reportingAndAnalytics: spec(false, 'Reporting is adequate; native analytics are thinner than Ashby’s funnel engine.'),
  integrations: spec(true, 'Core HRIS/assessment integrations; background-check marketplace is narrower than Greenhouse’s 400+ catalog.'),
  seatOrUsagePricing: spec(true, 'Custom annual quote; no published starter price and no unlimited-seat flat tier.'),
};

const workableBase: AtsFeatures = {
  structuredScorecards: spec(false, 'Scorecards are basic. Workable is job-board + AI sourcing, not Greenhouse structured hiring.'),
  sourcingCrm: spec(false, 'No full candidate CRM. AI sourcing database (400M+ profiles) substitutes for Lever-style nurture.'),
  interviewScheduling: spec(true, 'Self-scheduling included; async video and SMS texting are paid add-ons.'),
  careerSiteAndJobBoards: spec(true, 'One-click syndication to 200+ job boards is the SMB acquisition engine.'),
  complianceAndEeoc: spec(true, 'GDPR tools on; OFCCP/EEO is not Greenhouse-grade. Checkr-class background checks are a native integration.'),
  reportingAndAnalytics: spec(false, 'Operational reports only; no Ashby-style recruiting data warehouse in-product.'),
  integrations: spec(true, 'Background-check integrations plus job boards; SMS/video interview modules are add-on SKUs.'),
  seatOrUsagePricing: spec(true, 'Standard from $299/month (1–20 employees) with a published free trial; texting/video extra.'),
};

const breezyBase: AtsFeatures = {
  structuredScorecards: spec(false, 'Trello-style pipelines, not structured scorecard methodology.'),
  sourcingCrm: spec(false, 'No dedicated sourcing CRM. High-volume pipeline and automations instead.'),
  interviewScheduling: spec(true, 'Self-service scheduling plus native asynchronous video screening (not an add-on).'),
  careerSiteAndJobBoards: spec(true, 'Job-board syndication on paid plans; Bootstrap free tier exists to trial the pipeline.'),
  complianceAndEeoc: spec(true, 'GDPR checkbox; OFCCP/EEO reporting is not an enterprise compliance suite.'),
  reportingAndAnalytics: spec(false, 'Lightweight pipeline reports; no Ashby analytics layer.'),
  integrations: spec(false, 'Smaller marketplace than Greenhouse; Checkr is not a highlighted native matrix item.'),
  seatOrUsagePricing: spec(true, 'Free Bootstrap tier; Startup from about $157/month with a free trial.'),
};

const jazzhrBase: AtsFeatures = {
  structuredScorecards: spec(false, 'Simple workflows, not structured enterprise scorecards.'),
  sourcingCrm: spec(false, 'No Lever-style CRM. Applicant tracking for SMB volume.'),
  interviewScheduling: spec(true, 'Basic scheduling and collaborative score-on-the-record for small panels.'),
  careerSiteAndJobBoards: spec(true, 'Job-board syndication included on paid tiers.'),
  complianceAndEeoc: spec(true, 'Published OFCCP/EEOC reporting for US SMB federal-contractor-lite needs; GDPR is not a Recruitee-grade EU story.'),
  reportingAndAnalytics: spec(false, 'Standard ATS reports; not a recruiting analytics product.'),
  integrations: spec(false, 'Narrow integration catalog; background checks are not a native Greenhouse/Checkr-level matrix win.'),
  seatOrUsagePricing: spec(true, 'From $75/month with unlimited interviewer seats and a free trial—the price leader.'),
};

const recruiteeBase: AtsFeatures = {
  structuredScorecards: spec(false, 'Collaborative evaluations, not Greenhouse structured hiring kits.'),
  sourcingCrm: spec(false, 'Agency-friendly pipeline collaboration without a full CRM automation suite.'),
  interviewScheduling: spec(true, 'Visual pipeline plus scheduling; multi-language careers sites are first-class.'),
  careerSiteAndJobBoards: spec(true, 'Branded multi-language career sites and job-slot based posting (Launch from $199/month, unlimited users).'),
  complianceAndEeoc: spec(true, 'European GDPR data residency is the compliance story; US OFCCP trails Greenhouse/JazzHR.'),
  reportingAndAnalytics: spec(false, 'Collaboration reporting, not Ashby funnel science.'),
  integrations: spec(false, 'Smaller NA marketplace; background checks not a native matrix highlight.'),
  seatOrUsagePricing: spec(true, 'Job-slot pricing with unlimited team seats and a free trial; EU-first packaging.'),
};

const bambooBase: AtsFeatures = {
  structuredScorecards: spec(false, 'Streamlined SMB pipeline inside BambooHR, not a dedicated structured-hiring ATS.'),
  sourcingCrm: spec(false, 'No sourcing CRM. Candidate-to-employee conversion into the BambooHRIS is the point.'),
  interviewScheduling: spec(true, 'Mobile hiring approvals and e-sign; scheduling is adequate for small panels.'),
  careerSiteAndJobBoards: spec(false, 'No one-click 200-board syndication. Career site is HRIS-adjacent.'),
  complianceAndEeoc: spec(false, 'Neither GDPR-resident ATS nor OFCCP suite. Compliance lives in the HRIS, not the ATS module.'),
  reportingAndAnalytics: spec(false, 'HRIS reports, not recruiting analytics.'),
  integrations: spec(true, 'Native BambooHR HRIS sync is the integration: zero re-key from candidate to employee record.'),
  seatOrUsagePricing: spec(true, 'Quote-only, sold only bundled with BambooHR HRIS; ATS is not a standalone SKU.'),
};

export const atsPersonaByToolId: Record<string, AtsPersonaData> = {
  ashby: {
    startupFeatures: ats(ashbyBase, {
      seatOrUsagePricing: spec(true, 'Flat $400/month to 100 employees with unlimited seats is the startup math versus per-recruiter Greenhouse quotes.'),
    }),
    scaleupFeatures: ats(ashbyBase, {
      reportingAndAnalytics: spec(true, 'Funnel conversion and source ROI become the scaleup operating system once hiring volume exceeds a spreadsheet ATS.'),
    }),
    agencyFeatures: ats(ashbyBase, {
      sourcingCrm: spec(true, 'CRM is strong for in-house talent teams; there is no staffing client-submission portal comparable to agency ATSs.'),
    }),
    remoteFeatures: ats(ashbyBase, {
      interviewScheduling: spec(true, 'Multi-time-zone scheduling is native; async video is not Breezy-native and is typically an integration.'),
    }),
    hourlyFeatures: ats(ashbyBase, {
      integrations: spec(false, 'No native Checkr/SMS high-volume hourly stack. Background checks and texting are partner tools, not Workable add-on SKUs.'),
    }),
    enterpriseFeatures: ats(ashbyBase, {
      complianceAndEeoc: spec(true, 'GDPR plus analytics for enterprise talent ops; OFCCP audit files still trail Greenhouse Structured Hiring.'),
    }),
  },
  greenhouse: {
    startupFeatures: ats(greenhouseBase, {
      seatOrUsagePricing: spec(false, 'Quote-only annual contracts and implementation weight make Greenhouse a poor first ATS under ~25 reqs/year.'),
    }),
    scaleupFeatures: ats(greenhouseBase, {
      structuredScorecards: spec(true, 'Structured Hiring becomes the scaleup control system once interview panels need auditability.'),
    }),
    agencyFeatures: ats(greenhouseBase, {
      sourcingCrm: spec(false, 'No staffing client portal. Greenhouse is an in-house enterprise ATS, not a submission ATS for agencies.'),
    }),
    remoteFeatures: ats(greenhouseBase, {
      careerSiteAndJobBoards: spec(true, 'Multi-language career sites and global job boards for distributed employer brands.'),
    }),
    hourlyFeatures: ats(greenhouseBase, {
      integrations: spec(true, 'Checkr (and similar) background-check integrations; SMS candidate texting is not a Workable-style native add-on.'),
    }),
    enterpriseFeatures: ats(greenhouseBase, {
      complianceAndEeoc: spec(true, 'EEO/OFCCP reporting plus SAML 2.0 SSO and 400+ integrations for federal contractors and global HRIS stacks.'),
    }),
  },
  lever: {
    startupFeatures: ats(leverBase, {
      sourcingCrm: spec(true, 'Outbound CRM and silver-medalist nurture fit startups that source rather than inbound-apply.'),
    }),
    scaleupFeatures: ats(leverBase, {
      structuredScorecards: spec(true, 'Scorecards plus CRM scale to 50–250 employees; analytics still trail Ashby.'),
    }),
    agencyFeatures: ats(leverBase, {
      sourcingCrm: spec(true, 'CRM helps agency-like outbound; there is still no client submission portal for staffing desks.'),
    }),
    remoteFeatures: ats(leverBase, {
      interviewScheduling: spec(true, 'Pipeline UX is fast for distributed hiring managers; async video is integration-led.'),
    }),
    hourlyFeatures: ats(leverBase, {
      integrations: spec(false, 'Not an SMS/Checkr hourly engine. High-volume hourly hiring is a Workable/Breezy problem.'),
    }),
    enterpriseFeatures: ats(leverBase, {
      complianceAndEeoc: spec(true, 'SAML SSO on enterprise; OFCCP is secondary to CRM. Checkr via integration, not a native compliance suite.'),
    }),
  },
  workable: {
    startupFeatures: ats(workableBase, {
      seatOrUsagePricing: spec(true, 'Published $299/month plus free trial is the self-serve startup ATS versus quote-only Greenhouse/Lever.'),
    }),
    scaleupFeatures: ats(workableBase, {
      careerSiteAndJobBoards: spec(true, '200+ board syndication still works at scale-up volume; structured hiring gaps show up past ~30 concurrent reqs.'),
    }),
    agencyFeatures: ats(workableBase, {
      careerSiteAndJobBoards: spec(true, 'Job-board blast helps agencies advertise roles; client submission portals are not a first-class staffing module.'),
    }),
    remoteFeatures: ats(workableBase, {
      interviewScheduling: spec(true, 'Self-scheduling plus paid async video add-on for distributed screens.'),
    }),
    hourlyFeatures: ats(workableBase, {
      integrations: spec(true, 'Checkr-class background checks plus paid SMS candidate texting add-on for high-volume hourly reqs.'),
    }),
    enterpriseFeatures: ats(workableBase, {
      complianceAndEeoc: spec(false, 'Not the OFCCP system of record. Video/SMS add-ons also keep total cost above the $299 headline.'),
    }),
  },
  'breezy-hr': {
    startupFeatures: ats(breezyBase, {
      seatOrUsagePricing: spec(true, 'Free Bootstrap tier plus ~$157 Startup plan for teams that need a visual pipeline this week.'),
    }),
    scaleupFeatures: ats(breezyBase, {
      interviewScheduling: spec(true, 'Automation and video screening scale volume; compliance and analytics do not.'),
    }),
    agencyFeatures: ats(breezyBase, {
      interviewScheduling: spec(true, 'Drag-and-drop pipelines fit agency desks; client portals are lightweight compared with true staffing ATSs.'),
    }),
    remoteFeatures: ats(breezyBase, {
      interviewScheduling: spec(true, 'Native asynchronous video screening is the remote-first differentiator versus calendar-only ATSs.'),
    }),
    hourlyFeatures: ats(breezyBase, {
      interviewScheduling: spec(true, 'Automated messaging plus video screens for hourly/high-volume roles; Checkr is not native.'),
    }),
    enterpriseFeatures: ats(breezyBase, {
      complianceAndEeoc: spec(false, 'No OFCCP/EEO enterprise suite and a thin integration catalog. SAML is not the buying motion.'),
    }),
  },
  jazzhr: {
    startupFeatures: ats(jazzhrBase, {
      seatOrUsagePricing: spec(true, '$75/month with unlimited interviewer seats is the cheapest structured-enough ATS for US SMBs.'),
    }),
    scaleupFeatures: ats(jazzhrBase, {
      careerSiteAndJobBoards: spec(true, 'Syndication and workflows hold to mid-market volume; CRM/analytics gaps appear as recruiting ops matures.'),
    }),
    agencyFeatures: ats(jazzhrBase, {
      careerSiteAndJobBoards: spec(true, 'Fine for small recruiting shops posting US jobs; not a client-submission staffing ATS.'),
    }),
    remoteFeatures: ats(jazzhrBase, {
      interviewScheduling: spec(true, 'Basic panel scheduling exists; US/North America-first product with no Recruitee-grade multi-language careers site or Breezy-native async video.'),
    }),
    hourlyFeatures: ats(jazzhrBase, {
      complianceAndEeoc: spec(true, 'OFCCP/EEOC reporting on a cheap seat is the hourly/US-contractor-adjacent compliance story, not Checkr/SMS.'),
    }),
    enterpriseFeatures: ats(jazzhrBase, {
      complianceAndEeoc: spec(true, 'EEO/OFCCP reports exist; SAML, GDPR residency, and 400-integration depth do not. Not a Greenhouse replacement.'),
    }),
  },
  recruitee: {
    startupFeatures: ats(recruiteeBase, {
      careerSiteAndJobBoards: spec(true, 'EU-grade careers site plus unlimited seats on job-slot pricing for European startups.'),
    }),
    scaleupFeatures: ats(recruiteeBase, {
      careerSiteAndJobBoards: spec(true, 'Multi-language career sites scale with EU/UK expansion; NA sourcing AI trails Ashby/Workable.'),
    }),
    agencyFeatures: ats(recruiteeBase, {
      interviewScheduling: spec(true, 'Collaborative evaluations for agency-style team hiring; not a dedicated client portal ATS.'),
    }),
    remoteFeatures: ats(recruiteeBase, {
      careerSiteAndJobBoards: spec(true, 'Multi-language careers pages for distributed EU/UK employers; GDPR data residency included.'),
    }),
    hourlyFeatures: ats(recruiteeBase, {
      integrations: spec(false, 'Not a Checkr/SMS hourly stack. High-volume US hourly is Workable/JazzHR territory.'),
    }),
    enterpriseFeatures: ats(recruiteeBase, {
      complianceAndEeoc: spec(true, 'GDPR data residency for EU enterprises; US OFCCP and SAML-centric Greenhouse RFPs are a weaker fit.'),
    }),
  },
  'bamboohr-ats': {
    startupFeatures: ats(bambooBase, {
      integrations: spec(true, 'If the company already bought BambooHR, the ATS module avoids a second vendor for the first 10–20 hires.'),
    }),
    scaleupFeatures: ats(bambooBase, {
      integrations: spec(true, 'Candidate-to-employee HRIS handoff stays clean; recruiting ops will outgrow the ATS module around dedicated recruiter headcount.'),
    }),
    agencyFeatures: ats(bambooBase, {
      sourcingCrm: spec(false, 'No agency/client-submission model. BambooHR ATS is in-house SMB hiring only.'),
    }),
    remoteFeatures: ats(bambooBase, {
      interviewScheduling: spec(true, 'Mobile approvals help distributed managers; async video and multi-language careers are not the product.'),
    }),
    hourlyFeatures: ats(bambooBase, {
      integrations: spec(false, 'No Checkr/SMS high-volume hourly toolkit. Time tracking lives elsewhere in the HRIS.'),
    }),
    enterpriseFeatures: ats(bambooBase, {
      complianceAndEeoc: spec(false, 'Not an OFCCP ATS and not sold standalone. Enterprises buying Greenhouse will not evaluate BambooHR ATS as a peer.'),
    }),
  },
};
