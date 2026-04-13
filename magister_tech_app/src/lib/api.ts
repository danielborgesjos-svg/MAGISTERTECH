/**
 * Magister ERP — API Client Centralizado
 * 
 * Usa httpOnly cookies para autenticação (enviados automaticamente pelo browser).
 * NENHUM token em localStorage. NENHUM header Authorization manual.
 * Basta usar `apiFetch` em vez de `fetch` direto.
 */

const BASE_URL = '';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth: _skip, ...fetchOptions } = options;

  const customHeaders: any = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  const impId = localStorage.getItem('magister_impersonate_id');
  if (impId) {
    customHeaders['X-Impersonate-User'] = impId;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...fetchOptions,
    credentials: 'include', // Cookie httpOnly enviado automaticamente
    headers: customHeaders,
  });

  if (!res.ok) {
    // Se 401, a sessão expirou — redirecionar para login
    if (res.status === 401) {
      // Evitar loop infinito se já estiver na tela de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(errorData.error || `API ${url} → ${res.status}`);
  }

  // Resposta vazia (ex: DELETE)
  const text = await res.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// Helper para login — única vez que trabalhamos com o token (backend seta cookie)
export async function apiLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro de autenticação' }));
    throw new Error(err.error || 'Credenciais inválidas');
  }

  return res.json(); // Retorna { token, user } — token ignorado no frontend
}

// Helper para logout
export async function apiLogout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {}); // Silent fail — cookie será expirado mesmo assim
}

// Helper para verificar sessão atual
export async function apiGetMe() {
  return apiFetch<any>('/api/auth/me');
}
