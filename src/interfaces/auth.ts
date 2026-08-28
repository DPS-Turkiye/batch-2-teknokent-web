export const PASSWORD_MIN_LENGTH = 8;

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisteredAccount {
  fullName: string;
  email: string;
  phone: string;
}
