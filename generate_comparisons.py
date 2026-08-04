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
        "starting_price": "$49/mo",
        "pricing_model": "Per contractor / month ($599/mo for EOR)",
        "free_trial": False,
        "affiliate_url": "https://www.deel.com",
        "key_features": ["150+ Country EOR", "Contractor Auto-Pay", "Equipment Shipping", "Background Checks"],
        "pros": ["Fast 24-hr onboarding", "Comprehensive localized tax compliance", "Flexible payout options"],
        "cons": ["EOR pricing can be steep for small teams", "Admin UI has a learning curve"],
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
            "Free Trial Available": False
        }
    },
    "rippling": {
        "name": "Rippling",
        "logo": "https://unavatar.io/rippling.com",
        "rating": 4.7,
        "starting_price": "$35/mo",
        "pricing_model": "Base fee + $8 per user / month",
        "free_trial": False,
        "affiliate_url": "https://www.rippling.com",
        "key_features": ["Unified HR & IT", "US & Global Payroll", "Device Management", "App Provisioning"],
        "pros": ["Automates IT device setup alongside HR", "Powerful custom workflow engine", "Native US payroll integration"],
        "cons": ["Base platform fee required", "EOR feature set is secondary to HRIS"],
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
            "Free Trial Available": False
        }
    },
    "remote": {
        "name": "Remote",
        "logo": "https://unavatar.io/remote.com",
        "rating": 4.6,
        "starting_price": "$29/mo",
        "pricing_model": "Per contractor / month ($599/mo for EOR)",
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
            "Free Trial Available": True
        }
    },
    "oyster": {
        "name": "Oyster HR",
        "logo": "/Oyster.png",
        "rating": 4.5,
        "starting_price": "$29/mo",
        "pricing_model": "Per contractor / month ($499/mo for EOR)",
        "free_trial": True,
        "affiliate_url": "https://www.oysterhr.com",
        "key_features": ["180+ Country Reach", "Oyster Academy", "Global Employment Cost Calculator", "Equity Admin"],
        "pros": ["Extremely intuitive UI", "Great tools for early-stage founder estimation", "B-Corp social mission"],
        "cons": ["Relies on third-party local partners in select markets", "Slightly higher EOR base rate"],
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
            "Free Trial Available": True
        }
    },
    "gusto": {
        "name": "Gusto",
        "logo": "/Gusto.png",
        "rating": 4.7,
        "starting_price": "$40/mo",
        "pricing_model": "Base fee + $6 per user / month",
        "free_trial": True,
        "affiliate_url": "https://www.gusto.com",
        "key_features": ["US Native Payroll", "Benefits Administration", "International Contractor Pay", "Time Tracking"],
        "pros": ["Best-in-class user experience for US teams", "Automated state tax filings", "Affordable pricing"],
        "cons": ["Not a full global EOR (contractor pay only internationally)", "US-centric only"],
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
            "Free Trial Available": True
        }
    },
    "papaya": {
        "name": "Papaya Global",
        "logo": "https://unavatar.io/papayaglobal.com",
        "rating": 4.4,
        "starting_price": "$25/mo",
        "pricing_model": "Per contractor / month ($650/mo for EOR)",
        "free_trial": False,
        "affiliate_url": "https://papayaglobal.com",
        "key_features": ["Enterprise Payroll", "Workforce Intelligence", "Embedded Payments", "160+ Countries"],
        "pros": ["Built for complex enterprise security and ERPs", "Consolidated global payroll analytics", "Bank-grade security"],
        "cons": ["High minimum spend limits", "Overkill for early-stage startups"],
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
            "Free Trial Available": False
        }
    },
    "multiplier": {
        "name": "Multiplier",
        "logo": "https://unavatar.io/usemultiplier.com",
        "rating": 4.6,
        "starting_price": "$40/mo",
        "pricing_model": "Per contractor / month ($400/mo for EOR)",
        "free_trial": False,
        "affiliate_url": "https://www.usemultiplier.com",
        "key_features": ["Self-Serve EOR", "Instant Employment Contracts", "Global Insurance", "Multi-Currency Payouts"],
        "pros": ["Competitive baseline EOR pricing ($400/mo)", "Instant contract generation", "Strong Asian market presence"],
        "cons": ["Smaller user community", "Fewer third-party software integrations"],
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
            "Free Trial Available": False
        }
    },
    "plane": {
        "name": "Plane",
        "logo": "https://unavatar.io/plane.com",
        "rating": 4.5,
        "starting_price": "$20/mo",
        "pricing_model": "Flat $29/mo per contractor ($299/mo for EOR)",
        "free_trial": True,
        "affiliate_url": "https://plane.com",
        "key_features": ["Zero FX Markup", "Stock Option Grants", "Flat-Fee Pricing", "Direct Crypto/Fiat Pay"],
        "pros": ["No exchange rate markup fees", "Lowest EOR rate in the market ($299/mo)", "Transparent pricing"],
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
        "logo": "https://unavatar.io/greenhouse.io",
        "rating": 4.4,
        "starting_price": "$6,000/yr",
        "pricing_model": "Custom annual contract (Core tier from ~$6,000-$9,000/yr)",
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
        "rating": 4.3,
        "starting_price": "$7,000/yr",
        "pricing_model": "Custom annual contract based on headcount",
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
        "pricing_model": "Published monthly plans (up to 20 employees)",
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
        "logo": "https://unavatar.io/breezy.hr",
        "rating": 4.4,
        "starting_price": "$157/mo",
        "pricing_model": "Flat monthly fee for unlimited jobs and candidates",
        "free_trial": True,
        "affiliate_url": "https://www.breezy.hr",
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
        "starting_price": "$49/mo",
        "pricing_model": "Tiered monthly plans (Hero plan up to 3 active jobs)",
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
        "logo": "https://unavatar.io/recruitee.com",
        "rating": 4.5,
        "starting_price": "$269/mo",
        "pricing_model": "Tiered monthly plans (Startup tier up to 10 job slots)",
        "free_trial": True,
        "affiliate_url": "https://recruitee.com",
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
        "name": "BambooHR ATS",
        "logo": "https://unavatar.io/bamboohr.com",
        "rating": 4.4,
        "starting_price": "$8/employee/mo",
        "pricing_model": "Bundled with BambooHR Advantage or Pro HRIS tiers",
        "free_trial": False,
        "affiliate_url": "https://www.bamboohr.com",
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
            "Free Trial Available": False
        }
    },
}

# "Global partner platforms" - the vendors our site is built around (Global EOR,
# international contractor management, and SMB usability). When one of these is
# compared against a general-purpose HR platform like Rippling, the verdict is
# framed around the specific use case our audience cares about rather than a
# single blanket "better overall" claim, while the underlying star ratings above
# stay untouched and reflect the same consistent criteria for every vendor.
PARTNER_IDS = {"deel", "oyster", "remote", "gusto"}

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
        "audience": "Seed to Series B fast-growing technology companies hiring remote engineers worldwide.",
        "focus_feature": "IP ownership, fast onboarding, and equity option distribution."
    },
    "agencies": {
        "name": "Design & Marketing Agencies",
        "audience": "Client-service agencies managing variable monthly international contractor pools.",
        "focus_feature": "Flexible monthly contractor invoicing, fast payouts, and zero overhead."
    },
    "web3-crypto": {
        "name": "Web3 & Crypto Teams",
        "audience": "Decentralized teams requiring flexible global contractor payouts in fiat or stablecoins.",
        "focus_feature": "Multi-currency support, flexible contractor contracts, and minimal bureaucracy."
    },
    "us-latam": {
        "name": "US Companies Hiring in LATAM",
        "audience": "US-based enterprises sourcing nearshore software talent in Mexico, Colombia, and Brazil.",
        "focus_feature": "Localized LATAM compliance, health benefits, and same-time-zone payroll processing."
    },
    "scaleups": {
        "name": "Mid-Market Scaleups",
        "audience": "Established 100+ employee companies transitioning from local payroll to global workforce management.",
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
        "audience": "Early-stage startups building their first structured hiring process without a dedicated recruiting team.",
        "focus_feature": "fast setup, transparent pricing, and flexible seat-based collaboration."
    },
    "scaleups": {
        "name": "Scaleups",
        "audience": "Fast-growing 50-500 employee companies scaling recruiting operations and interview consistency.",
        "focus_feature": "structured scorecards, recruiting analytics, and predictable flat-tier pricing."
    },
    "enterprise": {
        "name": "Enterprise",
        "audience": "Large organizations running high-volume hiring with dedicated recruiting operations and compliance requirements.",
        "focus_feature": "rigorous compliance reporting, deep integrations, and enterprise-grade structured hiring."
    },
    "agencies": {
        "name": "Staffing & Recruiting Agencies",
        "audience": "Agencies managing multiple concurrent client requisitions and high candidate throughput.",
        "focus_feature": "high-volume sourcing, candidate CRM tooling, and multi-client pipeline visibility."
    },
    "remote-teams": {
        "name": "Remote-First Teams",
        "audience": "Distributed companies hiring across time zones and countries with fully remote interview loops.",
        "focus_feature": "multi-time-zone scheduling, multi-language support, and asynchronous collaboration tools."
    }
}

def build_row(tool_a, tool_b, key_a, key_b, niche_id, niche_info, winner_key, winner_category, winner_label, winner_bullets, winner_reason, verdict_summary):
    """Assembles one comparisons.csv row dict from two resolved tool records
    and an already-decided verdict, shared by both the Global Payroll & EOR
    and Applicant Tracking Systems (ATS) row generators below."""
    feature_matrix = {}
    for feature, val_a in tool_a["matrix"].items():
        val_b = tool_b["matrix"].get(feature, False)
        feature_matrix[feature] = {"a": val_a, "b": val_b}

    return {
        "slug": f"{key_a}-vs-{key_b}-for-{niche_id}",
        "niche_id": niche_id,
        "niche_name": niche_info["name"],
        "niche_audience_phrase": natural_audience_phrase(niche_info["name"], "teams"),
        "target_audience": niche_info["audience"],
        "tool_a_id": key_a,
        "tool_a_name": tool_a["name"],
        "tool_a_logo_url": tool_a["logo"],
        "tool_a_rating": tool_a["rating"],
        "tool_a_starting_price": tool_a["starting_price"],
        "tool_a_pricing_model": tool_a["pricing_model"],
        "tool_a_free_trial": str(tool_a["free_trial"]).lower(),
        "tool_a_affiliate_url": tool_a["affiliate_url"],
        "tool_a_key_features": "|".join(tool_a["key_features"]),
        "tool_a_pros": "|".join(tool_a["pros"]),
        "tool_a_cons": "|".join(tool_a["cons"]),
        "tool_b_id": key_b,
        "tool_b_name": tool_b["name"],
        "tool_b_logo_url": tool_b["logo"],
        "tool_b_rating": tool_b["rating"],
        "tool_b_starting_price": tool_b["starting_price"],
        "tool_b_pricing_model": tool_b["pricing_model"],
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
                    f"for {winner_category.lower()} for {niche_info['name']} evaluating international remote team "
                    f"operations: {bullet_sentence}. Both platforms carry solid overall ratings ({partner['rating']}/5 "
                    f"for {partner['name']} vs. {rippling_tool['rating']}/5 for {rippling_tool['name']}), but "
                    f"{rippling_tool['name']} is built primarily as a general-purpose domestic HRIS, so {partner['name']} "
                    f"pulls ahead specifically on {winner_category.lower()} for globally distributed teams."
                )
                verdict_summary = (
                    f"{BRAND_NAME} research team evaluated {EVALUATION_YEAR} feature sets and pricing models for "
                    f"{tool_a['name']} and {tool_b['name']} for {niche_info['audience']} Based on that analysis, "
                    f"{partner['name']} is the recommended choice for {winner_category.lower()}. {tool_a['name']} "
                    f"starts at {tool_a['starting_price']} while {tool_b['name']} starts at {tool_b['starting_price']}."
                )
                winner_bullets = bullet_list
            else:
                winner_key = key_a if tool_a["rating"] >= tool_b["rating"] else key_b
                winner = TOOLS[winner_key]

                winner_category = "Overall Fit"
                winner_label = f"{BRAND_NAME}'s Overall Winner: {winner['name']}"
                winner_reason = (
                    f"Based on {BRAND_NAME}'s {EVALUATION_YEAR} evaluation, {winner['name']} edges out the "
                    f"competition for {niche_info['name']} due to its superior score ({winner['rating']}/5), "
                    f"flexible operational setup, and strong support for {niche_info['focus_feature']}"
                )
                verdict_summary = (
                    f"{BRAND_NAME} research team evaluated {EVALUATION_YEAR} feature sets and pricing models for "
                    f"{tool_a['name']} and {tool_b['name']} for {niche_info['audience']} Based on that analysis, "
                    f"{winner['name']} is the recommended choice. {tool_a['name']} starts at {tool_a['starting_price']} "
                    f"while {tool_b['name']} starts at {tool_b['starting_price']}."
                )
                winner_bullets = []

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

            winner_key = key_a if tool_a["rating"] >= tool_b["rating"] else key_b
            winner = ATS_TOOLS[winner_key]

            winner_category = "Overall Fit"
            winner_label = f"{BRAND_NAME}'s Overall Winner: {winner['name']}"
            winner_reason = (
                f"Based on {BRAND_NAME}'s {EVALUATION_YEAR} evaluation, {winner['name']} edges out the "
                f"competition for {niche_info['name']} due to its superior score ({winner['rating']}/5), "
                f"flexible operational setup, and strong support for {niche_info['focus_feature']}"
            )
            verdict_summary = (
                f"{BRAND_NAME} research team evaluated {EVALUATION_YEAR} feature sets and pricing models for "
                f"{tool_a['name']} and {tool_b['name']} for {niche_info['audience']} Based on that analysis, "
                f"{winner['name']} is the recommended choice. {tool_a['name']} starts at {tool_a['starting_price']} "
                f"while {tool_b['name']} starts at {tool_b['starting_price']}."
            )
            winner_bullets = []

            rows.append(build_row(
                tool_a, tool_b, key_a, key_b, niche_id, niche_info,
                winner_key, winner_category, winner_label, winner_bullets, winner_reason, verdict_summary
            ))

    return rows


def generate_csv(filename="comparisons.csv"):
    # ATS rows are appended after the original Global Payroll & EOR rows so
    # the first 140 rows (and every existing page they generate) stay
    # byte-for-byte identical.
    rows = generate_eor_rows() + generate_ats_rows()

    fieldnames = list(rows[0].keys())
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Success: Updated {len(rows)} pSEO comparison rows in '{filename}'.")


if __name__ == "__main__":
    generate_csv()
