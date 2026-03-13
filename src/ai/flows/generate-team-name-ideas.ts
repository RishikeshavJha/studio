'use server';
/**
 * @fileOverview A Genkit flow for generating creative team name ideas for hackathons.
 *
 * - generateTeamNameIdeas - A function that generates team name ideas.
 * - GenerateTeamNameIdeasInput - The input type for the generateTeamNameIdeas function.
 * - GenerateTeamNameIdeasOutput - The return type for the generateTeamNameIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeamNameIdeasInputSchema = z.object({
  keywordsOrTheme: z.string().describe('Keywords or the theme of the hackathon to inspire team names.'),
});
export type GenerateTeamNameIdeasInput = z.infer<typeof GenerateTeamNameIdeasInputSchema>;

const GenerateTeamNameIdeasOutputSchema = z.object({
  teamNames: z.array(z.string()).describe('An array of creative and relevant team name suggestions.'),
});
export type GenerateTeamNameIdeasOutput = z.infer<typeof GenerateTeamNameIdeasOutputSchema>;

export async function generateTeamNameIdeas(input: GenerateTeamNameIdeasInput): Promise<GenerateTeamNameIdeasOutput> {
  return generateTeamNameIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTeamNameIdeasPrompt',
  input: {schema: GenerateTeamNameIdeasInputSchema},
  output: {schema: GenerateTeamNameIdeasOutputSchema},
  prompt: `You are a creative hackathon team name generator.
  Your task is to suggest 5 to 10 creative, inspiring, and relevant team names based on the provided keywords or hackathon theme.
  The names should be suitable for a competitive hackathon environment.

  Keywords or Hackathon Theme: {{{keywordsOrTheme}}}

  Provide the suggestions as a JSON array of strings.`
});

const generateTeamNameIdeasFlow = ai.defineFlow(
  {
    name: 'generateTeamNameIdeasFlow',
    inputSchema: GenerateTeamNameIdeasInputSchema,
    outputSchema: GenerateTeamNameIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
