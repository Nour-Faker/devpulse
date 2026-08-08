import client from "./client";

export const register = (data: {
  email: string;
  password: string;
  full_name: string;
}) => client.post("/auth/register", data);

export const login = (data: {
  username: string;
  password: string;
}) => {
  const form = new URLSearchParams();
  form.append("username", data.username);
  form.append("password", data.password);
  return client.post("/auth/login", form);
};

export const getMe = () => client.get("/auth/me");