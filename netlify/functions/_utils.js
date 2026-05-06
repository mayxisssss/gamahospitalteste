
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sessionSecret = process.env.SESSION_SECRET || 'troque-este-segredo';
const MAIN_MANAGER = 'MayconAdmin';
const ALL_PERMISSIONS = ['announcements','site','home','homeCards','about','doctors','specialties','exams','ophthalmology','convenios','gallery','events','backup','reset','logs'];

if (!supabaseUrl || !serviceKey) console.warn('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.');
const db = createClient(supabaseUrl || 'https://example.supabase.co', serviceKey || 'missing');

function json(statusCode, body){ return { statusCode, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body: JSON.stringify(body) }; }
function parseBody(event){ try { return event.body ? JSON.parse(event.body) : {}; } catch(e){ return {}; } }
function now(){ return new Date().toISOString(); }
function makeSalt(){ return crypto.randomBytes(16).toString('hex'); }
function hashPassword(password, salt){ return crypto.pbkdf2Sync(String(password), String(salt), 120000, 64, 'sha512').toString('hex'); }
function sign(payload){
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000*60*60*12 })).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verify(token){
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const check = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(check))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Date.now()) return null;
  return payload;
}
function safeUser(u){ if(!u) return null; return { id:u.id, username:u.username, name:u.name, manager:u.manager, protected:u.protected, fullAccess:u.full_access, permissions:u.permissions || [], active:u.active }; }
async function getCurrentUser(event){
  const raw = event.headers.authorization || event.headers.Authorization || '';
  const token = raw.replace(/^Bearer\s+/i,'');
  const payload = verify(token);
  if (!payload?.id) return null;
  const { data, error } = await db.from('admin_users').select('*').eq('id', payload.id).maybeSingle();
  if (error || !data || !data.active) return null;
  return data;
}
function can(user, permission){
  if (!user) return false;
  if (user.manager || user.full_access) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
function canManageUser(current, target){
  if (!current?.manager) return false;
  if (current.username === MAIN_MANAGER) return true;
  if (!target) return true;
  if (target.protected || target.manager) return false;
  if (target.id === current.id) return false;
  return true;
}
async function logAction(username, action, area, beforeData, afterData){
  await db.from('admin_logs').insert({ username, action, area, before_data: beforeData || null, after_data: afterData || null });
}
async function ensureMainManager(){
  const { data: existing } = await db.from('admin_users').select('*').eq('username', MAIN_MANAGER).maybeSingle();
  if (existing) return existing;
  const salt = makeSalt();
  const pass = process.env.MAYCON_PASSWORD || 'Maycon@2026';
  const row = { username: MAIN_MANAGER, name:'Maycon', salt, password_hash: hashPassword(pass, salt), manager:true, protected:true, full_access:true, permissions: ALL_PERMISSIONS, active:true };
  const { data, error } = await db.from('admin_users').insert(row).select('*').single();
  if (error) throw error;
  return data;
}
module.exports = { db, json, parseBody, now, makeSalt, hashPassword, sign, verify, safeUser, getCurrentUser, can, canManageUser, logAction, ensureMainManager, MAIN_MANAGER, ALL_PERMISSIONS };
