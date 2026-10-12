import { defineCollection, z } from 'astro:content';

const comparisonCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaDescription: z.string().min(120).max(160),
    category: z.enum(['ats', 'global-payroll-eor', 'performance-management']),
    vendorA: z.object({
      name: z.string(),
      pricingModel: z.string(),
      hiddenCostsNotice: z.string().min(30, 'Must detail explicit pricing traps or fee escalation triggers'),
    }),
    vendorB: z.object({
      name: z.string(),
      pricingModel: z.string(),
      hiddenCostsNotice: z.string().min(30, 'Must detail explicit pricing traps or fee escalation triggers'),
    }),
    uniqueDifferentiatorProse: z.string().min(200, 'Minimum 200 characters of non-templated editorial analysis required'),
    targetTeamSizeRecommendation: z.string(),
    screenshots: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string().min(20, 'Alt text must be descriptive for accessibility & OCR'),
          caption: z.string().min(20, 'Captions must explain specific software features shown'),
          uiFeatureTag: z.string(),
        }),
      )
      .min(1, 'Every comparison route must feature at least one verified UI screenshot'),
  }),
});

export const collections = {
  comparisons: comparisonCollection,
};
