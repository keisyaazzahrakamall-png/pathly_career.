import { supabase } from '../lib/supabase.js';
import { ROLES, dashboardForRole } from '../lib/roles.js';
import { requireSession } from './require-session.js';

export async function loadAccountRole(userId) {
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
  if (error || !ROLES.includes(data?.role)) {
    throw new Error('Account roles could not be loaded. Check the connection and run Supabase migration 002_roles_and_supervision.sql.');
  }
  return data.role;
}

export async function requireRole(allowedRoles) {
  const user = await requireSession();
  const role = await loadAccountRole(user.id);
  if (!allowedRoles.includes(role)) {
    window.location.replace(dashboardForRole(role));
    // Do not initialize the wrong dashboard while navigation is pending.
    return new Promise(() => {});
  }
  return { user, role };
}
