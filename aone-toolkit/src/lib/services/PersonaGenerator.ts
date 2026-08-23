import { MetaFlowService } from "./MetaFlowService";
import type { Agent } from "../stores/agentStore.svelte";

const PERSONA_GENERATION_PROMPT = `
You are an expert Persona Architect. Your goal is to generate a detailed, consistent, and interesting AI agent profile based on a short description.

Input: A short description of a character or role (e.g., "A grumpy cyberpunk hacker").
Output: A valid JSON object representing the agent configuration.

IMPORTANT: The output content (name, role, description, traits, systemPrompt) MUST be in CHINESE (Simplified Chinese).

JSON Schema:
{
    "name": "string (Creative name in Chinese)",
    "role": "string (Professional role title in Chinese)",
    "description": "string (Public bio, 1-2 sentences in Chinese)",
    "traits": ["string", "string", "string"] (3-5 personality tags in Chinese),
    "systemPrompt": "string (Detailed system instruction in Chinese, 2nd person 'You are...', covering personality, style, constraints)",
    "personaConfig": {
        "rationality": number (0-10),
        "creativity": number (0-10),
        "empathy": number (0-10),
        "mbti": "string (e.g. INTJ)",
        "communicationStyle": "string (e.g. Direct, Socratic, Cheerful)"
    },
    "temperature": number (0.0 - 1.0, based on creativity),
    "suggestedColor": "string (One of: bg-blue-500, bg-indigo-500, bg-violet-500, bg-purple-500, bg-rose-500, bg-orange-500, bg-amber-500, bg-emerald-500, bg-teal-500, bg-cyan-500, bg-slate-500, bg-zinc-500)",
    "suggestedAvatar": "string (One of: default, sitemap, calculator, compass, shield-check, flag, heart, users, code)"
}

Rules:
1. Output ONLY valid JSON. No markdown, no commentary.
2. The "systemPrompt" should be high-quality, instruction-tuned, and mandate concise, direct, conclusion-first reasoning (AI 输出克制铁律).
3. "rationality" + "creativity" + "empathy" should reflect the character.
4. "suggestedColor" and "suggestedAvatar" must match the allowed list.
`;

export class PersonaGenerator {
    static async generateFromDescription(description: string): Promise<Partial<Agent>> {
        const fullPrompt = `${PERSONA_GENERATION_PROMPT}\n\nUser Description: "${description}"\n\nJSON Output:`;

        try {
            const result = await MetaFlowService.callAI(fullPrompt);
            const parsed = MetaFlowService.extractJSON(result);

            // Map suggested fields specific to our UI
            return {
                name: parsed.name,
                role: parsed.role,
                description: parsed.description,
                traits: parsed.traits,
                systemPrompt: parsed.systemPrompt,
                personaConfig: parsed.personaConfig,
                temperature: parsed.temperature,
                color: parsed.suggestedColor || "bg-slate-500",
                avatar: parsed.suggestedAvatar || "default"
            };
        } catch (error) {
            console.error("Failed to generate persona:", error);
            throw new Error("Failed to generate persona. Please try again.");
        }
    }
}
