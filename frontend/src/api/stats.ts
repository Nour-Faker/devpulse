import client from "./client";

export const getStats = () => client.get("/stats/summary");
export const getWeeklySummary = () => client.get("/ai/weekly-summary");
export const getSuggestedTitles = () => client.get("/ai/suggest-title");