(function () {
  if (!document.body.classList.contains('site-winter')) return;

  const canvas = document.getElementById('snow-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const numFlakes = 150;
  const flakes = [];

  for (let i = 0; i < numFlakes; i++) {
    flakes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      d: Math.random() + 1,
    });
  }

  function drawSnow() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      ctx.moveTo(f.x, f.y);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    updateSnow();
  }

  let angle = 0;

  function updateSnow() {
    angle += 0.01;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y += Math.pow(f.d, 2) + 1;
      f.x += Math.sin(angle) * 2;

      if (f.y > height) {
        flakes[i] = { x: Math.random() * width, y: 0, r: f.r, d: f.d };
      }
    }
  }

  function animateSnow() {
    if (!document.body.classList.contains('site-winter')) return;
    drawSnow();
    requestAnimationFrame(animateSnow);
  }

  animateSnow();

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });
})();
