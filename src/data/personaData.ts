import type { PersonaData } from '../types/comparison';
import { atsPersonaByToolId } from './personaData.ats';
import { performancePersonaByToolId } from './personaData.pm';
import { globalPayrollPersonaByToolId } from './personaData.payroll';
import { mergePersonaPack } from './personaSpec';

/**
 * Stage 1 schema uses `startupFeatures` — not a `for-tech-startups` key.
 * Live CSV slugs may still end in `-for-tech-startups` (payroll) or
 * `-for-startups` (ATS/PM); those niche ids resolve to `startupFeatures`.
 */
export function personaDataForComparison(
  toolAId: string,
  toolBId: string,
  aName: string,
  bName: string
): PersonaData | undefined {
  const payrollA = globalPayrollPersonaByToolId[toolAId];
  const payrollB = globalPayrollPersonaByToolId[toolBId];
  if (payrollA && payrollB) {
    return { globalPayroll: mergePersonaPack(payrollA, payrollB, aName, bName) };
  }

  const atsA = atsPersonaByToolId[toolAId];
  const atsB = atsPersonaByToolId[toolBId];
  if (atsA && atsB) {
    return { ats: mergePersonaPack(atsA, atsB, aName, bName) };
  }

  const pmA = performancePersonaByToolId[toolAId];
  const pmB = performancePersonaByToolId[toolBId];
  if (pmA && pmB) {
    return { performanceMgmt: mergePersonaPack(pmA, pmB, aName, bName) };
  }

  return undefined;
}

export { atsPersonaByToolId, globalPayrollPersonaByToolId, performancePersonaByToolId };
