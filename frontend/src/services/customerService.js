import api from "./api";

export async function getCustomers() {

    const response = await api.get("/customers/");

    return response.data;

}
export async function getCustomerDetails(customerId) {

    const response = await api.get(
        `/transactions/customer/${customerId}`
    );

    return response.data;
}

export async function deleteCustomer(customerId) {
    const response = await api.delete(
        `/customers/delete/${customerId}`
    );

    return response.data;
}

export async function activateLoan(customerId) {

    const response = await api.put(
        `/customers/activate-loan/${customerId}`
    );

    return response.data;

}

export async function updateCustomer(customerId, data) {

    const response = await api.put(
        `/customers/update/${customerId}`,
        data
    );

    return response.data;

}

export async function addCustomer(data) {

    const response = await api.post(
        "/customers/add",
        data
    );

    return response.data;

}

export async function closeLoan(customerId) {
    const res = await api.put(
        `/customers/close-loan/${customerId}`
    );

    return res.data;
}

