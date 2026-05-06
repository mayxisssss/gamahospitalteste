
const { db, json, getCurrentUser, can } = require('./_utils');

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangeFromParams(params = {}) {
  const now = new Date();
  const period = params.period || '30';
  let start;
  let end = now;

  if (period === 'today') {
    start = new Date(now);
    start.setHours(0,0,0,0);
  } else if (period === 'yesterday') {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0,0,0,0);
    end = new Date(start);
    end.setHours(23,59,59,999);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'all') {
    start = new Date('2020-01-01T00:00:00.000Z');
  } else if (period === 'custom') {
    start = parseDate(params.start) || new Date(now.getTime() - 30*24*60*60*1000);
    end = parseDate(params.end) || now;
    end.setHours(23,59,59,999);
  } else {
    const days = Number(period || 30);
    start = new Date(now.getTime() - (Number.isFinite(days) ? days : 30) * 24*60*60*1000);
  }

  return { start, end, period };
}

function dayKey(date) {
  return date.toISOString().slice(0,10);
}

function hostFromReferrer(referrer) {
  try {
    if (!referrer) return 'Direto';
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host || 'Direto';
  } catch {
    return 'Direto';
  }
}

function inc(map, key, amount = 1) {
  const k = key || 'Não informado';
  map[k] = (map[k] || 0) + amount;
}

function mapToSortedArray(map, limit = 20) {
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, limit);
}

function eventLabel(type) {
  const labels = {
    page_view: 'Visualização',
    click_whatsapp: 'Clique no WhatsApp',
    click_instagram: 'Clique no Instagram',
    click_facebook: 'Clique no Facebook',
    click_maps: 'Clique no mapa',
    click_link: 'Clique em link',
    event: 'Evento'
  };
  return labels[type] || type || 'Evento';
}

function toCSV(rows) {
  const headers = ['created_at','type','page','path','device','referrer','ip','details'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(h === 'details' ? JSON.stringify(r.details || {}) : r[h])).join(','))
  ].join('\n');
}

exports.handler = async (event) => {
  const user = await getCurrentUser(event);
  if (!user) return json(401, { error:'Sessão inválida' });
  if (!can(user, 'logs')) return json(403, { error:'Sem permissão para estatísticas.' });

  const params = event.queryStringParameters || {};
  const { start, end, period } = rangeFromParams(params);

  try {
    if (event.httpMethod === 'DELETE') {
      let del = db.from('analytics_events').delete().gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      const { error } = await del;
      if (error) return json(500, { error:error.message });
      return json(200, { ok:true, message:'Estatísticas apagadas no período selecionado.' });
    }

    let query = db
      .from('analytics_events')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending:false })
      .limit(params.limit ? Number(params.limit) : 20000);

    const { data, error } = await query;
    if (error) return json(500, { error:error.message });

    const rows = data || [];
    const pageViews = rows.filter(r => r.type === 'page_view');
    const visitors = new Set();
    const byPage = {};
    const byPath = {};
    const byDevice = {};
    const byReferrer = {};
    const byType = {};
    const byDay = {};
    const byHour = {};
    const topLinks = {};
    const topWhatsAppPages = {};

    for (let h = 0; h < 24; h++) byHour[String(h).padStart(2,'0')] = 0;

    rows.forEach(r => {
      const d = new Date(r.created_at);
      const day = dayKey(d);
      const hour = String(d.getHours()).padStart(2,'0');
      const details = r.details || {};
      const visitor = details.visitorId || `${r.ip || ''}|${r.user_agent || ''}`;
      if (visitor.trim()) visitors.add(visitor);

      inc(byType, eventLabel(r.type));
      inc(byDevice, r.device || 'Não informado');
      inc(byReferrer, hostFromReferrer(r.referrer));

      if (!byDay[day]) byDay[day] = { label: day, events:0, pageViews:0, whatsapp:0 };
      byDay[day].events += 1;

      if (r.type === 'page_view') {
        inc(byPage, r.page || r.path || 'Não informado');
        inc(byPath, r.path || 'Não informado');
        byDay[day].pageViews += 1;
        byHour[hour] += 1;
      }

      if (r.type === 'click_whatsapp') {
        byDay[day].whatsapp += 1;
        inc(topWhatsAppPages, r.page || r.path || 'Não informado');
      }

      if (r.type && r.type.startsWith('click_')) {
        const href = details.href || '';
        const text = details.text || href || r.type;
        inc(topLinks, text);
      }
    });

    const summary = {
      events: rows.length,
      pageViews: pageViews.length,
      visitors: visitors.size,
      whatsapp: rows.filter(r => r.type === 'click_whatsapp').length,
      instagram: rows.filter(r => r.type === 'click_instagram').length,
      facebook: rows.filter(r => r.type === 'click_facebook').length,
      maps: rows.filter(r => r.type === 'click_maps').length,
      links: rows.filter(r => r.type === 'click_link').length,
      conversionRate: pageViews.length ? Number(((rows.filter(r => r.type === 'click_whatsapp').length / pageViews.length) * 100).toFixed(1)) : 0
    };

    const daily = Object.values(byDay).sort((a,b) => a.label.localeCompare(b.label));
    const hourly = Object.entries(byHour).map(([label,value]) => ({ label, value }));

    if (params.format === 'csv') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="estatisticas-gama-hospital-dia.csv"'
        },
        body: toCSV(rows)
      };
    }

    return json(200, {
      range: { period, start: start.toISOString(), end: end.toISOString() },
      summary,
      byPage: mapToSortedArray(byPage, 12),
      byPath: mapToSortedArray(byPath, 12),
      byDevice: mapToSortedArray(byDevice, 8),
      byReferrer: mapToSortedArray(byReferrer, 10),
      byType: mapToSortedArray(byType, 10),
      topLinks: mapToSortedArray(topLinks, 10),
      topWhatsAppPages: mapToSortedArray(topWhatsAppPages, 10),
      daily,
      hourly,
      recent: rows.slice(0, 30).map(r => ({
        id: r.id,
        created_at: r.created_at,
        type: r.type,
        page: r.page,
        path: r.path,
        device: r.device,
        referrer: hostFromReferrer(r.referrer),
        details: r.details || {}
      }))
    });
  } catch(error) {
    return json(500, { error:error.message });
  }
};
