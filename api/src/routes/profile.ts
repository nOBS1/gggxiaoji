// ==================== 用户资料路由 ====================
// 获取和更新用户信息、设置等

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { getSupabase } from '../lib/supabase';

const profile = new Hono<{ Bindings: Env }>();

// ==================== GET /api/profile ====================
// 获取当前用户的资料信息

profile.get('/', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    if (error || !profileData) {
      throw Errors.NOT_FOUND;
    }

    return c.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    console.error('[Profile Get Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== PUT /api/profile ====================
// 更新用户资料（昵称、头像等）

profile.put('/', async (c) => {
  const user = c.get('user');
  const { nickname, avatar } = await c.req.json<{ nickname?: string; avatar?: string }>();

  try {
    const supabase = getSupabase(c.env);
    const updateData: any = {};

    if (nickname) {
      updateData.nickname = nickname;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length === 0) {
      throw Errors.INVALID_INPUT;
    }

    // 更新资料
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Profile Update Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    // 返回更新后的资料
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    return c.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    console.error('[Profile Update Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== PUT /api/profile/settings ====================
// 更新用户设置（音效、语言等）

profile.put('/settings', async (c) => {
  const user = c.get('user');
  const { soundEnabled, language } = await c.req.json<{
    soundEnabled?: boolean;
    language?: string;
  }>();

  try {
    const supabase = getSupabase(c.env);
    const updateData: any = {};

    if (soundEnabled !== undefined) {
      updateData.sound_enabled = soundEnabled;
    }

    if (language) {
      if (!['zh', 'en'].includes(language)) {
        throw Errors.INVALID_INPUT;
      }
      updateData.language = language;
    }

    if (Object.keys(updateData).length === 0) {
      throw Errors.INVALID_INPUT;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Profile Settings Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        message: 'Settings updated successfully',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    console.error('[Profile Settings Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== GET /api/profile/leaderboard ====================
// 获取排行榜（按金币排序）

profile.get('/leaderboard', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');

  try {
    const supabase = getSupabase(c.env);
    
    const { data: leaderboard, error } = await supabase
      .from('profiles')
      .select('user_id, nickname, coins, avatar')
      .order('coins', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Profile Leaderboard Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        leaderboard: leaderboard || [],
      },
    });
  } catch (error) {
    console.error('[Profile Leaderboard Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

export default profile;
