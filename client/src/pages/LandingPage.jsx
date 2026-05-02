import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const canvasRef = useRef(null);
  const mbRef = useRef(null);
  const mlRef = useRef(null);
  const mrRef = useRef(null);
  const mlineRef = useRef(null);
  const chatBodyRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: 'Good morning! Today\'s target is <strong>2,400 units</strong>. Line 3 at 87% efficiency. How can I help?' },
    { id: 2, role: 'usr', text: 'Show pending vendor payments this week' },
    { id: 3, role: 'bot', text: 'Found <strong>7 pending invoices</strong> — ₹14.2L total. 3 are overdue 5+ days. Draft payment approvals?' },
    { id: 4, role: 'usr', text: 'Machine 7 on Line 2 making noise' },
    { id: 5, role: 'bot', text: 'Raised <strong>Priority HIGH</strong> ticket for Machine 7, Line 2. Assigned to Rajan — ETA 45 min. Ticket #MT-2847 created.' }
  ]);

  useEffect(() => {
    // Mouse effects
    const wrap = wrapRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = wrap.offsetWidth;
      canvas.height = wrap.scrollHeight;
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(wrap);

    let mx = -200, my = -200, rx = -200, ry = -200;
    const particles = [];

    const onMouseMove = (e) => {
      const r = wrap.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top + wrap.scrollTop;
      if (dot) {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      }
      particles.push({
        x: mx, y: my, r: Math.random() * 5 + 2, a: 0.7,
        dx: (Math.random() - 0.5) * 1.5, dy: (Math.random() - 0.5) * 1.5 - 0.4
      });
      if (particles.length > 80) particles.shift();
    };
    wrap.addEventListener('mousemove', onMouseMove);

    let raf;
    const animLoop = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      if (ring) {
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${p.a})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy; p.r *= 0.93; p.a *= 0.92;
        if (p.a < 0.02 || p.r < 0.3) particles.splice(i, 1);
      }
      raf = requestAnimationFrame(animLoop);
    };
    animLoop();

    const onEnter = () => { if (ring) ring.style.opacity = '1'; if (dot) dot.style.opacity = '1'; };
    const onLeave = () => { if (ring) ring.style.opacity = '0'; if (dot) dot.style.opacity = '0'; };
    wrap.addEventListener('mouseenter', onEnter);
    wrap.addEventListener('mouseleave', onLeave);
    if (ring) ring.style.opacity = '0';
    if (dot) dot.style.opacity = '0';

    const interactiveEls = wrap.querySelectorAll('button, a');
    const onHoverEnter = () => { if (ring) { ring.style.width = '72px'; ring.style.height = '72px'; ring.style.borderColor = '#FCD34D'; } };
    const onHoverLeave = () => { if (ring) { ring.style.width = '40px'; ring.style.height = '40px'; ring.style.borderColor = '#F59E0B'; } };
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', onHoverEnter);
      el.addEventListener('mouseleave', onHoverLeave);
    });

    // Hero Merge
    const mb = mbRef.current;
    let autoP = 50, autoD = 1, manual = false;
    const setMerge = (p) => {
      if (mlRef.current) mlRef.current.style.clipPath = `polygon(0 0,${p}% 0,${p}% 100%,0 100%)`;
      if (mrRef.current) mrRef.current.style.clipPath = `polygon(${p}% 0,100% 0,100% 100%,${p}% 100%)`;
      if (mlineRef.current) mlineRef.current.style.left = p + '%';
    };
    let sweepRaf;
    const autoSweep = () => {
      if (manual) return;
      autoP += autoD * 0.25;
      if (autoP > 72) autoD = -1;
      if (autoP < 28) autoD = 1;
      setMerge(autoP);
      sweepRaf = requestAnimationFrame(autoSweep);
    };
    autoSweep();

    const onMbMove = (e) => {
      manual = true;
      const r = mb.getBoundingClientRect();
      setMerge(Math.max(5, Math.min(95, ((e.clientX - r.left) / r.width) * 100)));
    };
    const onMbLeave = () => { manual = false; autoSweep(); };
    if (mb) {
      mb.addEventListener('mousemove', onMbMove);
      mb.addEventListener('mouseleave', onMbLeave);
    }

    // Counters
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const t = +el.dataset.t;
        const dur = 2000;
        const step = t / (dur / 16);
        let c = 0;
        const tmr = setInterval(() => {
          c = Math.min(c + step, t);
          el.textContent = Math.floor(c).toLocaleString('en-IN');
          if (c >= t) clearInterval(tmr);
        }, 16);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    wrap.querySelectorAll('.cnt').forEach(c => obs.observe(c));

    // Scroll reveal
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: 0.12 });
    wrap.querySelectorAll('.step, .mod, .fp, #chat-win').forEach((el, i) => {
      el.style.transitionDelay = (i % 3) * 0.1 + 's';
      revObs.observe(el);
    });

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sweepRaf);
      ro.disconnect();
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('mouseenter', onEnter);
      wrap.removeEventListener('mouseleave', onLeave);
      interactiveEls.forEach(el => {
        el.removeEventListener('mouseenter', onHoverEnter);
        el.removeEventListener('mouseleave', onHoverLeave);
      });
      if (mb) {
        mb.removeEventListener('mousemove', onMbMove);
        mb.removeEventListener('mouseleave', onMbLeave);
      }
      obs.disconnect();
      revObs.disconnect();
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const sendMsg = () => {
    const txt = chatInput.trim();
    if (!txt) return;

    const newMessages = [...chatMessages, { id: Date.now(), role: 'usr', text: txt }];
    setChatMessages(newMessages);
    setChatInput('');

    setTimeout(() => {
      if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, 50);

    setTimeout(() => {
      const replies = [
        "Today's output: 1,847 units across all lines. Line 2 leads with 640 units.",
        "Current raw material inventory at 68% capacity. Reorder alert on SKU-442.",
        "Payroll: ₹34.8L processed this month. 3 employees have pending attendance fixes.",
        "6 open service tickets: 2 Critical, 3 High, 1 Medium. Machine 4 resolved 10:45 AM.",
        "4 POs awaiting approval — ₹8.2L total. Oldest pending for 3 days.",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setChatMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
      setTimeout(() => {
        if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }, 50);
    }, 800);
  };

  return (
    <div className="landing-wrap" id="wrap" ref={wrapRef}>
      <canvas id="trail" ref={canvasRef}></canvas>
      <div id="cur-ring" ref={ringRef}></div>
      <div id="cur-dot" ref={dotRef}></div>

      <nav className="landing-nav">
        <a href="#" className="landing-logo">
          <div className="logo-hex"></div>FactoryOS
        </a>
        <ul className="nav-links hidden md:flex">
          <li><a href="#mods-sec">Modules</a></li>
          <li><a href="#feats-sec">Features</a></li>
          <li><a href="#ai-sec">AI Bot</a></li>
        </ul>
        <button className="nav-btn" onClick={handleGetStarted}>Get Demo</button>
      </nav>

      <section className="landing-hero" id="hero-sec">
        <div className="merge-bg" id="merge-bg" ref={mbRef}>
          <div className="merge-l" id="ml" ref={mlRef}></div>
          <div className="merge-r" id="mr" ref={mrRef}></div>
          <div className="merge-ov"></div>
          <div className="merge-line" id="mline" ref={mlineRef}></div>
        </div>
        <div className="hero-grid"></div>
        <div className="hero-c">
          <p className="hero-eye">Unified Factory Intelligence Platform</p>
          <h1 className="hero-h">Factory<span>OS</span></h1>
          <p className="hero-p">From raw material to dispatch gate — one platform controls production, people, payroll, vendors, costs and your AI assistant.</p>
          <div className="hero-btns">
            <button className="btn-p" onClick={handleGetStarted}>Start Free Trial</button>
            <button className="btn-o" onClick={handleGetStarted}>Watch Demo</button>
          </div>
        </div>
        <div className="scroll-hint"><span>Scroll</span><div className="scroll-bar"></div></div>
      </section>

      <div className="landing-stats">
        <div className="stat"><div className="stat-n"><span className="cnt" data-t="2400">0</span><span className="stat-s">+</span></div><div className="stat-l">Factories Onboarded</div></div>
        <div className="stat"><div className="stat-n"><span className="cnt" data-t="98">0</span><span className="stat-s">%</span></div><div className="stat-l">Uptime SLA</div></div>
        <div className="stat"><div className="stat-n"><span className="cnt" data-t="12">0</span><span className="stat-s">M+</span></div><div className="stat-l">Transactions Processed</div></div>
        <div className="stat"><div className="stat-n"><span className="cnt" data-t="9">0</span><span className="stat-s"> Modules</span></div><div className="stat-l">Fully Integrated</div></div>
      </div>

      <div className="showcase">
        <div className="sc-imgs">
          <div className="sc-a"></div>
          <div className="sc-b"></div>
          <div className="sc-ov"></div>
          <div className="sc-lbl">Hover to merge views</div>
        </div>
        <div className="sc-copy">
          <span className="landing-tag">How It Works</span>
          <h2 className="sec-h" style={{ marginBottom: 0 }}>Every Layer of<br /><em>Your Factory</em></h2>
          <div className="steps">
            <div className="step"><div className="step-n">01</div><div className="step-t"><h4>Connect Your Floor</h4><p>Plug in machines, biometric devices and inventory sensors. Live data flows into your dashboard instantly.</p></div></div>
            <div className="step"><div className="step-n">02</div><div className="step-t"><h4>Automate Operations</h4><p>Work orders, payroll, GRNs and purchase approvals run automatically with your configured rules.</p></div></div>
            <div className="step"><div className="step-n">03</div><div className="step-t"><h4>Decide with Intelligence</h4><p>FactoryBot surfaces anomalies and insights before they become problems. Ask anything, get answers.</p></div></div>
          </div>
        </div>
      </div>

      <section className="landing-sec mods" id="mods-sec">
        <span className="landing-tag">Platform Modules</span>
        <h2 className="sec-h">Everything You Need.<br /><em>Nothing You Don't.</em></h2>
        <div className="mod-grid">
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="1" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg></div><h3>Production Management</h3><p>Work orders, shift scheduling, live output tracking, QC gates, batch traceability and yield analysis.</p><div className="mod-bar"></div><div className="mod-num">01</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></div><h3>Dispatch & Logistics</h3><p>Challan generation, e-way bills, transporter assignment, gate-pass auth and POD upload.</p><div className="mod-bar"></div><div className="mod-num">02</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div><h3>Employee Management</h3><p>Biometric attendance, leave workflows, skill matrix, performance scoring from production records.</p><div className="mod-bar"></div><div className="mod-num">03</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg></div><h3>Payroll & Salary</h3><p>Auto computation with PF, ESIC, TDS. Piece-rate workers. WhatsApp / email payslip delivery.</p><div className="mod-bar"></div><div className="mod-num">04</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg></div><h3>Vendor & Purchase</h3><p>PO workflow, 3-way invoice matching, vendor portal, payment scheduling and scorecard.</p><div className="mod-bar"></div><div className="mod-num">05</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div><h3>MIS & Reports</h3><p>OEE, capacity utilization, financial MIS, custom report builder with role-based dashboards.</p><div className="mod-bar"></div><div className="mod-num">06</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg></div><h3>Inventory & Stores</h3><p>Raw material, WIP and finished goods with reorder alerts, barcode labels and multi-warehouse.</p><div className="mod-bar"></div><div className="mod-num">07</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M21 12h-2M5 12H3M12 5V3M12 21v-2" /></svg></div><h3>Costing & Auth</h3><p>Standard vs actual cost per batch, CAPEX approvals, authorization matrix and profitability.</p><div className="mod-bar"></div><div className="mod-num">08</div></div>
          <div className="mod"><div className="mod-ico"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg></div><h3>Service Tickets</h3><p>Machine breakdown tickets, preventive maintenance, SLA tracking and spare parts per ticket.</p><div className="mod-bar"></div><div className="mod-num">09</div></div>
        </div>
      </section>

      <section className="feats" id="feats-sec">
        <div className="feats-hdr">
          <span className="landing-tag">Deep Dive</span>
          <h2 className="sec-h">Built for the<br /><em>Ground Level</em></h2>
        </div>
        <div className="fp fp1" id="fp1">
          <div className="fp-img"><div className="fp-iov"></div><div className="fp-itag">DISPATCH</div></div>
          <div className="fp-copy"><span className="landing-tag">Dispatch & Logistics</span><h2>From Finished Goods<br />to <em>Customer Door</em></h2><p>Every dispatch tracked end-to-end. Challans, e-way bills, transporter details and proof of delivery in one flow.</p><ul className="fl"><li>Auto e-way bill via GST API</li><li>Real-time transporter tracking</li><li>POD photo upload from driver's phone</li><li>Return merchandise authorization flow</li></ul></div>
        </div>
        <div className="fp fp2 rev" id="fp2">
          <div className="fp-img"><div className="fp-iov"></div><div className="fp-itag">VENDOR</div></div>
          <div className="fp-copy"><span className="landing-tag">Vendor Management</span><h2>Pay Vendors <em>Smarter</em>,<br />Not Slower</h2><p>Three-way matching validates POs, goods receipts and invoices automatically before payment is released.</p><ul className="fl"><li>Multi-level PO approval by value bands</li><li>3-way match: PO ↔ GRN ↔ Invoice</li><li>Vendor rating on quality, delivery, price</li><li>Vendor portal for payment self-tracking</li></ul></div>
        </div>
        <div className="fp fp3" id="fp3">
          <div className="fp-img"><div className="fp-iov"></div><div className="fp-itag">INSIGHTS</div></div>
          <div className="fp-copy"><span className="landing-tag">MIS & Intelligence</span><h2>Decision-Grade <em>Data</em><br />for Every Role</h2><p>From the worker checking leave balance to the owner reviewing margin by product line — every view built for its audience.</p><ul className="fl"><li>OEE: availability × performance × quality</li><li>Custom report builder with Excel export</li><li>Budget vs actual by cost center</li><li>Mobile-first for supervisors on floor</li></ul></div>
        </div>
      </section>

      <div className="gallery">
        <div className="gtrack">
          {[
            { img: '1581091226825-a6a2a5aee158', lbl: 'Production Floor' },
            { img: '1565008447742-97f6f38c985c', lbl: 'Assembly Line' },
            { img: '1504328345606-18bbc8c9d7d1', lbl: 'Quality Control' },
            { img: '1518770660439-4636190af475', lbl: 'Machinery' },
            { img: '1553413077-190dd305871c', lbl: 'Dispatch Bay' },
            { img: '1586528116311-ad8dd3c8310d', lbl: 'Warehouse' },
            { img: '1551288049-bebda4e38f71', lbl: 'Analytics' },
            { img: '1562408590-e32931084e23', lbl: 'Inventory' }
          ].map((g, i) => (
            <div key={i} className="gi" style={{ backgroundImage: `url('https://images.unsplash.com/photo-${g.img}?w=500&q=65')` }}><div className="gi-ov"></div><div className="gi-lbl">{g.lbl}</div></div>
          ))}
          {/* Duplicate for infinite scroll loop effect */}
          {[
            { img: '1581091226825-a6a2a5aee158', lbl: 'Production Floor' },
            { img: '1565008447742-97f6f38c985c', lbl: 'Assembly Line' },
            { img: '1504328345606-18bbc8c9d7d1', lbl: 'Quality Control' },
            { img: '1518770660439-4636190af475', lbl: 'Machinery' },
            { img: '1553413077-190dd305871c', lbl: 'Dispatch Bay' },
            { img: '1586528116311-ad8dd3c8310d', lbl: 'Warehouse' },
            { img: '1551288049-bebda4e38f71', lbl: 'Analytics' },
            { img: '1562408590-e32931084e23', lbl: 'Inventory' }
          ].map((g, i) => (
            <div key={`dup-${i}`} className="gi" style={{ backgroundImage: `url('https://images.unsplash.com/photo-${g.img}?w=500&q=65')` }}><div className="gi-ov"></div><div className="gi-lbl">{g.lbl}</div></div>
          ))}
        </div>
      </div>

      <section className="ai-sec" id="ai-sec">
        <div>
          <span className="landing-tag">AI Assistant</span>
          <h2 className="sec-h" style={{ marginBottom: 18 }}>Meet<br /><em>FactoryBot</em></h2>
          <p style={{ fontSize: 14, color: 'var(--mu)', lineHeight: 1.8, fontWeight: 300, maxWidth: 380, marginBottom: 28 }}>Your factory's AI brain. Ask about production, raise machine tickets, check payroll — in English, Hindi or any regional language.</p>
          <ul className="fl" style={{ maxWidth: 360 }}>
            <li>Natural language queries across all modules</li>
            <li>Proactive anomaly alerts & reminders</li>
            <li>Raise tickets & approvals via chat</li>
            <li>Hindi · Tamil · Gujarati · English</li>
          </ul>
        </div>
        <div className="chat-win" id="chat-win">
          <div className="chat-hdr">
            <div className="chat-dot"></div>
            <div className="chat-ht">FactoryBot AI</div>
            <div className="chat-hs">Powered by Claude</div>
          </div>
          <div className="chat-body" id="chat-body" ref={chatBodyRef}>
            {chatMessages.map(msg => (
              <div key={msg.id} className={`msg ${msg.role}`}>
                <div className="av">{msg.role === 'bot' ? 'FB' : 'YOU'}</div>
                <div><div className="bubble" dangerouslySetInnerHTML={{ __html: msg.text }}></div></div>
              </div>
            ))}
          </div>
          <div className="chat-inp">
            <input
              className="chat-field"
              type="text"
              id="cinput"
              placeholder="Ask FactoryBot anything…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMsg() }}
            />
            <button className="chat-send" onClick={sendMsg}>
              <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
        </div>
      </section>

      <section className="cta">
        <p style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--am)', marginBottom: 18, fontWeight: 500 }}>Get Started Today</p>
        <h2 className="cta-t">Run Your Factory<span>Like a Machine</span></h2>
        <p className="cta-p">Join 2,400+ factories across India already using FactoryOS to cut costs, raise output and eliminate manual errors.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="btn-p" style={{ fontSize: 13, padding: '14px 40px' }} onClick={handleGetStarted}>Start Free 30-Day Trial</button>
          <button className="btn-o" style={{ fontSize: 13, padding: '14px 40px' }} onClick={handleGetStarted}>Talk to Sales</button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="ft-brand">
          <div className="landing-logo"><div className="logo-hex" style={{ animation: 'none' }}></div>FactoryOS</div>
          <p>The only platform your factory will ever need. From shop floor to boardroom — unified, intelligent, built for India.</p>
        </div>
        <div className="ft-col">
          <h5>Platform</h5>
          <ul><li><a href="#">Production</a></li><li><a href="#">Payroll</a></li><li><a href="#">Dispatch</a></li><li><a href="#">Vendors</a></li><li><a href="#">FactoryBot AI</a></li></ul>
        </div>
        <div className="ft-col">
          <h5>Company</h5>
          <ul><li><a href="#">About Us</a></li><li><a href="#">Careers</a></li><li><a href="#">Blog</a></li><li><a href="#">Contact</a></li></ul>
        </div>
      </footer>
      <div className="ft-bot">
        <p>© 2025 FactoryOS Technologies Pvt. Ltd. — Made in India</p>
        <p>GST · PF · ESIC · TDS Compliant</p>
      </div>
    </div>
  );
}
