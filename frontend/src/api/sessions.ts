import client from "./client";

export interface SessionCreate {
  title: string;
  description?: string;
  duration_minutes: number;
  mood?: string;
  project_id?: string;
}

export interface WorkSession {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  mood?: string;
  session_date: string;
  created_at: string;
}

export const createSession = (data: SessionCreate) =>
  client.post<WorkSession>("/sessions", data);

export const getSessions = () =>
  client.get<WorkSession[]>("/sessions");

export const deleteSession = (id: string) =>
  client.delete(`/sessions/${id}`);