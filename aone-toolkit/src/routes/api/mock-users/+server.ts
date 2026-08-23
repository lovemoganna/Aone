import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
    const authHeader = request.headers.get("Authorization");
    const role = url.searchParams.get("role");
    const limitVal = url.searchParams.get("limit");
    const limit = limitVal ? parseInt(limitVal, 10) : 10;

    // Simulate authentication check
    if (!authHeader || !authHeader.startsWith("Bearer aone_token_12345")) {
        return json(
            { error: "Invalid token or authorization header format", code: "UNAUTHORIZED" },
            { status: 401 }
        );
    }

    const allUsers = [
        { id: "usr_99", name: "Jane Doe", role: "admin", email: "jane@aone.io" },
        { id: "usr_100", name: "John Smith", role: "developer", email: "john@aone.io" },
        { id: "usr_101", name: "Alice Brown", role: "developer", email: "alice@aone.io" },
        { id: "usr_102", name: "Bob Johnson", role: "guest", email: "bob@aone.io" },
        { id: "usr_103", name: "Charlie Green", role: "admin", email: "charlie@aone.io" }
    ];

    let filtered = allUsers;
    if (role) {
        filtered = allUsers.filter(u => u.role.toLowerCase() === role.toLowerCase());
    }

    // Return 404 if role filter is invalid
    if (role && !["admin", "developer", "guest"].includes(role.toLowerCase())) {
        return json(
            { error: "Specified filter role does not exist", code: "ROLE_NOT_FOUND" },
            { status: 404 }
        );
    }

    return json({ users: filtered.slice(0, limit) });
};
