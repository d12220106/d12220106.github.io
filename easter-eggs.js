'use strict';

// Dialog 的原生焦點管理與 Esc 支援；關閉時還原頁面捲動。
function bindEggDialog(dialog, opener, closer, onClose) {
  opener.addEventListener('click', () => { dialog.showModal(); document.body.classList.add('modal-open'); });
  closer.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    onClose?.();
    opener.focus();
  });
}

// 咖啡：小型狀態機，研磨四次 → 計時注水 → 停在目標區 → 萃取。
const coffeeDialog = document.querySelector('#coffee-dialog');
const coffeeScene = document.querySelector('.coffee-scene');
const coffeeStatus = document.querySelector('#coffee-status');
const grindButton = document.querySelector('#grind-coffee');
const pourButton = document.querySelector('#pour-coffee');
const brewButton = document.querySelector('#brew-coffee');
const waterAmount = document.querySelector('#water-amount');
const waterLevel = document.querySelector('#water-level');
const brewSteps = [...document.querySelectorAll('.brew-steps li')];
let grounds = 0, water = 0, pouring = false, pourStart = 0;
let coffeeTimer = null;
function setBrewStep(step) {
  brewSteps.forEach((item, index) => { item.classList.toggle('current', index === step); item.classList.toggle('done', index < step); });
}
function updateWater() {
  waterAmount.textContent = Math.round(water) + ' ml';
  waterLevel.style.width = (water / 260 * 100) + '%';
}
function resetCoffee() {
  clearInterval(coffeeTimer);
  grounds = water = 0; pouring = false;
  coffeeScene.classList.remove('is-pouring', 'is-brewing', 'is-complete');
  coffeeScene.style.setProperty('--grounds', '0%'); coffeeScene.style.setProperty('--fill', '0%');
  grindButton.disabled = false; grindButton.textContent = '研磨咖啡豆 · 0 / 4';
  pourButton.disabled = brewButton.disabled = true;
  pourButton.textContent = '開始注水'; brewButton.textContent = '開始萃取';
  coffeeStatus.textContent = '先把咖啡豆磨好。點擊研磨 4 次！';
  setBrewStep(0); updateWater();
}
bindEggDialog(coffeeDialog, document.querySelector('#open-coffee'), document.querySelector('#close-coffee'), resetCoffee);
document.querySelector('#reset-coffee').addEventListener('click', resetCoffee);
grindButton.addEventListener('click', () => {
  grounds = Math.min(4, grounds + 1);
  coffeeScene.style.setProperty('--grounds', (grounds * 13) + '%');
  grindButton.textContent = `研磨咖啡豆 · ${grounds} / 4`;
  if (grounds === 4) {
    grindButton.disabled = true; pourButton.disabled = false; setBrewStep(1);
    coffeeStatus.textContent = '咖啡粉準備好了！開始注水，停在 180–220 ml 的金色區間。';
  } else coffeeStatus.textContent = `喀啦、喀啦……已研磨 ${grounds} / 4，再來一下！`;
});
function stopPour() {
  clearInterval(coffeeTimer); pouring = false; coffeeScene.classList.remove('is-pouring');
  pourButton.textContent = '重新注水';
  const inRange = water >= 180 && water <= 220;
  brewButton.disabled = !inRange;
  if (inRange) coffeeStatus.textContent = `${Math.round(water)} ml，水量剛剛好！可以開始萃取了。`;
  else coffeeStatus.textContent = water > 220 ? '水加太多了！點「重新注水」再試一次。' : '水量還不夠！點「重新注水」，這次瞄準金色區間。';
}
pourButton.addEventListener('click', () => {
  if (pouring) { stopPour(); return; }
  water = 0; pourStart = performance.now(); pouring = true; updateWater();
  brewButton.disabled = true; pourButton.textContent = '停止注水'; coffeeScene.classList.add('is-pouring');
  coffeeStatus.textContent = '正在注水……快到金色區間時，點「停止注水」！';
  coffeeTimer = setInterval(() => {
    water = Math.min(260, (performance.now() - pourStart) * .055); updateWater();
    if (water >= 260) stopPour();
  }, 40);
});
brewButton.addEventListener('click', () => {
  if (pouring || water < 180 || water > 220) return;
  brewButton.disabled = pourButton.disabled = true; setBrewStep(2);
  coffeeScene.classList.add('is-brewing');
  coffeeStatus.textContent = '萃取中，讓香氣慢慢出來……';
  const started = performance.now();
  coffeeTimer = setInterval(() => {
    const progress = Math.min(1, (performance.now() - started) / 2800);
    coffeeScene.style.setProperty('--fill', (progress * 80) + '%');
    if (progress === 1) {
      clearInterval(coffeeTimer); coffeeScene.classList.remove('is-brewing'); coffeeScene.classList.add('is-complete');
      brewButton.textContent = '咖啡完成 ✓'; setBrewStep(3);
      coffeeStatus.textContent = '☕ 成功泡出一杯咖啡！休息一下，再把想像做成形狀。';
    }
  }, 40);
});

// 正八面體：六個頂點在三條座標軸上，八個等邊三角面依深度排列。
// 只在拖曳或鍵盤操作時重畫，頁尾不顯示額外提示。
const octa = document.querySelector('#octahedron');
const octaFaces = document.querySelector('#octa-faces');
const octaVertices = document.querySelector('#octa-vertices');
const vertices = [[0,-1,0],[0,1,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]];
const faces = [[0,2,3],[0,3,4],[0,4,5],[0,5,2],[1,3,2],[1,4,3],[1,5,4],[1,2,5]];
const colors = ['#bca0f2','#ed829a','#d9b979','#8e73b7'];
const svgNS = 'http://www.w3.org/2000/svg';
let angleX = -.35, angleY = .55, drag = null;
function drawOcta() {
  const transformed = vertices.map(([x,y,z]) => {
    const xx = x * Math.cos(angleY) + z * Math.sin(angleY);
    const zz = -x * Math.sin(angleY) + z * Math.cos(angleY);
    const yy = y * Math.cos(angleX) - zz * Math.sin(angleX);
    const depth = y * Math.sin(angleX) + zz * Math.cos(angleX);
    const scale = 88 * 5 / (5 - depth);
    return { x:130 + xx * scale, y:130 + yy * scale, z:depth };
  });
  octaFaces.replaceChildren(); octaVertices.replaceChildren();
  faces.map((face,index) => ({face,index,z:face.reduce((sum,i)=>sum+transformed[i].z,0)/3})).sort((a,b)=>a.z-b.z).forEach(({face,index,z}) => {
    const polygon = document.createElementNS(svgNS, 'polygon');
    polygon.setAttribute('points', face.map(i=>`${transformed[i].x},${transformed[i].y}`).join(' '));
    polygon.setAttribute('fill', colors[index % colors.length]); polygon.setAttribute('fill-opacity', z > 0 ? '.22' : '.07');
    polygon.setAttribute('stroke', colors[index % colors.length]); polygon.setAttribute('stroke-width', '2'); polygon.setAttribute('stroke-linejoin','round');
    octaFaces.append(polygon);
  });
  transformed.forEach(point => {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx',point.x); circle.setAttribute('cy',point.y); circle.setAttribute('r','2.5'); circle.setAttribute('fill','#f4e4bc');
    octaVertices.append(circle);
  });
}
octa.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drag) return;
  drag = {id:event.pointerId,x:event.clientX,y:event.clientY};
  octa.setPointerCapture(event.pointerId); octa.classList.add('dragging'); octa.focus({preventScroll:true});
});
octa.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  angleY += (event.clientX - drag.x) * .018; angleX -= (event.clientY - drag.y) * .018;
  drag.x = event.clientX; drag.y = event.clientY; drawOcta();
});
function endOctaDrag() { drag = null; octa.classList.remove('dragging'); }
octa.addEventListener('pointerup', endOctaDrag); octa.addEventListener('pointercancel', endOctaDrag); octa.addEventListener('lostpointercapture', endOctaDrag);
octa.addEventListener('keydown', event => {
  const changes = {ArrowLeft:[0,-.14],ArrowRight:[0,.14],ArrowUp:[.14,0],ArrowDown:[-.14,0]};
  if (!changes[event.key]) return;
  event.preventDefault(); angleX += changes[event.key][0]; angleY += changes[event.key][1]; drawOcta();
});
drawOcta();


