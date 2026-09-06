import api from "./api";

/**
 * Fetch all places ordered by priority ASC.
 * @returns {Promise<Array<{id: number, name: string, priority: number}>>}
 */
export async function getPlaces() {
    const response = await api.get("/places/");
    return response.data;
}

/**
 * Create a new place.
 * @param {{ name: string, priority: number }} data
 */
export async function createPlace(data) {
    const response = await api.post("/places/", data);
    return response.data;
}

/**
 * Update a place's name and/or priority.
 * @param {number} id
 * @param {{ name?: string, priority?: number }} data
 */
export async function updatePlace(id, data) {
    const response = await api.put(`/places/${id}`, data);
    return response.data;
}

/**
 * Delete a place (only if no customers are assigned).
 * @param {number} id
 */
export async function deletePlace(id) {
    const response = await api.delete(`/places/${id}`);
    return response.data;
}

/**
 * Bulk-update place priorities.
 * @param {Array<{id: number, priority: number}>} items
 */
export async function reorderPlaces(items) {
    const response = await api.put("/places/reorder", { items });
    return response.data;
}
