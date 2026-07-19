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