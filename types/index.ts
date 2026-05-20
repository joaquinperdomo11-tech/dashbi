export interface Tenant {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  ml_user_id: string | null;
  ml_site_id: string;
  status: 'trial' | 'active' | 'inactive';
  trial_ends_at: string;
  subscription_ends_at: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface MLTokens {
  id: string;
  tenant_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  updated_at: string;
}
