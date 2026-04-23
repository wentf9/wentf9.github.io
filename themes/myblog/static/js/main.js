// 背景效果
function initBackground() {
  const background = document.getElementById('background');
  if (!background) return;

  // Setup Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
      // Fallback: CSS gradient will remain
      return;
  }
  background.appendChild(canvas);
  
  // Set explicit z-index for canvas to ensure it stays behind content
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  background.style.zIndex = '1';

  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = (Math.random() - 0.5) * 1;
      this.radius = Math.random() * 1.5 + 0.5;
      this.friction = 0.98; // 摩擦力
      this.gravity = 0.002; // 鼠标引力系数
      this.maxSpeed = 3;
    }

    update(mouse, particles) {
      // 鼠标排斥：离鼠标太近时被推开
      if (mouse.isActive) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distSq = dx * dx + dy * dy;
        const radius = 150;
        if (distSq > 0 && distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const force = (radius - dist) / radius;
          this.vx -= (dx / dist) * force * 0.5;
          this.vy -= (dy / dist) * force * 0.5;
        }
      }

      // 粒子间的互相排斥，防止堆叠，保持均匀分布
      if (particles) {
        for (let i = 0; i < particles.length; i++) {
          const other = particles[i];
          if (other === this) continue;
          const dx = this.x - other.x;
          const dy = this.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0 && distSq < 2500) { // 50px以内互相排斥
            const dist = Math.sqrt(distSq);
            this.vx += (dx / dist) * 0.05;
            this.vy += (dy / dist) * 0.05;
          }
        }
      }

      // 应用摩擦力
      this.vx *= this.friction;
      this.vy *= this.friction;
      
      // 基础漂浮 (防止停止)
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vy += (Math.random() - 0.5) * 0.1;

      // 限制最大速度
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > this.maxSpeed) {
        this.vx = (this.vx / speed) * this.maxSpeed;
        this.vy = (this.vy / speed) * this.maxSpeed;
      }

      this.x += this.vx;
      this.y += this.vy;

      // 边界处理 (反弹)
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      
      // 确保不出界太远
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
      ctx.fill();
    }
  }

  const mouse = { x: 0, y: 0, isActive: false };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.isActive = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.isActive = false;
  });

  const numParticles = 120;
  const particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // 更新并绘制圆点
    particles.forEach(p => {
      p.update(mouse, particles);
      p.draw(ctx);
    });

    // 绘制连线和三角形填充
    const connectionDistance = 120;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < connectionDistance * connectionDistance) {
          const dist = Math.sqrt(distSq);
          const opacity = 1 - (dist / connectionDistance);
          
          // 画线
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${opacity * 0.3})`;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// 平滑滚动
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// 导航栏滚动效果
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScrollTop = 0;
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 100) {
      navbar.style.background = 'rgba(10, 10, 10, 0.8)';
    } else {
      navbar.style.background = 'rgba(10, 10, 10, 0.4)';
    }
    lastScrollTop = scrollTop;
  });
}

// 标签页颜色设置
function initTagColors() {
  const tagBadges = document.querySelectorAll('.tag-badge');
  tagBadges.forEach(badge => {
    const tagColor = badge.style.getPropertyValue('--tag-color');
    if (tagColor) {
      badge.style.borderColor = tagColor;
      badge.style.color = tagColor;
      badge.style.background = tagColor + '15'; // 15% opacity
    }
  });
}

// 代码块：语言标签 + 复制按钮
function initCodeBlocks() {
  document.querySelectorAll('.markdown-body .highlight').forEach(block => {
    const code = block.querySelector('code');
    if (!code) return;

    // 创建页眉容器
    const header = document.createElement('div');
    header.className = 'code-header';

    // 语言标签
    const lang = code.getAttribute('data-lang');
    if (lang) {
      const langLabel = document.createElement('span');
      langLabel.className = 'code-lang';
      langLabel.textContent = lang;
      header.appendChild(langLabel);
    }

    // 复制按钮
    const btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.textContent = 'Copy';
    
    // 复制功能函数
    const copyToClipboard = (text) => {
      // 优先使用现代 API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      
      // 回退方案：使用临时 textarea
      return new Promise((resolve, reject) => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          // 确保 textarea 在屏幕外不可见
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          textArea.style.top = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            resolve();
          } else {
            reject(new Error('ExecCommand copy failed'));
          }
        } catch (err) {
          reject(err);
        }
      });
    };

    btn.addEventListener('click', () => {
      const text = code.textContent;
      copyToClipboard(text).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
        btn.textContent = 'Error';
      });
    });
    header.appendChild(btn);

    // 将页眉添加到代码块
    block.appendChild(header);
  });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
  initBackground();
  initSmoothScroll();
  initNavbarScroll();
  initTagColors();
  initCodeBlocks();
});