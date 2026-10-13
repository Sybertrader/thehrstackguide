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
  caption:
    'Build-time comparison of PerformYard, Lattice, and Culture Amp on review cycles, OKRs, compensation calibration, chat integrations, and published price structure.',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'specialty', label: 'Core Specialty' },
    { key: 'reviews', label: 'Review Cycles (360/Continuous)' },
    { key: 'okrs', label: 'OKRs & Goals' },
    { key: 'comp', label: 'Compensation Calibration' },
    { key: 'chat', label: 'Slack/Teams Integration' },
    { key: 'price', label: 'Starting Price Structure' },
  ],
  rows: [
    {
      platform: 'PerformYard',
      cells: {
        specialty: 'Configurable review templates, 1:1s, and 360s without a six-month implementation.',
        reviews: '360, annual, and quarterly cycles you can stand up this quarter. Continuous check-ins via 1:1 templates.',
        okrs: 'Goals cascade into reviews. Lighter OKR analytics than Lattice.',
        comp: 'Quoted as an add-on. Not the reason to buy PerformYard.',
        chat: 'Native Slack and Microsoft Teams reminders for feedback and cycle deadlines.',
        price: 'About $5/user/month. Demo-led. No published free trial.',
      },
    },
    {
      platform: 'Lattice',
      cells: {
        specialty: 'Full talent cycle: reviews, OKRs, engagement, and pay bands on one calibration table.',
        reviews: 'Formal cycles plus continuous feedback. Talent-review confidentiality for People partners.',
        okrs: 'Goals & OKRs module from about $8/user/month. Cascades into 1:1s and reviews.',
        comp: 'Compensation calibration is a first-class module. Pay decisions sit next to ratings.',
        chat: 'Slack and Microsoft Teams. HRIS hooks include Workday and Greenhouse.',
        price: 'Performance from about $10/user/month. Engagement and compensation sold separately. Annual minimum.',
      },
    },
    {
      platform: 'Culture Amp',
      cells: {
        specialty: 'Engagement survey science and external benchmarks first. Performance sits on that data.',
        reviews: 'Perform module exists, but the product is bought for surveys, not a review form.',
        okrs: 'Develop/Perform bundles can hold goals. Benchmarks, not OKR software, are the buying reason.',
        comp: 'Not a compensation-calibration suite. Action planning after surveys, not pay-band governance.',
        chat: 'Slack and Microsoft Teams for survey nudges and manager action plans.',
        price: 'Custom quote by headcount and Engage/Perform/Develop mix. Demo-led enterprise motion.',
      },
    },
  ],
};

export const PAYROLL_FEATURE_MATRIX: CategoryMatrix = {
  heading: 'Global Payroll & EOR Feature Matrix',
  caption:
    'Build-time comparison of Deel, Remote, Rippling, Oyster HR, Papaya Global, and Multiplier on entity model, contractors, payouts, HRIS hooks, and price transparency.',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'specialty', label: 'Core Specialty' },
    { key: 'entities', label: 'Owned Entities vs. Partners' },
    { key: 'contractors', label: 'Contractor Management' },
    { key: 'payouts', label: 'Same-Day US/Global Payouts' },
    { key: 'hris', label: 'HRIS Integration' },
    { key: 'price', label: 'Pricing Transparency' },
  ],
  rows: [
    {
      platform: 'Deel',
      cells: {
        specialty: 'Owned-entity EOR and contractor payroll in 150+ countries. Deel is the local legal employer.',
        entities: 'Owned local companies in key hiring hubs. Ask for the owned-versus-partner list on outlier markets.',
        contractors: 'Yes. $49/contractor platform fee. USDC and local-currency wallets on the same worker file.',
        payouts: 'Multi-currency and crypto corridors. FX spread sits on fiat payouts. Not a same-day US payroll product.',
        hris: 'Slack, Google Workspace, Xero, plus API. HRIS of record is usually Deel itself for EOR staff.',
        price: 'Published $49 contractor / $599 EOR. Shield, equipment, background checks, and FX are extra SKUs.',
      },
    },
    {
      platform: 'Remote',
      cells: {
        specialty: 'EOR through companies Remote owns. Partner agencies are not in the employment chain.',
        entities: 'Owned-entity EOR in 100+ countries. Contractor coverage in 180+. No partner agency on the contract.',
        contractors: 'Yes. From $29/month per worker. Different risk profile than EOR employment.',
        payouts: 'Local-currency contractor and EOR payroll. IP and entity are the pitch, not same-day US ACH.',
        hris: 'Slack, Google Workspace, Xero, QuickBooks, NetSuite, Okta, REST API.',
        price: 'Published $29 contractor / $599 EOR on annual term ($699 month-to-month). IP included in EOR fee.',
      },
    },
    {
      platform: 'Rippling',
      cells: {
        specialty: 'US HR, payroll, laptops, and app access on one employee record. Global EOR is a paid module.',
        entities: 'EOR is a module. Confirm which markets Rippling covers directly versus through a partner.',
        contractors: 'Worldwide contractors live on the same workforce graph as US W-2 staff.',
        payouts: 'US payroll runs on Rippling’s domestic engine. International payouts follow the EOR/payroll module, not a same-day global rail.',
        hris: 'Rippling is the HRIS. Slack, Google Workspace, Okta, QuickBooks, NetSuite, Xero, REST API.',
        price: '$8/user/month is the graph only. Payroll, benefits, devices, and EOR are à la carte. Ask for module line items.',
      },
    },
    {
      platform: 'Oyster HR',
      cells: {
        specialty: 'Global employment for mid-market remote companies. Contractor trial, then EOR conversion.',
        entities: 'Mix of owned infrastructure and local HR partners across 180+ countries. Get the legal-employer list.',
        contractors: 'Yes. $29/month after a 30-day trial. EOR listed at $699/employee.',
        payouts: 'Local-currency payouts and local benefits admin. FX spread and salary deposits move TCO.',
        hris: 'Slack, Google Workspace, Xero, NetSuite, Okta, Zapier, REST API.',
        price: 'Published $29 contractor / $699 EOR. Trial is contractor-only. Deposits are working capital, not a fee.',
      },
    },
    {
      platform: 'Papaya Global',
      cells: {
        specialty: 'Multi-country payroll reporting for finance teams running owned entities and EOR side by side.',
        entities: 'Hybrid: your subsidiaries plus Papaya EOR. Mix of owned rails and local partners in 160+ jurisdictions.',
        contractors: 'Yes. $25–$30/month per contractor. Do not blend with EOR or payroll-only rates.',
        payouts: 'Consolidated multi-country payroll files, not consumer same-day payouts. BI for CFOs is the product.',
        hris: 'Workday, SAP, NetSuite, Xero, Slack, Okta, REST API.',
        price: 'Full-service EOR from $650; Premium $770; payroll-only $12–$25. Deposits and complex benefits extra.',
      },
    },
    {
      platform: 'Multiplier',
      cells: {
        specialty: 'Mid-market EOR priced for APAC and EMEA hiring, from $400 per employee per month.',
        entities: 'Direct entity depth in India, Singapore, Vietnam, and the UAE. Confirm the model outside that core.',
        contractors: 'Yes. From $40/month per active contractor.',
        payouts: 'Localized payroll cycles and statutory filings. Not a same-day US payout network.',
        hris: 'Localized contracts plus standard SaaS integrations. Ask for the HRIS catalog on the quote.',
        price: 'Published $40 contractor / $400 EOR. Country admin fees and benefit packages quoted per market.',
      },
    },
  ],
};

export const ATS_FEATURE_MATRIX: CategoryMatrix = {
  heading: 'Applicant Tracking System Feature Matrix',
  caption:
    'Build-time comparison of Ashby, Lever, Greenhouse, Workable, Recruitee, JazzHR, and Breezy HR on sourcing, interview kits, scheduling, buyer fit, and pricing tier.',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'specialty', label: 'Core Specialty' },
    { key: 'sourcing', label: 'Candidate Sourcing/Outreach' },
    { key: 'kits', label: 'Structured Interview Kits' },
    { key: 'scheduling', label: 'Automated Scheduling' },
    { key: 'fit', label: 'Mid-Market vs. Enterprise Fit' },
    { key: 'price', label: 'Pricing Tier' },
  ],
  rows: [
    {
      platform: 'Ashby',
      cells: {
        specialty: 'ATS, sourcing CRM, and funnel conversion reporting in one product. Flat-tier price. No recruiter seats.',
        sourcing: 'Built-in sourcing CRM and stage-to-offer analytics. LinkedIn plus CRM nurture in the same file.',
        kits: 'Enforced, weighted scorecards across the panel. Auditable hiring record.',
        scheduling: 'Automated multi-time-zone interview scheduling in the core product.',
        fit: 'Scaleups 50–250 that instrument the funnel. Overkill if you post two jobs a quarter.',
        price: 'Foundations from $400/month up to 100 employees. Headcount bands, not interviewer seats. No free trial.',
      },
    },
    {
      platform: 'Lever',
      cells: {
        specialty: 'Outbound sourcing and nurture (LeverTRM) on the same pipeline as inbound applications.',
        sourcing: 'Nurture sequences, silver-medalist rediscovery, and outreach templates inside the ATS.',
        kits: 'Structured feedback managers will actually leave. UI is the collaboration pitch.',
        scheduling: 'Self-scheduling and interviewer coordination on the talent CRM timeline.',
        fit: 'Mid-market talent teams that live in the tool. Annual seat-licensed quotes, not SMB self-serve.',
        price: 'Custom annual contract. No public self-serve tier. TRM and analytics are modules.',
      },
    },
    {
      platform: 'Greenhouse',
      cells: {
        specialty: 'Structured hiring operating system for enterprise TA. Interview kits and scorecards are the product.',
        sourcing: 'Sourcing CRM is an add-on, not the native motion Lever and Ashby sell. Inbound plus agency workflows.',
        kits: 'Yes. Scorecards, kits, and stage gates are the Greenhouse buying reason. Legal can audit the file.',
        scheduling: 'Greenhouse Scheduling automates panel coordination. Confirm it is in the quoted package.',
        fit: 'Enterprise and late-stage mid-market. OFCCP, SSO, and implementation partners are expected.',
        price: 'Custom annual quote. No public starter tier. Implementation is a line item.',
      },
    },
    {
      platform: 'Workable',
      cells: {
        specialty: 'SMB ATS with one-click posting to 200+ job boards and published monthly prices.',
        sourcing: 'AI Recruiter searches 400M+ profiles. Board syndication is the volume play, not a TRM.',
        kits: 'Scorecards exist. OFCCP-grade packaging lives on Premier/Enterprise, not Standard.',
        scheduling: 'Self-serve scheduling on paid plans. Video and texting are add-ons.',
        fit: 'SMB and early mid-market. Not an enterprise RFP ATS.',
        price: 'Standard from $299/month for 1–20 employees. Premier/Enterprise and add-ons raise the bill.',
      },
    },
    {
      platform: 'Recruitee',
      cells: {
        specialty: 'European hiring platform. Multi-language careers site. GDPR as a default, not an add-on.',
        sourcing: 'EU job-board syndication and careers-site localization. Not a US outbound TRM.',
        kits: 'Collaborative scorecards with unlimited team members. DPA-ready consent timers.',
        scheduling: 'Self-scheduling on Launch+ tiers. Multi-language candidate experience.',
        fit: 'EU and multi-national SMBs. Skip if the only office is US and you needed OFCCP reporting.',
        price: 'Launch from $199/month, job-slot based, unlimited teammates. Scale and enterprise are quoted.',
      },
    },
    {
      platform: 'JazzHR',
      cells: {
        specialty: 'SMB ATS from about $75/month with unlimited interviewer seats and Indeed/ZipRecruiter syndication.',
        sourcing: 'Board syndication, not a sourcing CRM. Tracking, not recruiting ops.',
        kits: 'Basic scorecards. Does not block advancing a candidate the way Ashby/Greenhouse kits do.',
        scheduling: 'Self-scheduling on paid plans. Lightweight compared with enterprise kits.',
        fit: 'US SMB. OFCCP/EEOC reporting exists. Not a structured-hiring operating system.',
        price: 'From about $75/month. Unlimited seats keep interviewer cost flat as the panel grows.',
      },
    },
    {
      platform: 'Breezy HR',
      cells: {
        specialty: 'Kanban pipeline with built-in async video screening. Free Bootstrap tier, then paid by job pool.',
        sourcing: 'Indeed/LinkedIn/ZipRecruiter distribution. Visual pipeline, not a 400M-profile database.',
        kits: 'Drag-and-drop stages. Not OFCCP-grade interview-kit enforcement.',
        scheduling: 'Self-serve scheduling plus async video screens without a second tool.',
        fit: 'Startups and small teams that will drag cards. Not a federal-contractor audit ATS.',
        price: 'Free Bootstrap tier. Paid Startup commonly from about $157–$189/month by active jobs, not seats.',
      },
    },
  ],
};
