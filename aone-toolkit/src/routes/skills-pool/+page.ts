import { redirect } from "@sveltejs/kit";
import { getLegacyAgentStudioTarget } from "$lib/legacyRoutes";

export function load() {
    throw redirect(308, getLegacyAgentStudioTarget("skills"));
}
