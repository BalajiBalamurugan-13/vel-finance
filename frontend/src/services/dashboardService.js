import api from "./api";

export const getDashboard = async () => {
    const response = await api.get("/transactions/dashboard");
    return response.data;
};

export async function getCashbook() {

    const response = await api.get(
        "/transactions/cashbook"
    );

    return response.data;

}   

export async function getCashFlow(date) {

    const res = await api.get(
        `/transactions/cash-flow/${date}`
    );

    return res.data;
}

export async function getTodayCashFlow() {
    const response = await api.get("/transactions/cash-flow");
    return response.data;
}

export async function getMigrationStatus() {
    const response = await api.get("/transactions/migration-status");
    return response.data;
}

export async function completeMigration() {
    const response = await api.post("/transactions/complete-migration");
    return response.data;
}

export async function addInvestment(data) {
    const response = await api.post("/transactions/add-investment", data);
    return response.data;
}