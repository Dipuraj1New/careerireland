export enum UserRole {
  APPLICANT = 'APPLICANT',
  AGENT = 'AGENT',
  EXPERT = 'EXPERT',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth?: Date;
  nationality?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  cases?: any[];
  assignedCases?: any[];
  documents?: any[];
  notifications?: any[];
  conversations?: any[];
  messages?: any[];
  consultationsAsExpert?: any[];
  consultationsAsApplicant?: any[];
  formTemplates?: any[];
  formSubmissions?: any[];
  formSignatures?: any[];
  securityAlerts?: any[];
  dataSubjectRequests?: any[];
  permissionGroups?: any[];
  accessReviews?: any[];
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth?: string;
  nationality?: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
}
