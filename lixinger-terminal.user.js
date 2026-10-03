// ==UserScript==
// @name         理杏仁终端 · Lixinger Terminal
// @namespace    lxr-terminal
// @version      0.5.0
// @description  理杏仁金融终端式改造：左侧树形多级菜单（14大模块·155+页面，默认仅展开当前模块）、侧边栏顶嵌入理杏仁官方logo（顶栏原logo隐藏避免重复）、页脚整体右移与内容区对齐、隐藏顶部子菜单扩大图表区、侧边栏头与顶栏高度同步（Vue后台式一体化布局）、同模块SPA无刷新跳转、菜单搜索（按 / 聚焦）。纯前端改造，零额外请求
// @author       lxr-terminal
// @match        https://www.lixinger.com/*
// @match        https://lixinger.com/*
// @run-at       document-end
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const VER = '0.5.0';
  const STORE = { enabled: 'lxrTerm.enabled', expanded: 'lxrTerm.expanded' };
  const HIDE_TOP_MENUS = true; // 隐藏内容区顶部的面包屑与二级tab菜单，扩大图表/表格显示区
  const W = 240;

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    building: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    chart: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
  };
  const svgIcon = n => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  // 子项格式: [href, label, 三级子项?]
  // 数据于 2026-08-30 从各模块页面 DOM 实地采集；运行时还会从当前页面包屑自动同步（自愈）
  const MENU = [
    { key: 'profile', label: '首页', href: '/profile/center', prefix: '/profile', icon: 'home', children: [
      ['/profile/center/my-followed', '我的关注'],
      ['/profile/center/my-user-groups', '我的圈子'],
      ['/profile/center/discover', '发现'],
      ['/profile/center/my-discussions', '我的讨论'],
      ['/profile/center/user-data', '我的资源文件'],
      ['/profile/center/taxation', '我的税务'],
      ['/profile/center/subscribed-settings', '我的订阅设置'],
      ['/profile/center/companies', '我的公司']
    ] },
    { key: 'company', label: '公司', href: '/analytics/company/dashboard', prefix: '/analytics/company', icon: 'building', children: [
      ['/analytics/company/dashboard/my-companies', '我的公司'],
      ['/analytics/company/dashboard/mutual-market', '互联互通', [
        ['/analytics/company/dashboard/mutual-market/ha', '陆股通'],
        ['/analytics/company/dashboard/mutual-market/ah', '港股通'],
        ['/analytics/company/dashboard/mutual-market/transaction-trend', '成交趋势'],
        ['/analytics/company/dashboard/mutual-market/top-ten', '最新十大成交股']
      ]],
      ['/analytics/company/dashboard/margin-trading-and-securities-lending', '融资融券'],
      ['/analytics/company/dashboard/dividend-financing', '分红融资'],
      ['/analytics/company/dashboard/repurchase', '回购'],
      ['/analytics/company/dashboard/short-selling', '做空'],
      ['/analytics/company/dashboard/shares-increase-decrease', '增减持'],
      ['/analytics/company/dashboard/institution-holdings', '机构持股'],
      ['/analytics/company/dashboard/trading-abnormal', '龙虎榜'],
      ['/analytics/company/dashboard/block-deal', '大宗交易'],
      ['/analytics/company/dashboard/restricted-shares-lifted', '限售解禁'],
      ['/analytics/company/dashboard/pledge', '股权质押'],
      ['/analytics/company/dashboard/financial-report-and-forecast', '财报及预告'],
      ['/analytics/company/dashboard/same-shares-ba', '跨市场比价'],
      ['/analytics/company/dashboard/hk-reits', 'HK reits'],
      ['/analytics/company/dashboard/intermediary', 'HK券商持仓'],
      ['/analytics/company/dashboard/special-treatment', 'ST板块'],
      ['/analytics/company/dashboard/bse-selection', '北交所精选'],
      ['/analytics/company/dashboard/supervision', '监管'],
      ['/analytics/company/dashboard/announcements', '公告'],
      ['/analytics/company/dashboard/shareholders-interactions', '互动易'],
      ['/analytics/company/dashboard/memo', '备注'],
      ['/analytics/company/dashboard/followed', '关注度排名'],
      ['/analytics/company/dashboard/capita', '人均排名'],
      ['/analytics/company/dashboard/shareholders-num-change-rank', '股东人数排名'],
      ['/analytics/company/dashboard/rate-of-return-rank', '投资收益率排名'],
      ['/analytics/company/dashboard/turnover-rate', '换手率'],
      ['/analytics/company/dashboard/volatility', '波动率'],
      ['/analytics/company/dashboard/magic-formula', '神奇公式排名'],
      ['/analytics/company/dashboard/rank', '其他排名']
    ] },
    { key: 'shareholders', label: '天眼', href: '/analytics/shareholders/', prefix: '/analytics/shareholders', icon: 'eye', children: [
      ['/analytics/shareholders/search', '搜索'],
      ['/analytics/shareholders/national-team', '国家队'],
      ['/analytics/shareholders/insurance-company', '保险公司'],
      ['/analytics/shareholders/pension-funds', '养老基金'],
      ['/analytics/shareholders/social-security-fund', '社保基金'],
      ['/analytics/shareholders/qfii', 'QFII'],
      ['/analytics/shareholders/foreign-sovereign-wealth-funds', '国外主权财富基金'],
      ['/analytics/shareholders/famous-institutions', '知名机构'],
      ['/analytics/shareholders/private-placement', '知名私募'],
      ['/analytics/shareholders/personage', '知名牛散'],
      ['/analytics/shareholders/fund-collection', '基金公司'],
      ['/analytics/shareholders/mine', '我的']
    ] },
    { key: 'screener', label: '筛选器', href: '/analytics/screener/', prefix: '/analytics/screener', icon: 'filter', children: [
      ['/analytics/screener/company-dashboard', '我的公司筛选'],
      ['/analytics/screener/company-fundamental', '开始公司筛选'],
      ['/analytics/screener/fund-dashboard', '我的基金筛选'],
      ['/analytics/screener/fund-fundamental', '开始基金筛选'],
      ['/analytics/screener/fund-manager-dashboard', '我的基金经理筛选'],
      ['/analytics/screener/fund-manager-fundamental', '开始基金经理筛选'],
      ['/analytics/screener/index-dashboard', '我的指数筛选'],
      ['/analytics/screener/index-fundamental', '开始指数筛选']
    ] },
    { key: 'industry', label: '行业', href: '/analytics/industry/dashboard', prefix: '/analytics/industry', icon: 'layers', children: [
      ['/analytics/industry/dashboard/my-industries', '我的行业'],
      ['/analytics/industry/dashboard/value', '估值列表'],
      ['/analytics/industry/dashboard/fs', '财报列表'],
      ['/analytics/industry/dashboard/mutual-market', '互联互通', [
        ['/analytics/industry/dashboard/mutual-market/ha', '陆股通'],
        ['/analytics/industry/dashboard/mutual-market/ah', '港股通']
      ]],
      ['/analytics/industry/dashboard/margin-trading-and-securities-lending', '融资融券'],
      ['/analytics/industry/dashboard/congestion', '拥挤度'],
      ['/analytics/industry/dashboard/trading-heat', '交易热度']
    ] },
    { key: 'index', label: '指数', href: '/analytics/index/dashboard', prefix: '/analytics/index', icon: 'chart', children: [
      ['/analytics/index/dashboard/my-indices', '我的指数'],
      ['/analytics/index/dashboard/value', '估值列表'],
      ['/analytics/index/dashboard/fs', '财报列表'],
      ['/analytics/index/dashboard/hot-etf-premium-rate-list', '热门ETF折溢价'],
      ['/analytics/index/dashboard/funds-subscription-net-inflow', '场内基金认购净流入'],
      ['/analytics/index/dashboard/history-change', '历史涨跌幅列表'],
      ['/analytics/index/dashboard/yield-ranking', '收益率排名'],
      ['/analytics/index/dashboard/correction-coefficient', '相关性'],
      ['/analytics/index/dashboard/mutual-market', '互联互通', [
        ['/analytics/index/dashboard/mutual-market/ha', '陆股通'],
        ['/analytics/index/dashboard/mutual-market/ah', '港股通']
      ]],
      ['/analytics/index/dashboard/margin-trading-and-securities-lending', '融资融券'],
      ['/analytics/index/dashboard/turnover-rate', '换手率'],
      ['/analytics/index/dashboard/volatility', '波动率'],
      ['/analytics/index/dashboard/proposed-effect-constituents', '拟纳入样本'],
      ['/analytics/index/dashboard/scatter-analysis', '散点分析'],
      ['/analytics/index/dashboard/my-bond-indices', '我的债券指数'],
      ['/analytics/index/dashboard/bond-index', '债券指数']
    ] },
    { key: 'fund', label: '基金', href: '/analytics/fund/dashboard', prefix: '/analytics/fund', icon: 'pie', children: [
      ['/analytics/fund/dashboard/my-funds', '我的基金'],
      ['/analytics/fund/dashboard/fund-list', '基金列表'],
      ['/analytics/fund/dashboard/active-fund-rankings', '主动型基金榜单'],
      ['/analytics/fund/dashboard/exchange-traded-fund-discount', '场内基金折溢价'],
      ['/analytics/fund/dashboard/exchange-traded-fund-shares-list', '场内基金份额'],
      ['/analytics/fund/dashboard/shareholders-structure-list', '持有人结构列表'],
      ['/analytics/fund/dashboard/index-fund-expected-holdings-change', '指数基金预期持仓变化'],
      ['/analytics/fund/dashboard/correlation', '相关性'],
      ['/analytics/fund/dashboard/fund-set-up-statistics', '新基金发布统计'],
      ['/analytics/fund/dashboard/strategy-and-operation', '基金投资策略和运作'],
      ['/analytics/fund/dashboard/fund-aggregation', '基金整体持仓'],
      ['/analytics/fund/dashboard/margin-trading-and-securities-lending', '融资融券'],
      ['/analytics/fund/dashboard/volatility', '波动率'],
      ['/analytics/fund/dashboard/latest-announcement', '最新公告'],
      ['/analytics/fund/dashboard/latest-memo', '最新备注'],
      ['/analytics/fund/dashboard/fund-collection', '基金公司'],
      ['/analytics/fund/dashboard/my-fund-managers', '我的基金经理'],
      ['/analytics/fund/dashboard/fund-manager', '基金经理']
    ] },
    { key: 'bond', label: '债券', href: '/analytics/bond/dashboard', prefix: '/analytics/bond', icon: 'doc', children: [
      ['/analytics/bond/dashboard/bonds', '我的债券'],
      ['/analytics/bond/dashboard/conversion-rank', '转股排名'],
      ['/analytics/bond/dashboard/scatter-analysis', '样本散点分析'],
      ['/analytics/bond/dashboard/announcements', '公告'],
      ['/analytics/bond/dashboard/latest-memo', '最新备注']
    ] },
    { key: 'chartMaker', label: '制图', href: '/analytics/chart-maker/', prefix: '/analytics/chart-maker', icon: 'edit', children: [
      ['/analytics/chart-maker/custom', '自定义'],
      ['/analytics/chart-maker/my-templates', '我的制图'],
      ['/analytics/chart-maker/my-followed', '我的关注'],
      ['/analytics/chart-maker/public-templates', '公共制图']
    ] },
    { key: 'model', label: '模型', href: '/analytics/model/', prefix: '/analytics/model', icon: 'cpu', children: [
      ['/analytics/model/market-values', '市场估值'],
      ['/analytics/model/market-sentiment', '市场情绪'],
      ['/analytics/model/fund-set-up-statistics', '新基金发布统计'],
      ['/analytics/model/user-access', '新用户访问量']
    ] },
    { key: 'macro', label: '宏观', href: '/analytics/macro/', prefix: '/analytics/macro', icon: 'globe', children: [
      ['/analytics/macro/security-market', '证券市场'],
      ['/analytics/macro/price-index', '价格指数'],
      ['/analytics/macro/required-reserves', '存款备用金'],
      ['/analytics/macro/money-supply', '货币供应'],
      ['/analytics/macro/national-debt', '国债'],
      ['/analytics/macro/interest-rate', '利率'],
      ['/analytics/macro/social-financing', '社会融资'],
      ['/analytics/macro/rmb-loans-and-deposits', '人民币存贷款'],
      ['/analytics/macro/central-bank-balance-sheet', '央行资产负债表'],
      ['/analytics/macro/official-reserve-assets', '官方储备资产'],
      ['/analytics/macro/foreign-assets', '国外资产'],
      ['/analytics/macro/various-domestic-debt-securities', '国内各类债券'],
      ['/analytics/macro/treasury', '国家财政'],
      ['/analytics/macro/levrage-ratio', '杠杆率'],
      ['/analytics/macro/population', '人口'],
      ['/analytics/macro/gdp', 'GDP'],
      ['/analytics/macro/unemployment-rate', '失业率'],
      ['/analytics/macro/nonfarm-payroll', '非农就业人数'],
      ['/analytics/macro/social-retail-consumer', '社会消费品零售'],
      ['/analytics/macro/foreign-trade', '对外贸易'],
      ['/analytics/macro/balance-of-payments', '国际收支平衡'],
      ['/analytics/macro/traffic-transportation', '交通运输'],
      ['/analytics/macro/investment-in-fixed-assets', '全社会固定资产投资'],
      ['/analytics/macro/real-estate', '房地产'],
      ['/analytics/macro/energy', '能源'],
      ['/analytics/macro/bulk-commodity', '大宗商品'],
      ['/analytics/macro/industrialization', '工业'],
      ['/analytics/macro/vix-fear-index', 'VIX恐慌指数'],
      ['/analytics/macro/currency-exchange-rate', '汇率'],
      ['/analytics/macro/futures', '期货'],
      ['/analytics/macro/graham-index', '格雷厄姆指数'],
      ['/analytics/macro/buffett-index', '巴菲特指数'],
      ['/analytics/macro/market-index', '债券类市场指数']
    ] },
    { key: 'openApi', label: '开放平台', href: '/open/api/', prefix: '/open', icon: 'code', children: [
      ['/open/api/doc', 'API文档'],
      ['/open/api/skill', 'SKILL'],
      ['/open/api/precaution', 'api注意事项'],
      ['/open/api/token', '我的token'],
      ['/open/api/my-settings', '我的设置'],
      ['/open/api/my-apis', '我的接口'],
      ['/open/api/orders', '我的订单'],
      ['/open/api/receipts', '我的发票'],
      ['/open/api/price-tier', '购买'],
      ['/open/api/coupon', '推广活动'],
      ['/open/api/open-source-projects', '开源对接项目'],
      ['/open/api/update-log', '更新日志']
    ] },
    { key: 'wiki', label: '百科', href: '/wiki/list', prefix: '/wiki', icon: 'book', children: [] },
    { key: 'feedback', label: '反馈', href: '/feedback/dashboard', prefix: '/feedback', icon: 'msg', children: [
      ['/feedback/dashboard/list', '反馈'],
      ['/feedback/dashboard/mine', '我的'],
      ['/feedback/dashboard/rank', '排名']
    ] }
  ];

  const ALIAS = {
    company: '/equity/company', index: '/equity/index', industry: '/equity/industry',
    fund: '/equity/fund', bond: '/equity/bond', macro: '/equity/macro'
  };

  const norm = p => (p || '').replace(/\/+$/, '') || '/';
  const moduleOf = path => {
    const p = norm(path);
    let best = null, len = 0;
    for (const m of MENU) {
      const pre = norm(m.prefix);
      if ((p === pre || p.startsWith(pre + '/')) && pre.length > len) { best = m; len = pre.length; }
    }
    return best;
  };
  const findActive = pathname => {
    const p = norm(pathname);
    let best = null, bestLen = 0;
    for (const m of MENU) {
      if (norm(m.href) === p) return { mod: m };
      for (const c of (m.children || [])) {
        const ch = norm(c[0]);
        if (ch === p) return { mod: m, child: c };
        for (const s of (c[2] || [])) if (norm(s[0]) === p) return { mod: m, child: c, sub: s };
        if (p.startsWith(ch + '/') && ch.length > bestLen) { best = { mod: m, child: c }; bestLen = ch.length; }
      }
    }
    if (best) return best;
    for (const key in ALIAS) {
      if (p.startsWith(ALIAS[key])) {
        const m = MENU.find(x => x.key === key);
        if (m) return { mod: m };
      }
    }
    const m = moduleOf(p);
    return m ? { mod: m } : null;
  };

  let enabled = localStorage.getItem(STORE.enabled) !== '0';
  // 记录用户手动展开的模块；默认全部折叠，当前所在模块强制展开
  let expandedSet;
  try { expandedSet = new Set(JSON.parse(localStorage.getItem(STORE.expanded) || '[]')); }
  catch (e) { expandedSet = new Set(); }
  localStorage.removeItem('lxrTerm.collapsed');
  let searchQ = '';
  let els = {};

  // 站内每个模块是独立 Vue 实例：同模块用 pushState+popstate 走 SPA（无刷新），
  // 跨模块整页跳转（与原顶栏行为一致，不增加任何额外请求）
  function navigate(href) {
    if (!href || href === '#!' || href === '#') return;
    const cur = moduleOf(location.pathname);
    const tgt = moduleOf(href);
    if (cur && tgt && cur.key === tgt.key && norm(href) !== norm(location.pathname)) {
      history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else if (norm(href) !== norm(location.pathname)) {
      location.assign(href);
    }
  }

  const CSS = `
#lxr-term {
  --t-bg: #ffffff; --t-border: #e4e7ec; --t-text: #1f2937; --t-muted: #6b7280;
  --t-hover: #f3f4f6; --t-active-bg: #eef4ff; --t-accent: #2458e6; --t-accent-text: #1d4ed8;
  --t-input-bg: #f5f6f8; --t-badge: #f3f4f6;
}
html[data-bs-theme="dark"] #lxr-term {
  --t-bg: #16181d; --t-border: #2a2e37; --t-text: #e5e7eb; --t-muted: #9ca3af;
  --t-hover: #21242b; --t-active-bg: #1c2942; --t-accent: #5b8def; --t-accent-text: #93b4f5;
  --t-input-bg: #1d2027; --t-badge: #23262d;
}
#lxr-term {
  position: fixed; top: 0; left: 0; bottom: 0; width: ${W}px; z-index: 1029;
  display: none; flex-direction: column;
  background: var(--t-bg); border-right: 1px solid var(--t-border);
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  color: var(--t-text);
}
/* 显示状态挂在侧边栏自身的类上（is-on），不依赖 body 类——
   站点框架挂载/路由时会整体重写 body 的 className，body 类方案会被抹掉导致刷新后侧边栏消失 */
#lxr-term.is-on { display: flex; }
/* 正文右移：只移一层。站点结构是 #app > .lxr-body，
   两个都加 padding 会叠成 480px 导致正文与 header logo 错位；
   :has() 保证有 .lxr-body 时只移 .lxr-body，没有时（个别页面结构不同）才移 #app */
body.lxr-term-on #app:not(:has(.lxr-body)),
body.lxr-term-on .lxr-body { padding-left: ${W}px !important; }
body.lxr-term-on #header.lxr-header { left: ${W}px; }
body.lxr-term-on nav.navbar li.nav-item:not(.dropdown) { display: none !important; }
/* 侧边栏开启时：隐藏原站内容区顶部的面包屑与二级tab菜单，扩大图表/表格显示区 */
body.lxr-term-on #header nav:not(.navbar) { display: none !important; }
body.lxr-term-on .lxr-body .breadcrumb,
body.lxr-term-on #app .breadcrumb { display: none !important; }
.lxr-term-hide { display: none !important; }
/* logo 移入侧边栏品牌区后，隐藏顶栏原 logo（避免两处重复显示；关闭终端即恢复） */
body.lxr-term-on #header .navbar-brand { display: none !important; }
/* 页脚（网站链接区）整体右移，与上方内容区左缘对齐——右侧呈现一个完整页面 */
body.lxr-term-on .lxr-footer { margin-left: ${W}px !important; }

#lxr-term .t-head {
  display: flex; align-items: center; gap: 8px; flex: none;
  min-height: 44px; padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--t-border);
}
#lxr-term .t-brand {
  display: flex; align-items: center; gap: 8px; min-width: 0;
  text-decoration: none; color: var(--t-text); font-size: 14.5px; font-weight: 600;
}
#lxr-term .t-brand:hover { color: var(--t-accent-text); }
#lxr-term .t-brand-img { display: flex; align-items: center; flex: none; }
#lxr-term .t-brand-img img { display: block; height: 25px; width: 25px; }
#lxr-term .t-brand-name { letter-spacing: .5px; white-space: nowrap; }
#lxr-term .t-brand-type {
  flex: none; font-size: 10.5px; font-weight: 500; color: var(--t-muted);
  background: var(--t-badge); border: 1px solid var(--t-border);
  border-radius: 4px; padding: 1px 5px; margin-left: 2px;
}
#lxr-term .t-collapse {
  margin-left: auto; display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border: none; border-radius: 6px;
  background: transparent; color: var(--t-muted); cursor: pointer;
}
#lxr-term .t-collapse:hover { background: var(--t-hover); color: var(--t-text); }

#lxr-term .t-search { flex: none; padding: 8px 10px; }
#lxr-term .t-search input {
  width: 100%; box-sizing: border-box; height: 30px; padding: 0 9px 0 28px;
  border: 1px solid var(--t-border); border-radius: 7px; outline: none;
  background: var(--t-input-bg); color: var(--t-text); font-size: 12.5px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-size: 13px; background-position: 9px center;
}
#lxr-term .t-search input:focus { border-color: var(--t-accent); background-color: var(--t-bg); }
#lxr-term .t-search input::placeholder { color: var(--t-muted); }

#lxr-term .t-tree { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 6px 14px; }
#lxr-term .t-tree::-webkit-scrollbar { width: 8px; }
#lxr-term .t-tree::-webkit-scrollbar-thumb { background: var(--t-border); border-radius: 4px; border: 2px solid var(--t-bg); }
#lxr-term .t-tree::-webkit-scrollbar-track { background: transparent; }

#lxr-term .t-group { margin-bottom: 2px; }
#lxr-term .t-ghead {
  display: flex; align-items: center; gap: 8px; width: 100%;
  height: 30px; padding: 0 7px; border: none; border-radius: 7px;
  background: transparent; color: var(--t-text); font-size: 13px; font-weight: 600;
  cursor: pointer; text-align: left; font-family: inherit;
}
#lxr-term .t-ghead:hover { background: var(--t-hover); }
#lxr-term .t-ghead.is-active .t-glabel { color: var(--t-accent-text); }
#lxr-term .t-ghead .t-gicon { display: flex; color: var(--t-muted); flex: none; }
#lxr-term .t-ghead.is-active .t-gicon { color: var(--t-accent); }
#lxr-term .t-glabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#lxr-term .t-count { flex: none; font-size: 10.5px; font-weight: 400; color: var(--t-muted); background: var(--t-badge); border-radius: 8px; padding: 0 6px; line-height: 15px; }
#lxr-term .t-chev { display: flex; flex: none; color: var(--t-muted); transition: transform .15s ease; }
#lxr-term .t-group.open > .t-ghead .t-chev { transform: rotate(90deg); }

#lxr-term .t-gbody { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .18s ease; }
#lxr-term .t-group.open > .t-gbody { grid-template-rows: 1fr; }
#lxr-term .t-ginner { min-height: 0; overflow: hidden; }
@media (prefers-reduced-motion: reduce) { #lxr-term .t-gbody, #lxr-term .t-chev { transition: none; } }

#lxr-term .t-item {
  display: flex; align-items: center; gap: 6px; width: 100%;
  height: 27px; padding: 0 8px 0 37px; border: none; border-radius: 6px;
  background: transparent; color: var(--t-muted); font-size: 12.5px;
  cursor: pointer; text-align: left; font-family: inherit; position: relative;
}
#lxr-term .t-item:hover { background: var(--t-hover); color: var(--t-text); }
#lxr-term .t-item.is-active { background: var(--t-active-bg); color: var(--t-accent-text); font-weight: 600; }
#lxr-term .t-item.is-active::before {
  content: ""; position: absolute; left: 0; top: 5px; bottom: 5px; width: 2.5px;
  border-radius: 2px; background: var(--t-accent);
}
#lxr-term .t-item .t-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#lxr-term .t-item.has-sub { padding-left: 29px; font-weight: 500; color: var(--t-text); }
#lxr-term .t-item.has-sub .t-chev { display: flex; flex: none; color: var(--t-muted); transition: transform .15s ease; }
#lxr-term .t-item.has-sub.open > .t-chev { transform: rotate(90deg); }
#lxr-term .t-subbody { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .18s ease; }
#lxr-term .t-item.open + .t-subbody { grid-template-rows: 1fr; }
#lxr-term .t-subinner { min-height: 0; overflow: hidden; }
#lxr-term .t-sub { padding-left: 50px; }

#lxr-term .t-empty { padding: 20px 14px; text-align: center; color: var(--t-muted); font-size: 12.5px; }
#lxr-term .t-foot { flex: none; display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-top: 1px solid var(--t-border); color: var(--t-muted); font-size: 11px; }
#lxr-term .t-foot kbd { font-family: inherit; font-size: 10.5px; background: var(--t-badge); border: 1px solid var(--t-border); border-radius: 4px; padding: 0 4px; }
#lxr-term-open {
  position: fixed; left: 0; top: 54px; z-index: 1029;
  display: none; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px 0 10px;
  background: #ffffff; color: #374151;
  border: 1px solid #e4e7ec; border-left: none; border-radius: 0 8px 8px 0;
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  box-shadow: 2px 2px 8px rgba(0,0,0,.08);
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
}
html[data-bs-theme="dark"] #lxr-term-open { background: #1d2027; color: #e5e7eb; border-color: #2a2e37; }
#lxr-term-open.is-show { display: flex; }
#lxr-term-open:hover { color: #2458e6; }
@media print { #lxr-term, #lxr-term-open { display: none !important; } }
`;

  function injectStyles() {
    if (document.getElementById('lxr-term-style')) return;
    const st = document.createElement('style');
    st.id = 'lxr-term-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function buildSidebar() {
    if (document.getElementById('lxr-term')) return;
    const sb = document.createElement('div');
    sb.id = 'lxr-term';
    sb.setAttribute('role', 'navigation');
    sb.setAttribute('aria-label', '理杏仁终端菜单');
    sb.innerHTML = `
      <div class="t-head">
        <a class="t-brand" href="/" title="理杏仁首页">
          <span class="t-brand-img"></span><span class="t-brand-name">理杏仁</span><span class="t-brand-type">终端</span>
        </a>
        <button class="t-collapse" title="收起侧边栏（恢复原站）" aria-label="收起侧边栏">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>
      <div class="t-search"><input type="text" placeholder="搜索菜单…" aria-label="搜索菜单"></div>
      <div class="t-tree" role="tree"></div>
      <div class="t-foot"><kbd>/</kbd> 搜索菜单 · <span>理杏仁终端 v${VER}</span></div>`;
    document.body.appendChild(sb);

    const open = document.createElement('button');
    open.id = 'lxr-term-open';
    open.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg> 终端`;
    open.title = '开启终端侧边栏';
    document.body.appendChild(open);

    els = { root: sb, head: sb.querySelector('.t-head'), brandSlot: sb.querySelector('.t-brand-img'), tree: sb.querySelector('.t-tree'), search: sb.querySelector('input'), open };

    sb.querySelector('.t-collapse').addEventListener('click', () => setEnabled(false));
    open.addEventListener('click', () => setEnabled(true));

    els.search.addEventListener('input', () => { searchQ = els.search.value; renderTree(); });
    els.search.addEventListener('keydown', e => {
      if (e.key === 'Escape') { els.search.value = ''; searchQ = ''; renderTree(); els.search.blur(); }
      if (e.key === 'Enter') {
        const items = els.tree.querySelectorAll('.t-item:not(.has-sub)');
        if (items.length === 1) { navigate(items[0].dataset.href); els.search.value = ''; searchQ = ''; renderTree(); els.search.blur(); }
      }
    });

    els.tree.addEventListener('click', e => {
      const grp = e.target.closest('.t-ghead');
      if (grp) {
        const key = grp.dataset.group;
        const g = grp.closest('.t-group');
        const isOpen = g.classList.toggle('open');
        if (isOpen) expandedSet.add(key); else expandedSet.delete(key);
        persistExpanded();
        return;
      }
      const subHead = e.target.closest('.t-item.has-sub');
      if (subHead && !e.target.closest('.t-sub')) {
        const it = subHead.parentElement.querySelector(':scope > .t-subbody');
        const isOpen = subHead.classList.toggle('open');
        if (it) it.style.gridTemplateRows = isOpen ? '1fr' : '0fr';
        return;
      }
      const item = e.target.closest('.t-item:not(.has-sub)');
      if (item) navigate(item.dataset.href);
    });

    document.addEventListener('keydown', e => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target;
        const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
        if (!typing && enabled) { e.preventDefault(); els.search.focus(); els.search.select(); }
      }
    });
  }

  // 统一应用开关状态：侧边栏/开启按钮挂自身类（防 body 类被站点框架抹掉），
  // body 类仅用于布局调整（内容右移、隐藏原站菜单页脚），丢了由守卫观察器补回
  function applyState() {
    const sb = document.getElementById('lxr-term');
    const ob = document.getElementById('lxr-term-open');
    if (sb) sb.classList.toggle('is-on', enabled);
    if (ob) ob.classList.toggle('is-show', !enabled);
    document.body.classList.toggle('lxr-term-on', enabled);
  }

  function setEnabled(on) {
    enabled = on;
    localStorage.setItem(STORE.enabled, on ? '1' : '0');
    applyState();
    if (on) {
      renderTree();
      hideTopMenus();
      syncTop();
      syncLogo();
      syncHeadHeight();
    } else {
      document.querySelectorAll('.lxr-term-hide').forEach(el => el.classList.remove('lxr-term-hide'));
      document.body.style.paddingTop = '';
    }
  }

  const persistExpanded = () => localStorage.setItem(STORE.expanded, JSON.stringify([...expandedSet]));

  function renderTree() {
    if (!els.tree) return;
    const scroll = els.tree.scrollTop;
    const act = findActive(location.pathname);
    const q = searchQ.trim().toLowerCase();
    const frag = document.createDocumentFragment();
    let visible = 0;

    for (const mod of MENU) {
      const children = mod.children || [];
      const modMatch = q && mod.label.toLowerCase().includes(q);
      let shown = children;
      if (q && !modMatch) {
        shown = children.filter(c => c[1].toLowerCase().includes(q) || (c[2] || []).some(s => s[1].toLowerCase().includes(q)));
        if (!shown.length) continue;
      }
      visible += shown.length;

      const g = document.createElement('div');
      g.className = 't-group';
      const isActiveMod = act && act.mod && act.mod.key === mod.key;
      const open = q ? true : (isActiveMod || expandedSet.has(mod.key));
      if (open) g.classList.add('open');

      const count = children.length ? `<span class="t-count">${children.length}</span>` : '';

      if (!children.length && !q) {
        const single = document.createElement('button');
        single.className = 't-item' + (isActiveMod ? ' is-active' : '');
        single.style.paddingLeft = '12px';
        single.style.height = '30px';
        single.style.fontSize = '13px';
        single.style.fontWeight = '600';
        single.dataset.href = mod.href;
        single.innerHTML = `<span class="t-gicon" style="display:flex;color:var(--t-muted)">${svgIcon(mod.icon)}</span><span class="t-label">${mod.label}</span>`;
        g.appendChild(single);
        frag.appendChild(g);
        continue;
      }

      const head = document.createElement('button');
      head.className = 't-ghead' + (isActiveMod && !act.child ? ' is-active' : '');
      head.dataset.group = mod.key;
      head.setAttribute('aria-expanded', String(open));
      head.innerHTML = `<span class="t-gicon">${svgIcon(mod.icon)}</span><span class="t-glabel">${mod.label}</span>${q ? '' : count}<span class="t-chev"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>`;
      g.appendChild(head);

      const body = document.createElement('div');
      body.className = 't-gbody';
      const inner = document.createElement('div');
      inner.className = 't-ginner';

      for (const c of shown) {
        const [href, label, subs] = c;
        const isActive = act && act.child && norm(act.child[0]) === norm(href);
        if (subs && subs.length) {
          const subOpen = q || (act && ((act.child && norm(act.child[0]) === norm(href)) || (act.sub && subs.some(s => norm(s[0]) === norm(act.sub[0])))));
          const it = document.createElement('button');
          it.className = 't-item has-sub' + (subOpen ? ' open' : '') + (isActive ? ' is-active' : '');
          it.dataset.href = href;
          it.innerHTML = `<span class="t-chev"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span><span class="t-label">${label}</span>`;
          inner.appendChild(it);
          const sb2 = document.createElement('div');
          sb2.className = 't-subbody';
          if (subOpen) sb2.style.gridTemplateRows = '1fr';
          const si = document.createElement('div');
          si.className = 't-subinner';
          for (const s of subs) {
            const isSubActive = act && act.sub && norm(act.sub[0]) === norm(s[0]);
            const si2 = document.createElement('button');
            si2.className = 't-item t-sub' + (isSubActive ? ' is-active' : '');
            si2.dataset.href = s[0];
            si2.innerHTML = `<span class="t-label">${s[1]}</span>`;
            si.appendChild(si2);
          }
          sb2.appendChild(si);
          inner.appendChild(sb2);
        } else {
          const it = document.createElement('button');
          it.className = 't-item' + (isActive ? ' is-active' : '');
          it.dataset.href = href;
          it.innerHTML = `<span class="t-label">${label}</span>`;
          inner.appendChild(it);
        }
      }
      body.appendChild(inner);
      g.appendChild(body);
      frag.appendChild(g);
    }

    els.tree.innerHTML = '';
    if (!visible && q) {
      const em = document.createElement('div');
      em.className = 't-empty';
      em.textContent = '没有匹配的菜单';
      els.tree.appendChild(em);
    } else {
      els.tree.appendChild(frag);
    }
    els.tree.scrollTop = scroll;
    const activeEl = els.tree.querySelector('.is-active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
  }

  // 把顶栏官方 logo 克隆进侧边栏品牌区（顶栏原件由 CSS 隐藏，视觉上等于 logo 平移到侧边栏）
  function syncLogo() {
    if (!els.brandSlot) return;
    const img = document.querySelector('#header .navbar-brand img');
    if (!img) return;
    const cur = els.brandSlot.querySelector('img');
    if (cur && cur.getAttribute('src') === img.getAttribute('src')) return;
    const clone = img.cloneNode(false);
    clone.removeAttribute('style');
    clone.removeAttribute('class');
    clone.alt = '理杏仁';
    els.brandSlot.innerHTML = '';
    els.brandSlot.appendChild(clone);
  }

  // 侧边栏品牌区与顶栏等高，底边线连通，形成 Vue 后台式一体化顶带
  function syncHeadHeight() {
    if (!els.head) return;
    const hd = document.getElementById('header');
    const h = hd ? hd.offsetHeight : 44;
    els.head.style.minHeight = Math.max(44, h) + 'px';
  }

  // 隐藏内容区顶部的二级tab菜单：面包屑本身由CSS隐藏，
  // 此处处理面包屑之后的tab容器（页面异步渲染后需重复执行，幂等）
  function hideTopMenus() {
    if (!HIDE_TOP_MENUS || !enabled) return 0;
    let n = 0;
    document.querySelectorAll('ol.breadcrumb').forEach(bc => {
      let el = bc.nextElementSibling, hops = 0;
      while (el && hops < 4) {
        if (el.matches && el.matches('.nav-tabs, ul.nav') && !el.classList.contains('lxr-term-hide')) {
          el.classList.add('lxr-term-hide');
          n++;
        }
        el = el.nextElementSibling;
        hops++;
      }
    });
    return n;
  }

  // header 内菜单行被隐藏后高度塌缩，同步收紧 body 顶部留白，避免出现空隙
  function syncTop() {
    const h = document.getElementById('header');
    if (!h) return;
    const pt = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    if (pt > 0) document.body.style.paddingTop = h.offsetHeight + 'px';
  }

  // 从当前页面包屑同步菜单（自愈：理杏仁增删页面时无需更新脚本）
  function harvest() {
    const bc = document.querySelector('ol.breadcrumb.level-0');
    if (!bc) return false;
    const items = Array.from(bc.children)
      .map(li => {
        const a = li.querySelector('a');
        if (!a) return null;
        const href = a.getAttribute('href');
        const label = a.textContent.trim();
        return href && label && !/^#!?$/.test(href) ? [href, label] : null;
      })
      .filter(Boolean);
    if (items.length < 3) return false;
    const mod = moduleOf(location.pathname);
    if (!mod || !mod.children || mod.children.length < 3) return false;
    const old = new Map(mod.children.map(c => [norm(c[0]), c]));
    const next = items.map(it => {
      const prev = old.get(norm(it[0]));
      return prev && prev[2] ? [it[0], it[1], prev[2]] : [it[0], it[1]];
    });
    const sig = JSON.stringify(mod.children) === JSON.stringify(next);
    mod.children = next;
    if (!sig) renderTree();
    return true;
  }

  let harvestTimer = null;
  function scheduleHarvest() {
    clearTimeout(harvestTimer);
    harvestTimer = setTimeout(() => {
      let tries = 0;
      const tick = () => {
        hideTopMenus();
        if (harvest() || ++tries >= 8) return;
        setTimeout(tick, 600);
      };
      tick();
    }, 400);
  }

  let routeTimer = null;
  function onRoute() {
    if (!els.tree || !enabled) return;
    clearTimeout(routeTimer);
    routeTimer = setTimeout(() => { renderTree(); hideTopMenus(); syncTop(); syncLogo(); syncHeadHeight(); }, 60);
    scheduleHarvest();
  }

  function patchHistory() {
    if (history.__lxrTermPatched) return;
    history.__lxrTermPatched = true;
    const raw = history.pushState.bind(history);
    history.pushState = function (...args) { const r = raw(...args); onRoute(); return r; };
    const rawRep = history.replaceState.bind(history);
    history.replaceState = function (...args) { const r = rawRep(...args); onRoute(); return r; };
    window.addEventListener('popstate', onRoute);
  }

  function init() {
    injectStyles();
    buildSidebar();
    patchHistory();
    applyState();
    if (enabled) {
      renderTree();
      hideTopMenus();
      syncTop();
      syncLogo();
      syncHeadHeight();
      scheduleHarvest();
    }
    // 守卫观察器：1) 站点框架重渲染移除侧边栏/样式时自动重建；
    // 2) 框架整体重写 body className 抹掉 lxr-term-on 时立即补回（刷新后侧边栏消失的根因）
    if (!window.__lxrTermGuard) {
      window.__lxrTermGuard = new MutationObserver(() => {
        if (!document.getElementById('lxr-term') || !document.getElementById('lxr-term-style')) { init(); return; }
        if (enabled && !document.body.classList.contains('lxr-term-on')) applyState();
      });
      window.__lxrTermGuard.observe(document.body, {
        childList: true, subtree: false,
        attributes: true, attributeFilter: ['class']
      });
    }
    if (!window.__lxrTopBound) {
      window.__lxrTopBound = true;
      window.addEventListener('resize', () => { syncTop(); syncHeadHeight(); });
    }
    console.log('%c[LXR终端] v' + VER + ' 已注入' + (enabled ? '' : '（当前为关闭状态，点击左侧「终端」按钮开启）'), 'color:#2458e6;font-weight:600');
    window.lxrTermVersion = VER;
    // 一次性结构诊断：布局异常时把下面日志发给开发者即可精确定位
    if (!window.__lxrDiagOnce) {
      window.__lxrDiagOnce = true;
      const hd = document.getElementById('header');
      if (hd && els.head) console.log('[LXR终端] 顶栏高:', hd.offsetHeight, '侧栏头高:', els.head.offsetHeight, '（两者应相等）');
      const lf = document.querySelector('.lxr-footer');
      if (lf) console.log('[LXR终端] 页脚左缘:', Math.round(lf.getBoundingClientRect().left), '（应为 ' + W + '）');
      const img = document.querySelector('#lxr-term .t-brand-img img');
      console.log('[LXR终端] 侧栏logo:', img ? img.getAttribute('src') : '未克隆（顶栏无logo图）');
    }
  }

  // v0.2.0：不再等待站点导航出现（侧边栏是 fixed 定位，不依赖页面结构），
  // 只需 <body> 存在即注入。若 v0.1.0 因等待 nav.navbar 卡住，此版直接修复
  function boot() {
    if (document.body) { init(); return; }
    const t = setInterval(() => {
      if (document.body) { clearInterval(t); init(); }
    }, 50);
    setTimeout(() => clearInterval(t), 10000);
  }

  boot();
})();