'use server';
/**
 * @fileOverview An AI agent for classifying incidents and suggesting key tags.
 *
 * - aiIncidentClassifier - A function that handles the incident classification process.
 * - AiIncidentClassifierInput - The input type for the aiIncidentClassifier function.
 * - AiIncidentClassifierOutput - The return type for the aiIncidentClassifier function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiIncidentClassifierInputSchema = z.object({
  incidentDescription: z.string().describe('A detailed description of the incident.'),
});
export type AiIncidentClassifierInput = z.infer<typeof AiIncidentClassifierInputSchema>;

const AiIncidentClassifierOutputSchema = z.object({
  crimeClassifications: z.array(z.string()).describe('A list of suggested crime classifications relevant to the incident.'),
  keyTags: z.array(z.string()).describe('A list of relevant keywords or tags for the incident.'),
});
export type AiIncidentClassifierOutput = z.infer<typeof AiIncidentClassifierOutputSchema>;

export async function aiIncidentClassifier(
  input: AiIncidentClassifierInput
): Promise<AiIncidentClassifierOutput> {
  return aiIncidentClassifierFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiIncidentClassifierPrompt',
  input: {schema: AiIncidentClassifierInputSchema},
  output: {schema: AiIncidentClassifierOutputSchema},
  prompt: `You are an AI police intelligence analyst. Your task is to analyze incident descriptions and provide accurate crime classifications and relevant key tags.

Based on the following incident description, provide a list of appropriate crime classifications and key tags.

Incident Description: {{{incidentDescription}}}

Make sure to provide the classifications and tags as lists.`,
});

const aiIncidentClassifierFlow = ai.defineFlow(
  {
    name: 'aiIncidentClassifierFlow',
    inputSchema: AiIncidentClassifierInputSchema,
    outputSchema: AiIncidentClassifierOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
