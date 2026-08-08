import client from "./client";

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

export const createProject = (data: ProjectCreate) =>
  client.post<Project>("/projects", data);

export const getProjects = () =>
  client.get<Project[]>("/projects");

export const deleteProject = (id: string) =>
  client.delete(`/projects/${id}`);