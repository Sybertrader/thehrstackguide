import csv
import itertools
import json

TOOLS = {
    "deel": {
        "name": "Deel",
        "logo": "/deel.png",
        "rating": 4.8,
        "starting_price": "$49/mo",
        "pricing_model": "Per contractor / month ($599/mo for EOR)",
        "free_trial": False,
        "affiliate_url": "https://deel.partnerlinks.io/pSEO-campaign",
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
        "affiliate_url": "https://rippling.impact.com/pSEO-campaign",
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
        "affiliate_url": "https://remote.partnerlinks.io/pSEO-campaign",
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
        "affiliate_url": "https://oyster.partnerlinks.io/pSEO-campaign",
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
        "affiliate_url": "https://gusto.partnerlinks.io/pSEO-campaign",
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
        "affiliate_url": "https://papaya.partnerlinks.io/pSEO-campaign",
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
        "affiliate_url": "https://multiplier.partnerlinks.io/pSEO-campaign",
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
        "affiliate_url": "https://plane.partnerlinks.io/pSEO-campaign",
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

def generate_csv(filename="comparisons.csv"):
    tool_keys = list(TOOLS.keys())
    tool_pairs = list(itertools.combinations(tool_keys, 2))
    rows = []
    
    for niche_id, niche_info in NICHES.items():
        for key_a, key_b in tool_pairs:
            tool_a = TOOLS[key_a]
            tool_b = TOOLS[key_b]
            
            slug = f"{key_a}-vs-{key_b}-for-{niche_id}"

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
                winner_label = f"Winner for {winner_category}: {partner['name']}"
                bullet_list = focus["bullets"]

                bullet_sentence = "; ".join(bullet_list[:-1]) + f"; and {bullet_list[-1]}" if len(bullet_list) > 1 else bullet_list[0]
                winner_reason = (
                    f"{winner_label}. For {niche_info['name']} evaluating international remote team operations, "
                    f"{partner['name']} is the stronger fit for {winner_category.lower()}: {bullet_sentence}. "
                    f"Both platforms carry solid overall ratings ({partner['rating']}/5 for {partner['name']} vs. "
                    f"{rippling_tool['rating']}/5 for {rippling_tool['name']}), but {rippling_tool['name']} is built "
                    f"primarily as a general-purpose domestic HRIS, so {partner['name']} pulls ahead specifically on "
                    f"{winner_category.lower()} for globally distributed teams."
                )
                verdict_summary = (
                    f"When choosing between {tool_a['name']} and {tool_b['name']} for {niche_info['audience']}, "
                    f"{partner['name']} is the recommended choice for {winner_category.lower()}. "
                    f"{tool_a['name']} starts at {tool_a['starting_price']} while {tool_b['name']} starts at {tool_b['starting_price']}."
                )
                winner_bullets = bullet_list
            else:
                winner_key = key_a if tool_a["rating"] >= tool_b["rating"] else key_b
                winner = TOOLS[winner_key]

                winner_category = "Overall Fit"
                winner_label = f"Overall Winner: {winner['name']}"
                winner_reason = f"{winner['name']} edges out the competition for {niche_info['name']} due to its superior score ({winner['rating']}/5), flexible operational setup, and strong support for {niche_info['focus_feature']}"
                verdict_summary = f"When choosing between {tool_a['name']} and {tool_b['name']} for {niche_info['audience']}, {winner['name']} is the recommended choice. {tool_a['name']} starts at {tool_a['starting_price']} while {tool_b['name']} starts at {tool_b['starting_price']}."
                winner_bullets = []

            feature_matrix = {}
            for feature, val_a in tool_a["matrix"].items():
                val_b = tool_b["matrix"].get(feature, False)
                feature_matrix[feature] = {"a": val_a, "b": val_b}
            
            row = {
                "slug": slug,
                "niche_id": niche_id,
                "niche_name": niche_info["name"],
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
            rows.append(row)
            
    fieldnames = list(rows[0].keys())
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"Success: Updated {len(rows)} pSEO comparison rows in '{filename}'.")


if __name__ == "__main__":
    generate_csv()
