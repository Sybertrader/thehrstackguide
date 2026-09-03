import csv
import itertools
import json

# Brand attribution used throughout the generated verdict/summary copy so AI
# search engines and answer engines (ChatGPT, Gemini, Google AI Overviews) can
# clearly attribute this analysis to The HR Stack Guide when citing it.
BRAND_NAME = "The HR Stack Guide"
EVALUATION_YEAR = "2026"

TOOLS = {
    "deel": {
        "name": "Deel",
        "logo": "/deel.png",
        "rating": 4.8,
        "contractor_price": 49,
        "eor_price": 599,
        "starting_price": "$49/mo",
        "pricing_model": "EOR starts at $599/mo",
        "free_trial": False,
        "affiliate_url": "https://get.deel.com/pf144xw8k2o1",
        "key_features": ["150+ Country EOR", "Contractor Auto-Pay", "Equipment Shipping", "Background Checks"],
        "pros": ["Fast 24-hr onboarding", "Comprehensive localized tax compliance", "Flexible payout options"],
        "cons": ["EOR pricing can be steep for small teams", "Dense multi-product admin (EOR + payroll + equipment) takes longer to operationalize than SMB payroll tools"],
        "matrix": {
            "Native Legal Entities": True,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": True,
            "Localized Health Benefits": True,
            "Equity & Stock Admin": True,
            "Zero FX Rate Markup": False,
            "Global Tax Filings": True,
            "Background Checks": True,
            "Native US Payroll": True,
            "Multi-Currency Wallets": True,
            "Free Trial Available": False
        }
    },
    "rippling": {
        "name": "Rippling",
        "logo": "/rippling.jpeg",
        "rating": 4.8,
        "starting_price": "$8/user/mo",
        "pricing_model": "Core platform from $8/user/mo; payroll and EOR are modular add-ons",
        "free_trial": False,
        "affiliate_url": "https://www.rippling.com",
        "key_features": ["Unified HR & IT", "US & Global Payroll", "Device Management", "App Provisioning"],
        "pros": ["Automates IT device setup alongside HR", "Powerful custom workflow engine", "Native US payroll integration"],
        "cons": ["Payroll, IT, and global EOR modules are add-ons—core $8/user pricing rarely equals all-in cost.", "EOR feature set is secondary to HRIS"],
        "matrix": {
            "Native Legal Entities": False,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": True,
            "Localized Health Benefits": True,
            "Equity & Stock Admin": True,
            "Zero FX Rate Markup": False,
            "Global Tax Filings": True,
            "Background Checks": True,
            "Native US Payroll": True,
            "Multi-Currency Wallets": False,
            "Free Trial Available": False
        }
    },
    "remote": {
        "name": "Remote",
        "logo": "/remote.jpeg",
        "rating": 4.6,
        "contractor_price": 29,
        "eor_price": 599,
        "starting_price": "$29/mo",
        "pricing_model": "EOR starts at $599/mo",
        "free_trial": True,
        "affiliate_url": "https://remote.com",
        "key_features": ["100% Native Entities", "IP Protection", "Global Benefits", "Remote Relocation"],
        "pros": ["Owns all local legal entities directly", "Strong IP guardrails for tech startups", "No hidden markup fees"],
        "cons": ["Slower entity expansion than Deel", "Limited IT management tooling"],
        "matrix": {
            "Native Legal Entities": True,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": True,
            "Equity & Stock Admin": True,
            "Zero FX Rate Markup": True,
            "Global Tax Filings": True,
            "Background Checks": True,
            "Native US Payroll": False,
            "Multi-Currency Wallets": False,
            "Free Trial Available": True
        }
    },
    "oyster": {
        "name": "Oyster HR",
        "logo": "/Oyster.png",
        "rating": 4.5,
        "contractor_price": 29,
        "eor_price": 699,
        "starting_price": "$29/mo",
        "pricing_model": "EOR starts at $699/mo",
        "free_trial": True,
        "affiliate_url": "https://www.oysterhr.com",
        "key_features": ["180+ Country Reach", "Oyster Academy", "Global Employment Cost Calculator", "Equity Admin"],
        "pros": ["Clean admin UX for first-time international contractor onboarding", "Global Employment Cost Calculator for founder budgeting", "180+ country contractor and EOR reach for distributed creative teams"],
        "cons": ["Relies on third-party local partners in select markets", "Higher published EOR list price ($699/mo) than Deel/Remote annual rates"],
        "matrix": {
            "Native Legal Entities": False,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": True,
            "Equity & Stock Admin": True,
            "Zero FX Rate Markup": False,
            "Global Tax Filings": True,
            "Background Checks": True,
            "Native US Payroll": False,
            "Multi-Currency Wallets": False,
            "Free Trial Available": True
        }
    },
    "gusto": {
        "name": "Gusto",
        "logo": "/gusto.jpeg",
        "rating": 4.6,
        "starting_price": "$49/mo + $6/user",
        "pricing_model": "US payroll Simple plan; no international EOR",
        "free_trial": True,
        "affiliate_url": "https://www.gusto.com",
        "key_features": ["US Native Payroll", "Benefits Administration", "International Contractor Pay", "Time Tracking"],
        "pros": ["Best-in-class user experience for US teams", "Automated state tax filings", "Transparent $49/mo + $6/user US payroll pricing without EOR-tier fees"],
        "cons": ["No full-time international EOR—global coverage is contractor payments only", "Domestic-first benefits administration with limited non-US statutory coverage"],
        "matrix": {
            "Native Legal Entities": False,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": False,
            "Equity & Stock Admin": False,
            "Zero FX Rate Markup": False,
            "Global Tax Filings": True,
            "Background Checks": False,
            "Native US Payroll": True,
            "Multi-Currency Wallets": False,
            "Free Trial Available": True
        }
    },
    "papaya": {
        "name": "Papaya Global",
        "logo": "https://unavatar.io/papayaglobal.com",
        "rating": 4.5,
        "contractor_price": 5,
        "eor_price": 499,
        "starting_price": "$5/mo",
        "pricing_model": "EOR starts at $499/mo",
        "free_trial": False,
        "affiliate_url": "https://papayaglobal.com",
        "key_features": ["Enterprise Payroll", "Workforce Intelligence", "Embedded Payments", "160+ Countries"],
        "pros": ["Built for complex enterprise security and ERPs", "Consolidated global payroll analytics", "Enterprise payroll controls suited to ERP-linked multi-entity finance teams"],
        "cons": ["High minimums and enterprise packaging poorly fit sub-50 headcount teams", "Implementation overhead geared to complex multi-entity payroll rather than lean startups"],
        "matrix": {
            "Native Legal Entities": False,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": True,
            "Equity & Stock Admin": False,
            "Zero FX Rate Markup": True,
            "Global Tax Filings": True,
            "Background Checks": True,
            "Native US Payroll": True,
            "Multi-Currency Wallets": False,
            "Free Trial Available": False
        }
    },
    "multiplier": {
        "name": "Multiplier",
        "logo": "/multiplier.jpeg",
        "rating": 4.7,
        "contractor_price": 40,
        "eor_price": 400,
        "starting_price": "$40/mo",
        "pricing_model": "EOR starts at $400/mo",
        "free_trial": False,
        "affiliate_url": "https://multipliertechnologiespteltd.pxf.io/B51kg9",
        "key_features": ["Self-Serve EOR", "Instant Employment Contracts", "Global Insurance", "Multi-Currency Payouts"],
        "pros": ["Competitive baseline EOR pricing ($400/mo)", "Instant contract generation", "Strong Asian market presence"],
        "cons": ["Fewer third-party HRIS/payroll integrations than Deel or Rippling", "Narrower self-serve contractor tooling versus larger EOR marketplaces"],
        "matrix": {
            "Native Legal Entities": True,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": True,
            "Equity & Stock Admin": False,
            "Zero FX Rate Markup": False,
            "Global Tax Filings": True,
            "Background Checks": False,
            "Native US Payroll": False,
            "Multi-Currency Wallets": False,
            "Free Trial Available": False
        }
    },
    "plane": {
        "name": "Plane",
        "logo": "/plane.jpeg",
        "rating": 4.6,
        "contractor_price": 39,
        "eor_price": 499,
        "starting_price": "$39/mo",
        "pricing_model": "EOR starts at $499/mo",
        "free_trial": True,
        "affiliate_url": "https://plane.com",
        "key_features": ["Zero FX Markup", "Stock Option Grants", "Flat-Fee Pricing", "Direct Crypto/Fiat Pay"],
        "pros": ["Transparent contractor pricing from $39/contractor/month with low FX markup on bank payouts", "Flat $499/mo EOR with free HRIS for startups", "Direct crypto and fiat payout options for global contractors"],
        "cons": ["Fewer automated localized HR add-ons", "Smaller legal footprint"],
        "matrix": {
            "Native Legal Entities": True,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": False,
            "Equity & Stock Admin": True,
            "Zero FX Rate Markup": True,
            "Global Tax Filings": False,
            "Background Checks": False,
            "Native US Payroll": False,
            "Multi-Currency Wallets": False,
            "Free Trial Available": True
        }
    },
    "payoneer-workforce-management": {
        "name": "Payoneer Workforce Management",
        "logo": "/payoneer-logo.png",
        "rating": 4.5,
        "contractor_price": 0,
        "starting_price": "$0/mo",
        "pricing_model": "$0/mo base for contractor accounts; 0%-1% cross-border payout fees",
        "free_trial": True,
        "affiliate_url": "https://payoneer557.partnerlinks.io/c9q0eynun43w",
        "key_features": ["190+ Country Batch Payouts", "Multi-Currency Wallets", "Zero-Fee Contractor Receiving", "W-8BEN/W-9 Collection"],
        "pros": ["Multi-currency wallets with batch payouts across 190+ countries", "Zero-fee receiving options for contractors plus local bank transfer, Payoneer card, and wire payout methods", "$0/mo base fee with automated contractor onboarding, tax form collection, and invoice management"],
        "cons": ["No EOR or owned legal entities, so it cannot employ full-time international staff on your behalf", "No statutory payroll filings or localized benefits administration, so it complements rather than replaces an EOR"],
        "matrix": {
            "Native Legal Entities": False,
            "Contractor Auto-Pay": True,
            "IT Device Shipping": False,
            "Localized Health Benefits": False,
            "Equity & Stock Admin": False,
            "Zero FX Rate Markup": False,
            "Global Tax Filings": False,
            "Background Checks": False,
            "Native US Payroll": False,
            "Multi-Currency Wallets": True,
            "Free Trial Available": True
        }
    },
}

ATS_TOOLS = {
    "ashby": {
        "name": "Ashby",
        "logo": "https://unavatar.io/ashbyhq.com",
        "rating": 4.7,
        "starting_price": "$400/mo",
        "pricing_model": "Flat monthly fee up to 100 employees (Foundations plan)",
        "free_trial": False,
        "affiliate_url": "https://www.ashbyhq.com",
        "key_features": ["Sourcing CRM & Analytics", "AI Candidate Summaries", "Structured Scorecards", "Multi-Time-Zone Scheduling"],
        "pros": ["Deep recruiting analytics built into the ATS", "Combines ATS, CRM, and scheduling in one tool", "Predictable flat-tier pricing with no per-seat fees"],
        "cons": ["No published free trial", "Steeper learning curve for advanced analytics"],
        "matrix": {
            "Structured Scorecards": True,
            "Candidate Sourcing CRM": True,
            "AI Candidate Sourcing": True,
            "Job Board Syndication": False,
            "Multi-Language Support": False,
            "Native HRIS Integration": False,
            "Unlimited User Seats": True,
            "GDPR Compliance Tools": True,
            "Background Check Integrations": False,
            "Free Trial Available": False
        }
    },
    "greenhouse": {
        "name": "Greenhouse",
        "logo": "/Greenhouse.jpeg",
        "rating": 4.4,
        "starting_price": "Custom quote",
        "pricing_model": "Custom annual contract (quote-based)",
        "free_trial": False,
        "affiliate_url": "https://www.greenhouse.io",
        "key_features": ["Structured Hiring Scorecards", "400+ Native Integrations", "DEI & Compliance Reporting", "Global Job Board Postings"],
        "pros": ["Industry-leading integration ecosystem", "Rigorous, auditable structured hiring methodology", "Best-in-class DEI and compliance reporting"],
        "cons": ["Custom pricing requires a sales call", "Steep setup and learning curve for smaller teams"],
        "matrix": {
            "Structured Scorecards": True,
            "Candidate Sourcing CRM": False,
            "AI Candidate Sourcing": False,
            "Job Board Syndication": True,
            "Multi-Language Support": True,
            "Native HRIS Integration": True,
            "Unlimited User Seats": False,
            "GDPR Compliance Tools": True,
            "Background Check Integrations": True,
            "Free Trial Available": False
        }
    },
    "lever": {
        "name": "Lever",
        "logo": "https://unavatar.io/lever.co",
        "rating": 4.4,
        "starting_price": "Custom quote",
        "pricing_model": "Custom annual contract (quote-based)",
        "free_trial": False,
        "affiliate_url": "https://www.lever.co",
        "key_features": ["Candidate Relationship Management", "Automated Nurture Campaigns", "Built-in E-Signature", "Visual Pipeline Tracking"],
        "pros": ["Strong outbound sourcing and CRM tooling", "Clean, fast UI that hiring managers adopt quickly", "Automated candidate rediscovery for silver medalists"],
        "cons": ["Custom pricing lacks upfront transparency", "Fewer native analytics than Ashby"],
        "matrix": {
            "Structured Scorecards": True,
            "Candidate Sourcing CRM": True,
            "AI Candidate Sourcing": False,
            "Job Board Syndication": False,
            "Multi-Language Support": False,
            "Native HRIS Integration": False,
            "Unlimited User Seats": False,
            "GDPR Compliance Tools": True,
            "Background Check Integrations": False,
            "Free Trial Available": False
        }
    },
    "workable": {
        "name": "Workable",
        "logo": "https://unavatar.io/workable.com",
        "rating": 4.4,
        "starting_price": "$299/mo",
        "pricing_model": "Standard plan from $299/mo (1–20 employees)",
        "free_trial": True,
        "affiliate_url": "https://www.workable.com",
        "key_features": ["One-Click Job Board Syndication", "AI Candidate Sourcing", "Background Check Integrations", "Basic HR Onboarding Tools"],
        "pros": ["Transparent published pricing, no sales calls required", "One-click distribution to 200+ job boards", "Built-in AI sourcing database of 400M+ profiles"],
        "cons": ["Add-on fees for video interviewing and texting", "Less depth for complex enterprise hiring programs"],
        "matrix": {
            "Structured Scorecards": False,
            "Candidate Sourcing CRM": False,
            "AI Candidate Sourcing": True,
            "Job Board Syndication": True,
            "Multi-Language Support": False,
            "Native HRIS Integration": False,
            "Unlimited User Seats": False,
            "GDPR Compliance Tools": True,
            "Background Check Integrations": True,
            "Free Trial Available": True
        }
    },
    "breezy-hr": {
        "name": "Breezy HR",
        "logo": "/breezy-logo.png",
        "rating": 4.4,
        "starting_price": "Free tier / $157/mo",
        "pricing_model": "Free Bootstrap tier; paid Startup from about $157/mo",
        "free_trial": True,
        "affiliate_url": "https://breezyhr.partnerlinks.io/ahid34bxoa2w",
        "key_features": ["Drag-and-Drop Pipelines", "Async Video Screening", "Self-Service Interview Scheduling", "Automated Candidate Messaging"],
        "pros": ["Free tier available to test the platform", "Intuitive, Trello-style visual pipeline", "Built-in asynchronous video screening"],
        "cons": ["Fewer enterprise-grade compliance tools", "Smaller third-party integration marketplace"],
        "matrix": {
            "Structured Scorecards": False,
            "Candidate Sourcing CRM": False,
            "AI Candidate Sourcing": False,
            "Job Board Syndication": True,
            "Multi-Language Support": False,
            "Native HRIS Integration": False,
            "Unlimited User Seats": False,
            "GDPR Compliance Tools": True,
            "Background Check Integrations": False,
            "Free Trial Available": True
        }
    },
    "jazzhr": {
        "name": "JazzHR",
        "logo": "https://unavatar.io/jazzhr.com",
        "rating": 4.4,
        "starting_price": "$75/mo",
        "pricing_model": "Tiered monthly plans from $75/mo",
        "free_trial": True,
        "affiliate_url": "https://www.jazzhr.com",
        "key_features": ["Unlimited User Seats", "Job Board Syndication", "Customizable Hiring Workflows", "OFCCP/EEOC Reporting"],
        "pros": ["Ultra-affordable entry-level pricing", "Unlimited free user seats for every interviewer", "Simple, no-nonsense candidate tracking"],
        "cons": ["Primarily focused on US/North American hiring", "Fewer advanced sourcing or CRM tools"],
        "matrix": {
            "Structured Scorecards": False,
            "Candidate Sourcing CRM": False,
            "AI Candidate Sourcing": False,
            "Job Board Syndication": True,
            "Multi-Language Support": False,
            "Native HRIS Integration": False,
            "Unlimited User Seats": True,
            "GDPR Compliance Tools": False,
            "Background Check Integrations": False,
            "Free Trial Available": True
        }
    },
    "recruitee": {
        "name": "Recruitee",
        "logo": "/Recruitee.png",
        "rating": 4.5,
        "starting_price": "$199/mo",
        "pricing_model": "Launch plan from $199/mo (job-slot based, unlimited users)",
        "free_trial": True,
        "affiliate_url": "https://join.tellent.com/t5yy8cn4dn30",
        "key_features": ["Multi-Language Careers Sites", "Visual Pipeline Management", "European GDPR Data Residency", "Collaborative Evaluations"],
        "pros": ["Strong European GDPR compliance and data residency", "Beautiful, custom-branded multi-language careers pages", "Unlimited team member seats across departments"],
        "cons": ["Smaller North American market presence", "Fewer AI-driven sourcing features"],
        "matrix": {
            "Structured Scorecards": False,
            "Candidate Sourcing CRM": False,
            "AI Candidate Sourcing": False,
            "Job Board Syndication": True,
            "Multi-Language Support": True,
            "Native HRIS Integration": False,
            "Unlimited User Seats": True,
            "GDPR Compliance Tools": True,
            "Background Check Integrations": False,
            "Free Trial Available": True
        }
    },
    "bamboohr-ats": {
        "name": "BambooHR",
        "logo": "/bamboohr.jpeg",
        "rating": 4.4,
        "starting_price": "Custom quote",
        "pricing_model": "Custom quote (bundled with BambooHR HRIS)",
        "free_trial": True,
        "affiliate_url": "https://www.bamboohr.com/?eid=fopydE",
        "key_features": ["Native BambooHR HRIS Sync", "Candidate-to-Employee Conversion", "Mobile Hiring Approvals", "Secure E-Signatures"],
        "pros": ["Zero manual data entry from candidate to employee record", "Single mobile app for HR admin and recruiting", "Simple, streamlined pipeline for small teams"],
        "cons": ["Only sold bundled with the BambooHR HRIS", "Fewer standalone ATS features than dedicated tools"],
        "matrix": {
            "Structured Scorecards": False,
            "Candidate Sourcing CRM": False,
            "AI Candidate Sourcing": False,
            "Job Board Syndication": False,
            "Multi-Language Support": False,
            "Native HRIS Integration": True,
            "Unlimited User Seats": False,
            "GDPR Compliance Tools": False,
            "Background Check Integrations": False,
            "Free Trial Available": True
        }
    },
}

PM_TOOLS = {
    "15five": {
        "name": "15Five",
        "logo": "https://unavatar.io/15five.com",
        "rating": 4.6,
        "starting_price": "$4/user/mo",
        "pricing_model": "Per user / month (Engage, Perform, and Total Platform tiers)",
        "free_trial": True,
        "affiliate_url": "https://www.15five.com",
        "key_features": ["Weekly Check-ins", "OKRs & Goals", "1:1 Agenda Tools", "Manager Coaching"],
        "pros": ["Excellent manager coaching and weekly check-in cadence", "Strong OKR cascading with lightweight reviews", "Transparent published pricing with a free trial"],
        "cons": ["Engagement survey depth trails Culture Amp", "Compensation calibration is less mature than Lattice"],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": True,
            "Engagement Surveys": True,
            "Compensation Calibration": False,
            "Career Pathing": True,
            "AI Performance Insights": True,
            "Slack/Teams Integration": True,
            "Free Trial Available": True
        }
    },
    "performyard": {
        "name": "PerformYard",
        "logo": "/PerformYard.jpeg",
        "rating": 4.7,
        "starting_price": "$5/user/mo",
        "pricing_model": "Per user / month with configurable review cycle modules",
        "free_trial": False,
        "affiliate_url": "https://www.performyard.com",
        "key_features": [
            "Configurable Review Cycles",
            "1:1 Meeting Tools",
            "Engagement Surveys",
            "Career Pathing",
            "AI Performance Insights",
        ],
        "pros": [
            "Highly configurable review templates without heavy implementation",
            "1:1 agendas, engagement surveys, career pathing, and AI insights in one mid-market suite",
            "Strong customer support for HR admins running custom performance cycles",
        ],
        "cons": [
            "Engagement survey depth still trails dedicated culture platforms like Culture Amp",
            "Compensation and talent-calibration depth trails Lattice for large enterprise programs",
        ],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": True,
            "Engagement Surveys": True,
            "Compensation Calibration": True,
            "Career Pathing": True,
            "AI Performance Insights": True,
            "Slack/Teams Integration": True,
            "Free Trial Available": False,
        },
    },
    "leapsome": {
        "name": "Leapsome",
        "logo": "/leapsome.jpeg",
        "rating": 4.8,
        "starting_price": "$8/user/mo",
        "pricing_model": "Modular per-user pricing (Reviews, Goals, Engagement, Learning)",
        "free_trial": True,
        "affiliate_url": "https://www.leapsome.com",
        "key_features": ["Modular Reviews & Goals", "Learning Paths", "Engagement Surveys", "AI Writing Assist"],
        "pros": ["Best-in-class modular suite spanning reviews, learning, and engagement", "Strong European GDPR posture", "AI assists for review writing and goal drafting"],
        "cons": ["Per-module pricing can stack for full-suite buyers", "North American brand awareness still catching up"],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": True,
            "Engagement Surveys": True,
            "Compensation Calibration": True,
            "Career Pathing": True,
            "AI Performance Insights": True,
            "Slack/Teams Integration": True,
            "Free Trial Available": True
        }
    },
    "lattice": {
        "name": "Lattice",
        "logo": "/lattice.jpeg",
        "rating": 4.7,
        "starting_price": "$10/user/mo",
        "pricing_model": "Performance module from $10/user/mo (Goals from $8)",
        "free_trial": False,
        "affiliate_url": "https://lattice.com/demo?utm_source=The-HR-Stack-Guide&utm_medium=partner&utm_campaign=referral",
        "key_features": ["Performance Reviews", "OKRs", "Compensation Bands", "Talent Reviews"],
        "pros": ["Deep compensation calibration tied to performance data", "Mature OKR and talent review workflows", "Strong analytics for People leaders"],
        "cons": ["Module add-ons (Engagement, Grow, Compensation) can push total seat cost well above the $8 Performance base.", "No self-serve free trial; requires a sales demo"],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": True,
            "Engagement Surveys": True,
            "Compensation Calibration": True,
            "Career Pathing": True,
            "AI Performance Insights": True,
            "Slack/Teams Integration": True,
            "Free Trial Available": False
        }
    },
    "culture-amp": {
        "name": "Culture Amp",
        "logo": "https://unavatar.io/cultureamp.com",
        "rating": 4.5,
        "starting_price": "Custom quote",
        "pricing_model": "Custom quote (Engage / Perform / Develop bundles)",
        "free_trial": False,
        "affiliate_url": "https://www.cultureamp.com",
        "key_features": ["Science-Backed Engagement Surveys", "Performance Reviews", "Development Plans", "People Science Benchmarks"],
        "pros": ["Industry-leading engagement survey science and benchmarks", "Actionable people-science insights for HRBPs", "Strong development planning alongside performance"],
        "cons": ["Performance module is secondary to engagement strengths", "Enterprise sales cycle for full platform access"],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": False,
            "Engagement Surveys": True,
            "Compensation Calibration": False,
            "Career Pathing": True,
            "AI Performance Insights": True,
            "Slack/Teams Integration": True,
            "Free Trial Available": False
        }
    },
    "reflektive": {
        "name": "PeopleFluent",
        "logo": "https://unavatar.io/peoplefluent.com",
        "rating": 4.2,
        "starting_price": "Custom quote",
        "pricing_model": "Custom quote (Workday-era packaging)",
        "free_trial": False,
        "affiliate_url": "https://www.peoplefluent.com/",
        "key_features": ["Real-Time Feedback", "Goals", "Review Cycles", "Recognition Feed"],
        "pros": ["Lightweight continuous feedback and recognition UX", "Familiar for teams transitioning from legacy Reflektive workflows", "Solid Slack-native feedback loops"],
        "cons": ["Smaller modern market footprint versus category leaders", "Fewer modern AI and compensation modules than Lattice/Leapsome"],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": False,
            "Engagement Surveys": False,
            "Compensation Calibration": False,
            "Career Pathing": False,
            "AI Performance Insights": False,
            "Slack/Teams Integration": True,
            "Free Trial Available": False
        }
    },
    "clearcompany": {
        "name": "ClearCo",
        "logo": "/ClearCo.jpeg",
        "rating": 4.5,
        "starting_price": "Custom quote",
        "pricing_model": "Custom quote (talent suite bundle)",
        "free_trial": False,
        "affiliate_url": "https://www.clearcompany.com/",
        "key_features": ["Performance Reviews", "Goal Alignment", "Talent Suite Bundle", "Onboarding Handoff"],
        "pros": ["Performance reviews connected to the same suite as ATS and onboarding", "Configurable review workflows without heavy IT", "Talent data handoff from hiring into ongoing performance cycles"],
        "cons": ["Performance depth trails dedicated PM specialists", "Best value only when buying the broader ClearCo (formerly ClearCompany) suite"],
        "matrix": {
            "OKRs & Goal Cascading": True,
            "Continuous Feedback": True,
            "360 Degree Reviews": True,
            "1:1 Meeting Tools": False,
            "Engagement Surveys": True,
            "Compensation Calibration": False,
            "Career Pathing": True,
            "AI Performance Insights": False,
            "Slack/Teams Integration": True,
            "Free Trial Available": False
        }
    },
}

# Editorial layer applied to every vendor in all three registries above:
#
#   badge          - the sub-niche positioning tag rendered as a pill beside the
#                    vendor name in comparison table headers and on the category
#                    hub rosters. This is the single source of truth for that
#                    string, so a vendor's badge reads identically everywhere.
#   pricing_nuance - the fine print behind the headline price (add-ons, FX
#                    spreads, per-module gating). This is the detail generic
#                    comparison sites omit, so it is the most citable field here.
#   take_fit       - lowercase clause naming the buying condition where this
#                    vendor wins, used after "If ..." in The HR Stack Guide Take.
#   take_edge      - lowercase clause naming the vendor's core differentiator,
#                    used as the payoff to that sentence.
#
# Kept as one block rather than inlined into each tool dict so all 24 vendors
# are reviewable side by side, which is what keeps the badges mutually distinct
# and the pricing nuances specific rather than interchangeable filler.
VENDOR_EDITORIAL = {
    # --- Global Payroll & EOR ---
    "deel": {
        "badge": "Best for Global Scale & Owned Entities",
        "pricing_nuance": "The $49/contractor and $599/employee headline rates exclude the add-ons most global teams end up buying: Deel Shield misclassification cover, equipment procurement and shipping, and background checks are each billed separately. FX conversion spreads on payouts sit on top of the platform fee, so model your actual payout corridors rather than the sticker price.",
        "take_fit": "you are hiring full-time employees in several countries at once and want one vendor to own entities, contracts, and equipment",
        "take_edge": "its 150+ country owned-entity network and 24-hour onboarding remove the entity-setup bottleneck entirely",
    },
    "rippling": {
        "badge": "Best for Multi-State Scaling",
        "pricing_nuance": "The advertised $8/user/month buys the core workforce platform only. Payroll, benefits administration, device management, and global EOR are separately priced modules, so a realistic all-in quote for a team running payroll plus IT typically lands at several multiples of the base rate. Ask for module-level line items before comparing it against a bundled EOR price.",
        "take_fit": "you want HR, payroll, and IT device provisioning running off one employee record",
        "take_edge": "its workflow automation spans onboarding, app access, and hardware provisioning in a single system",
    },
    "remote": {
        "badge": "Best for Direct IP Protection & Owned Entities",
        "pricing_nuance": "EOR is $599/month per employee on an annual commitment but $699 month-to-month, so the headline figure assumes you prepay for a year. IP protection and owned-entity compliance are included rather than upsold, and Remote does not add an FX markup on payouts, which can make the effective cost lower than a cheaper-looking competitor once currency conversion is counted.",
        "take_fit": "your board treats IP ownership and compliance purity as non-negotiable",
        "take_edge": "it owns 100% of its local entities and folds IP assignment plus zero-markup FX into the base fee",
    },
    "oyster": {
        "badge": "Best for Mid-Market UX & Remote Perks",
        "pricing_nuance": "The $699/month EOR list price is the highest published rate in this category, and also the most negotiable: volume and annual commitments routinely pull it below list for teams above roughly ten employees. Contractor management is $29/month after a 30-day trial, and some markets are served through local partners rather than owned entities, which can introduce deposit requirements.",
        "take_fit": "you are a mid-market remote team where admin and employee experience drive adoption",
        "take_edge": "its onboarding UX and employment cost calculator make first-time international hiring legible to non-specialists",
    },
    "gusto": {
        "badge": "Best for US SMBs (1\u201350)",
        "pricing_nuance": "The $49/month base plus $6/user rate covers US payroll and filings, but benefits administration, HR support, and time tracking sit on higher tiers. International contractor payments are billed per transfer on top of the subscription, and the FX conversion applied to those transfers is where the real cost of paying overseas contractors through Gusto accumulates.",
        "take_fit": "your workforce is US-based and you want payroll, tax filings, and benefits to run themselves",
        "take_edge": "automated federal, state, and local filings come standard with the cleanest admin experience for lean teams",
    },
    "papaya": {
        "badge": "Best for Enterprise Consolidated Payroll BI",
        "pricing_nuance": "Contractor management from $5/month looks category-leading, but Papaya is packaged for enterprise buyers: EOR starts at $499/month per employee and real quotes carry implementation fees, platform minimums, and country-complexity surcharges. Benefit administration and salary deposits in higher-risk jurisdictions are quoted separately.",
        "take_fit": "your finance team needs consolidated payroll reporting across owned entities and EOR workers in 20+ countries",
        "take_edge": "its workforce intelligence layer and ERP-grade controls are built for exactly that reporting problem",
    },
    "multiplier": {
        "badge": "Best for APAC & Regional Cost Value",
        "pricing_nuance": "At $400/month per EOR employee, Multiplier undercuts most owned-entity competitors, but statutory benefit packages and country-specific admin fees are quoted per market rather than bundled. Ask for a country-by-country breakdown of your specific hiring markets, since the gap between the base rate and the all-in cost varies more here than with flat-fee providers.",
        "take_fit": "you are hiring concentrated headcount across APAC or EMEA and price per seat is the deciding factor",
        "take_edge": "it delivers instant localized contracts at one of the lowest published EOR rates in the category",
    },
    "plane": {
        "badge": "Best for Tech Startups & Low FX Fees",
        "pricing_nuance": "Flat $39/contractor and $499/month EOR with a free HRIS keeps the base predictable, and low FX markup on direct bank payouts is a genuine differentiator for contractor-heavy teams. The trade-off is scope: localized benefits and statutory add-ons are thinner than larger providers, so complex markets may need a second vendor alongside it.",
        "take_fit": "you are a venture-backed startup paying developers abroad and want flat, low-overhead fees",
        "take_edge": "transparent flat pricing plus minimal FX markup keeps the true cost per contractor closest to the sticker price",
    },
    "payoneer-workforce-management": {
        "badge": "Best for Cross-Border Contractor Payouts",
        "pricing_nuance": "There is no subscription at all: contractor receiving and management accounts are $0/month and Payoneer monetizes the transfer instead. Cross-border payout fees typically run 0%\u20131% depending on method, with wallet transfers at the low end and card or wire withdrawals at the high end, so the FX conversion spread on your specific currency corridors is the number to model.",
        "take_fit": "you are paying contractors across many currencies and do not need an employer of record",
        "take_edge": "it runs batch payouts from multi-currency wallets into 190+ countries at a zero monthly base fee",
    },
    # --- Applicant Tracking Systems ---
    "ashby": {
        "badge": "Best for All-in-One Recruiting Analytics",
        "pricing_nuance": "Flat-tier pricing from $400/month up to 100 employees means unlimited seats with no per-recruiter charge, which usually beats seat-based rivals once your interview panel grows. The catch is the step change: pricing rescales as headcount crosses tier boundaries, and there is no free trial, so budget for a paid pilot.",
        "take_fit": "you want funnel analytics and a sourcing CRM inside the ATS rather than bolted on afterwards",
        "take_edge": "its reporting depth and unlimited-seat flat tiers reward teams that actually instrument their hiring funnel",
    },
    "greenhouse": {
        "badge": "Best for Enterprise Structured Hiring",
        "pricing_nuance": "Greenhouse is quote-only on annual contracts, and the published tiers gate significant capability: advanced reporting, CRM, and parts of the compliance suite sit above the entry plan. Expect per-seat licensing plus an implementation fee, and confirm which of the 400+ integrations require a higher tier before you sign.",
        "take_fit": "you need auditable, structured hiring backed by a deep integration ecosystem",
        "take_edge": "its scorecard methodology and DEI reporting are the category benchmark for defensible hiring decisions",
    },
    "lever": {
        "badge": "Best for Outbound CRM & Candidate Nurture",
        "pricing_nuance": "Pricing is quote-based and typically seat-licensed on an annual contract, so cost scales with how many hiring managers you onboard. Nurture campaigns and advanced analytics are packaged into higher tiers, which means the outbound sourcing strength that makes Lever attractive is often not in the entry-level quote.",
        "take_fit": "your hiring depends on outbound sourcing and re-engaging candidates you already know",
        "take_edge": "its ATS and candidate CRM are genuinely unified, so nurture campaigns run off the same pipeline data",
    },
    "workable": {
        "badge": "Best for Built-in AI Candidate Sourcing",
        "pricing_nuance": "Published pricing from $299/month is refreshingly transparent, but it is banded by headcount and the Standard plan caps active jobs. Video interviewing, candidate texting, and assessments are paid add-ons, so the AI sourcing database is the value driver at the base rate rather than the full toolkit.",
        "take_fit": "you want to post widely and source proactively without sitting through a sales call",
        "take_edge": "one-click syndication to 200+ job boards plus a 400M-profile sourcing database ships in the base product",
    },
    "breezy-hr": {
        "badge": "Best for Visual Drag-and-Drop Pipelines",
        "pricing_nuance": "The free Bootstrap tier is genuinely usable for a single open role, making Breezy the cheapest way to trial a real pipeline. Paid plans from about $157/month are priced by active job pool rather than per user, so cost tracks how many roles you run concurrently instead of how large your team is.",
        "take_fit": "you are a small team that wants a visual pipeline live this week with no procurement cycle",
        "take_edge": "a free tier, Trello-style pipelines, and built-in async video screening get real hiring running without setup overhead",
    },
    "jazzhr": {
        "badge": "Best for Budget SMB Unlimited Posting",
        "pricing_nuance": "From $75/month with unlimited user seats, JazzHR has the lowest true cost of entry in this comparison set, but plans are tiered by number of open jobs. Compliance reporting and several integrations require the higher tiers, and coverage is oriented to US and North American hiring.",
        "take_fit": "you are cost-constrained and want every interviewer in the system without paying per seat",
        "take_edge": "unlimited free seats at $75/month removes the usual trade-off between budget and panel participation",
    },
    "recruitee": {
        "badge": "Best for EU GDPR Data Residency & Employer Brand",
        "pricing_nuance": "The $199/month Launch plan is job-slot based with unlimited users, so cost scales with concurrent openings rather than headcount. Careers-site customization and multi-language pages are core rather than add-ons, though advanced automation sits on higher tiers and North American integrations are thinner than US-first rivals.",
        "take_fit": "you hire across European markets and need GDPR data residency alongside localized careers pages",
        "take_edge": "EU data residency and multi-language employer branding are native here rather than retrofitted",
    },
    "bamboohr-ats": {
        "badge": "Best for BambooHR Ecosystem Integration",
        "pricing_nuance": "The ATS is not sold standalone: it is quoted as a module on top of a BambooHR HRIS subscription, so the real comparison is that bundle price against a dedicated ATS plus integration work. The bundling is the entire point for existing BambooHR customers and the disqualifier for everyone else.",
        "take_fit": "you already run BambooHR as your HRIS and want hiring to live in the same system",
        "take_edge": "candidate-to-employee conversion needs no re-entry because the candidate and the employee are one record",
    },
    # --- Performance Management ---
    "15five": {
        "badge": "Best for Manager Coaching & Weekly Check-ins",
        "pricing_nuance": "From $4/user/month, 15Five is priced per module: Engage, Perform, and Total Platform are separate tiers, so the $4 entry rate rarely covers reviews and engagement together. Manager coaching content is an additional line item, which matters because coaching is the main reason teams pick it.",
        "take_fit": "your real bottleneck is manager capability and you want a weekly check-in habit to stick",
        "take_edge": "its check-in cadence and coaching layer change manager behaviour rather than just recording reviews",
    },
    "performyard": {
        "badge": "Best for Configurable Mid-Market Reviews",
        "pricing_nuance": "At $5/user/month, PerformYard sits at the low end of this category while including 1:1s, engagement surveys, career pathing, and AI insights that rivals sell as separate modules. There is no self-serve trial, so evaluation runs through a guided demo, and review-cycle configuration is where implementation time is actually spent.",
        "take_fit": "you need genuinely custom review cycles without an enterprise implementation project",
        "take_edge": "its template flexibility and bundled feature set at $5/user undercut modular competitors on all-in cost",
    },
    "leapsome": {
        "badge": "Best for Modular Reviews + Learning Suite",
        "pricing_nuance": "The $8/user/month entry rate is per module. Reviews, Goals, Engagement, and Learning are priced separately, so full-suite buyers should expect the effective per-seat cost to stack well above the headline figure. Request a bundled quote rather than adding modules onto a base price.",
        "take_fit": "you want performance, engagement, and learning in one system with a strong EU data posture",
        "take_edge": "it is the broadest modular suite here, and its learning paths connect directly to review outcomes",
    },
    "lattice": {
        "badge": "Best for Compensation & Talent Calibration",
        "pricing_nuance": "Performance starts at $10/user/month and Goals at $8, but Engagement, Grow, and Compensation are add-on modules that can push the real per-seat cost to several times the entry rate. There is no self-serve trial, so a sales demo is the only evaluation path.",
        "take_fit": "you run calibrated performance and compensation cycles that have to withstand scrutiny",
        "take_edge": "compensation banding tied directly to performance data is the most mature implementation in this set",
    },
    "culture-amp": {
        "badge": "Best for Engagement Science & Benchmarks",
        "pricing_nuance": "Quote-only, bundled as Engage, Perform, and Develop, and priced for enterprise procurement. Engagement is the flagship and performance is the secondary module, so buying Culture Amp primarily for reviews usually means paying for survey science you will not fully use.",
        "take_fit": "engagement measurement and people-science benchmarks are the actual reason you are buying",
        "take_edge": "its survey methodology and benchmark dataset are the strongest evidence base in the category",
    },
    "reflektive": {
        "badge": "Best for Lightweight Continuous Feedback (PeopleFluent)",
        "pricing_nuance": "Quote-only under legacy Workday-era packaging, so pricing is negotiated rather than published and contract terms vary widely. The feature set is narrower than modern rivals, which makes benchmarking any quote against cheaper per-seat tools essential before renewal.",
        "take_fit": "you want Slack-native recognition and continuous feedback without a full performance suite",
        "take_edge": "its feedback and recognition loops are light enough that adoption does not need a rollout programme",
    },
    "clearcompany": {
        "badge": "Best for Talent Suite + Performance Bundle (ClearCo)",
        "pricing_nuance": "Performance is quoted as part of the wider ClearCo talent suite, so the economics only work if you are also buying ATS and onboarding. Bought standalone, its performance depth does not justify the suite price against dedicated specialists.",
        "take_fit": "you are consolidating ATS, onboarding, and performance under a single vendor",
        "take_edge": "hiring data flows into performance cycles with no integration project because it is all one suite",
    },
}


def attach_vendor_editorial():
    """Merge VENDOR_EDITORIAL into every tool record across all three category
    registries. Missing metadata raises KeyError on import rather than silently
    generating 425 pages with blank badges and empty pricing callouts."""
    for registry in (TOOLS, ATS_TOOLS, PM_TOOLS):
        for tool_id, tool in registry.items():
            tool.update(VENDOR_EDITORIAL[tool_id])


attach_vendor_editorial()


# "Global partner platforms" - the vendors our site is built around (Global EOR,
# international contractor management, and SMB usability). When one of these is
# compared against a general-purpose HR platform like Rippling, the verdict is
# framed around the specific use case our audience cares about rather than a
# single blanket "better overall" claim, while the underlying star ratings above
# stay untouched and reflect the same consistent criteria for every vendor.
PARTNER_IDS = {"deel", "oyster", "remote", "gusto", "payoneer-workforce-management"}

PARTNER_FOCUS = {
    "deel": {
        "category": "Global EOR",
        "bullets": [
            "150+ country EOR network with dedicated in-market legal entities, versus a narrower international EOR footprint",
            "24-hour EOR onboarding backed by in-house compliance and legal teams in each market",
            "Equipment shipping and background checks are bundled directly into the EOR workflow for faster international hires",
        ],
    },
    "remote": {
        "category": "Global EOR",
        "bullets": [
            "Owns 100% of its local legal entities directly rather than relying on secondary EOR partners",
            "Zero FX markup on cross-border payouts keeps international payroll costs predictable",
            "Built-in IP and invention-assignment protections purpose-built for distributed, IP-sensitive teams",
        ],
    },
    "oyster": {
        "category": "International Contractor Management",
        "bullets": [
            "180+ country contractor and EOR reach with a dedicated Global Employment Cost Calculator for upfront budgeting",
            "Contractor-first onboarding flows purpose-built for hiring across borders, rather than adapted from a domestic-first HRIS",
            "Oyster Academy resources help first-time international hiring teams navigate compliance without dedicated in-house legal support",
        ],
    },
    "gusto": {
        "category": "Domestic SMB Simplicity",
        "bullets": [
            "Best-in-class US payroll experience purpose-built for small teams, without added IT device-management overhead",
            "Automated state-by-state tax filings come standard, reducing the compliance workload for lean SMB teams",
            "Simple, transparent per-employee pricing starting lower than a base-fee-plus-per-user model",
        ],
    },
    "payoneer-workforce-management": {
        "category": "Cross-Border Contractor Payouts",
        "bullets": [
            "Multi-currency wallets with batch payout capabilities across 190+ countries, rather than routing every international contractor payment through a domestic-first payroll rail",
            "Zero-fee receiving options for contractors plus flexible payout methods (local bank transfer, Payoneer card, wire) keep worker-side costs down on every transfer",
            "Automated contractor onboarding with W-8BEN/W-9 tax form collection and invoice management built directly into the payout workflow",
        ],
    },
}

def natural_audience_phrase(niche_name, trailing_word="teams"):
    """
    Combine a niche name with a trailing collective noun (e.g. "teams",
    "scaleups", "agencies") without producing an awkward duplicate when the
    niche name already ends with that word or its singular form.

    Example: natural_audience_phrase("Web3 & Crypto Teams", "teams")
             -> "Web3 & Crypto Teams"        (not "Web3 & Crypto Teams teams")
             natural_audience_phrase("Tech Startups", "teams")
             -> "Tech Startups teams"
    """
    lowered_name = niche_name.lower().rstrip(".")
    lowered_trailing = trailing_word.lower()
    singular_trailing = lowered_trailing[:-1] if lowered_trailing.endswith("s") else lowered_trailing

    if lowered_name.endswith(lowered_trailing) or lowered_name.endswith(singular_trailing):
        return niche_name
    return f"{niche_name} {trailing_word}"


NICHES = {
    "tech-startups": {
        "name": "Tech Startups",
        "audience": "High-growth technology startups and distributed teams scaling global payroll, compliance, and remote operations.",
        "focus_feature": "IP ownership, fast onboarding, and equity option distribution."
    },
    "agencies": {
        "name": "Design & Marketing Agencies",
        "audience": "Lean businesses and growing teams looking for automated domestic payroll, benefits administration, and simple HR operations.",
        "focus_feature": "Flexible monthly contractor invoicing, fast payouts, and zero overhead."
    },
    "web3-crypto": {
        "name": "Web3 & Crypto Teams",
        "audience": "Distributed companies managing cross-border contractors, international EOR employees, and foreign currency payouts.",
        "focus_feature": "Multi-currency support, flexible contractor contracts, and minimal bureaucracy."
    },
    "us-latam": {
        "name": "US Companies Hiring in LATAM",
        "audience": "Distributed companies managing cross-border contractors, international EOR employees, and foreign currency payouts.",
        "focus_feature": "Localized LATAM compliance, health benefits, and same-time-zone payroll processing."
    },
    "scaleups": {
        "name": "Mid-Market Scaleups",
        "audience": "Fast-scaling companies expanding headcount across multiple regions while streamlining core HR workflows.",
        "focus_feature": "Custom HRIS integrations, IT device provisioning, and enterprise compliance reporting."
    }
}

# Audience intents for the Applicant Tracking Systems (ATS) sub-vertical. Kept
# in a separate namespace from NICHES above (Global Payroll & EOR) even though
# a couple of names overlap ("scaleups", "agencies") in spirit, since these
# describe a different tool category with its own tool_a_id/tool_b_id space,
# so slugs never collide and "related comparisons" naturally stay within the
# same sub-vertical (it ranks candidates by shared tool ids, and every ATS row
# always has same-category matches that outscore any cross-category overlap).
ATS_NICHES = {
    "startups": {
        "name": "Startups",
        "audience": "High-growth technology startups and distributed teams scaling global payroll, compliance, and remote operations.",
        "focus_feature": "fast setup, transparent pricing, and flexible seat-based collaboration."
    },
    "scaleups": {
        "name": "Scaleups",
        "audience": "Fast-scaling companies expanding headcount across multiple regions while streamlining core HR workflows.",
        "focus_feature": "structured scorecards, recruiting analytics, and predictable flat-tier pricing."
    },
    "enterprise": {
        "name": "Enterprise",
        "audience": "Global enterprise organizations requiring multi-entity payroll, custom HRIS integrations, and strict compliance security.",
        "focus_feature": "rigorous compliance reporting, deep integrations, and enterprise-grade structured hiring."
    },
    "agencies": {
        "name": "Staffing & Recruiting Agencies",
        "audience": "Lean businesses and growing teams looking for automated domestic payroll, benefits administration, and simple HR operations.",
        "focus_feature": "high-volume sourcing, candidate CRM tooling, and multi-client pipeline visibility."
    },
    "remote-teams": {
        "name": "Remote-First Teams",
        "audience": "Distributed companies managing cross-border contractors, international EOR employees, and foreign currency payouts.",
        "focus_feature": "multi-time-zone scheduling, multi-language support, and asynchronous collaboration tools."
    }
}

# Audience intents for the Performance Management sub-vertical. Separate
# namespace from NICHES / ATS_NICHES so slugs never collide across categories
# even when niche ids overlap (e.g. "startups", "scaleups", "enterprise").
PM_NICHES = {
    "startups": {
        "name": "Startups",
        "audience": "High-growth technology startups and distributed teams scaling global payroll, compliance, and remote operations.",
        "focus_feature": "fast setup, transparent per-seat pricing, and simple continuous feedback loops."
    },
    "scaleups": {
        "name": "Scaleups",
        "audience": "Fast-scaling companies expanding headcount across multiple regions while streamlining core HR workflows.",
        "focus_feature": "OKR cascading, structured review cycles, and manager coaching workflows."
    },
    "enterprise": {
        "name": "Enterprise",
        "audience": "Global enterprise organizations requiring multi-entity payroll, custom HRIS integrations, and strict compliance security.",
        "focus_feature": "compensation calibration, talent reviews, and enterprise analytics."
    },
    "remote-teams": {
        "name": "Remote-First Teams",
        "audience": "Distributed companies managing cross-border contractors, international EOR employees, and foreign currency payouts.",
        "focus_feature": "async continuous feedback, Slack/Teams integrations, and remote-friendly 1:1 agendas."
    },
    "people-ops": {
        "name": "People Ops Teams",
        "audience": "Fast-scaling companies expanding headcount across multiple regions while streamlining core HR workflows.",
        "focus_feature": "engagement surveys, career pathing, and people-science benchmarks."
    }
}

CATEGORY_DIFFERENTIATORS = {
    "eor": "entity ownership, global payroll routing, and FX conversion margins",
    "ats": "interview scorecards, candidate pipeline stages, and sourcing CRM",
    "pm": "OKR tracking, continuous feedback loops, and performance calibration",
}


def format_price_clause(tool_name, tool):
    """Natural-language price clause with singular contractor/EOR formatting."""
    if isinstance(tool, dict):
        contractor = tool.get("contractor_price")
        eor = tool.get("eor_price")
        if contractor is not None and eor is not None:
            return f"{tool_name} starts at ${contractor}/mo; EOR starts at ${eor}/mo"
        if eor is not None:
            return f"{tool_name} EOR starts at ${eor}/mo"
        if contractor is not None:
            return f"{tool_name} starts at ${contractor}/mo"
        starting_price = tool.get("starting_price", "Custom quote")
    else:
        starting_price = tool

    if str(starting_price).strip().lower() == "custom quote":
        return f"{tool_name} is quote-based with no public starter price"
    return f"{tool_name} starts at {starting_price}"


def matrix_feature_score(tool):
    return sum(1 for value in tool["matrix"].values() if value)


def pick_overall_winner(key_a, key_b, tool_a, tool_b):
    """Pick a winner by rating, then niche-relevant feature coverage on ties.
    Returns (winner_key, tie_broken_by_matrix, ratings_tied)."""
    rating_a = tool_a["rating"]
    rating_b = tool_b["rating"]
    if rating_a > rating_b:
        return key_a, False, False
    if rating_b > rating_a:
        return key_b, False, False

    score_a = matrix_feature_score(tool_a)
    score_b = matrix_feature_score(tool_b)
    if score_a > score_b:
        return key_a, True, True
    if score_b > score_a:
        return key_b, True, True

    # Perfect rating + matrix tie: stable alphabetical by display name, flagged as balanced.
    if tool_a["name"].lower() <= tool_b["name"].lower():
        return key_a, False, True
    return key_b, False, True


def build_overall_fit_copy(winner, winner_key, tool_a, tool_b, key_a, key_b, niche_info, differentiator, ratings_tied, matrix_tiebreak):
    """Shared Overall Fit winner_reason + verdict_summary without generic filler."""
    winner_category = "Overall Fit"
    winner_label = f"{BRAND_NAME}'s Overall Winner: {winner['name']}"

    if ratings_tied and matrix_tiebreak:
        winner_reason = (
            f"Based on {BRAND_NAME}'s {EVALUATION_YEAR} evaluation, {winner['name']} edges ahead for "
            f"{niche_info['name']} despite matching {tool_a['rating']}/5 overall scores, because it covers more of "
            f"the capabilities that matter here—{differentiator}—and stronger support for {niche_info['focus_feature']}"
        )
    elif ratings_tied:
        winner_reason = (
            f"Based on {BRAND_NAME}'s {EVALUATION_YEAR} evaluation, {tool_a['name']} and {tool_b['name']} are closely "
            f"matched at {winner['rating']}/5 for {niche_info['name']}; {winner['name']} is the slight recommended lean "
            f"based on {differentiator}, plus stronger support for {niche_info['focus_feature']}"
        )
    else:
        winner_reason = (
            f"Based on {BRAND_NAME}'s {EVALUATION_YEAR} evaluation, {winner['name']} edges out the "
            f"competition for {niche_info['name']} due to its superior score ({winner['rating']}/5), "
            f"strength in {differentiator}, and strong support for {niche_info['focus_feature']}"
        )

    verdict_summary = (
        f"{BRAND_NAME} research team evaluated {EVALUATION_YEAR} feature sets and pricing models for "
        f"{tool_a['name']} and {tool_b['name']} for {niche_info['audience']} Based on that analysis, "
        f"{winner['name']} is the recommended choice. {format_price_clause(tool_a['name'], tool_a)} "
        f"while {format_price_clause(tool_b['name'], tool_b)}."
    )
    # Fix doubled "while X is quote-based" grammar when both custom — still fine.
    # When second clause repeats full sentence subject, normalize second clause to lowercase start after while.
    # format_price_clause always starts with tool name — "while Tool starts at" is correct.
    return winner_category, winner_label, winner_reason, verdict_summary, []


def build_hr_stack_take(winner, runner_up, winner_category, niche_info):
    """Two-sentence executive takeaway rendered as The HR Stack Guide Take
    blockquote above the comparison table. Sentence one states the condition
    under which the winner is the right call plus its core differentiator;
    sentence two does the same for the runner-up, so the reader gets a
    decision rule rather than a ranking.

    When a row was decided by PARTNER_FOCUS (a specialist beating the
    general-purpose HRIS on a specific use case), the take names that use case
    explicitly instead of claiming a generic overall win."""
    if winner_category and winner_category != "Overall Fit":
        opening = (
            f"If {winner['take_fit']}, {winner['name']} is the stronger call on "
            f"{winner_category} for {niche_info['name']}: {winner['take_edge']}."
        )
    else:
        opening = (
            f"If {winner['take_fit']}, {winner['name']} is the stronger call for "
            f"{niche_info['name']}: {winner['take_edge']}."
        )

    counterpoint = (
        f"If instead {runner_up['take_fit']}, {runner_up['name']} is the better "
        f"shortlist candidate: {runner_up['take_edge']}."
    )
    return f"{opening} {counterpoint}"


def build_row(tool_a, tool_b, key_a, key_b, niche_id, niche_info, winner_key, winner_category, winner_label, winner_bullets, winner_reason, verdict_summary):
    """Assembles one comparisons.csv row dict from two resolved tool records
    and an already-decided verdict, shared by both the Global Payroll & EOR
    and Applicant Tracking Systems (ATS) row generators below."""
    feature_matrix = {}
    for feature, val_a in tool_a["matrix"].items():
        val_b = tool_b["matrix"].get(feature, False)
        feature_matrix[feature] = {"a": val_a, "b": val_b}

    winner_tool = tool_a if winner_key == key_a else tool_b
    runner_up_tool = tool_b if winner_key == key_a else tool_a

    return {
        "slug": f"{key_a}-vs-{key_b}-for-{niche_id}",
        "niche_id": niche_id,
        "niche_name": niche_info["name"],
        "niche_audience_phrase": natural_audience_phrase(niche_info["name"], "teams"),
        "target_audience": niche_info["audience"],
        "tool_a_id": key_a,
        "tool_a_name": tool_a["name"],
        "tool_a_badge": tool_a["badge"],
        "tool_a_logo_url": tool_a["logo"],
        "tool_a_rating": tool_a["rating"],
        "tool_a_starting_price": tool_a["starting_price"],
        "tool_a_pricing_model": tool_a["pricing_model"],
        "tool_a_pricing_nuance": tool_a["pricing_nuance"],
        "tool_a_free_trial": str(tool_a["free_trial"]).lower(),
        "tool_a_affiliate_url": tool_a["affiliate_url"],
        "tool_a_key_features": "|".join(tool_a["key_features"]),
        "tool_a_pros": "|".join(tool_a["pros"]),
        "tool_a_cons": "|".join(tool_a["cons"]),
        "tool_b_id": key_b,
        "tool_b_name": tool_b["name"],
        "tool_b_badge": tool_b["badge"],
        "tool_b_logo_url": tool_b["logo"],
        "tool_b_rating": tool_b["rating"],
        "tool_b_starting_price": tool_b["starting_price"],
        "tool_b_pricing_model": tool_b["pricing_model"],
        "tool_b_pricing_nuance": tool_b["pricing_nuance"],
        "tool_b_free_trial": str(tool_b["free_trial"]).lower(),
        "tool_b_affiliate_url": tool_b["affiliate_url"],
        "tool_b_key_features": "|".join(tool_b["key_features"]),
        "tool_b_pros": "|".join(tool_b["pros"]),
        "tool_b_cons": "|".join(tool_b["cons"]),
        "winner_id": winner_key,
        "winner_category": winner_category,
        "winner_label": winner_label,
        "winner_bullets": "|".join(winner_bullets),
        "winner_reason": winner_reason,
        "verdict_summary": verdict_summary,
        "hr_stack_take": build_hr_stack_take(winner_tool, runner_up_tool, winner_category, niche_info),
        "feature_matrix_json": json.dumps(feature_matrix),
        "meta_title": f"{tool_a['name']} vs {tool_b['name']} for {niche_info['name']} (2026 Comparison)",
        "meta_description": f"Detailed comparison of {tool_a['name']} vs {tool_b['name']} for {niche_info['name']}."
    }


def generate_eor_rows():
    """Generates the original 140 Global Payroll & EOR comparison rows."""
    tool_keys = list(TOOLS.keys())
    tool_pairs = list(itertools.combinations(tool_keys, 2))
    rows = []

    for niche_id, niche_info in NICHES.items():
        for key_a, key_b in tool_pairs:
            tool_a = TOOLS[key_a]
            tool_b = TOOLS[key_b]

            # Determine which vendor, if either, is a "global partner platform"
            # being compared directly against Rippling. Ratings for every vendor
            # always come straight from TOOLS above (real, consistent criteria);
            # only the *framing* of the verdict changes for this specific pairing.
            partner_key = None
            if key_a == "rippling" and key_b in PARTNER_IDS:
                partner_key = key_b
            elif key_b == "rippling" and key_a in PARTNER_IDS:
                partner_key = key_a

            if partner_key is not None:
                partner = TOOLS[partner_key]
                rippling_tool = TOOLS["rippling"]
                focus = PARTNER_FOCUS[partner_key]
                winner_key = partner_key
                winner = partner

                winner_category = focus["category"]
                winner_label = f"{BRAND_NAME}'s Winner for {winner_category}: {partner['name']}"
                bullet_list = focus["bullets"]

                bullet_sentence = "; ".join(bullet_list[:-1]) + f"; and {bullet_list[-1]}" if len(bullet_list) > 1 else bullet_list[0]
                winner_reason = (
                    f"Based on {BRAND_NAME}'s {EVALUATION_YEAR} evaluation, {partner['name']} is the stronger fit "
                    f"for {winner_category} for {niche_info['name']} evaluating international remote team "
                    f"operations: {bullet_sentence}. Both platforms carry solid overall ratings ({partner['rating']}/5 "
                    f"for {partner['name']} vs. {rippling_tool['rating']}/5 for {rippling_tool['name']}), but "
                    f"{rippling_tool['name']} is built primarily as a general-purpose domestic HRIS, so {partner['name']} "
                    f"pulls ahead specifically on {winner_category} for globally distributed teams."
                )
                verdict_summary = (
                    f"{BRAND_NAME} research team evaluated {EVALUATION_YEAR} feature sets and pricing models for "
                    f"{tool_a['name']} and {tool_b['name']} for {niche_info['audience']} Based on that analysis, "
                    f"{partner['name']} is the recommended choice for {winner_category}. "
                    f"{format_price_clause(tool_a['name'], tool_a)} while "
                    f"{format_price_clause(tool_b['name'], tool_b)}."
                )
                winner_bullets = bullet_list
            else:
                winner_key, matrix_tiebreak, ratings_tied = pick_overall_winner(key_a, key_b, tool_a, tool_b)
                winner = TOOLS[winner_key]
                winner_category, winner_label, winner_reason, verdict_summary, winner_bullets = build_overall_fit_copy(
                    winner, winner_key, tool_a, tool_b, key_a, key_b, niche_info,
                    CATEGORY_DIFFERENTIATORS["eor"], ratings_tied, matrix_tiebreak,
                )

            rows.append(build_row(
                tool_a, tool_b, key_a, key_b, niche_id, niche_info,
                winner_key, winner_category, winner_label, winner_bullets, winner_reason, verdict_summary
            ))

    return rows


def generate_ats_rows():
    """Generates the 140 new Applicant Tracking Systems (ATS) comparison rows
    (28 unique tool pairings x 5 audience intents). Every ATS pairing uses the
    simple "Overall Fit" verdict style (the same style used for the vast
    majority of the existing Global Payroll & EOR rows) since there is no
    Rippling-style general-purpose platform in this sub-vertical that needs a
    special use-case framing."""
    tool_keys = list(ATS_TOOLS.keys())
    tool_pairs = list(itertools.combinations(tool_keys, 2))
    rows = []

    for niche_id, niche_info in ATS_NICHES.items():
        for key_a, key_b in tool_pairs:
            tool_a = ATS_TOOLS[key_a]
            tool_b = ATS_TOOLS[key_b]

            winner_key, matrix_tiebreak, ratings_tied = pick_overall_winner(key_a, key_b, tool_a, tool_b)
            winner = ATS_TOOLS[winner_key]
            winner_category, winner_label, winner_reason, verdict_summary, winner_bullets = build_overall_fit_copy(
                winner, winner_key, tool_a, tool_b, key_a, key_b, niche_info,
                CATEGORY_DIFFERENTIATORS["ats"], ratings_tied, matrix_tiebreak,
            )

            rows.append(build_row(
                tool_a, tool_b, key_a, key_b, niche_id, niche_info,
                winner_key, winner_category, winner_label, winner_bullets, winner_reason, verdict_summary
            ))

    return rows


def generate_pm_rows():
    """Generates Performance Management comparison rows (21 unique tool
    pairings x 5 audience intents = 105 rows). Uses the same Overall Fit
    verdict style as ATS rows."""
    tool_keys = list(PM_TOOLS.keys())
    tool_pairs = list(itertools.combinations(tool_keys, 2))
    rows = []

    for niche_id, niche_info in PM_NICHES.items():
        for key_a, key_b in tool_pairs:
            tool_a = PM_TOOLS[key_a]
            tool_b = PM_TOOLS[key_b]

            winner_key, matrix_tiebreak, ratings_tied = pick_overall_winner(key_a, key_b, tool_a, tool_b)
            winner = PM_TOOLS[winner_key]
            winner_category, winner_label, winner_reason, verdict_summary, winner_bullets = build_overall_fit_copy(
                winner, winner_key, tool_a, tool_b, key_a, key_b, niche_info,
                CATEGORY_DIFFERENTIATORS["pm"], ratings_tied, matrix_tiebreak,
            )

            rows.append(build_row(
                tool_a, tool_b, key_a, key_b, niche_id, niche_info,
                winner_key, winner_category, winner_label, winner_bullets, winner_reason, verdict_summary
            ))

    return rows


def generate_csv(filename="comparisons.csv"):
    # ATS then Performance Management rows are appended after the original
    # Global Payroll & EOR rows so earlier categories stay stable.
    rows = generate_eor_rows() + generate_ats_rows() + generate_pm_rows()

    fieldnames = list(rows[0].keys())
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Success: Updated {len(rows)} pSEO comparison rows in '{filename}'.")


if __name__ == "__main__":
    generate_csv()
