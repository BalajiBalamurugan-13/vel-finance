import api from "./api";

const getLocalDate = () => new Date().toLocaleDateString("en-CA");

export const getDashboard = async (date) => {
    const d = date || getLocalDate();
    const response = await api.get(`/transactions/dashboard?date=${d}`);
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

export async function getTodayCashFlow(date) {
    const d = date || getLocalDate();
    const response = await api.get(`/transactions/cash-flow?date=${d}`);
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

export async function getLoansByDate(date) {
    const response = await api.get(`/transactions/loans-by-date/${date}`);
    return response.data;
}

export async function getTodayLoans(date) {
    const d = date || getLocalDate();
    const response = await api.get(`/transactions/loans-by-date?date=${d}`);
    return response.data;
}