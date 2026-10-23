import { siteConfig } from '@/config';

/**
 * 访问量统计 —— 基于不蒜子 busuanzi，但由前端自控拉取时机。
 *
 * 为什么自控（而非直接用 busuanzi 脚本）：
 *  1. busuanzi 脚本 + 本站点自刷新会各请求一次 -> 同一页面 +2，需去掉。
 *  2. busuanzi 按 Referer 的 host 分桶：localhost/127.0.0.1 落入「全球共享桶」，
 *     数值（site_pv 可达千万级）毫无意义，本地应不显示。
 *  3. busuanzi 每次请求都 +1，无 session 去重；这里按「每 session 每篇文章只计 1 次」自控。
 */

export const BUSUANZI_API_URL = 'https://busuanzi.ibruce.info/busuanzi';

export function viewsEnabled(): boolean {
  return siteConfig.statistics?.views?.enable !== false;
}

/** 本机/内网环境：busuanzi 计数无意义，不显示。 */
function isLocalHost(): boolean {
  if (typeof location === 'undefined') return false;
  const h = (location.hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '::1';
}

/**
 * JSONP 读 busuanzi 计数（一次请求，返回 site_pv / page_pv / site_uv）。
 * busuanzi 无 CORS，采用动态 script 标签 + 全局回调。
 */
function fetchBusuanzi(): Promise<Record<string, number> | null> {
  return new Promise((resolve) => {
    try {
      const cb = `__logoBszi_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const w = window as unknown as Record<string, unknown>;
      const script = document.createElement('script');
      let done = false;
      const timer = window.setTimeout(() => { if (!done) { done = true; cleanup(); resolve(null); } }, 8000);
      const cleanup = () => {
        window.clearTimeout(timer);
        try { delete w[cb]; } catch { /* noop */ }
        if (script.parentElement) script.parentElement.removeChild(script);
      };
      w[cb] = (data: Record<string, number>) => {
        if (done) return;
        done = true;
        cleanup();
        resolve(data || null);
      };
      script.async = true;
      script.src = `${BUSUANZI_API_URL}?jsonpCallback=${cb}`;
      script.referrerPolicy = 'no-referrer-when-downgrade';
      document.head.appendChild(script);
    } catch {
      resolve(null);
    }
  });
}

function setValue(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * 初始化并刷新访问量。应在 astro:page-load / after-swap / DOMContentLoaded 时调用。
 *
 * 去重策略：
 *  - 站点总数：每个浏览器 session 只取一次真实 busuanzi 值（sessionStorage 缓存）。
 *  - 文章 page_pv：每 session 每篇文章只计 1 次（仅当该文章首次访问时才触发请求）。
 *  - 请求幂等：模块级 in-flight 守卫，避免同一次导航被多个组件脚本重复触发。
 */
export function initViews(): void {
  if (typeof window === 'undefined' || !viewsEnabled()) return;
  if (isLocalHost()) return; // 本地/localhost 不显示，避免共享桶大数

  const w = window as unknown as { __logoViewsInflight?: boolean };
  if (w.__logoViewsInflight) return;

  const siteDone = sessionStorage.getItem('momo_site_done') === '1';
  const hasArticle = !!document.getElementById('busuanzi_value_page_pv');
  const artKey = hasArticle ? location.pathname : null;
  const artDone = artKey ? sessionStorage.getItem(`momo_art_done_${artKey}`) === '1' : true;

  // 本 session 已计过 -> 用缓存值展示，不再请求（避免 +1 / +2）
  if (siteDone && artDone) {
    const sv = sessionStorage.getItem('momo_site_val');
    if (sv) setValue('busuanzi_value_site_pv', sv);
    if (artKey) {
      const av = sessionStorage.getItem(`momo_art_val_${artKey}`);
      if (av) setValue('busuanzi_value_page_pv', av);
    }
    return;
  }

  w.__logoViewsInflight = true;
  fetchBusuanzi().then((data) => {
    w.__logoViewsInflight = false;
    if (!data) return; // 拉取失败：保持 `–`
    const siteVal = data.site_pv != null ? String(data.site_pv) : '';
    if (siteVal) {
      sessionStorage.setItem('momo_site_done', '1');
      sessionStorage.setItem('momo_site_val', siteVal);
      setValue('busuanzi_value_site_pv', siteVal);
    }
    if (artKey) {
      const artVal = data.page_pv != null ? String(data.page_pv) : '';
      if (artVal) {
        sessionStorage.setItem(`momo_art_done_${artKey}`, '1');
        sessionStorage.setItem(`momo_art_val_${artKey}`, artVal);
        setValue('busuanzi_value_page_pv', artVal);
      }
    }
  });
}
