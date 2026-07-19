import api from "./api";

export async function getHistoryByDate(selectedDate) {
  const response = await api.get(
    `/transactions/summary-by-date/${selectedDate}`
  );

  return response.data;
}

export async function getCashFlow(selectedDate) {

    const response = await api.get(
        `/transactions/cash-flow/${selectedDate}`
    );

    return response.data;
}