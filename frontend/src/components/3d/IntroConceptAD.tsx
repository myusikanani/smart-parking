import { useEffect, useRef, useState } from 'react';

interface IntroConceptADProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

// Total single-play duration of the intro, in ms.
// Matches the timeline used in the approved prototype (scan -> barrier -> LED chase -> logo).
const DURATION = 9000;
const EXIT_FADE = 500; // ms fade-out after the logo holds, before unmount

// Rough "P" pixel mask across the LED strip (same mask used in the approved prototype)
function buildPMask(ledCount: number): boolean[] {
  const mask = new Array(ledCount).fill(false);
  for (let i = 8; i <= 32; i++) if (i <= 12) mask[i] = true; // stem
  for (let i = 12; i <= 24; i++) if (i === 12 || i === 24) mask[i] = true; // bowl sides
  for (let i = 12; i <= 24; i++) if (i === 18) mask[i] = true; // bowl top hint
  for (let i = 8; i <= 12; i++) mask[i] = true;
  return mask;
}

export default function IntroConceptAD({ onComplete, forcePlay = false }: IntroConceptADProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const scanBarRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<{ el: HTMLDivElement; row: number; status: 'go' | 'warn' }[]>([]);
  const ledRefs = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const ROWS = 6;
  const COLS = 4;
  const LED_COUNT = 44;
  const pMask = useRef(buildPMask(LED_COUNT)).current;

  // decide whether to play, same session-storage contract as the previous Intro3D
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('hasSeen3DIntro');
    if (!hasSeen || forcePlay) {
      setIsVisible(true);
    } else {
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcePlay]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    sessionStorage.setItem('hasSeen3DIntro', 'true');
    setIsExiting(true);
    window.setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, EXIT_FADE);
  };

  useEffect(() => {
    if (!isVisible) return;
    startTimeRef.current = performance.now();
    finishedRef.current = false;
    setIsExiting(false);

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / DURATION);

      // --- data-ghost scan sweep: 0.10 -> 0.55 ---
      const scanStart = 0.10;
      const scanEnd = 0.55;
      if (scanBarRef.current) {
        if (t >= scanStart && t <= scanEnd) {
          const p = (t - scanStart) / (scanEnd - scanStart);
          scanBarRef.current.style.opacity = '0.9';
          scanBarRef.current.style.top = `${p * 100}%`;
          const revealRow = p * ROWS;
          slotRefs.current.forEach((s) => {
            s.el.classList.toggle('on', s.row <= revealRow);
          });
        } else if (t > scanEnd) {
          const fade = Math.max(0, 0.9 - (t - scanEnd) * 3);
          scanBarRef.current.style.opacity = String(fade);
          if (t > scanEnd + 0.05) {
            slotRefs.current.forEach((s) => s.el.classList.remove('on'));
          }
        } else {
          scanBarRef.current.style.opacity = '0';
        }
      }

      // --- LED chase: 0.55 -> 0.80, freeze into "P": 0.80 -> 0.92 ---
      if (t >= 0.55 && t < 0.80) {
        const p = (t - 0.55) / 0.25;
        ledRefs.current.forEach((led, i) => {
          const wave = Math.sin((i / LED_COUNT) * Math.PI * 2 - p * Math.PI * 6);
          const on = wave > 0.6;
          led.style.opacity = on ? '0.95' : '0.15';
          led.style.background = on ? 'var(--go)' : '#10b981';
        });
      } else if (t >= 0.80 && t < 0.92) {
        ledRefs.current.forEach((led, i) => {
          const on = pMask[i];
          led.style.opacity = on ? '0.95' : '0.08';
          led.style.background = 'var(--go)';
        });
      } else if (t < 0.55) {
        ledRefs.current.forEach((led) => {
          led.style.opacity = '0.15';
          led.style.background = '#10b981';
        });
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        // hold on the finished logo for a beat, then fade out and hand back to the app
        window.setTimeout(finish, 350);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!isVisible) return null;

  const slots: { row: number; col: number; status: 'go' | 'warn' }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      slots.push({ row: r, col: c, status: Math.random() > 0.35 ? 'go' : 'warn' });
    }
  }

  return (
    <div
      ref={stageRef}
      style={{ opacity: isExiting ? 0 : 1, transition: `opacity ${EXIT_FADE}ms ease` }}
      className="intro-ad-stage"
    >
      <style>{css}</style>

      <button
        onClick={finish}
        className="intro-ad-skip"
      >
        Skip Intro ➔
      </button>

      <div id="floor" />

      <div id="slotLayer">
        {slots.map((s, i) => (
          <div
            key={i}
            className="slot"
            ref={(el) => {
              if (el) slotRefs.current[i] = { el, row: s.row, status: s.status };
            }}
            style={{
              left: `${s.col * (100 / COLS)}%`,
              top: `${s.row * (100 / ROWS)}%`,
              width: `${90 / COLS}%`,
              height: `${90 / ROWS}%`,
            }}
          >
            <div
              className="dot"
              style={{ background: s.status === 'go' ? 'var(--go)' : 'var(--warn)' }}
            />
          </div>
        ))}
      </div>

      <div id="scanBar" ref={scanBarRef} />

      <div id="barrierRig">
        <div className="post left" />
        <div className="post right" />
        <div id="canopy" />
        <div id="ledStrip">
          {Array.from({ length: LED_COUNT }).map((_, i) => (
            <div
              key={i}
              className="led"
              ref={(el) => {
                if (el) ledRefs.current[i] = el;
              }}
            />
          ))}
        </div>
        <div id="arm" className={isExiting ? '' : 'play'} />
      </div>

      <div id="car" className={isExiting ? '' : 'play'}>
        <div className="cabin" />
        <div className="windshield" />
        <div className="body" />
        <div className="accent-line" />
        <div className="arch al" />
        <div className="arch ar" />
        <div className="wheel wl" />
        <div className="wheel wr" />
        <div className="exhaust el" />
        <div className="exhaust er" />
        <div className="light l" />
        <div className="light r" />
      </div>

      <div id="logo-overlay" className={isExiting ? '' : 'play'}>
        <div className="mark">
          PARK<span>SMART</span>
          <div className="scan" />
        </div>
        <div className="underline" />
        <div className="tag">SMART PARKING. SMARTER CITY.</div>
      </div>
    </div>
  );
}

const css = `
  .intro-ad-stage{
    --bg:#070b14; --panel:#0a0e14; --line:#1e2733;
    --go:#39ff88; --warn:#ff3b3b; --cyan:#4dd8ff; --amber:#f59e0b; --ink:#e8edf2; --dim:#7d8a9a;
    position:fixed; inset:0; z-index:9999; overflow:hidden;
    background: radial-gradient(ellipse at center 40%, #0d1420 0%, #070b14 75%);
    font-family:'JetBrains Mono', monospace;
  }
  .intro-ad-skip{
    position:absolute; top:20px; right:20px; z-index:40;
    background:rgba(10,14,20,0.7); color:var(--dim);
    border:1px solid rgba(77,216,255,0.3); padding:8px 16px; border-radius:6px;
    font-family:inherit; font-size:11px; letter-spacing:1px; cursor:pointer; text-transform:uppercase;
  }
  .intro-ad-skip:hover{ color:var(--cyan); border-color:var(--cyan); }

  .intro-ad-stage #floor{
    position:absolute; left:50%; bottom:-10%; width:220%; height:140%;
    transform: translateX(-50%) rotateX(72deg); transform-origin: 50% 0%;
    background:
      repeating-linear-gradient(90deg, rgba(30,39,52,0.9) 0 2px, transparent 2px 90px),
      repeating-linear-gradient(0deg, rgba(30,39,52,0.6) 0 2px, transparent 2px 60px),
      #090d16;
    animation: adFloorDrift ${DURATION}ms linear forwards;
  }
  @keyframes adFloorDrift{ 0%{ background-position-y:0px; } 100%{ background-position-y:2400px; } }

  .intro-ad-stage #slotLayer{
    position:absolute; left:50%; bottom:6%; width:70%; height:80%;
    transform: translateX(-50%) rotateX(72deg); transform-origin: 50% 100%;
  }
  .intro-ad-stage .slot{ position:absolute; border:1px solid #2a3644; border-radius:4px; }
  .intro-ad-stage .slot .dot{ position:absolute; inset:9px; border-radius:3px; opacity:0; transition:opacity .25s ease; }
  .intro-ad-stage .slot.on .dot{ opacity:0.9; }

  .intro-ad-stage #scanBar{
    position:absolute; left:0; right:0; height:10px; top:0;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    box-shadow:0 0 30px 4px var(--cyan); opacity:0;
  }

  .intro-ad-stage #barrierRig{ position:absolute; left:50%; bottom:18%; transform:translateX(-50%); width:min(420px, 92vw); z-index:10; }
  .intro-ad-stage .post{ position:absolute; bottom:0; width:14px; height:130px; background:#0284c7; border-radius:2px; }
  .intro-ad-stage .post.left{ left:60px; } .intro-ad-stage .post.right{ right:60px; }
  .intro-ad-stage #arm{
    position:absolute; left:74px; bottom:104px; width:270px; height:8px;
    background: repeating-linear-gradient(90deg, var(--warn) 0 28px, #fff 28px 36px);
    transform-origin: left center; transform: rotate(0deg); border-radius:3px;
  }
  .intro-ad-stage #arm.play{ animation: adArmOpen ${DURATION}ms linear forwards; }
  @keyframes adArmOpen{ 0%,58%{ transform:rotate(0deg); } 76%,100%{ transform:rotate(-72deg); } }
  .intro-ad-stage #canopy{ position:absolute; left:50%; bottom:118px; transform:translateX(-50%); width:min(400px, 88vw); height:26px; background:#0f172a; border-radius:4px; }
  .intro-ad-stage #ledStrip{ position:absolute; left:50%; bottom:126px; transform:translateX(-50%); width:min(380px, 84vw); height:10px; display:flex; gap:3px; }
  .intro-ad-stage .led{ flex:1; height:100%; background:#10b981; opacity:0.15; border-radius:1px; }

  .intro-ad-stage #car{ position:absolute; left:50%; bottom:8%; transform:translate(-50%,0) scale(1.05); width:100px; height:34px; z-index:9; }
  .intro-ad-stage #car.play{ animation: adCarDrive ${DURATION}ms linear forwards; }
  .intro-ad-stage #car .body{
    position:absolute; inset:0 0 6px 0;
    background: linear-gradient(180deg, #c3d1c8 0%, #a9bab0 45%, #8a9c92 75%, #71827a 100%);
    border-radius:14px 14px 4px 4px; border:1px solid #5f6f68;
    box-shadow: 0 0 10px rgba(200,220,210,0.2), 0 4px 14px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,255,255,0.5);
  }
  .intro-ad-stage #car .accent-line{
    position:absolute; left:5px; right:8px; top:16px; height:2px;
    background: linear-gradient(90deg, rgba(220,225,220,0) 0%, rgba(220,225,220,0.8) 15%, rgba(220,225,220,0.8) 85%, rgba(220,225,220,0) 100%);
    box-shadow: 0 0 3px rgba(255,255,255,0.4); z-index:2;
  }
  .intro-ad-stage #car .cabin{
    position:absolute; left:25px; right:22px; top:-14px; height:18px;
    background: linear-gradient(180deg, #9fb0a6, #6f8078);
    border-radius:9px 6px 0 0; border:1px solid #5f6f68; border-bottom:none;
    box-shadow: inset 0 1px 3px rgba(255,255,255,0.25);
  }
  .intro-ad-stage #car .windshield{
    position:absolute; left:28px; right:25px; top:-11px; height:10px;
    background: linear-gradient(160deg, rgba(90,105,98,0.85), rgba(40,50,46,0.95));
    border-radius:6px 4px 0 0;
  }
  .intro-ad-stage #car .light{
    position:absolute; top:19px; width:26px; height:6px; border-radius:3px; z-index:2;
    background: linear-gradient(90deg, rgba(239,68,68,0.2), #ef4444 30%, #ff5c5c 50%, #ef4444 70%, rgba(239,68,68,0.2));
    box-shadow: 0 0 8px rgba(239,68,68,0.7);
  }
  .intro-ad-stage #car .light.l{ left:3px; } .intro-ad-stage #car .light.r{ right:3px; }
  .intro-ad-stage #car .arch{ position:absolute; bottom:-2px; width:18px; height:12px; background: radial-gradient(ellipse at center, rgba(10,10,10,0.55), rgba(10,10,10,0) 70%); z-index:0; }
  .intro-ad-stage #car .arch.al{ left:5px; } .intro-ad-stage #car .arch.ar{ right:5px; }
  .intro-ad-stage #car .wheel{
    position:absolute; bottom:-7px; width:15px; height:15px; border-radius:50%;
    background: radial-gradient(circle at 35% 35%, #3a3a3a, #0a0a0a 70%); border:2px solid #050505; z-index:1;
  }
  .intro-ad-stage #car .wheel::after{ content:''; position:absolute; inset:4px; border-radius:50%; background: radial-gradient(circle at 35% 35%, #8a8f96, #4a4e54 80%); }
  .intro-ad-stage #car .wheel.wl{ left:12px; } .intro-ad-stage #car .wheel.wr{ right:12px; }
  .intro-ad-stage #car .exhaust{ position:absolute; bottom:-4px; width:10px; height:10px; border-radius:50%; background: radial-gradient(circle at 35% 35%, #6a6a6a, #0a0a0a 75%); border:1px solid #2a2a2a; z-index:1; }
  .intro-ad-stage #car .exhaust.el{ left:34px; } .intro-ad-stage #car .exhaust.er{ right:34px; }
  @keyframes adCarDrive{
    0%,58%{ transform:translate(-50%,0) scale(1.05); opacity:1; }
    76%{ transform:translate(-50%,-40px) scale(0.65); opacity:1; }
    92%,100%{ transform:translate(-50%,-160px) scale(0.18); opacity:0; }
  }

  .intro-ad-stage #logo-overlay{
    position:absolute; inset:0; z-index:50; pointer-events:none;
    display:flex; align-items:center; justify-content:center; flex-direction:column;
    background:#070b14; opacity:0;
  }
  .intro-ad-stage #logo-overlay.play{ animation: adLogoBackdrop ${DURATION}ms linear forwards; }
  .intro-ad-stage #logo-overlay .mark{
    font-family:'Archivo Black', sans-serif; font-size:56px; color:var(--ink); letter-spacing:1px;
    text-shadow:0 0 30px rgba(57,255,136,0.5); position:relative; opacity:0;
  }
  .intro-ad-stage #logo-overlay.play .mark{ animation: adLogoGlitch ${DURATION}ms linear forwards; }
  .intro-ad-stage #logo-overlay .mark span{ color:var(--go); }
  .intro-ad-stage #logo-overlay .scan{
    position:absolute; left:0; right:0; height:3px; background:var(--cyan);
    box-shadow:0 0 10px var(--cyan); top:-10%; opacity:0;
  }
  .intro-ad-stage #logo-overlay.play .scan{ animation: adLogoScan ${DURATION}ms linear forwards; }
  .intro-ad-stage #logo-overlay .underline{
    height:3px; width:0px; margin-top:10px; border-radius:2px;
    background:linear-gradient(90deg,var(--cyan),var(--go));
    box-shadow:0 0 8px rgba(57,255,136,0.6);
  }
  .intro-ad-stage #logo-overlay.play .underline{ animation: adLogoUnderline ${DURATION}ms linear forwards; }
  .intro-ad-stage #logo-overlay .tag{
    margin-top:8px; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:5px; color:var(--dim); opacity:0;
  }
  .intro-ad-stage #logo-overlay.play .tag{ animation: adLogoTagFade ${DURATION}ms linear forwards; }

  @keyframes adLogoBackdrop{ 0%,83%{ opacity:0; } 88%,100%{ opacity:1; } }
  @keyframes adLogoGlitch{
    0%,83%{ opacity:0; transform:translateX(-6px); filter:blur(4px); }
    84%{ opacity:0.5; transform:translateX(5px); filter:blur(2px); }
    85%{ opacity:0.3; transform:translateX(-4px); filter:blur(3px); }
    86%{ opacity:0.8; transform:translateX(3px); filter:blur(1px); }
    87%{ opacity:0.5; transform:translateX(-2px); filter:blur(2px); }
    89%,100%{ opacity:1; transform:translateX(0); filter:blur(0); }
  }
  @keyframes adLogoScan{
    0%,82%{ top:-10%; opacity:0; }
    83%{ opacity:1; top:-10%; }
    89%{ top:110%; opacity:1; }
    90%,100%{ opacity:0; top:110%; }
  }
  @keyframes adLogoUnderline{ 0%,89%{ width:0px; } 93%,100%{ width:260px; } }
  @keyframes adLogoTagFade{ 0%,92%{ opacity:0; } 96%,100%{ opacity:1; } }
`;
