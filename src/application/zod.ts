import z from 'zod';

export const tooSmall = (field: string, minimum: number): z.IssueData => ({
  type: 'number',
  code: z.ZodIssueCode.too_small,
  inclusive: true,
  path: [field],
  minimum,
});

export const tooBig = (field: string, maximum: number): z.IssueData => ({
  type: 'number',
  code: z.ZodIssueCode.too_big,
  inclusive: true,
  path: [field],
  maximum,
});
