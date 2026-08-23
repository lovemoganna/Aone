export const legacyAgentStudioRoutes = {
    orchestration: {
        from: "/orchestration",
        to: "/agent-studio/orchestration",
        reason: "Squad and workflow orchestration now live inside Agent Studio.",
    },
    personas: {
        from: "/persona-workshop",
        to: "/agent-studio/personas",
        reason: "Persona resources now live inside Agent Studio.",
    },
    skills: {
        from: "/skills-pool",
        to: "/agent-studio/skills",
        reason: "Skill resources now live inside Agent Studio.",
    },
} as const;

export type LegacyAgentStudioRoute = keyof typeof legacyAgentStudioRoutes;

export function getLegacyAgentStudioTarget(route: LegacyAgentStudioRoute) {
    return legacyAgentStudioRoutes[route].to;
}
