'use strict';

// 訪客可隨時暫停裝飾動態；偏好在同一瀏覽器中保留。
const motionToggle = document.querySelector('.motion-toggle');
function setMotionPaused(paused) {
  document.body.classList.toggle('motion-paused', paused);
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.innerHTML = paused ? '<span aria-hidden="true">▷</span> 開啟動態' : '<span aria-hidden="true">Ⅱ</span> 暫停動態';
}
try { setMotionPaused(localStorage.getItem('portfolio-motion-paused') === 'true'); } catch { /* 私密瀏覽仍能操作。 */ }
motionToggle.addEventListener('click', () => {
  const paused = !document.body.classList.contains('motion-paused');
  setMotionPaused(paused);
  try { localStorage.setItem('portfolio-motion-paused', String(paused)); } catch { /* 儲存不可用時不影響操作。 */ }
});

// 手機導覽：保持 aria-expanded 與實際開合狀態一致。
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(max-width: 760px)').addEventListener('change', closeMenu);

// 捲動到區塊時，更新目前的導覽位置。
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    navigation.querySelectorAll('a').forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

// 原生 dialog 支援鍵盤焦點管理與 Esc 關閉。
const imageDialog = document.querySelector('#image-dialog');
const previewImage = document.querySelector('#preview-image');
const previewCaption = document.querySelector('#preview-caption');
let previewTrigger = null;
document.querySelectorAll('[data-preview]').forEach(button => {
  button.addEventListener('click', () => {
    previewTrigger = button;
    previewImage.src = button.dataset.preview;
    previewImage.alt = button.dataset.caption;
    previewCaption.textContent = button.dataset.caption;
    imageDialog.showModal();
    document.body.classList.add('modal-open');
  });
});
document.querySelector('#close-preview').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', event => {
  const rect = imageDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) imageDialog.close();
});
imageDialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  previewImage.removeAttribute('src');
  previewTrigger?.focus();
});

// 分類只顯示對應作品；無 JavaScript 時仍可閱讀所有作品。
const filters = document.querySelectorAll('[data-filter]');
const works = document.querySelectorAll('[data-category]');
filters.forEach(button => button.addEventListener('click', () => {
  let count = 0;
  works.forEach(work => {
    work.hidden = button.dataset.filter !== 'all' && button.dataset.filter !== work.dataset.category;
    if (!work.hidden) count++;
  });
  filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  document.querySelector('#filter-status').textContent = `目前顯示 ${count} 件作品。`;
}));
