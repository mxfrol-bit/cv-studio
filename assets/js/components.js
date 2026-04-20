// NAV HTML — call with base path prefix ('' for root, '../' for subfolders)
window.renderNav = function(prefix = '') {
  const nav = `
<nav id="navbar">
  <a href="${prefix}index.html" class="logo">CHAOS<em>VISION</em></a>
  <ul class="nav-menu">
    <li class="nav-item">
      <a class="nav-link" href="${prefix}solutions/index.html">Решения</a>
      <div class="nav-dd">
        <a class="nav-dd-link" href="${prefix}solutions/index.html">Все решения</a>
        <a class="nav-dd-link" href="${prefix}solutions/voice-bot.html">Голосовые боты</a>
        <a class="nav-dd-link" href="${prefix}solutions/chatbot.html">Чат-боты</a>
        <a class="nav-dd-link" href="${prefix}solutions/sales.html">Автоматизация продаж</a>
        <a class="nav-dd-link" href="${prefix}solutions/analytics.html">AI-аналитика</a>
        <a class="nav-dd-link" href="${prefix}solutions/hr.html">AI для HR</a>
        <a class="nav-dd-link" href="${prefix}solutions/docs.html">Документооборот</a>
        <a class="nav-dd-link" href="${prefix}solutions/ecom.html">E-commerce AI</a>
      </div>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="${prefix}cases/index.html">Кейсы</a>
      <div class="nav-dd">
        <a class="nav-dd-link" href="${prefix}cases/index.html">Все кейсы</a>
        <a class="nav-dd-link" href="${prefix}cases/retail.html">Ритейл / FMCG</a>
        <a class="nav-dd-link" href="${prefix}cases/telephony.html">Телефония</a>
        <a class="nav-dd-link" href="${prefix}cases/b2b.html">B2B продажи</a>
        <a class="nav-dd-link" href="${prefix}cases/logistics.html">Логистика</a>
        <a class="nav-dd-link" href="${prefix}cases/hr.html">HR / Стаффинг</a>
        <a class="nav-dd-link" href="${prefix}cases/ecom.html">E-commerce</a>
        <a class="nav-dd-link" href="${prefix}cases/fintech.html">Финтех</a>
        <a class="nav-dd-link" href="${prefix}cases/manufacturing.html">Производство</a>
      </div>
    </li>
    <li class="nav-item"><a class="nav-link" href="${prefix}products/index.html">Продукты</a></li>
    <li class="nav-item"><a class="nav-link" href="${prefix}pricing/index.html">Цены</a></li>
    <li class="nav-item"><a class="nav-link" href="${prefix}audit/index.html">Аудит</a></li>
    <li class="nav-item">
      <a class="nav-link" href="${prefix}investors/index.html">Инвесторам</a>
      <div class="nav-dd">
        <a class="nav-dd-link" href="${prefix}investors/index.html">Предложение</a>
        <a class="nav-dd-link" href="${prefix}investors/roadmap.html">Дорожная карта</a>
        <a class="nav-dd-link" href="${prefix}investors/market.html">Анализ рынка</a>
      </div>
    </li>
    <li class="nav-item"><a class="nav-link" href="${prefix}blog/index.html">Блог</a></li>
    <li class="nav-item"><a class="nav-link" href="${prefix}faq/index.html">FAQ</a></li>
  </ul>
  <a class="nav-link" href="${prefix}platform/index.html" style="color:var(--ac2);border:1px solid rgba(0,212,164,.3);padding:8px 14px;font-size:10px;font-family:var(--mono);letter-spacing:2px;text-transform:uppercase;margin-right:4px;transition:all .2s" onmouseover="this.style.borderColor='var(--ac2)'" onmouseout="this.style.borderColor='rgba(0,212,164,.3)'">Демо ↗</a>
  <a class="nav-cta" href="${prefix}contact/index.html">Связаться</a>
  <button class="burger" id="burger"><span></span><span></span><span></span></button>
</nav>
<div class="mobile-nav" id="mobile-nav">
  <button class="mobile-close" id="mobile-close">✕</button>
  <a href="${prefix}index.html">Главная</a>
  <a href="${prefix}solutions/index.html">Решения</a>
  <a href="${prefix}cases/index.html">Кейсы</a>
  <a href="${prefix}products/index.html">Продукты</a>
  <a href="${prefix}platform/index.html" style="color:var(--ac2)">Демо-платформа ↗</a>
  <a href="${prefix}pricing/index.html">Цены</a>
  <a href="${prefix}audit/index.html">Аудит</a>
  <a href="${prefix}investors/index.html">Инвесторам</a>
  <a href="${prefix}blog/index.html">Блог</a>
  <a href="${prefix}faq/index.html">FAQ</a>
  <a href="${prefix}contact/index.html">Контакты</a>
</div>`;
  document.body.insertAdjacentHTML('afterbegin', nav);
};

window.renderFooter = function(prefix = '') {
  const footer = `
<footer>
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a href="${prefix}index.html" class="footer-logo">CHAOS<em>VISION</em></a>
        <p class="footer-desc">AI Studio нового поколения. Превращаем хаос данных в управляемые системы. Пилот за 3 недели.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="${prefix}contact/index.html" class="btn-p" style="padding:12px 24px;font-size:12px">Связаться →</a>
          <a href="${prefix}audit/index.html" class="btn-g" style="padding:12px 24px;font-size:12px">Заказать аудит</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">Решения</div>
        <ul class="footer-links-list">
          <li><a href="${prefix}solutions/voice-bot.html">Голосовые боты</a></li>
          <li><a href="${prefix}solutions/chatbot.html">Чат-боты</a></li>
          <li><a href="${prefix}solutions/sales.html">Автоматизация продаж</a></li>
          <li><a href="${prefix}solutions/hr.html">AI для HR</a></li>
          <li><a href="${prefix}solutions/docs.html">Документооборот</a></li>
          <li><a href="${prefix}solutions/ecom.html">E-commerce AI</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Компания</div>
        <ul class="footer-links-list">
          <li><a href="${prefix}cases/index.html">Кейсы</a></li>
          <li><a href="${prefix}products/index.html">Продукты</a></li>
          <li><a href="${prefix}platform/index.html" style="color:var(--ac2)">Демо-платформа ↗</a></li>
          <li><a href="${prefix}pricing/index.html">Цены</a></li>
          <li><a href="${prefix}audit/index.html">Аудит</a></li>
          <li><a href="${prefix}blog/index.html">Блог</a></li>
          <li><a href="${prefix}faq/index.html">FAQ</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Инвесторам</div>
        <ul class="footer-links-list">
          <li><a href="${prefix}investors/index.html">Предложение</a></li>
          <li><a href="${prefix}investors/roadmap.html">Роадмап</a></li>
          <li><a href="${prefix}investors/market.html">Анализ рынка</a></li>
        </ul>
        <div style="margin-top:24px">
          <div class="footer-col-title">Контакты</div>
          <div style="font-size:13px;color:var(--mu);line-height:1.8">
            hello@chaosvision.ai<br>
            @chaosvision_ai<br>
            Нижний Новгород
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© 2026 Chaos Vision Global · Нижний Новгород · Россия</div>
      <div class="footer-socials">
        <a href="#">Telegram</a>
        <a href="#">VC.ru</a>
        <a href="#">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`;
  document.body.insertAdjacentHTML('beforeend', footer);
};
