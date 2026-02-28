import { getToken } from "./storage.js";

export function requireAuth() {
  if (!getToken()) window.location.href = "/login.html";
}

export function isAuthed() {
  return Boolean(getToken());
}
