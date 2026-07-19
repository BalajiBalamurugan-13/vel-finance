import api from "./api";

export async function addExpense(data) {
  const response = await api.post("/expenses/add", data);
  return response.data;
}