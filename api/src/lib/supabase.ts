// ==================== Supabase 客户端配置 ====================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  NODE_ENV?: string;
}

/**
 * 获取 Supabase 客户端实例（单例模式）
 */
export function getSupabase(env: Env): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * 创建带有服务端权限的 Supabase 客户端
 * 注意：这个客户端会绕过 RLS，仅用于服务端操作
 */
export function getSupabaseAdmin(env: Env, serviceRoleKey?: string): SupabaseClient {
  // 如果没有提供 service_role key，使用普通的 anon key
  const key = serviceRoleKey || env.SUPABASE_ANON_KEY;
  
  return createClient(env.SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 关闭 Supabase 连接（清理资源）
 */
export function closeSupabase() {
  if (supabaseClient) {
    supabaseClient = null;
  }
}
