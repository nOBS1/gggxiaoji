// ==================== Google OAuth 璁よ瘉璺敱 ====================
// 鏀寔 Google 绗笁鏂圭櫥褰?
// 浣跨敤 Supabase PostgreSQL

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { generateToken } from '../middleware/auth';
import { getSupabase } from '../lib/supabase';

const oauth = new Hono<{ Bindings: Env }>();

// Google OAuth 鐢ㄦ埛淇℃伅绫诲瀷
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
// Google OAuth 鐧诲綍鍏ュ彛
// 閲嶅畾鍚戝埌 Google 鎺堟潈椤甸潰

oauth.get('/google', async (c) => {
  try {
    // 浠庣幆澧冨彉閲忚幏鍙?Google OAuth 閰嶇疆
    const clientId = c.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = c.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      console.error('Missing Google OAuth configuration');
      return c.json({
        success: false,
        error: 'Google OAuth is not configured properly'
      }, 500);
    }
    
    // 鏋勫缓 Google OAuth 鎺堟潈 URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'online');
    authUrl.searchParams.set('prompt', 'select_account');
    
    // 娣诲姞 state 鍙傛暟闃叉 CSRF 鏀诲嚮
    const state = crypto.randomUUID();
    authUrl.searchParams.set('state', state);
    
    console.log('Redirecting to Google OAuth:', authUrl.toString());
    
    // 閲嶅畾鍚戝埌 Google 鎺堟潈椤甸潰
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
// Google OAuth 鍥炶皟澶勭悊
// 澶勭悊 Google 鎺堟潈鍚庣殑鍥炶皟

oauth.get('/google/callback', async (c) => {
  try {
    // 鑾峰彇鎺堟潈鐮?
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // 妫€鏌ユ槸鍚︽湁閿欒
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
    
    // 浠庣幆澧冨彉閲忚幏鍙栭厤缃?
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
    
    // 1. 鐢ㄦ巿鏉冪爜浜ゆ崲 access_token
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
    
    // 2. 鐢?access_token 鑾峰彇鐢ㄦ埛淇℃伅
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
    
    // 3. 鍦?Supabase 涓煡鎵炬垨鍒涘缓鐢ㄦ埛
    const env = {
      SUPABASE_URL: c.env.SUPABASE_URL || process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: c.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      JWT_SECRET: c.env.JWT_SECRET || process.env.JWT_SECRET || '',
      NODE_ENV: c.env.NODE_ENV || process.env.NODE_ENV || 'development',
    };
    
    const supabase = getSupabase(env);
    
    // 鏌ユ壘鏄惁宸插瓨鍦ㄨ閭鐨勭敤鎴?
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
      // 鐢ㄦ埛宸插瓨鍦紝鐩存帴鐧诲綍
      user = existingUsers[0];
      console.log('Existing user found:', user.id);
      
      // 鏇存柊鏈€鍚庣櫥褰曟椂闂村拰澶村儚
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
      // 鏂扮敤鎴凤紝鍒涘缓璐﹀彿
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
      
      // 涓烘柊鐢ㄦ埛鍒涘缓鍒濆 profile锛坧eck_level 绛夋父鎴忔暟鎹湪 stats 琛ㄤ腑锛?
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
        // 涓嶆姏鍑洪敊璇紝profile 鍙互绋嶅悗鍒涘缓
      }

      // 涓烘柊鐢ㄦ埛鍒涘缓鍒濆 stats锛堟父鎴忚繘搴︽暟鎹級
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
        // 涓嶆姏鍑洪敊璇紝stats 鍙互绋嶅悗鍒涘缓
      }

      // 涓烘柊鐢ㄦ埛鍒涘缓鍒濆 inventory锛堟墍鏈夌█鏈夊害铔嬩负0锛?
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
        // 涓嶆姏鍑洪敊璇紝inventory 鍙互绋嶅悗鍒涘缓
      }

      // 涓烘柊鐢ㄦ埛鍒涘缓鍒濆 upgrades锛坙evel=1锛屽叾浠?0锛?
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
        // 涓嶆姏鍑洪敊璇紝upgrades 鍙互绋嶅悗鍒涘缓
      }

      // 涓烘柊鐢ㄦ埛鍒涘缓鍒濆 ad_runs
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
        // 涓嶆姏鍑洪敊璇紝ad_runs 鍙互绋嶅悗鍒涘缓
      }
    }
    
    // 4. 鐢熸垚 JWT Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
    }, env.JWT_SECRET);
    
    console.log('JWT token generated for user:', user.id);
    
    // 5. 重定向回前端，携带 token
    const referer = c.req.header('Referer');

    const candidateBases: string[] = [];
    const allowedOrigins = new Set<string>();

    const addCandidates = (raw?: string) => {
      if (!raw || raw === '*') return;
      raw.split(',')
        .map(entry => entry.trim())
        .filter(Boolean)
        .forEach((entry) => {
          try {
            const url = new URL(entry);
            const normalized = url.toString();
            if (!candidateBases.includes(normalized)) {
              candidateBases.push(normalized);
              allowedOrigins.add(url.origin);
            }
          } catch (parseError) {
            console.warn('Invalid frontend candidate URL skipped:', entry, parseError);
          }
        });
    };

    addCandidates(env.FRONTEND_URL);
    addCandidates(env.CORS_ORIGIN);

    const defaultFrontendBase = env.FRONTEND_URL
      || (env.NODE_ENV === 'production'
        ? 'https://chickgamehub.online'
        : 'http://localhost:5173');
    addCandidates(defaultFrontendBase);

    let frontendUrl: URL | null = null;

    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (allowedOrigins.has(refererUrl.origin)) {
          frontendUrl = refererUrl;
        } else {
          console.warn('Referer origin not in whitelist, falling back to configured frontend:', refererUrl.origin);
        }
      } catch (parseError) {
        console.warn('Invalid referer URL from OAuth callback:', referer, parseError);
      }
    }

    if (!frontendUrl) {
      const fallbackBase = candidateBases[0] || defaultFrontendBase;
      frontendUrl = new URL(fallbackBase);
    }

    console.log('OAuth redirect decision', {
      referer,
      allowedOrigins: Array.from(allowedOrigins),
      candidateBases,
      chosen: frontendUrl.toString(),
    });
    frontendUrl.searchParams.delete('token');
    frontendUrl.searchParams.delete('oauth_success');
    frontendUrl.searchParams.delete('error');

    frontendUrl.searchParams.set('token', token);
    frontendUrl.searchParams.set('oauth_success', 'true');    
    console.log('Redirecting to frontend:', frontendUrl.toString());
    
    return c.redirect(frontendUrl.toString());
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // 灏濊瘯閲嶅畾鍚戝洖鍓嶇锛屾樉绀洪敊璇?
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

// ==================== 瀵煎嚭璺敱 ====================

export default oauth;





