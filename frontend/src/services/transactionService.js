import api from "./api";

export async function addPayment(payment) {

    const response = await api.post(
        "/transactions/add",
        payment
    );

    return response.data;
}

export async function getBusinessSummary() {

    const response = await api.get(
        "/transactions/business-summary"
    );

    return response.data;

}

export async function getOutstandingDetails() {
    const response = await api.get(
        "/transactions/outstanding-details"
    );
    return response.data;
}

export async function getDailySheet(selectedDate) {
    const response = await api.get(
        `/transactions/daily-sheet/${selectedDate}`
    );
    return response.data;
}

export async function deletePayment(transactionId) {
    const response = await api.delete(
        `/transactions/delete/${transactionId}`
    );
    return response.data;
}