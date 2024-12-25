// Store both access and refresh tokens
export const setTokens = (access: string, refresh: string) => {
  document.cookie = `token=${access}; path=/; secure; samesite=strict`;
  document.cookie = `refresh_token=${refresh}; path=/; secure; samesite=strict`;
};

// Get refresh token
export const getRefreshToken = () => {
  return document.cookie.split('refresh_token=')[1]?.split(';')[0];
};

// Clear both tokens on logout
export const logout = () => {
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
  window.location.href = '/auth/signin';
}; 