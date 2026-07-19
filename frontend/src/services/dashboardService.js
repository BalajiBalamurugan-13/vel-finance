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