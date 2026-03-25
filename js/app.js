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

  // ─── Hero Entrance Animation ───
  function animateHeroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      .to('.title-word', {
        opacity: 1, y: 0, duration: 1.2, stagger: 0.15,
      }, 0.4)
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
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
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

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        cards.forEach((card, i) => {
          const match = filter === 'all' || card.dataset.category === filter;
          if (match) {
            card.classList.remove('hidden');
            gsap.from(card, { opacity: 0, y: 20, duration: 0.5, delay: i * 0.05, ease: 'expo.out' });
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // ─── Contact Form ───
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const submitBtn = form.querySelector('.btn-submit');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitBtn.classList.add('loading');

      setTimeout(() => {
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        form.reset();

        setTimeout(() => {
          submitBtn.classList.remove('success');
        }, 3000);
      }, 1500);
    });
  }

  // ─── Neural Network Visualizer ───
  function initNeuralViz() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let animId;
    let pulseActive = false;
    let pulseTime = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    }

    function createNode(x, y) {
      return {
        x: x || Math.random() * canvas.offsetWidth,
        y: y || Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2,
        energy: 0,
      };
    }

    function initNodes() {
      nodes = [];
      for (let i = 0; i < 30; i++) nodes.push(createNode());
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      if (pulseActive) pulseTime += 0.05;

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.4;
            const energy = (nodes[i].energy + nodes[j].energy) / 2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = energy > 0
              ? `rgba(0, 240, 255, ${alpha + energy * 0.3})`
              : `rgba(136, 136, 168, ${alpha})`;
            ctx.lineWidth = 0.5 + energy * 1.5;
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));

        if (pulseActive) {
          node.energy = Math.max(0, Math.sin(pulseTime - Math.sqrt(node.x * node.x + node.y * node.y) * 0.02) * 0.5 + 0.5);
        } else {
          node.energy *= 0.95;
        }

        // Glow
        if (node.energy > 0.1) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8 * node.energy, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 240, 255, ${node.energy * 0.15})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.energy > 0.1
          ? `rgba(0, 240, 255, ${0.6 + node.energy * 0.4})`
          : 'rgba(136, 136, 168, 0.6)';
        ctx.fill();
      });

      if (pulseActive && pulseTime > 10) {
        pulseActive = false;
        pulseTime = 0;
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    initNodes();
    draw();

    // Controls
    document.querySelectorAll('[data-action="add-node"]').forEach(btn => {
      btn.addEventListener('click', () => {
        for (let i = 0; i < 5; i++) nodes.push(createNode());
      });
    });

    document.querySelectorAll('[data-action="remove-node"]').forEach(btn => {
      btn.addEventListener('click', () => {
        for (let i = 0; i < 5 && nodes.length > 5; i++) nodes.pop();
      });
    });

    document.querySelectorAll('[data-action="pulse"]').forEach(btn => {
      btn.addEventListener('click', () => {
        pulseActive = true;
        pulseTime = 0;
      });
    });

    document.querySelectorAll('[data-action="reset-neural"]').forEach(btn => {
      btn.addEventListener('click', () => {
        pulseActive = false;
        pulseTime = 0;
        initNodes();
      });
    });

    // Touch / mouse interaction on canvas
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      nodes.push(createNode(e.clientX - rect.left, e.clientY - rect.top));
    });

    window.addEventListener('resize', resize);
  }

  // ─── Waveform Visualizer ───
  function initWaveViz() {
    const canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const freq = parseFloat(document.getElementById('wave-freq').value);
      const amp = parseFloat(document.getElementById('wave-amp').value);
      const noise = parseFloat(document.getElementById('wave-noise').value);

      ctx.clearRect(0, 0, w, h);
      time += 0.03;

      // Draw multiple wave layers
      const layers = [
        { color: 'rgba(0, 240, 255, 0.8)', offset: 0, ampMult: 1 },
        { color: 'rgba(139, 92, 246, 0.5)', offset: 1, ampMult: 0.7 },
        { color: 'rgba(217, 70, 239, 0.3)', offset: 2, ampMult: 0.5 },
      ];

      layers.forEach(layer => {
        ctx.beginPath();
        for (let x = 0; x <= w; x++) {
          const nx = x / w;
          let y = h / 2;
          y += Math.sin(nx * freq + time + layer.offset) * amp * layer.ampMult * (h / 200);
          y += Math.sin(nx * freq * 2.5 + time * 1.5 + layer.offset) * amp * layer.ampMult * 0.3 * (h / 200);
          y += (Math.random() - 0.5) * noise * 0.5;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fill beneath
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = layer.color.replace(/[\d.]+\)$/, '0.05)');
        ctx.fill();
      });

      // Center line
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.strokeStyle = 'rgba(136, 136, 168, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
  }

  // ─── Matrix Visualizer ───
  function initMatrixViz() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let mode = 'rain';
    let time = 0;
    const chars = '01アイウエオカキクケコサシスセソ量子計算'.split('');
    let drops = [];

    function resize() {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      initDrops();
    }

    function initDrops() {
      const w = canvas.offsetWidth;
      const cols = Math.floor(w / 14);
      drops = [];
      for (let i = 0; i < cols; i++) {
        drops[i] = Math.random() * -100;
      }
    }

    function drawRain() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '12px JetBrains Mono, monospace';

      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 14;

        // Head glow
        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.fillText(char, x, y);

        // Trail
        for (let t = 1; t < 8; t++) {
          const trailY = y - t * 14;
          if (trailY > 0) {
            ctx.fillStyle = `rgba(0, 240, 255, ${0.5 - t * 0.06})`;
            const tc = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(tc, x, trailY);
          }
        }

        drops[i] += 14;
        if (drops[i] > h + 100 && Math.random() > 0.95) {
          drops[i] = Math.random() * -50;
        }
      });
    }

    function drawGrid() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = '10px JetBrains Mono, monospace';

      const cellSize = 20;
      const cols = Math.floor(w / cellSize);
      const rows = Math.floor(h / cellSize);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = Math.sin(time + c * 0.3 + r * 0.3) * 0.5 + 0.5;
          const hue = 180 + val * 80;
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${val * 0.6 + 0.1})`;
          ctx.fillText(val > 0.5 ? '1' : '0', c * cellSize + 4, r * cellSize + 14);
        }
      }
    }

    function drawSpiral() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '11px JetBrains Mono, monospace';

      const cx = w / 2;
      const cy = h / 2;

      for (let i = 0; i < 100; i++) {
        const angle = time * 2 + i * 0.15;
        const radius = i * 1.5 + time * 5 % 200;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (x > 0 && x < w && y > 0 && y < h) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const alpha = Math.max(0, 1 - radius / (Math.min(w, h) / 2));
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.7})`;
          ctx.fillText(char, x, y);
        }
      }
    }

    function draw() {
      time += 0.02;
      if (mode === 'rain') drawRain();
      else if (mode === 'grid') drawGrid();
      else if (mode === 'spiral') drawSpiral();
      requestAnimationFrame(draw);
    }

    resize();
    // Clear once for initial state
    ctx.fillStyle = 'rgba(10, 10, 15, 1)';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    draw();

    // Controls
    document.querySelectorAll('[data-action^="matrix-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.action.replace('matrix-', '');
        document.querySelectorAll('[data-action^="matrix-"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Clear canvas on mode switch
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        if (mode === 'rain' || mode === 'spiral') {
          ctx.fillStyle = 'rgba(10, 10, 15, 1)';
          ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        }
        if (mode === 'rain') initDrops();
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

    // ── Interactive Touch on Lab Canvases ──
    // Tapping/dragging on neural canvas creates nodes at touch position
    const neuralCanvas = document.getElementById('neural-canvas');
    if (neuralCanvas) {
      neuralCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = neuralCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        neuralCanvas.dispatchEvent(new MouseEvent('click', {
          clientX: touch.clientX,
          clientY: touch.clientY,
        }));
      });
    }

    // Touch drag on wave canvas adjusts the visualization
    const waveCanvas = document.getElementById('wave-canvas');
    if (waveCanvas) {
      waveCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = waveCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const nx = (touch.clientX - rect.left) / rect.width;
        const ny = (touch.clientY - rect.top) / rect.height;
        document.getElementById('wave-freq').value = Math.round(nx * 19 + 1);
        document.getElementById('wave-amp').value = Math.round((1 - ny) * 90 + 10);
      });
    }
  }

  // ─── Resize Handler ───
  function initResize() {
    window.addEventListener('resize', () => {
      state.isMobile = window.innerWidth <= 768;
    });
  }

  // ─── Init Everything ───
  function init() {
    initPreloader();
    initCursor();
    initParticleBackground();
    initNavigation();
    initSmoothScroll();
    initScrollAnimations();
    initTiltEffect();
    initMagnetic();
    initProjectFilters();
    initContactForm();
    initNeuralViz();
    initWaveViz();
    initMatrixViz();
    initTouchEvents();
    initResize();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
