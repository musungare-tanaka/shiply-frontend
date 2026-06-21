const RESET_EMAIL_KEY = "shiply-reset-email";
const RESET_TOKEN_KEY = "shiply-reset-token";

export const saveResetEmail = (email: string) => {
  sessionStorage.setItem(RESET_EMAIL_KEY, email);
};

export const getResetEmail = () => sessionStorage.getItem(RESET_EMAIL_KEY) ?? "";

export const saveResetToken = (token: string) => {
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
};

export const getResetToken = () => sessionStorage.getItem(RESET_TOKEN_KEY) ?? "";

export const clearResetFlow = () => {
  sessionStorage.removeItem(RESET_EMAIL_KEY);
  sessionStorage.removeItem(RESET_TOKEN_KEY);
};
