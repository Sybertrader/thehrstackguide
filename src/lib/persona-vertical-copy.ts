type WorkflowBottleneck = { title: string; body: string };
type FaqItem = { question: string; answer: string };

/** ATS child-page bottlenecks: pipeline, scorecards, offer chain — unique per persona. */
export const ATS_BOTTLENECKS: Record<string, WorkflowBottleneck[]> = {
  startups: [
    {
      title: 'Garage-hire candidate pipeline & stage automation for {PERSONA}',
      body: 'For {PERSONA}, the bottleneck is a founder-run pipeline with no recruiting coordinator and no garage-hire intake owner. {A} vs {B} must auto-advance inbound applicants without a sourcer sitting in the ATS. A Chrome sourcing extension that dumps profiles into a junk stage is worse than a short, automated screen-to-onsite path {PERSONA} can run after hours.',
    },
    {
      title: 'First-interviewer scorecards & feedback loops for {PERSONA}',
      body: 'For {PERSONA}, structured interview kits have to work with first-time interviewers, not a hiring committee. If {A} or {B} cannot lock a two-question scorecard and ping missing feedback before the founder call, {PERSONA} will hire on vibe. GDPR candidate consent still matters on the first EU contractor, even at seed, before a cap-table offer draft goes out.',
    },
    {
      title: 'Founder-Slack requisition approvals & offer letter workflows for {PERSONA}',
      body: 'For {PERSONA}, there is no formal offer approval chain—just a founder Slack thumbs-up. {A} vs {B} should generate a same-day offer letter with equity language without routing through three budget owners {PERSONA} does not have yet. A cap-table offer draft that needs Finance sign-off will stall the first AE.',
    },
  ],
  scaleups: [
    {
      title: 'Sourcer-split candidate pipeline & stage automation for {PERSONA}',
      body: 'For {PERSONA}, stage automation has to survive a sourcer-plus-recruiter split and a headcount-plan freeze. {A} vs {B} should auto-nudge stalled onsite stages and keep silver medalists warm. A sourcing extension that writes into the CRM without polluting conversion reporting is the difference between a clean funnel and a fake pipeline {PERSONA} cannot forecast.',
    },
    {
      title: 'Debrief-SLA interviewer scorecards & feedback loops for {PERSONA}',
      body: 'For {PERSONA}, recruiter-to-sourcer SLAs break when hiring managers skip structured interview kits. {A} or {B} must block advancing a candidate until scorecards land, then roll feedback into a 30-minute debrief. GDPR candidate consent logs should ride with every outbound sequence {PERSONA} runs in the EU and UK.',
    },
    {
      title: 'Banded requisition approvals & offer letter workflows for {PERSONA}',
      body: 'For {PERSONA}, the offer approval chain now includes Finance and a compensation band, not just the hiring manager. {A} vs {B} has to gate the offer letter on that chain and still ship it inside 24 hours, or {PERSONA} loses competing candidates to a faster stack. Backfill velocity dies when a headcount-plan freeze sits in email.',
    },
  ],
  agencies: [
    {
      title: 'Client-tagged candidate pipeline & stage automation for {PERSONA}',
      body: 'For {PERSONA}, pipeline stages are client-tagged submittals, not a single in-house req. {A} vs {B} must stop duplicate-candidate collisions across retainers and let a sourcing extension push prospects into the right client pipeline without mixing confidential rosters {PERSONA} cannot leak. A confidential-roster firewall is the buying test.',
    },
    {
      title: 'Client-facing interviewer scorecards & feedback loops for {PERSONA}',
      body: 'For {PERSONA}, the interviewer is often the client. Structured interview kits have to travel as a client-facing scorecard, not an internal-only form. {A} or {B} fails if feedback loops cannot be exported per retainer. GDPR candidate consent must be captured before {PERSONA} redistributes a CV across accounts.',
    },
    {
      title: 'Placement-fee requisition approvals & offer letter workflows for {PERSONA}',
      body: 'For {PERSONA}, the offer approval chain is the client plus the agency lead, not an internal budget owner. {A} vs {B} should keep the offer letter, fee-on-placement ledger, and guarantee window on one placement record {PERSONA} can invoice from.',
    },
  ],
  enterprise: [
    {
      title: 'OFCCP-grade candidate pipeline & stage automation for {PERSONA}',
      body: 'For {PERSONA}, stage automation has to survive requisition freezes, adverse-impact funnel files, and executive-search bypasses. {A} vs {B} cannot treat a sourcing extension as the system of record if OFCCP needs a reconstructable pipeline {PERSONA} can hand legal.',
    },
    {
      title: 'Audit-kit interviewer scorecards & feedback loops for {PERSONA}',
      body: 'For {PERSONA}, structured interview kits are an audit artifact. {A} or {B} must enforce scorecards, store GDPR candidate consent with the application, and prove every interviewer used the same kit. Feedback loops that live in email are a works-council finding waiting to happen.',
    },
    {
      title: 'Comp-committee requisition approvals & offer letter workflows for {PERSONA}',
      body: 'For {PERSONA}, the offer approval chain includes compensation-committee signoff, legal, and sometimes a works council. {A} vs {B} has to freeze the offer letter until that chain clears and still log who approved what. A self-serve send is a policy breach {PERSONA} will not survive.',
    },
  ],
  'remote-teams': [
    {
      title: 'Follow-the-sun candidate pipeline & stage automation for {PERSONA}',
      body: 'For {PERSONA}, stages cannot assume overlapping working hours. {A} vs {B} should auto-move take-home and async video stages overnight on a follow-the-sun debrief clock. A sourcing extension that only works in one timezone calendar will stall the pipeline {PERSONA} runs across continents.',
    },
    {
      title: 'Async interviewer scorecards & feedback loops for {PERSONA}',
      body: 'For {PERSONA}, structured interview kits must support async scorecards so interviewers who never meet still leave comparable notes. {A} or {B} needs GDPR candidate consent baked into EU outbound, plus feedback loops that do not require a hallway debrief {PERSONA} will never hold.',
    },
    {
      title: 'Timezone requisition approvals & offer letter workflows for {PERSONA}',
      body: 'For {PERSONA}, the offer approval chain is Slack-across-time-zones, not a same-room signature. {A} vs {B} should let distributed budget owners clear an offer letter asynchronously without blocking the right-to-work packet {PERSONA} still has to finish before start date.',
    },
  ],
};

/** Performance-management child-page bottlenecks: 360 calibration, OKRs, check-ins. */
export const PM_BOTTLENECKS: Record<string, WorkflowBottleneck[]> = {
  startups: [
    {
      title: 'Seed-stage 360-degree peer review calibration for {PERSONA}',
      body: 'For {PERSONA}, a full 360-degree peer review calibration is premature—there is no 9-box talent matrix to populate yet. {A} vs {B} should allow a lightweight peer ping without launching calibration sessions {PERSONA} cannot staff. Skip forced ranking until a founding-manager cadence exists.',
    },
    {
      title: 'Founder-cascade OKR & goal tracking alignment for {PERSONA}',
      body: 'For {PERSONA}, OKR & goal tracking alignment is a founder-to-first-hire cascade, not a department tree. {A} or {B} must keep review cycle automation optional so {PERSONA} is not paying for quarterly talent reviews nobody will run. A seed-stage pulse skip is the right call until headcount exists.',
    },
    {
      title: 'Slack-native continuous manager check-ins & engagement surveys for {PERSONA}',
      body: 'For {PERSONA}, continuous manager check-ins & engagement surveys have to live in Slack, not a second login. Anonymous sentiment analysis is a later module. {A} vs {B} fails if weekly 1:1s need a People Ops operator {PERSONA} has not hired.',
    },
  ],
  scaleups: [
    {
      title: 'Skip-level 360-degree peer review calibration for {PERSONA}',
      body: 'For {PERSONA}, 360-degree peer review calibration now includes skip-level talent huddles and a first tabletop talent review during a series-b headcount wave. {A} vs {B} should run calibration sessions on real manager data and sketch a 9-box talent matrix without pretending {PERSONA} is already enterprise. Review cycle automation has to hit a mid-year cycle lock and year-end without a third survey tool. Quota-carrying managers will skip a sandbox demo dataset.',
    },
    {
      title: 'Department-cascade OKR & goal tracking alignment for {PERSONA}',
      body: 'For {PERSONA}, OKR & goal tracking alignment breaks on a product-vs-sales collision when each function keeps a spreadsheet. {A} or {B} must cascade department OKRs into reviews so {PERSONA} can see goal attainment next to calibration, not in a sidecar. Third-survey sprawl is how this buy fails.',
    },
    {
      title: 'Pulse-replacement continuous manager check-ins & engagement surveys for {PERSONA}',
      body: 'For {PERSONA}, continuous manager check-ins & engagement surveys compete with an incumbent pulse vendor. {A} vs {B} needs anonymous sentiment analysis that HRBPs trust, plus check-in completion {PERSONA} can report to the exec team without CSV gymnastics. A compensation-module sticker quoted after kickoff wrecks the Finance case.',
    },
  ],
  'people-ops': [
    {
      title: 'HRBP-pack 360-degree peer review calibration for {PERSONA}',
      body: 'For {PERSONA}, 360-degree peer review calibration is the HRBP succession pack: succession-slate facilitation kit, a 9-box talent matrix, and minutes from calibration sessions. {A} vs {B} fails if review cycle automation dumps that pack into a spreadsheet {PERSONA} has to rebuild every talent cycle. Office-hours talent clinics and a cycle-admin runbook are the operating test, not a feature tour.',
    },
    {
      title: 'Console OKR & goal tracking alignment for {PERSONA}',
      body: 'For {PERSONA}, OKR & goal tracking alignment has to land in the same single-console talent file as reviews. {A} or {B} should let {PERSONA} drop a people-analytics overlay on calibration without a BI export. That business-partner console lock is the system-of-record test, not a feature checkbox.',
    },
    {
      title: 'HRBP-console continuous manager check-ins & engagement surveys for {PERSONA}',
      body: 'For {PERSONA}, continuous manager check-ins & engagement surveys are incomplete without anonymous sentiment analysis next to 1:1 completion. {A} vs {B} must keep that science in one console so {PERSONA} is not maintaining a shadow dashboard. An admin-seat freeze plus an engagement-science pack is how {PERSONA} scores the buy.',
    },
  ],
  'remote-teams': [
    {
      title: 'Timezone-fair 360-degree peer review calibration for {PERSONA}',
      body: 'For {PERSONA}, 360-degree peer review calibration cannot assume a hallway 9-box talent matrix. {A} vs {B} needs timezone-fair written 360s and calibration sessions plus review cycle automation that waits for async peers. A same-day onsite calibration will exclude half the company {PERSONA} employs.',
    },
    {
      title: 'Async OKR & goal tracking alignment for {PERSONA}',
      body: 'For {PERSONA}, OKR & goal tracking alignment has to be visible without overlapping hours. {A} or {B} should show goal check-ins in writing so distributed ICs {PERSONA} manages are not graded on hallway context they never heard.',
    },
    {
      title: 'Pod-safe continuous manager check-ins & engagement surveys for {PERSONA}',
      body: 'For {PERSONA}, continuous manager check-ins & engagement surveys live in Slack/Teams, not a shared office. Anonymous sentiment analysis must respect a pod-size anonymity floor so small pods are not unmasked. {A} vs {B} fails if 1:1 nudges assume one working day {PERSONA} does not have.',
    },
  ],
  agencies: [
    {
      title: 'Studio-scoped 360-degree peer review calibration for {PERSONA}',
      body: 'For {PERSONA}, 360-degree peer review calibration collides with client confidentiality—peers on a billable team should not see another account’s notes. {A} vs {B} must scope calibration sessions and any 9-box talent matrix by a studio-scoped talent ladder, not a fake company-wide ladder {PERSONA} does not run.',
    },
    {
      title: 'Utilization OKR & goal tracking alignment for {PERSONA}',
      body: 'For {PERSONA}, OKR & goal tracking alignment is utilization-tied goals and delivery, not a product roadmap. {A} or {B} should map goals to billable teams so review cycle automation does not grade studio leads on a corporate OKR {PERSONA} never adopted.',
    },
    {
      title: 'Bench-split continuous manager check-ins & engagement surveys for {PERSONA}',
      body: 'For {PERSONA}, continuous manager check-ins & engagement surveys have to work for mixed employee and contractor benches. Anonymous sentiment analysis that includes contractors on a client site is a leak risk. {A} vs {B} should let {PERSONA} segment pulses by employment type.',
    },
  ],
  enterprise: [
    {
      title: 'Comp-committee 360-degree peer review calibration for {PERSONA}',
      body: 'For {PERSONA}, 360-degree peer review calibration is a compensation-committee artifact: a 9-box talent matrix, documented calibration sessions, and legal-grade notes. {A} vs {B} must keep review cycle automation audit-ready. A self-serve SMB 360 will not survive {PERSONA} counsel.',
    },
    {
      title: 'Board-cascade OKR & goal tracking alignment for {PERSONA}',
      body: 'For {PERSONA}, OKR & goal tracking alignment has to cascade from board-level objectives into manager scorecards. {A} or {B} should prove goal attainment feeds calibration, not a parallel OKR toy {PERSONA} will be asked to sunset.',
    },
    {
      title: 'Works-council continuous manager check-ins & engagement surveys for {PERSONA}',
      body: 'For {PERSONA}, continuous manager check-ins & engagement surveys need anonymous sentiment analysis with works-council pulse posture, SAML, and completion reporting. {A} vs {B} fails if pulses cannot be segmented for {PERSONA} without exporting identifiable comments.',
    },
  ],
};

export const ATS_FAQS: Record<string, FaqItem[]> = {
  startups: [
    {
      question: 'How should garage-hire candidate pipeline and stage automation work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, pick the stack that auto-advances a founder-led pipeline without a recruiting coordinator or garage-hire intake owner. {A} vs {B} should keep a sourcing extension from dumping noise into every stage. Seed hiring volume does not need enterprise funnel analytics; it needs a short screen-to-offer path {PERSONA} can run at night.',
    },
    {
      question: 'Do first-interviewer scorecards and feedback loops on {A} or {B} actually fit for {PERSONA}?',
      answer:
        'For {PERSONA}, structured interview kits should be two questions a first-time interviewer will fill in. {A} vs {B} loses if feedback loops require a hiring committee {PERSONA} does not have. Capture GDPR candidate consent on the first EU inbound even when the ATS feels like a spreadsheet replacement, before any cap-table offer draft.',
    },
    {
      question: 'What does a founder-Slack requisition and offer letter workflow look like for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, skip a three-step offer approval chain. {A} or {B} should spit out an offer letter with equity after a founder Slack yes. Requisition approvals that assume budget owners and compensation bands will slow the first AE hire {PERSONA} is trying to make.',
    },
  ],
  scaleups: [
    {
      question: 'How should sourcer-split candidate pipeline and stage automation work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, stage automation has to respect a sourcer vs recruiter split, survive a headcount-plan freeze, and keep silver-medalist nurture out of the active funnel. {A} vs {B} should let a sourcing extension write to CRM without wrecking conversion. Backfill velocity is the KPI {PERSONA} will use to pick a winner.',
    },
    {
      question: 'Do debrief-SLA interviewer scorecards and feedback loops on {A} or {B} actually fit for {PERSONA}?',
      answer:
        'For {PERSONA}, structured interview kits must block advancing until scorecards land, then feed a timed debrief. {A} vs {B} is a methodology choice tied to recruiter-to-sourcer SLAs. GDPR candidate consent should attach to every outbound sequence {PERSONA} runs as hiring volume crosses multiple countries.',
    },
    {
      question: 'What does a banded requisition and offer letter workflow look like for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, the offer approval chain now includes Finance and a compensation band. {A} vs {B} has to gate the offer letter on that chain and still send inside a day. Requisition approvals that stall in email are why {PERSONA} loses competing offers.',
    },
  ],
  agencies: [
    {
      question: 'How should client-tagged candidate pipeline and stage automation work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, pipelines are client-tagged, not one company req list. {A} vs {B} must catch duplicate candidates across retainers. A sourcing extension that cannot target a client pipeline will mix confidential rosters {PERSONA} is contracted to keep separate behind a confidential-roster firewall.',
    },
    {
      question: 'Do client-facing interviewer scorecards and feedback loops on {A} or {B} actually fit for {PERSONA}?',
      answer:
        'For {PERSONA}, the interviewer is often the hiring client. Structured interview kits have to export as a client scorecard. {A} vs {B} fails if feedback loops cannot be retainer-scoped. GDPR candidate consent is required before {PERSONA} redistributes a CV to a second account.',
    },
    {
      question: 'What does a placement-fee requisition and offer letter workflow look like for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, the offer approval chain is client plus agency lead. {A} vs {B} should keep the offer letter, fee-on-placement ledger, and guarantee on one record {PERSONA} invoices from. Internal-only requisition approvals that ignore the client will not close retained search.',
    },
  ],
  enterprise: [
    {
      question: 'How should OFCCP-grade candidate pipeline and stage automation work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, stage automation must survive requisition freezes, adverse-impact funnel files, and OFCCP reconstruction. {A} vs {B} cannot let a sourcing extension be the system of record. Adverse-impact reporting on the pipeline is a buying criterion {PERSONA} legal will raise in the RFP.',
    },
    {
      question: 'Do audit-kit interviewer scorecards and feedback loops on {A} or {B} actually fit for {PERSONA}?',
      answer:
        'For {PERSONA}, structured interview kits are evidence. {A} vs {B} must store GDPR candidate consent with the application and prove every interviewer used the same kit. Feedback loops in email are a works-council issue {PERSONA} will not accept.',
    },
    {
      question: 'What does a compensation-committee requisition and offer letter workflow look like for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, the offer approval chain includes compensation-committee signoff, legal, and sometimes a works council. {A} vs {B} has to freeze the offer letter until that chain clears and log approvers. A self-serve send is a policy breach {PERSONA} procurement will reject.',
    },
  ],
  'remote-teams': [
    {
      question: 'How should follow-the-sun candidate pipeline and stage automation work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, stages must move take-home and async video overnight on a follow-the-sun debrief clock. {A} vs {B} should not assume overlapping interviewer hours. A sourcing extension tied to one office calendar will freeze the pipeline {PERSONA} runs across continents.',
    },
    {
      question: 'Do async interviewer scorecards and feedback loops on {A} or {B} actually fit for {PERSONA}?',
      answer:
        'For {PERSONA}, structured interview kits need async scorecards so interviewers who never meet still leave comparable notes. {A} vs {B} should embed GDPR candidate consent in EU outbound. Feedback loops that require a hallway debrief exclude the team {PERSONA} actually employs.',
    },
    {
      question: 'What does a timezone requisition and offer letter workflow look like for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, the offer approval chain is asynchronous across time zones. {A} vs {B} should clear an offer letter without a same-room signature and still collect the right-to-work packet before start date. Requisition approvals that batch at 9am local time will stall {PERSONA} for a full working day.',
    },
  ],
};

export const PM_FAQS: Record<string, FaqItem[]> = {
  startups: [
    {
      question: 'Does seed-stage 360-degree peer review calibration on {A} vs {B} actually matter for {PERSONA}?',
      answer:
        'For {PERSONA}, skip a 9-box talent matrix and formal calibration sessions until a founding-manager cadence exists. {A} vs {B} should offer a lightweight peer ping. Review cycle automation that forces a talent-day calendar is overhead {PERSONA} will ignore.',
    },
    {
      question: 'How should founder-cascade OKR and goal tracking alignment work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, OKR & goal tracking alignment is founder-to-first-hire, not a department cascade. {A} vs {B} should keep goals next to weekly check-ins. Paying for enterprise OKR trees {PERSONA} will not fill is wasted seat cost; a seed-stage pulse skip is cheaper.',
    },
    {
      question: 'Can Slack-native continuous manager check-ins and engagement surveys on {A} or {B} run for {PERSONA} without People Ops?',
      answer:
        'For {PERSONA}, continuous manager check-ins & engagement surveys must live in Slack. Anonymous sentiment analysis can wait. {A} vs {B} fails if 1:1s need an admin {PERSONA} has not hired.',
    },
  ],
  scaleups: [
    {
      question: 'Does skip-level 360-degree peer review calibration on {A} vs {B} actually matter for {PERSONA}?',
      answer:
        'For {PERSONA}, 360-degree peer review calibration now includes skip-level talent huddles and a first tabletop talent review during a series-b headcount wave. {A} vs {B} should run calibration sessions on live manager data and sketch a 9-box talent matrix without enterprise theater. Review cycle automation needs a mid-year cycle lock and year-end pass {PERSONA} will actually complete. Quota-carrying managers will not sit through a sandbox demo dataset.',
    },
    {
      question: 'How should department-cascade OKR and goal tracking alignment work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, OKR & goal tracking alignment breaks on a product-vs-sales collision when product, sales, and people keep separate trackers. {A} vs {B} must cascade department OKRs into reviews so {PERSONA} sees goal attainment beside calibration, not in a sidecar spreadsheet. Third-survey sprawl is the failure mode.',
    },
    {
      question: 'Can pulse-replacement continuous manager check-ins and engagement surveys on {A} or {B} replace a pulse tool for {PERSONA}?',
      answer:
        'For {PERSONA}, continuous manager check-ins & engagement surveys compete with an incumbent pulse vendor. {A} vs {B} needs anonymous sentiment analysis HRBPs trust and check-in completion {PERSONA} can show the exec team without a CSV merge. Ask for the compensation-module sticker in the same quote.',
    },
  ],
  'people-ops': [
    {
      question: 'Does HRBP-pack 360-degree peer review calibration on {A} vs {B} actually matter for {PERSONA}?',
      answer:
        'For {PERSONA}, 360-degree peer review calibration is the HRBP succession pack: a succession-slate facilitation kit, a 9-box talent matrix, and minutes from calibration sessions. {A} vs {B} fails if review cycle automation dumps that pack into a file {PERSONA} rebuilds every cycle. Office-hours talent clinics plus a cycle-admin runbook are how {PERSONA} runs talent day.',
    },
    {
      question: 'How should console OKR and goal tracking alignment work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, OKR & goal tracking alignment must live in the single-console talent file next to reviews. {A} vs {B} should drop a people-analytics overlay on calibration without a BI export. That business-partner console lock is how {PERSONA} kills a shadow dashboard.',
    },
    {
      question: 'Can HRBP-console continuous manager check-ins and engagement surveys on {A} or {B} sit in one console for {PERSONA}?',
      answer:
        'For {PERSONA}, continuous manager check-ins & engagement surveys are incomplete without anonymous sentiment analysis beside 1:1 completion. {A} vs {B} must keep that science in one place so {PERSONA} is not exporting comments into a second survey product. Score an admin-seat freeze and an engagement-science pack before {PERSONA} signs.',
    },
  ],
  'remote-teams': [
    {
      question: 'Does timezone-fair 360-degree peer review calibration on {A} vs {B} actually matter for {PERSONA}?',
      answer:
        'For {PERSONA}, 360-degree peer review calibration cannot be a hallway 9-box talent matrix. {A} vs {B} needs timezone-fair written 360s, written calibration sessions, and review cycle automation that waits for async peers. Same-day onsite calibration excludes the company {PERSONA} actually employs.',
    },
    {
      question: 'How should async OKR and goal tracking alignment work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, OKR & goal tracking alignment has to be readable without overlapping hours. {A} vs {B} should keep goal check-ins in writing so distributed ICs {PERSONA} manages are not scored on hallway context they never heard.',
    },
    {
      question: 'Can pod-safe continuous manager check-ins and engagement surveys on {A} or {B} stay fair for {PERSONA}?',
      answer:
        'For {PERSONA}, continuous manager check-ins & engagement surveys live in Slack/Teams. Anonymous sentiment analysis must respect a pod-size anonymity floor so small pods are not unmasked. {A} vs {B} fails if 1:1 nudges assume one working day {PERSONA} does not share.',
    },
  ],
  agencies: [
    {
      question: 'Does studio-scoped 360-degree peer review calibration on {A} vs {B} actually matter for {PERSONA}?',
      answer:
        'For {PERSONA}, 360-degree peer review calibration collides with client confidentiality. {A} vs {B} must scope calibration sessions and any 9-box talent matrix by a studio-scoped talent ladder. A company-wide ladder {PERSONA} does not run will leak account context in peer comments.',
    },
    {
      question: 'How should utilization OKR and goal tracking alignment work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, OKR & goal tracking alignment is utilization-tied goals and delivery, not a product roadmap. {A} vs {B} should map goals to billable teams so review cycle automation does not grade studio leads on a corporate OKR {PERSONA} never adopted.',
    },
    {
      question: 'Can bench-split continuous manager check-ins and engagement surveys on {A} or {B} cover mixed benches for {PERSONA}?',
      answer:
        'For {PERSONA}, continuous manager check-ins & engagement surveys must work for employees and contractors. Anonymous sentiment analysis that includes client-site contractors is a leak. {A} vs {B} should let {PERSONA} segment pulses by employment type.',
    },
  ],
  enterprise: [
    {
      question: 'Does comp-committee 360-degree peer review calibration on {A} vs {B} actually matter for {PERSONA}?',
      answer:
        'For {PERSONA}, 360-degree peer review calibration is a compensation-committee file: a 9-box talent matrix, documented calibration sessions, and legal-grade notes. {A} vs {B} must keep review cycle automation audit-ready. A self-serve SMB 360 will not survive {PERSONA} counsel.',
    },
    {
      question: 'How should board-cascade OKR and goal tracking alignment work for {PERSONA} on {A} vs {B}?',
      answer:
        'For {PERSONA}, OKR & goal tracking alignment has to cascade from board objectives into manager scorecards. {A} vs {B} should prove goal attainment feeds calibration. A parallel OKR toy {PERSONA} will be asked to sunset is a failed buy.',
    },
    {
      question: 'Can works-council continuous manager check-ins and engagement surveys on {A} or {B} meet works-council needs for {PERSONA}?',
      answer:
        'For {PERSONA}, continuous manager check-ins & engagement surveys need anonymous sentiment analysis with works-council pulse posture, SAML, and completion reporting. {A} vs {B} fails if pulses cannot be segmented without exporting identifiable comments {PERSONA} legal will block.',
    },
  ],
};
