const TOKEN_KEY = "token";
const PROFILE_KEY = "profile";
const API_KEY = "apiKey";

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfile() {
  const profile = localStorage.getItem(PROFILE_KEY);
  return profile ? JSON.parse(profile) : null;
}

export function setApiKey(apiKey) {
  localStorage.setItem(API_KEY, apiKey);
}

export function getApiKey() {
  return localStorage.getItem(API_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(API_KEY);
}
