/* ============================================
   NEXUS AI — Main Application
   ============================================ */

(function () {
  'use strict';

  // ─── State ───
  const state = {
    mouse: { x: 0, y: 0, nx: 0.5, ny: 0.5 },
    scroll: 0,
    isMobile: window.innerWidth <= 768,
    isLoaded: false,
  };

  // ─── Preloader ───
  function initPreloader() {
    const bar = document.querySelector('.preloader-progress-bar');
    const preloader = document.getElementById('preloader');
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;
      bar.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          preloader.classList.add('loaded');
          state.isLoaded = true;
          animateHeroEntrance();
        }, 400);
      }
    }, 150);
  }

  // ─── Custom Cursor ───
  function initCursor() {
    if (state.isMobile) return;

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const trail = document.querySelector('.cursor-trail');

    let ringX = 0, ringY = 0;
    let trailX = 0, trailY = 0;

    document.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
      state.mouse.nx = e.clientX / window.innerWidth;
      state.mouse.ny = e.clientY / window.innerHeight;
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
    });

    // Hover detection
    const hoverElements = 'a, button, [data-tilt], input, textarea, select, .filter-btn, .lab-btn, .magnetic';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverElements)) {
        dot.classList.add('hovering');
        ring.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverElements)) {
        dot.classList.remove('hovering');
        ring.classList.remove('hovering');
      }
    });

    // Smooth follow
    function animateCursor() {
      ringX += (state.mouse.x - ringX) * 0.15;
      ringY += (state.mouse.y - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      trailX += (state.mouse.x - trailX) * 0.08;
      trailY += (state.mouse.y - trailY) * 0.08;
      trail.style.left = trailX + 'px';
      trail.style.top = trailY + 'px';

      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // ─── Magnetic Effect ───
  function initMagnetic() {
    if (state.isMobile) return;

    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    });
  }

  // ─── Button Click Ripple ───
  function initButtonRipple() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'click-ripple';
        const size = Math.max(rect.width, rect.height) * 2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  // ─── Three.js Particle Background ───
  function initParticleBackground() {
    const canvas = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Particles
    const particleCount = state.isMobile ? 600 : 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const cyan = new THREE.Color(0x00f0ff);
    const purple = new THREE.Color(0x8b5cf6);
    const magenta = new THREE.Color(0xd946ef);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;

      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;

      const colorChoice = Math.random();
      const color = colorChoice < 0.5 ? cyan : colorChoice < 0.8 ? purple : magenta;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Particle material with custom shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Subtle wave motion
          pos.x += sin(uTime * 0.3 + position.y * 0.05) * 0.5;
          pos.y += cos(uTime * 0.2 + position.x * 0.05) * 0.5;

          // Mouse interaction — attract nearby particles
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float dist = length(pos.xy - (uMouse * 100.0 - 50.0));
          float influence = smoothstep(25.0, 0.0, dist);
          pos.xy += normalize(pos.xy - (uMouse * 100.0 - 50.0)) * influence * -3.0;
          pos.z += influence * 5.0;

          mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (30.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = smoothstep(100.0, 20.0, -mvPosition.z) * (0.4 + influence * 0.6);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Connection lines
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = state.isMobile ? 200 : 800;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Animation
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.005;
      material.uniforms.uTime.value = time;
      material.uniforms.uMouse.value.set(state.mouse.nx, 1 - state.mouse.ny);

      // Move particles
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        pos[i3 + 2] += velocities[i3 + 2];

        // Wrap
        if (pos[i3] > 50) pos[i3] = -50;
        if (pos[i3] < -50) pos[i3] = 50;
        if (pos[i3 + 1] > 50) pos[i3 + 1] = -50;
        if (pos[i3 + 1] < -50) pos[i3 + 1] = 50;
        if (pos[i3 + 2] > 30) pos[i3 + 2] = -30;
        if (pos[i3 + 2] < -30) pos[i3 + 2] = 30;
      }
      geometry.attributes.position.needsUpdate = true;

      // Update connection lines
      let lineIndex = 0;
      const connectionDistance = state.isMobile ? 8 : 6;
      const lp = lineGeometry.attributes.position.array;
      const lc = lineGeometry.attributes.color.array;

      for (let i = 0; i < particleCount && lineIndex < maxLines; i++) {
        for (let j = i + 1; j < particleCount && lineIndex < maxLines; j++) {
          const i3 = i * 3;
          const j3 = j * 3;
          const dx = pos[i3] - pos[j3];
          const dy = pos[i3 + 1] - pos[j3 + 1];
          const dz = pos[i3 + 2] - pos[j3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDistance) {
            const idx = lineIndex * 6;
            lp[idx] = pos[i3];
            lp[idx + 1] = pos[i3 + 1];
            lp[idx + 2] = pos[i3 + 2];
            lp[idx + 3] = pos[j3];
            lp[idx + 4] = pos[j3 + 1];
            lp[idx + 5] = pos[j3 + 2];

            const alpha = 1 - dist / connectionDistance;
            lc[idx] = 0; lc[idx + 1] = 0.94 * alpha; lc[idx + 2] = 1 * alpha;
            lc[idx + 3] = 0; lc[idx + 4] = 0.94 * alpha; lc[idx + 5] = 1 * alpha;
            lineIndex++;
          }
        }
      }

      // Clear remaining lines
      for (let i = lineIndex * 6; i < maxLines * 6; i++) {
        lp[i] = 0;
        lc[i] = 0;
      }

      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);

      // Subtle camera movement
      camera.position.x += (state.mouse.nx * 4 - 2 - camera.position.x) * 0.02;
      camera.position.y += ((1 - state.mouse.ny) * 4 - 2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });
  }

  // ─── Navigation ───
  function initNavigation() {
    const navbar = document.getElementById('navbar');
    const toggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const allLinks = document.querySelectorAll('.nav-link, .mobile-link');

    // Scroll state
    window.addEventListener('scroll', () => {
      state.scroll = window.scrollY;
      navbar.classList.toggle('scrolled', state.scroll > 50);

      // Update scroll progress
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (state.scroll / scrollable) * 100;
      document.querySelector('.scroll-progress-bar').style.width = progress + '%';

      // Update active link
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        const top = section.offsetTop - 200;
        const bottom = top + section.offsetHeight;
        if (state.scroll >= top && state.scroll < bottom) {
          const id = section.id;
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });

      // Parallax floating shapes
      document.querySelectorAll('.shape').forEach((shape, i) => {
        const speed = (i + 1) * 0.15;
        const yOffset = state.scroll * speed;
        shape.style.setProperty('--parallax-y', yOffset + 'px');
      });
    });

    // Mobile toggle
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Link clicks
    allLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          // Close mobile menu
          toggle.classList.remove('active');
          mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // ─── Text Scramble Effect ───
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';

  function scrambleElement(el, originalText) {
    const duration = originalText.length * 3;
    let frame = 0;

    if (!el.dataset.scrambleInit) {
      el.innerHTML = originalText.split('').map((ch, i) =>
        `<span class="scramble-char" data-index="${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`
      ).join('');
      el.dataset.scrambleInit = '1';
    }

    const spans = el.querySelectorAll('.scramble-char');

    const interval = setInterval(() => {
      frame++;
      const progress = frame / duration;
      const revealed = Math.floor(progress * originalText.length);

      spans.forEach((span, i) => {
        const original = originalText[i];
        if (original === ' ') {
          span.innerHTML = '&nbsp;';
          return;
        }
        if (i < revealed) {
          span.textContent = original;
          span.classList.remove('scrambling');
        } else {
          span.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          span.classList.add('scrambling');
        }
      });

      if (frame >= duration) {
        clearInterval(interval);
        spans.forEach((span, i) => {
          const ch = originalText[i];
          if (ch === ' ') {
            span.innerHTML = '&nbsp;';
          } else {
            span.textContent = ch;
          }
          span.classList.remove('scrambling');
        });
      }
    }, 30);

    return interval;
  }

  // ─── Hero Entrance Animation ───
  function animateHeroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    // Scramble hero title words in — no slide, just appear via scramble
    document.querySelectorAll('.title-word').forEach((word, i) => {
      const text = word.getAttribute('data-glitch') || word.textContent.trim();
      word.textContent = '';
      word.style.opacity = '1';
      word.style.transform = 'none';
      setTimeout(() => scrambleElement(word, text), 400 + i * 200);
    });

    tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      .to('.hero-description', { opacity: 1, y: 0, duration: 0.8 }, 1.0)
      .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.8 }, 1.2)
      .to('.hero-stats', { opacity: 1, y: 0, duration: 0.8 }, 1.4)
      .to('.hero-scroll-indicator', { opacity: 0.6, duration: 1 }, 1.8);

    // Animate stat counters
    setTimeout(animateCounters, 1800);
  }

  // ─── Counter Animation ───
  function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const decimal = parseInt(el.dataset.decimal) || 0;
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = current.toFixed(decimal) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  // ─── Scroll Reveal Animations ───
  function initScrollAnimations() {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Section headers
    gsap.utils.toArray('.section-number').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0, x: -20, duration: 0.6,
      });
    });

    gsap.utils.toArray('.section-title').forEach(el => {
      const text = el.textContent.trim();
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          onEnter: () => scrambleElement(el, text),
        },
        opacity: 0, y: 40, duration: 0.8, ease: 'expo.out',
      });
    });

    gsap.utils.toArray('.section-line').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        width: 0, duration: 0.8, ease: 'expo.out', delay: 0.2,
      });
    });

    // Reveal text
    gsap.utils.toArray('.reveal-text').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          setTimeout(() => el.classList.add('revealed'), i * 100);
        },
      });
    });

    // Reveal up
    gsap.utils.toArray('.reveal-up').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        onEnter: () => {
          setTimeout(() => el.classList.add('revealed'), i * 80);
        },
      });
    });

    // About cards
    gsap.utils.toArray('.about-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0, y: 40, duration: 0.8, delay: i * 0.15, ease: 'expo.out',
      });
    });

    // Tech cards
    gsap.utils.toArray('.tech-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0, y: 50, scale: 0.95, duration: 0.8, delay: i * 0.1, ease: 'expo.out',
      });
    });

    // Terminal lines
    const terminalLines = document.querySelectorAll('.terminal-line');
    ScrollTrigger.create({
      trigger: '.terminal-window',
      start: 'top 80%',
      onEnter: () => {
        terminalLines.forEach((line, i) => {
          setTimeout(() => line.classList.add('visible'), i * 400);
        });
      },
    });

    // Project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%' },
        opacity: 0, y: 40, duration: 0.7, delay: i * 0.08, ease: 'expo.out',
      });
    });

    // Lab experiments
    gsap.utils.toArray('.lab-experiment').forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0, y: 40, duration: 0.8, delay: i * 0.15, ease: 'expo.out',
      });
    });
  }

  // ─── 3D Tilt Effect ───
  function initTiltEffect() {
    if (state.isMobile) return;

    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02, 1.02, 1.02)`;

        // Move glow
        const glow = el.querySelector('.tech-card-glow');
        if (glow) {
          glow.style.left = (e.clientX - rect.left) + 'px';
          glow.style.top = (e.clientY - rect.top) + 'px';
          glow.style.transform = 'translate(-50%, -50%)';
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    });
  }

  // ─── Project Filters ───
  function initProjectFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');
    const grid = document.querySelector('.projects-grid');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        // FLIP: record first positions
        const firstRects = new Map();
        cards.forEach(card => {
          firstRects.set(card, card.getBoundingClientRect());
        });

        // Apply filter
        let showDelay = 0;
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.category === filter;
          if (match) {
            card.classList.remove('hiding', 'hidden');
            card.classList.add('showing');
            card.style.animationDelay = showDelay * 0.06 + 's';
            showDelay++;
            card.addEventListener('animationend', () => {
              card.classList.remove('showing');
            }, { once: true });
          } else {
            card.classList.add('hiding');
            setTimeout(() => {
              card.classList.add('hidden');
              card.classList.remove('hiding');
            }, 350);
          }
        });
      });
    });
  }

  // ─── Custom Select Dropdown ───
  function initCustomSelect() {
    const wrapper = document.getElementById('custom-select');
    if (!wrapper) return;

    const trigger = wrapper.querySelector('.custom-select-trigger');
    const valueDisplay = wrapper.querySelector('.custom-select-value');
    const options = wrapper.querySelectorAll('.custom-select-option');
    const hiddenInput = document.getElementById('subject');

    const formGroup = wrapper.closest('.form-group');

    // Toggle dropdown
    trigger.addEventListener('click', () => {
      const opening = !wrapper.classList.contains('open');
      wrapper.classList.toggle('open');
      if (formGroup) formGroup.style.zIndex = opening ? '100' : '';
    });

    // Keyboard support
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        wrapper.classList.toggle('open');
      }
      if (e.key === 'Escape') {
        wrapper.classList.remove('open');
      }
    });

    // Select an option
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        valueDisplay.textContent = opt.textContent;
        valueDisplay.removeAttribute('data-placeholder');
        hiddenInput.value = opt.dataset.value;

        wrapper.classList.add('has-value');
        wrapper.classList.remove('open');
        if (formGroup) formGroup.style.zIndex = '';

        // Remove error state if present
        const group = wrapper.closest('.form-group');
        if (group) group.classList.remove('field-error', 'shake');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
        if (formGroup) formGroup.style.zIndex = '';
      }
    });
  }

  // ─── Contact Form ───
  // PASTE YOUR GOOGLE APPS SCRIPT URL BELOW (see google-apps-script.js for setup)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4mK9b4esiVT0saLBZpZItVRKy_6r4C6WBq-TdcdEHr2yx5Sd62120bi2KNTaf58At/exec';

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const submitBtn = form.querySelector('.btn-submit');
    const statusEl = document.getElementById('form-status');
    const statusText = statusEl.querySelector('.form-status-text');

    function showStatus(type, message) {
      statusEl.className = 'form-status ' + type;
      statusText.textContent = message;
      // Force reflow for re-triggering animation
      void statusEl.offsetWidth;
      statusEl.classList.add('visible');

      if (type === 'success') {
        setTimeout(() => {
          statusEl.classList.remove('visible');
        }, 6000);
      }
    }

    function clearFieldErrors() {
      form.querySelectorAll('.form-group').forEach(g => {
        g.classList.remove('field-error', 'shake');
      });
    }

    function validateFields() {
      clearFieldErrors();
      let valid = true;
      const fields = form.querySelectorAll('input[type="text"], input[type="email"], textarea, input[type="hidden"][name="subject"]');
      fields.forEach(field => {
        if (!field.value.trim() || (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value))) {
          const group = field.closest('.form-group');
          group.classList.add('field-error', 'shake');
          valid = false;
          setTimeout(() => group.classList.remove('shake'), 400);
        }
      });
      return valid;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.classList.remove('visible');
      statusEl.className = 'form-status';

      if (!validateFields()) {
        showStatus('error', '[ERR] Required fields missing or invalid');
        return;
      }

      // Collect form data
      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value,
        message: form.message.value.trim(),
      };

      // Start loading animation
      submitBtn.classList.remove('success', 'error');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // no-cors returns opaque response, so we trust it went through
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        showStatus('success', '[OK] Transmission received — we\'ll be in touch');
        clearFieldErrors();
        form.reset();

        // Reset custom select
        const customSelect = document.getElementById('custom-select');
        if (customSelect) {
          customSelect.classList.remove('has-value');
          customSelect.querySelector('.custom-select-value').textContent = '';
          customSelect.querySelector('.custom-select-value').setAttribute('data-placeholder', 'true');
          customSelect.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
        }

        setTimeout(() => {
          submitBtn.classList.remove('success');
          submitBtn.disabled = false;
        }, 4000);

      } catch (err) {
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        showStatus('error', '[ERR] Transmission failed — check connection and retry');

        setTimeout(() => {
          submitBtn.classList.remove('error');
          submitBtn.disabled = false;
        }, 4000);
      }
    });
  }

  // ─── Neural Network Visualizer ───
  // ─── Particle Gravity ───
  function initGravityViz() {
    const canvas = document.getElementById('gravity-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let wells = [];
    let started = false;

    function resize() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * 2;
      canvas.height = h * 2;
      ctx.setTransform(2, 0, 0, 2, 0, 0);
    }

    function spawnParticles(count) {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          life: 1,
          hue: 180 + Math.random() * 80,
        });
      }
    }

    function initParticles() {
      particles = [];
      wells = [];
      spawnParticles(80);
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Draw wells
      wells.forEach(well => {
        const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 20 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(well.x, well.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.fill();
      });

      // Update & draw particles
      particles.forEach(p => {
        // Gravity from wells
        wells.forEach(well => {
          const dx = well.x - p.x;
          const dy = well.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 10;
          const force = 50 / (dist * dist);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        });

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const alpha = Math.min(0.9, 0.3 + speed * 0.1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 + speed * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + speed * 10}, 80%, 65%, ${alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    // Use IntersectionObserver to start only when visible
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true;
        resize();
        initParticles();
        ctx.fillStyle = 'rgba(10, 10, 15, 1)';
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        draw();
      }
    }, { threshold: 0.1 });
    observer.observe(canvas);

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      wells.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      wells.push({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    });

    document.querySelectorAll('[data-action="gravity-burst"]').forEach(btn => {
      btn.addEventListener('click', () => spawnParticles(40));
    });

    document.querySelectorAll('[data-action="gravity-clear"]').forEach(btn => {
      btn.addEventListener('click', () => { wells = []; });
    });

    document.querySelectorAll('[data-action="gravity-reset"]').forEach(btn => {
      btn.addEventListener('click', () => {
        ctx.fillStyle = 'rgba(10, 10, 15, 1)';
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        initParticles();
      });
    });

    window.addEventListener('resize', resize);
  }

  // ─── Reaction Time Game ───
  function initReactionViz() {
    const box = document.getElementById('reaction-box');
    if (!box) return;
    const msg = box.querySelector('.reaction-message');
    const timeDisplay = box.querySelector('.reaction-time');
    const bestDisplay = document.querySelector('.reaction-best');
    const avgDisplay = document.querySelector('.reaction-avg');

    let gameState = 'idle'; // idle, waiting, go, result
    let timeout = null;
    let startTime = 0;
    let scores = [];

    box.addEventListener('click', () => {
      if (gameState === 'idle' || gameState === 'result' || gameState === 'too-early') {
        // Start waiting
        gameState = 'waiting';
        box.className = 'reaction-box waiting';
        msg.textContent = 'Wait for green...';
        timeDisplay.textContent = '';
        const delay = 1500 + Math.random() * 3500;
        timeout = setTimeout(() => {
          gameState = 'go';
          box.className = 'reaction-box go';
          msg.textContent = 'CLICK NOW!';
          startTime = performance.now();
        }, delay);
      } else if (gameState === 'waiting') {
        // Too early
        clearTimeout(timeout);
        gameState = 'too-early';
        box.className = 'reaction-box too-early';
        msg.textContent = 'Too early! Click to retry';
        timeDisplay.textContent = '';
      } else if (gameState === 'go') {
        // Got it
        const elapsed = Math.round(performance.now() - startTime);
        gameState = 'result';
        box.className = 'reaction-box result';
        msg.textContent = 'Your reaction time:';
        timeDisplay.textContent = elapsed + 'ms';
        scores.push(elapsed);
        const best = Math.min(...scores);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        bestDisplay.textContent = 'Best: ' + best + 'ms';
        avgDisplay.textContent = 'Avg: ' + avg + 'ms';
      }
    });
  }

  // ─── Neon Draw ───
  function initDrawViz() {
    const canvas = document.getElementById('draw-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;
    let currentColor = '#00f0ff';
    let started = false;

    function resize() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = w * 2;
      canvas.height = h * 2;
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      if (imgData.width > 0) ctx.putImageData(imgData, 0, 0);
    }

    function initCanvas() {
      resize();
      ctx.fillStyle = 'rgba(10, 10, 15, 1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true;
        initCanvas();
      }
    }, { threshold: 0.1 });
    observer.observe(canvas);

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function drawLine(x1, y1, x2, y2) {
      // Glow layer
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.15;
      ctx.stroke();

      // Core line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    canvas.addEventListener('mousedown', (e) => {
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      drawLine(lastX, lastY, pos.x, pos.y);
      lastX = pos.x;
      lastY = pos.y;
    });

    canvas.addEventListener('mouseup', () => { drawing = false; });
    canvas.addEventListener('mouseleave', () => { drawing = false; });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!drawing) return;
      const pos = getPos(e);
      drawLine(lastX, lastY, pos.x, pos.y);
      lastX = pos.x;
      lastY = pos.y;
    });

    canvas.addEventListener('touchend', () => { drawing = false; });

    // Color buttons
    document.querySelectorAll('.lab-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentColor = btn.dataset.color;
        document.querySelectorAll('.lab-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Clear button
    document.querySelectorAll('[data-action="draw-clear"]').forEach(btn => {
      btn.addEventListener('click', () => {
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(10, 10, 15, 1)';
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      });
    });

    window.addEventListener('resize', resize);
  }

  // ─── Smooth Scroll Links ───
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // ─── Touch Events for Mobile ───
  function initTouchEvents() {
    if (!state.isMobile) return;

    // Touch moves particle background
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        state.mouse.x = e.touches[0].clientX;
        state.mouse.y = e.touches[0].clientY;
        state.mouse.nx = e.touches[0].clientX / window.innerWidth;
        state.mouse.ny = e.touches[0].clientY / window.innerHeight;
      }
    });

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        state.mouse.x = e.touches[0].clientX;
        state.mouse.y = e.touches[0].clientY;
        state.mouse.nx = e.touches[0].clientX / window.innerWidth;
        state.mouse.ny = e.touches[0].clientY / window.innerHeight;
      }
    });

    // ── Touch Ripple Effect ──
    // Creates an expanding ring wherever you tap
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const ripple = document.createElement('div');
      ripple.className = 'touch-ripple';
      ripple.style.left = touch.clientX + 'px';
      ripple.style.top = touch.clientY + 'px';
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });

    // ── Gyroscope / Accelerometer Tilt ──
    // Tilts cards and moves particle background when phone is tilted
    if (window.DeviceOrientationEvent) {
      const requestPermission = typeof DeviceOrientationEvent.requestPermission === 'function';

      function handleOrientation(e) {
        const gamma = (e.gamma || 0) / 90; // left-right tilt, -1 to 1
        const beta = ((e.beta || 0) - 45) / 90; // front-back tilt, normalized

        // Feed into particle background
        state.mouse.nx = 0.5 + gamma * 0.5;
        state.mouse.ny = 0.5 + beta * 0.5;

        // Tilt cards with gyroscope
        document.querySelectorAll('[data-tilt]').forEach(el => {
          const rect = el.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (inView) {
            el.style.transform = `perspective(800px) rotateY(${gamma * 12}deg) rotateX(${-beta * 12}deg)`;
          }
        });

        // Parallax floating shapes
        document.querySelectorAll('.shape').forEach((shape, i) => {
          const depth = (i + 1) * 8;
          shape.style.transform += ` translate(${gamma * depth}px, ${beta * depth}px)`;
        });
      }

      if (requestPermission) {
        // iOS 13+ requires permission request on user gesture
        document.addEventListener('touchstart', function requestGyro() {
          DeviceOrientationEvent.requestPermission()
            .then(response => {
              if (response === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
              }
            }).catch(() => {});
          document.removeEventListener('touchstart', requestGyro);
        }, { once: true });
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    // ── Touch Feedback on Cards ──
    // Press-and-hold scale effect on interactive elements
    const touchTargets = document.querySelectorAll('.tech-card, .project-card, .about-card, .btn, .lab-btn, .filter-btn');
    touchTargets.forEach(el => {
      el.addEventListener('touchstart', () => {
        el.style.transition = 'transform 0.15s ease';
        el.style.transform = 'scale(0.97)';
      });
      el.addEventListener('touchend', () => {
        el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = '';
      });
      el.addEventListener('touchcancel', () => {
        el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = '';
      });
    });

    // ── Swipeable Project Cards ──
    // Horizontal swipe to cycle through projects on mobile
    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {
      let startX = 0;
      let scrollStart = 0;
      let isDragging = false;

      projectsGrid.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        scrollStart = projectsGrid.scrollLeft;
        isDragging = true;
        projectsGrid.style.scrollBehavior = 'auto';
      });

      projectsGrid.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const dx = startX - e.touches[0].clientX;
        projectsGrid.scrollLeft = scrollStart + dx;
      });

      projectsGrid.addEventListener('touchend', () => {
        isDragging = false;
        projectsGrid.style.scrollBehavior = 'smooth';
        // Snap to nearest card
        const cardWidth = projectsGrid.querySelector('.project-card').offsetWidth + 16;
        const snapIndex = Math.round(projectsGrid.scrollLeft / cardWidth);
        projectsGrid.scrollLeft = snapIndex * cardWidth;
      });
    }

  }

  // ─── Testimonials Infinite Scroll ───
  function initTestimonials() {
    document.querySelectorAll('.testimonials-column').forEach(col => {
      const scroll = col.querySelector('.testimonials-scroll');
      if (!scroll) return;
      const speed = parseInt(col.dataset.speed) || 15;
      scroll.style.setProperty('--scroll-duration', speed + 's');
      // Duplicate cards for seamless loop
      const cards = scroll.innerHTML;
      scroll.innerHTML = cards + cards;
    });
  }


  // ─── Resize Handler ───
  function initResize() {
    window.addEventListener('resize', () => {
      state.isMobile = window.innerWidth <= 768;
    });
  }

  // ─── Init Everything ───
  // ─── Dark Mode Toggle ───
  function initDarkMode() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    // Check saved preference
    const saved = localStorage.getItem('nexus-theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';

      if (next === 'dark') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }

      localStorage.setItem('nexus-theme', next);
    });
  }

  // ─── FAQ Accordion ───
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all others
        items.forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Toggle current
        if (!isOpen) {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ─── Scroll to Top ───
  function initScrollToTop() {
    const btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── Cookie Notice ───
  function initCookieNotice() {
    const notice = document.getElementById('cookie-notice');
    const accept = document.getElementById('cookie-accept');
    if (!notice || !accept) return;

    if (localStorage.getItem('nexus-cookie-accepted')) return;

    setTimeout(() => {
      notice.classList.add('visible');
    }, 2000);

    accept.addEventListener('click', () => {
      notice.classList.remove('visible');
      localStorage.setItem('nexus-cookie-accepted', 'true');
    });
  }

  // ─── Results Counter Animation ───
  function initResultCounters() {
    const counters = document.querySelectorAll('.result-counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          const textVal = el.dataset.text;

          if (textVal) {
            el.textContent = textVal;
            observer.unobserve(el);
            return;
          }

          let current = 0;
          const duration = 1500;
          const start = performance.now();

          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  // ─── Process Timeline Scroll Animation ─���─
  function initProcessTimeline() {
    const steps = document.querySelectorAll('.process-step');
    const progressLine = document.querySelector('.process-progress-line');
    if (!steps.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active', 'in-view');
        }
      });
    }, { threshold: 0.3 });

    steps.forEach(step => observer.observe(step));

    // Progress line tracks scroll position within the process section
    if (progressLine) {
      const section = document.getElementById('process');
      if (section) {
        window.addEventListener('scroll', () => {
          const rect = section.getBoundingClientRect();
          const sectionHeight = section.offsetHeight;
          const viewH = window.innerHeight;
          const scrolled = Math.max(0, viewH - rect.top);
          const pct = Math.min(100, (scrolled / (sectionHeight + viewH * 0.3)) * 100);
          progressLine.style.height = pct + '%';
        }, { passive: true });
      }
    }
  }

  // ─── Lazy Load Heavy Assets ──��
  function initLazyLoad() {
    // Lazy-init lab canvases only when visible
    const labSection = document.getElementById('lab');
    if (!labSection) return;

    let labInitialized = false;
    const labObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !labInitialized) {
        labInitialized = true;
        initGravityViz();
        initReactionViz();
        initDrawViz();
        labObserver.disconnect();
      }
    }, { rootMargin: '200px' });

    labObserver.observe(labSection);
  }

  function init() {
    initPreloader();
    initCursor();
    initParticleBackground();
    initNavigation();
    initSmoothScroll();
    initScrollAnimations();
    initTiltEffect();
    initMagnetic();
    initButtonRipple();
    initProjectFilters();
    initCustomSelect();
    initContactForm();
    initLazyLoad();
    initTestimonials();
    initTouchEvents();
    initResize();
    initKonamiCode();
    initClickHoldBurst();
    initSmoothPageTransitions();
    initDarkMode();
    initFAQ();
    initScrollToTop();
    initCookieNotice();
    initResultCounters();
    initProcessTimeline();
  }

  // ─── Konami Code Easter Egg ───
  function initKonamiCode() {
    const code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA
    let pos = 0;
    let active = false;

    document.addEventListener('keydown', (e) => {
      if (e.keyCode === code[pos]) {
        pos++;
        if (pos === code.length) {
          pos = 0;
          if (!active) triggerMatrixRain();
        }
      } else {
        pos = 0;
      }
    });

    function triggerMatrixRain() {
      active = true;
      const canvas = document.createElement('canvas');
      canvas.className = 'matrix-rain';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      const cols = Math.floor(canvas.width / 16);
      const drops = Array(cols).fill(1);
      const chars = 'NEXUS01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

      canvas.style.opacity = '1';

      const interval = setInterval(() => {
        ctx.fillStyle = 'rgba(10, 10, 18, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '14px monospace';

        drops.forEach((y, i) => {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = Math.random() > 0.9 ? '#d946ef' : '#00f0ff';
          ctx.fillText(char, i * 16, y * 16);
          if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
      }, 40);

      // Fade out after 5 seconds
      setTimeout(() => {
        canvas.style.transition = 'opacity 1s ease';
        canvas.style.opacity = '0';
        setTimeout(() => {
          clearInterval(interval);
          canvas.remove();
          active = false;
        }, 1000);
      }, 5000);
    }
  }

  // ─── Click & Hold Particle Burst ───
  function initClickHoldBurst() {
    let holdTimer = null;
    let holdIndicator = null;

    document.addEventListener('mousedown', (e) => {
      if (e.target.closest('a, button, input, textarea, select')) return;

      // Create hold indicator ring
      holdIndicator = document.createElement('div');
      holdIndicator.className = 'hold-indicator';
      holdIndicator.style.left = e.clientX + 'px';
      holdIndicator.style.top = e.clientY + 'px';
      document.body.appendChild(holdIndicator);

      holdTimer = setTimeout(() => {
        // Burst particles from cursor
        const colors = ['#00f0ff', '#8b5cf6', '#d946ef', '#10b981', '#ffffff'];
        for (let i = 0; i < 30; i++) {
          const p = document.createElement('div');
          p.className = 'hold-particle';
          const angle = (i / 30) * Math.PI * 2 + (Math.random() - 0.5);
          const speed = Math.random() * 120 + 50;
          const dx = Math.cos(angle) * speed;
          const dy = Math.sin(angle) * speed;
          const size = Math.random() * 5 + 2;
          p.style.cssText = `
            left: ${e.clientX}px; top: ${e.clientY}px;
            width: ${size}px; height: ${size}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            box-shadow: 0 0 8px currentColor;
          `;
          document.body.appendChild(p);
          p.animate([
            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
          ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(0.25,1,0.5,1)' })
            .addEventListener('finish', () => p.remove());
        }

        if (holdIndicator) {
          holdIndicator.remove();
          holdIndicator = null;
        }
      }, 800);
    });

    document.addEventListener('mouseup', () => {
      clearTimeout(holdTimer);
      if (holdIndicator) {
        holdIndicator.remove();
        holdIndicator = null;
      }
    });
  }

  // ─── Smooth Page Transitions ───
  function initSmoothPageTransitions() {
    document.querySelectorAll('a[href="form.html"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        document.body.appendChild(overlay);

        // Force reflow then animate
        overlay.offsetHeight;
        overlay.classList.add('active');

        setTimeout(() => {
          window.location.href = link.href;
        }, 500);
      });
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
