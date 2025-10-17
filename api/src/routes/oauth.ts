// ==================== Google OAuth 认证路由 ====================
// 支持 Google 第三方登录
// 使用 Supabase PostgreSQL

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { generateToken } from '../middleware/auth';
import { getSupabase } from '../lib/supabase';

const oauth = new Hono<{ Bindings: Env }>();

// Google OAuth 用户信息类型
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

// ==================== GET /api/auth/google ====================
// Google OAuth 登录入口
// 重定向到 Google 授权页面

oauth.get('/google', async (c) => {
  try {
    // 从环境变量获取 Google OAuth 配置
    const clientId = c.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = c.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      console.error('Missing Google OAuth configuration');
      return c.json({
        success: false,
        error: 'Google OAuth is not configured properly'
      }, 500);
    }
    
    // 构建 Google OAuth 授权 URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'online');
    authUrl.searchParams.set('prompt', 'select_account');
    
    // 添加 state 参数防止 CSRF 攻击
    const state = crypto.randomUUID();
    authUrl.searchParams.set('state', state);
    
    console.log('Redirecting to Google OAuth:', authUrl.toString());
    
    // 重定向到 Google 授权页面
    return c.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return c.json({
      success: false,
      error: 'Failed to initiate Google OAuth'
    }, 500);
  }
});

// ==================== GET /api/auth/google/callback ====================
// Google OAuth 回调处理
// 处理 Google 授权后的回调

oauth.get('/google/callback', async (c) => {
  try {
    // 获取授权码
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // 检查是否有错误
    if (error) {
      console.error('Google OAuth error:', error);
      return c.json({
        success: false,
        error: `Google OAuth error: ${error}`
      }, 400);
    }
    
    if (!code) {
      return c.json({
        success: false,
        error: 'Authorization code not provided'
      }, 400);
    }
    
    console.log('Received authorization code, exchanging for token...');
    
    // 从环境变量获取配置
    const clientId = c.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = c.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth configuration');
      return c.json({
        success: false,
        error: 'Google OAuth is not configured properly'
      }, 500);
    }
    
    // 1. 用授权码交换 access_token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token exchange failed:', errorData);
      return c.json({
        success: false,
        error: 'Failed to exchange authorization code'
      }, 500);
    }
    
    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    
    console.log('Successfully obtained access token');
    
    // 2. 用 access_token 获取用户信息
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      console.error('Failed to fetch user info from Google');
      return c.json({
        success: false,
        error: 'Failed to fetch user info from Google'
      }, 500);
    }
    
    const googleUser: GoogleUserInfo = await userResponse.json();
    console.log('Google user info:', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
    });
    
    // 3. 在 Supabase 中查找或创建用户
    const env = {
      SUPABASE_URL: c.env.SUPABASE_URL || process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: c.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      JWT_SECRET: c.env.JWT_SECRET || process.env.JWT_SECRET || '',
      NODE_ENV: c.env.NODE_ENV || process.env.NODE_ENV || 'development',
    };
    
    const supabase = getSupabase(env);
    
    // 查找是否已存在该邮箱的用户
    const { data: existingUsers, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .limit(1);
    
    if (findError) {
      console.error('Database query error:', findError);
      return c.json({
        success: false,
        error: 'Database query failed'
      }, 500);
    }
    
    let user;
    
    if (existingUsers && existingUsers.length > 0) {
      // 用户已存在，直接登录
      user = existingUsers[0];
      console.log('Existing user found:', user.id);
      
      // 更新最后登录时间和头像
      const updateData: Record<string, string> = {
        last_login: new Date().toISOString(),
      };

      if (googleUser.picture) {
        updateData.avatar_url = googleUser.picture;
      }

      if (!user.username && googleUser.name) {
        updateData.username = googleUser.name;
      }

      if (!user.google_id) {
        updateData.google_id = googleUser.id;
      }

      if (!user.auth_provider || user.auth_provider === 'google') {
        updateData.auth_provider = 'google';
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update existing user:', updateError);
      }
        
    } else {
      // 新用户，创建账号
      console.log('Creating new user from Google OAuth');
      
      const newUser = {
        email: googleUser.email,
        username: googleUser.name || googleUser.email.split('@')[0],
        avatar_url: googleUser.picture || null,
        auth_provider: 'google',
        google_id: googleUser.id,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create user:', createError);
        return c.json({
          success: false,
          error: 'Failed to create user account'
        }, 500);
      }
      
      user = createdUser;
      console.log('New user created:', user.id);
      
      // 为新用户创建初始 profile（peck_level 等游戏数据在 stats 表中）
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          nickname: googleUser.name || googleUser.email.split('@')[0],
          coins: 0,
          sound_enabled: true,
          language: 'zh',
        }]);
      
      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // 不抛出错误，profile 可以稍后创建
      }

      // 为新用户创建初始 stats（游戏进度数据）
      const { error: statsError } = await supabase
        .from('stats')
        .insert([{
          user_id: user.id,
          peck_progress: 0,
          idle_accumulator: 0,
          last_idle_tick: Date.now(),
          total_clicks: 0,
          total_eggs_sold: 0,
          black_pity_counter: 0,
        }]);
      
      if (statsError) {
        console.error('Failed to create user stats:', statsError);
        // 不抛出错误，stats 可以稍后创建
      }

      // 为新用户创建初始 inventory（所有稀有度蛋为0）
      const inventoryData = [
        { user_id: user.id, rarity: 'white', quantity: 0 },
        { user_id: user.id, rarity: 'brown', quantity: 0 },
        { user_id: user.id, rarity: 'silver', quantity: 0 },
        { user_id: user.id, rarity: 'gold', quantity: 0 },
        { user_id: user.id, rarity: 'purple', quantity: 0 },
        { user_id: user.id, rarity: 'black', quantity: 0 },
      ];
      
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryData);
      
      if (inventoryError) {
        console.error('Failed to create user inventory:', inventoryError);
        // 不抛出错误，inventory 可以稍后创建
      }

      // 为新用户创建初始 upgrades（level=1，其他=0）
      const upgradesData = [
        { user_id: user.id, upgrade_key: 'level', level: 1 },
        { user_id: user.id, upgrade_key: 'feed', level: 0 },
        { user_id: user.id, upgrade_key: 'clickPower', level: 0 },
        { user_id: user.id, upgrade_key: 'idleRate', level: 0 },
        { user_id: user.id, upgrade_key: 'luckyChance', level: 0 },
        { user_id: user.id, upgrade_key: 'autoSell', level: 0 },
        { user_id: user.id, upgrade_key: 'goldBonus', level: 0 },
      ];
      
      const { error: upgradesError } = await supabase
        .from('upgrades')
        .insert(upgradesData);
      
      if (upgradesError) {
        console.error('Failed to create user upgrades:', upgradesError);
        // 不抛出错误，upgrades 可以稍后创建
      }

      // 为新用户创建初始 ad_runs
      const { error: adRunsError } = await supabase
        .from('ad_runs')
        .insert([{
          user_id: user.id,
          cooldown: 0,
          watched_today: 0,
          last_date: null,
        }]);
      
      if (adRunsError) {
        console.error('Failed to create user ad_runs:', adRunsError);
        // 不抛出错误，ad_runs 可以稍后创建
      }
    }
    
    // 4. 生成 JWT Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
    }, env.JWT_SECRET);
    
    console.log('JWT token generated for user:', user.id);
    
    // 5. 重定向回前端，携带 token
    // 使用 Referer 或默认的前端 URL
    const referer = c.req.header('Referer');
    let frontendUrl: URL;
    
    if (referer) {
      frontendUrl = new URL(referer);
      // 清除可能存在的旧参数
      frontendUrl.searchParams.delete('token');
      frontendUrl.searchParams.delete('oauth_success');
      frontendUrl.searchParams.delete('error');
    } else {
      // 默认前端 URL (根据环境判断)
      const defaultFrontendUrl = env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : 'http://localhost:5173';
      frontendUrl = new URL(defaultFrontendUrl);
    }
    
    // 添加成功参数
    frontendUrl.searchParams.set('token', token);
    frontendUrl.searchParams.set('oauth_success', 'true');
    
    console.log('Redirecting to frontend:', frontendUrl.toString());
    
    return c.redirect(frontendUrl.toString());
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // 尝试重定向回前端，显示错误
    const referer = c.req.header('Referer');
    if (referer) {
      const errorUrl = new URL(referer);
      errorUrl.searchParams.set('oauth_success', 'false');
      errorUrl.searchParams.set('error', 'oauth_callback_failed');
      return c.redirect(errorUrl.toString());
    }
    
    return c.json({
      success: false,
      error: 'Internal server error during OAuth callback'
    }, 500);
  }
});

// ==================== 导出路由 ====================

export default oauth;
