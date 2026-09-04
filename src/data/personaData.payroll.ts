import type { GlobalPayrollFeatures, GlobalPayrollPersonaData } from '../types/comparison';
import { spec } from './personaSpec';

function gp(base: GlobalPayrollFeatures, patch: Partial<GlobalPayrollFeatures> = {}): GlobalPayrollFeatures {
  return { ...base, ...patch };
}

const deelBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(true, '150+ Deel-owned local entities; the employment contract is issued by the in-country Deel entity, not a partner agency.'),
  eorCountryCoverage: spec(true, 'EOR in 150+ countries at $599/employee/month; contractor management at $49/contractor/month.'),
  contractorPayments: spec(true, 'Contractor auto-pay with multi-currency wallets, batch runs, and Deel Shield misclassification cover as an add-on.'),
  nativePayrollFilings: spec(true, 'Deel withholds and remits employer tax, income tax, and social security under its own local registrations.'),
  fxAndMultiCurrency: spec(true, 'Multi-currency wallets supported; FX conversion spread applies on payout corridors and is not a zero-markup rail.'),
  statutoryBenefits: spec(true, 'Administers statutory pension, health, PTO, 13th/14th month, and severance under the local Deel entity.'),
  ipAndWorkProductAssignment: spec(true, 'Invention assignment sits in the local employment agreement drafted by Deel in-house counsel, then assigned onward to the customer.'),
  onboardingSla: spec(true, 'Published 24-hour EOR onboarding in coverage markets when KYC and salary inputs are complete.'),
};

const ripplingBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(false, 'Global EOR runs as a modular add-on on a partner/network model; Rippling is not a 150-country owned-entity EOR.'),
  eorCountryCoverage: spec(true, 'International EOR is a separately priced module on top of the $8/user workforce platform, not bundled into the headline seat rate.'),
  contractorPayments: spec(true, 'Contractor payments and app/device provisioning share one employee record; payouts are not a crypto rail.'),
  nativePayrollFilings: spec(true, 'Native US federal/state payroll plus global payroll modules; filings follow the modules you actually buy.'),
  fxAndMultiCurrency: spec(true, 'FX applies on international payouts; there is no published zero-markup FX guarantee.'),
  statutoryBenefits: spec(true, 'Benefits administration is a paid module; international statutory benefits depend on the EOR add-on, not the $8 core seat.'),
  ipAndWorkProductAssignment: spec(true, 'US W-2 IP assignment is native HRIS; cross-border EOR IP terms follow the EOR employment vehicle in each market.'),
  onboardingSla: spec(true, 'IT device shipping plus HRIS workflows accelerate US onboarding; international EOR SLAs are module- and country-dependent.'),
};

const remoteBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(true, '100% Remote-owned local entities; no third-party employer-of-record partner chain in advertised coverage markets.'),
  eorCountryCoverage: spec(true, 'EOR at $599/employee/month on annual commitment ($699 month-to-month); contractor management from $29/month.'),
  contractorPayments: spec(true, 'Contractor auto-pay with localized contracts; IP assignment and misclassification posture differ from EOR employment agreements.'),
  nativePayrollFilings: spec(true, 'Remote files payroll taxes under its owned entities; US native payroll is not the core product (no Gusto-style 50-state engine).'),
  fxAndMultiCurrency: spec(true, 'Published zero FX markup on payouts; currency conversion is included rather than upsold as spread.'),
  statutoryBenefits: spec(true, 'Global benefits administration included in EOR rather than sold as a separate US benefits marketplace.'),
  ipAndWorkProductAssignment: spec(true, 'Direct IP assignment through owned-entity employment contracts is a core Remote differentiator versus partner-network EORs.'),
  onboardingSla: spec(true, 'Entity expansion is slower than Deel; onboarding is reliable once the local Remote entity is live in-market.'),
};

const oysterBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(false, 'Mix of owned entities and local partners; some markets introduce partner deposits and an extra counterparty in the employment chain.'),
  eorCountryCoverage: spec(true, '180+ country contractor/EOR reach; published EOR list price $699/employee/month, often negotiable above ~10 employees.'),
  contractorPayments: spec(true, 'Contractor management from $29/month after a 30-day trial; auto-pay supported for distributed creative teams.'),
  nativePayrollFilings: spec(true, 'Payroll taxes and statutory filings run through the local employment vehicle (owned or partner) in each coverage market.'),
  fxAndMultiCurrency: spec(true, 'FX conversion is not zero-markup; model corridor spread on top of the $699 EOR list price.'),
  statutoryBenefits: spec(true, 'Localized health benefits and statutory leave administered per market; partner markets can lag owned-entity SLAs.'),
  ipAndWorkProductAssignment: spec(true, 'IP assignment quality depends on whether the hire sits on an owned Oyster entity or a local partner entity.'),
  onboardingSla: spec(true, 'Clean first-time international contractor UX; EOR go-live follows entity/partner availability rather than a 24-hour Deel-style SLA.'),
};

const gustoBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(false, 'No foreign owned EOR entities. Gusto is a US employer payroll platform, not an international EOR.'),
  eorCountryCoverage: spec(false, 'No full-time international EOR. Global coverage is contractor payments to 120+ countries, not local employment.'),
  contractorPayments: spec(true, 'International contractor pay is billed per transfer on top of the $49 + $6/user US payroll subscription.'),
  nativePayrollFilings: spec(true, 'Automated US federal, state, and local filings (940/941, W-2, 1099) across all 50 states.'),
  fxAndMultiCurrency: spec(true, 'FX conversion on overseas contractor transfers is where international cost accumulates; not a zero-markup wallet.'),
  statutoryBenefits: spec(false, 'US benefits marketplace (health, 401(k), workers’ comp). No non-US statutory benefits engine.'),
  ipAndWorkProductAssignment: spec(true, 'US W-2 and 1099 agreements support domestic IP assignment; there is no local-entity invention assignment chain abroad.'),
  onboardingSla: spec(true, 'Same-day US employee onboarding once tax and bank details are in; international EOR onboarding is out of scope.'),
};

const papayaBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(false, 'Payroll orchestration and embedded payments across 160+ countries; not a Deel-style owned-entity EOR network as the core product.'),
  eorCountryCoverage: spec(true, 'EOR from $499/employee/month with enterprise packaging; contractor from $5/month. High minimums unfit sub-50 teams.'),
  contractorPayments: spec(true, 'Embedded contractor payments into enterprise payroll rails rather than a founder-facing contractor wallet.'),
  nativePayrollFilings: spec(true, 'Multi-country payroll filings designed to sit next to ERP/finance controls, not a 50-state US SMB payroll UX.'),
  fxAndMultiCurrency: spec(true, 'Treasury-grade multi-currency payroll; FX is priced into enterprise contracts rather than a consumer zero-markup promise.'),
  statutoryBenefits: spec(true, 'Statutory benefits and works-council reporting are handled as part of enterprise country payroll, not a startup benefits shop.'),
  ipAndWorkProductAssignment: spec(true, 'IP terms follow the local employment or payroll vehicle Papaya operates in each country; confirm owned vs partner per market.'),
  onboardingSla: spec(false, 'Implementation is an enterprise payroll project, not 24-hour self-serve EOR onboarding.'),
};

const multiplierBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(true, 'Owned-entity coverage is strongest in APAC hiring hubs; other corridors may use partners—confirm the vehicle per country.'),
  eorCountryCoverage: spec(true, 'EOR plus contractor coverage with an APAC-weighted network versus Deel’s 150+ owned-entity footprint.'),
  contractorPayments: spec(true, 'Contractor auto-pay for distributed APAC/US teams; not a USDC-native payout rail.'),
  nativePayrollFilings: spec(true, 'Localized payroll filings in coverage markets; US 50-state native payroll is not the headline product.'),
  fxAndMultiCurrency: spec(true, 'Multi-currency payouts with corridor FX; no published zero-markup FX guarantee.'),
  statutoryBenefits: spec(true, 'Local statutory benefits in EOR markets; APAC PF/social schemes are a relative strength versus US-only payroll tools.'),
  ipAndWorkProductAssignment: spec(true, 'Employment-contract IP assignment in owned-entity markets; partner markets need a country-by-country legal review.'),
  onboardingSla: spec(true, 'APAC onboarding is competitive; global SLA is country-dependent rather than a uniform 24-hour promise.'),
};

const planeBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(true, 'Owned-entity EOR aimed at tech companies; coverage is narrower than Deel’s 150+ country owned network.'),
  eorCountryCoverage: spec(true, 'EOR plus contractor product with published low-FX positioning versus spread-heavy wallets.'),
  contractorPayments: spec(true, 'Contractor payments for remote engineering teams; crypto/USDC is not the native payout method.'),
  nativePayrollFilings: spec(true, 'Local payroll filings through Plane entities in coverage markets; not a US-only Gusto replacement.'),
  fxAndMultiCurrency: spec(true, 'Low FX markup is the commercial hook; still confirm corridor rates rather than assuming Remote-style zero markup.'),
  statutoryBenefits: spec(true, 'Statutory benefits on EOR employment; supplemental perks are quote-dependent.'),
  ipAndWorkProductAssignment: spec(true, 'Tech-startup IP assignment via owned-entity employment contracts in live markets.'),
  onboardingSla: spec(true, 'Faster than enterprise payroll suites; slower and narrower than Deel’s 24-hour, 150-country motion.'),
};

const payoneerBase: GlobalPayrollFeatures = {
  ownedLocalEntities: spec(false, 'Payoneer Workforce Management is a cross-border payout and contractor platform, not an owned-entity EOR employer.'),
  eorCountryCoverage: spec(false, 'No full-time EOR employment network. Coverage is contractor payouts to 190+ countries, not local employment.'),
  contractorPayments: spec(true, 'Batch contractor payouts, Payoneer wallet/card/wire, and invoice workflows built for high-volume contractor rosters.'),
  nativePayrollFilings: spec(false, 'No employer-of-record payroll filings. Tax docs are contractor-side (W-9 / W-8BEN) rather than local employer returns.'),
  fxAndMultiCurrency: spec(true, 'Multi-currency wallets with published zero-fee receiving options for contractors; FX still applies on some corridor conversions.'),
  statutoryBenefits: spec(false, 'No statutory EOR benefits (pension, 13th month, severance). Workers are contractors, not local employees.'),
  ipAndWorkProductAssignment: spec(true, 'Contractor agreements and SOWs carry IP language; there is no local-entity invention assignment chain.'),
  onboardingSla: spec(true, 'Contractor KYC and tax-form collection is self-serve and fast; employee EOR onboarding is out of product scope.'),
};

export const globalPayrollPersonaByToolId: Record<string, GlobalPayrollPersonaData> = {
  deel: {
    startupFeatures: gp(deelBase, {
      onboardingSla: spec(true, '24-hour EOR onboarding and equipment shipping let seed/Series B teams hire the first overseas engineer without registering an entity.'),
    }),
    scaleupFeatures: gp(deelBase, {
      nativePayrollFilings: spec(true, 'Scaleups consolidate multi-country employer filings onto one Deel invoice instead of opening local finance ops per market.'),
    }),
    agencyFeatures: gp(deelBase, {
      contractorPayments: spec(true, 'Batch contractor auto-pay plus Shield cover for agencies running mixed employee/contractor benches across clients.'),
    }),
    latamFeatures: gp(deelBase, {
      statutoryBenefits: spec(true, 'Brazil/Mexico 13th-month, IMSS/INSS, and vacation floors are accrued into monthly EOR cost rather than landing as a year-end surprise.'),
    }),
    web3Features: gp(deelBase, {
      fxAndMultiCurrency: spec(true, 'Deel Crypto / USDC payouts sit alongside fiat wallets; FX spread still applies on fiat corridors even when USDC is used.'),
    }),
    contractorFeatures: gp(deelBase, {
      contractorPayments: spec(true, 'W-8BEN/W-9 collection, localized contractor contracts, and optional Deel Shield for 1099/contractor misclassification audits.'),
    }),
    ukEuropeFeatures: gp(deelBase, {
      statutoryBenefits: spec(true, 'UK PAYE/NI and EU works-council / works-agreement constraints are handled by the local Deel entity; GDPR processing is in the DPA.'),
    }),
    enterpriseFeatures: gp(deelBase, {
      ownedLocalEntities: spec(true, 'SAML 2.0 SSO, SCIM, and owned-entity employment for procurement-grade vendor reviews; SOC reports available under NDA.'),
    }),
  },
  rippling: {
    startupFeatures: gp(ripplingBase, {
      onboardingSla: spec(true, 'App provisioning plus laptop shipping from day one for US-based startups; international EOR is a later add-on, not the $8 seat.'),
    }),
    scaleupFeatures: gp(ripplingBase, {
      nativePayrollFilings: spec(true, 'Multi-state US payroll plus workflow automation is the scaleup fit; global EOR remains a separately quoted module.'),
    }),
    agencyFeatures: gp(ripplingBase, {
      contractorPayments: spec(true, 'Contractor and employee records share one system of record for agencies that also manage client-device and app access.'),
    }),
    latamFeatures: gp(ripplingBase, {
      eorCountryCoverage: spec(true, 'LATAM EOR is available through the global module, not owned-entity density comparable to Deel/Remote in Brazil/Mexico.'),
    }),
    web3Features: gp(ripplingBase, {
      fxAndMultiCurrency: spec(false, 'No native USDC/crypto payroll rail. Payouts are fiat HRIS/payroll; treasury crypto is out of band.'),
    }),
    contractorFeatures: gp(ripplingBase, {
      contractorPayments: spec(true, 'Contractor payments exist; 1099/W-8BEN automation is secondary to the US W-2 + IT identity graph.'),
    }),
    ukEuropeFeatures: gp(ripplingBase, {
      statutoryBenefits: spec(true, 'UK/EU employment is an EOR-module problem; SAML SSO is available on workforce-platform enterprise SKUs.'),
    }),
    enterpriseFeatures: gp(ripplingBase, {
      nativePayrollFilings: spec(true, 'SAML 2.0 SSO, identity/device graph, and US payroll controls for IT-led enterprises; global EOR is not the system of record.'),
    }),
  },
  remote: {
    startupFeatures: gp(remoteBase, {
      ipAndWorkProductAssignment: spec(true, 'Owned-entity IP assignment is the reason technical founders pick Remote when board counsel treats invention assignment as non-negotiable.'),
    }),
    scaleupFeatures: gp(remoteBase, {
      fxAndMultiCurrency: spec(true, 'Zero FX markup keeps multi-currency salary cost predictable as headcount spreads across EU and LATAM.'),
    }),
    agencyFeatures: gp(remoteBase, {
      contractorPayments: spec(true, 'Contractor product at $29/month for agency benches; EOR at $599 is the employee path when a client requires employment.'),
    }),
    latamFeatures: gp(remoteBase, {
      ownedLocalEntities: spec(true, 'Remote-owned entities in core LATAM markets avoid partner-agency IP and deposit chains common in lighter EORs.'),
    }),
    web3Features: gp(remoteBase, {
      fxAndMultiCurrency: spec(true, 'Fiat payouts at zero FX markup; USDC is not the primary Remote payroll rail compared with Deel Crypto.'),
    }),
    contractorFeatures: gp(remoteBase, {
      contractorPayments: spec(true, 'Localized contractor agreements plus optional employment conversion onto a Remote entity without changing vendor.'),
    }),
    ukEuropeFeatures: gp(remoteBase, {
      ipAndWorkProductAssignment: spec(true, 'UK/EU owned entities plus GDPR DPA; works-council consultation remains a local-entity obligation Remote runs as employer.'),
    }),
    enterpriseFeatures: gp(remoteBase, {
      ownedLocalEntities: spec(true, 'SAML 2.0 SSO on enterprise plans; 100% owned-entity story is the procurement answer versus partner-network EORs.'),
    }),
  },
  oyster: {
    startupFeatures: gp(oysterBase, {
      onboardingSla: spec(true, 'Employment Cost Calculator plus 30-day contractor trial for first-time international hiring without a payroll specialist.'),
    }),
    scaleupFeatures: gp(oysterBase, {
      eorCountryCoverage: spec(true, '180+ country reach for mid-market expansion; negotiate the $699 list rate once headcount clears ~10 EOR seats.'),
    }),
    agencyFeatures: gp(oysterBase, {
      contractorPayments: spec(true, 'Contractor-first UX for creative/marketing agencies paying distributed talent without standing up entities.'),
    }),
    latamFeatures: gp(oysterBase, {
      ownedLocalEntities: spec(false, 'Confirm Brazil/Mexico employment vehicle: partner markets can require deposits and weaken IP assignment versus owned-entity EORs.'),
    }),
    web3Features: gp(oysterBase, {
      fxAndMultiCurrency: spec(false, 'No native USDC payroll. Fiat EOR/contractor rails only; crypto treasury stays off-platform.'),
    }),
    contractorFeatures: gp(oysterBase, {
      contractorPayments: spec(true, 'W-8BEN-style tax collection on contractor onboarding; misclassification cover is not Deel Shield-equivalent.'),
    }),
    ukEuropeFeatures: gp(oysterBase, {
      statutoryBenefits: spec(true, 'EU/UK statutory benefits when the local vehicle is live; partner markets need extra GDPR and works-council diligence.'),
    }),
    enterpriseFeatures: gp(oysterBase, {
      onboardingSla: spec(false, 'SSO is available on higher tiers, but partner-entity mix is a harder procurement story than Remote/Deel owned networks.'),
    }),
  },
  gusto: {
    startupFeatures: gp(gustoBase, {
      nativePayrollFilings: spec(true, '50-state automated payroll at $49 + $6/user is the default for US-only seed teams that do not need EOR.'),
    }),
    scaleupFeatures: gp(gustoBase, {
      nativePayrollFilings: spec(true, 'Multi-state tax, ACA, and benefits admin scale inside the US; international employees still cannot sit on Gusto EOR.'),
    }),
    agencyFeatures: gp(gustoBase, {
      contractorPayments: spec(true, '1099 contractor payroll plus international contractor transfers for US agencies; no local employment abroad.'),
    }),
    latamFeatures: gp(gustoBase, {
      eorCountryCoverage: spec(false, 'Cannot employ full-time staff in Brazil/Mexico. LATAM talent is contractor-only with per-transfer FX.'),
    }),
    web3Features: gp(gustoBase, {
      fxAndMultiCurrency: spec(false, 'No USDC/crypto payroll. USD payroll plus contractor FX on international wires only.'),
    }),
    contractorFeatures: gp(gustoBase, {
      contractorPayments: spec(true, 'Automated 1099-NEC filing and W-9 collection for US contractors; W-8BEN on international contractor payments.'),
    }),
    ukEuropeFeatures: gp(gustoBase, {
      ownedLocalEntities: spec(false, 'No UK PAYE or EU employer registrations. UK/EU hires must be contractors or a separate EOR.'),
    }),
    enterpriseFeatures: gp(gustoBase, {
      nativePayrollFilings: spec(true, 'SAML SSO on Gusto Plus/higher; still a US payroll system of record, not a global EOR with works-council coverage.'),
    }),
  },
  papaya: {
    startupFeatures: gp(papayaBase, {
      onboardingSla: spec(false, 'Enterprise minimums and implementation overhead make Papaya a poor fit below ~50-100 globally paid employees.'),
    }),
    scaleupFeatures: gp(papayaBase, {
      nativePayrollFilings: spec(true, 'Workforce intelligence plus multi-country payroll once finance wants ERP-linked controls rather than a founder EOR.'),
    }),
    agencyFeatures: gp(papayaBase, {
      contractorPayments: spec(true, 'Embedded payments for large contractor benches; overkill for a 10-person studio.'),
    }),
    latamFeatures: gp(papayaBase, {
      statutoryBenefits: spec(true, 'Country payroll in Brazil/Mexico includes statutory filings; confirm owned vs partner employer per entity.'),
    }),
    web3Features: gp(papayaBase, {
      fxAndMultiCurrency: spec(false, 'Treasury multi-currency, not a USDC payroll product. Crypto payouts are not the Papaya motion.'),
    }),
    contractorFeatures: gp(papayaBase, {
      contractorPayments: spec(true, 'Contractor payments inside enterprise payroll; 1099/W-8BEN is not the Gusto-style self-serve workflow.'),
    }),
    ukEuropeFeatures: gp(papayaBase, {
      statutoryBenefits: spec(true, 'Works-council and EU payroll reporting for multi-entity employers; SAML/SSO expected on enterprise tenants.'),
    }),
    enterpriseFeatures: gp(papayaBase, {
      nativePayrollFilings: spec(true, 'SAML 2.0 SSO, ERP connectors, and consolidated global payroll analytics for Fortune-scale finance teams.'),
    }),
  },
  multiplier: {
    startupFeatures: gp(multiplierBase, {
      eorCountryCoverage: spec(true, 'Cost-competitive EOR for APAC-first startups; global owned-entity count trails Deel.'),
    }),
    scaleupFeatures: gp(multiplierBase, {
      statutoryBenefits: spec(true, 'PF/social and local leave schemes in APAC EOR markets as headcount concentrates in IN/SG/PH/VN.'),
    }),
    agencyFeatures: gp(multiplierBase, {
      contractorPayments: spec(true, 'Contractor auto-pay for agencies staffing APAC delivery centers.'),
    }),
    latamFeatures: gp(multiplierBase, {
      eorCountryCoverage: spec(true, 'LATAM is available but is not the densest part of the network versus Deel/Remote owned entities.'),
    }),
    web3Features: gp(multiplierBase, {
      fxAndMultiCurrency: spec(false, 'No native USDC payroll rail; fiat EOR and contractor payouts only.'),
    }),
    contractorFeatures: gp(multiplierBase, {
      contractorPayments: spec(true, 'Contractor KYC and localized agreements; W-8BEN-style collection where US payors require it.'),
    }),
    ukEuropeFeatures: gp(multiplierBase, {
      statutoryBenefits: spec(true, 'UK/EU EOR depends on live entity list; works-council handling is local-employer standard rather than a Papaya-grade analytics suite.'),
    }),
    enterpriseFeatures: gp(multiplierBase, {
      ownedLocalEntities: spec(true, 'SSO on enterprise contracts; APAC owned-entity story is the procurement angle versus a 150-country Deel RFP.'),
    }),
  },
  plane: {
    startupFeatures: gp(planeBase, {
      fxAndMultiCurrency: spec(true, 'Low-FX EOR positioning for venture-backed engineering teams that want owned entities without Deel’s product surface area.'),
    }),
    scaleupFeatures: gp(planeBase, {
      eorCountryCoverage: spec(true, 'Fits scaleups whose country list sits inside Plane’s owned-entity map; overflow countries need a second EOR.'),
    }),
    agencyFeatures: gp(planeBase, {
      contractorPayments: spec(true, 'Contractor payments for studio/agency talent; not a high-volume Payoneer wallet replacement.'),
    }),
    latamFeatures: gp(planeBase, {
      ownedLocalEntities: spec(true, 'LATAM coverage exists where Plane has entities; verify Brazil CLT and Mexico IMSS on the current country list.'),
    }),
    web3Features: gp(planeBase, {
      fxAndMultiCurrency: spec(false, 'Low fiat FX, not USDC payroll. Token compensation remains a separate cap table/custody problem.'),
    }),
    contractorFeatures: gp(planeBase, {
      contractorPayments: spec(true, 'Contractor onboarding for remote ICs; 1099/W-8BEN automation is lighter than Payoneer’s payout-tax workflow.'),
    }),
    ukEuropeFeatures: gp(planeBase, {
      ipAndWorkProductAssignment: spec(true, 'UK/EU owned-entity IP assignment for software teams; confirm works-council markets before promising a go-live date.'),
    }),
    enterpriseFeatures: gp(planeBase, {
      onboardingSla: spec(false, 'SSO is quote-based. Plane is not the SAML/ERP payroll fabric Papaya sells to global finance.'),
    }),
  },
  'payoneer-workforce-management': {
    startupFeatures: gp(payoneerBase, {
      contractorPayments: spec(true, 'Fast contractor KYC, wallets, and batch payouts for startups paying a global IC bench without standing up EOR.'),
    }),
    scaleupFeatures: gp(payoneerBase, {
      contractorPayments: spec(true, '190+ country payout corridors and invoice collection once contractor volume outgrows PayPal/Wise spreadsheets.'),
    }),
    agencyFeatures: gp(payoneerBase, {
      contractorPayments: spec(true, 'Built for agencies and marketplaces paying many contractors: batch files, local bank deposit, Payoneer card, and wire.'),
    }),
    latamFeatures: gp(payoneerBase, {
      fxAndMultiCurrency: spec(true, 'Strong LATAM receiving options for contractors; still contractor payouts, not CLT/IMSS employment.'),
    }),
    web3Features: gp(payoneerBase, {
      fxAndMultiCurrency: spec(true, 'Multi-currency wallets; USDC is not a first-class payroll rail. Fiat receiving plus optional crypto off-ramps vary by corridor.'),
    }),
    contractorFeatures: gp(payoneerBase, {
      contractorPayments: spec(true, 'Automated W-8BEN/W-9 collection and invoice management inside the payout workflow for 1099/foreign contractors.'),
    }),
    ukEuropeFeatures: gp(payoneerBase, {
      ownedLocalEntities: spec(false, 'No UK PAYE or EU employer entity. GDPR applies to payout data; works-council employment compliance is out of scope.'),
    }),
    enterpriseFeatures: gp(payoneerBase, {
      contractorPayments: spec(true, 'SSO and batch payout controls for enterprise contractor programs; still not SAML-governed EOR employment.'),
    }),
  },
};
