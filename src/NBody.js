import './App.css';
import { useState, useEffect, useRef } from 'react'
class Body {
  constructor(xs, ys, x, y, mass, name, color) {
    this.xs = xs;
    this.ys = ys;
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.name = name;
    this.color = color;
    this.trail = [];
  }
}
function App() {
  const EARTH_MASS = 5.972e25;
  const G = 6.6743 * Math.pow(10,-11)
  const displayRef = useRef(null);
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });
  const WIDTH = dims.width;
  const HEIGHT = dims.height;
  const BASE_ZOOM = (3.47 * Math.pow(10,8)) / 150;
  const [zoomLevel, setZoomLevel] = useState(1);
  const ZOOM = BASE_ZOOM / zoomLevel;
  const [bodies, setBodies] = useState([])
  const [run, setRun] = useState(true)
  const [reset, setReset] = useState(true)
  const [speed, setSpeed] = useState(100)
  const canvasRef = useRef(null);
  const starsRef = useRef(null);
  const stepRef = useRef(0);
  const [showHint, setShowHint] = useState(true);
  const [flashes, setFlashes] = useState([]);
  const [space, setSpace] = useState([])

  function drawStars(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 400; s++) {
      const x = (Math.sin(s * 127.1) * 0.5 + 0.5) * canvas.width;
      const y = (Math.sin(s * 311.7) * 0.5 + 0.5) * canvas.height;
      const r = (Math.sin(s * 74.3) * 0.5 + 0.5) * 1.2;
      ctx.globalAlpha = (Math.sin(s * 53.1) * 0.5 + 0.5) * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = starsRef.current;
    if (!canvas) return;
    drawStars(canvas);

    let timeout;
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      clearTimeout(timeout);
      timeout = setTimeout(() => drawStars(canvas), 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const update = () => {
      if (displayRef.current) {
        setDims({
          width: displayRef.current.clientWidth,
          height: displayRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (run) {
      if (bodies.length <= 1) return;

      let current = bodies;
      for (let i = 0; i < speed; i++) {
        stepRef.current += 1;
        current = updateBodies(current, stepRef.current);
      }

      const result = handleCollisions(current, ZOOM);
      current = result.bodies;
      if (result.collisions.length > 0) {
        const init = current.find(b => b.name === "INIT");
        const mx = WIDTH / 2 - (init ? init.xs : 0) / ZOOM;
        const my = HEIGHT / 2 - (init ? init.ys : 0) / ZOOM;
        setFlashes(f => [
          ...f,
          ...result.collisions.map(c => ({
            x: mx + c.x / ZOOM,
            y: my + c.y / ZOOM,
            id: c.id
          }))
        ]);
        setTimeout(() => setFlashes(f => f.filter(fl => !result.collisions.find(c => c.id === fl.id))), 400);
      }

      drawSim(current, canvasRef);
      setBodies(current);
    }
  }, [run, bodies])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = WIDTH;
      canvasRef.current.height = HEIGHT;
    }
  }, [WIDTH, HEIGHT]);

  function updateBodies(bodies, step) {
    const newBodies = bodies.map(b => ({...b, trail: [...b.trail]}));

    for (let i = 0; i < newBodies.length; i++) {
      for (let j = i + 1; j < newBodies.length; j++) {
        updateVel(newBodies[i], newBodies[j]);
      }
    }

    for (let body of newBodies) {
      body.xs += body.x;
      body.ys += body.y;
      if (step % 10 === 0) {
        body.trail.push({x: body.xs, y: body.ys});
        if (body.trail.length > 800) body.trail.shift();
      }
    }

    return newBodies;
  }

  function updateVel(b1, b2) {
    const dx = b2.xs - b1.xs;
    const dy = b2.ys - b1.ys;
    const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1e6);
    const force = (G * b1.mass * b2.mass) / (dist * dist);
    const angle = Math.atan2(dy, dx);

    const fx = force * Math.cos(angle);
    const fy = force * Math.sin(angle);

    b1.x += fx / b1.mass;
    b1.y += fy / b1.mass;
    b2.x -= fx / b2.mass;
    b2.y -= fy / b2.mass;
  }

  function drawSim(bodies, canvasRef) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const init = bodies.find(b => b.name === "INIT");
    const mx = WIDTH / 2 - (init ? init.xs : 0) / ZOOM;
    const my = HEIGHT / 2 - (init ? init.ys : 0) / ZOOM;
    const frame = [];
    let i = 0;

    for (let body of bodies) {
      let size = Math.pow(body.mass / EARTH_MASS, 0.1) * 30;
      if (body.name === "INIT") size *= 2;
      body.trail.forEach((pos, idx) => {
        const opacity = idx / body.trail.length;
        const trailSize = Math.max(2, 8 * opacity) / 2;
        ctx.beginPath();
        ctx.arc(mx + pos.x / ZOOM, my + pos.y / ZOOM, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = body.color + Math.floor(opacity * 150).toString(16).padStart(2, '0');
        ctx.fill();
      });

      frame.push(
        <div key={i} style={{
          position: 'absolute',
          left: `${mx + body.xs / ZOOM - size/2}px`,
          top: `${my + body.ys / ZOOM - size/2}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: body.color || '#ffffff',
          boxShadow: `0 0 3px 1px ${body.color}99, 0 0 10px 3px ${body.color}55, 0 0 30px 8px ${body.color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.5}px`,
          fontFamily: "'Century Gothic', 'Futura', sans-serif",
          fontWeight: 'bold',
          color: '#ffffff',
          cursor: body.name === "INIT" ? 'pointer' : 'default',
        }}
        onClick={body.name === "INIT" ? (e) => { e.stopPropagation(); window.open('https://www.linkedin.com/in/kai-widitz/', '_blank'); } : undefined}
        >
          {body.name === "INIT" ? "in" : ""}
        </div>
      );
      i += 1;
    }
    setSpace(frame);
  }

  function randomColor() {
    const colors = [
      '#e07f4f', '#e0d44f', '#4fe0a3',
      '#e04f7f', '#4fe0e0', '#e0e04f',
      '#ff6b6b', '#6bffb8', '#ffb86b',
      '#ff4fd8', '#ff4f4f', '#c8ff4f', '#4fff91', '#ff9f4f'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function handleDisplayClick(e) {
    setShowHint(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const init = bodies.find(b => b.name === "INIT");
    const mx = WIDTH / 2 - (init ? init.xs : 0) / ZOOM;
    const my = HEIGHT / 2 - (init ? init.ys : 0) / ZOOM;

    const xs = (e.clientX - rect.left - mx) * ZOOM;
    const ys = (e.clientY - rect.top - my) * ZOOM;

    const mass = Math.pow(10, 21 + Math.random() * 5);

    const initXs = init ? init.xs : 0;
    const initYs = init ? init.ys : 0;
    const initMass = init ? init.mass : 5.972e26;
    const dx = xs - initXs;
    const dy = ys - initYs;
    const dist = Math.sqrt(dx*dx + dy*dy);

    const orbitalSpd = Math.sqrt(G * initMass / dist);

    const toInit = Math.atan2(dy, dx);
    const angleOffset = (Math.random() - 0.5) * 0.5;

    const retrograde = Math.random() < 0.3 ? -1 : 1;
    const eccentricity = 0.5 + Math.random() * 1.5;
    const angle = toInit + Math.PI / 2 + angleOffset;
    const vx = Math.cos(angle) * orbitalSpd * eccentricity * retrograde + (init ? init.x : 0);
    const vy = Math.sin(angle) * orbitalSpd * eccentricity * retrograde + (init ? init.y : 0);

    const newBody = new Body(xs, ys, vx, vy, mass, `B${bodies.length}`, randomColor());
    setBodies(b => {
      const updated = [...b, newBody];
      if (updated.length > 20) {
        const oldestNonInit = updated.findIndex(b => b.name !== "INIT");
        if (oldestNonInit !== -1) updated.splice(oldestNonInit, 1);
      }
      return updated;
    });
  }

  function handleCollisions(bodies, ZOOM) {
    const toRemove = new Set();
    const collisions = [];
    const newBodies = bodies.map(b => ({...b, trail: [...b.trail]}));

    for (let i = 0; i < newBodies.length; i++) {
      for (let j = i + 1; j < newBodies.length; j++) {
        if (toRemove.has(i) || toRemove.has(j)) continue;
        const b1 = newBodies[i];
        const b2 = newBodies[j];
        const dx = b1.xs - b2.xs;
        const dy = b1.ys - b2.ys;
        const dist = Math.sqrt(dx*dx + dy*dy);

        const size1 = Math.pow(b1.mass / EARTH_MASS, 0.1) * 30 * (b1.name === "INIT" ? 2 : 1);
        const size2 = Math.pow(b2.mass / EARTH_MASS, 0.1) * 30 * (b2.name === "INIT" ? 2 : 1);
        const collisionDist = (size1 / 2 + size2 / 2) * ZOOM;

        if (dist < collisionDist) {
          const bigger = b1.mass >= b2.mass ? i : j;
          const smaller = b1.mass >= b2.mass ? j : i;
          newBodies[bigger].mass += newBodies[smaller].mass;
          newBodies[bigger].color = mixColors(newBodies[bigger].color, newBodies[smaller].color);
          collisions.push({x: newBodies[bigger].xs, y: newBodies[bigger].ys, id: Date.now() + Math.random()});
          toRemove.add(smaller);
        }
      }
    }
    return { bodies: newBodies.filter((_, idx) => !toRemove.has(idx)), collisions };
  }

  function mixColors(c1, c2) {
    const r1 = parseInt(c1.slice(1,3), 16);
    const g1 = parseInt(c1.slice(3,5), 16);
    const b1 = parseInt(c1.slice(5,7), 16);
    const r2 = parseInt(c2.slice(1,3), 16);
    const g2 = parseInt(c2.slice(3,5), 16);
    const b2 = parseInt(c2.slice(5,7), 16);
    const r = Math.round((r1 + r2) / 2).toString(16).padStart(2, '0');
    const g = Math.round((g1 + g2) / 2).toString(16).padStart(2, '0');
    const b = Math.round((b1 + b2) / 2).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (reset) {
      const colors = {
        'E': '#4fa3e0',
        'M': '#aaaaaa',
        'T': '#e07f4f',
        'INIT': '#0A66C2',
      }
      const bodies = []
      bodies.push(new Body(0, 0, 0, 0, 5.972 * Math.pow(10,26), "INIT", colors["INIT"]));
      bodies.push(new Body(9e8, 0, 0, 5071.41588, 7.34767309 * Math.pow(10,24), "E", colors["E"]));
      bodies.push(new Body(1e9, 0, 0, 6900, 7.34767309 * Math.pow(10,22), "M", colors["M"]));
      bodies.push(new Body(-2e8, 0, 0, 1.3e4, 7.34e10, "T", colors["T"]));
      setBodies(bodies);
      setSpeed(100);
      setZoomLevel(1);
      stepRef.current = 0;
      setReset(false)
    }
  }, [reset])

  return (
    <div className="App">
      <div id="display" ref={displayRef} onClick={handleDisplayClick} style={{width:'100vw', height:'100vh', position:'relative', backgroundColor:'#111115'}}>
        {showHint && <div className="hint">click to add planets</div>}
        <canvas ref={starsRef} width={WIDTH} height={HEIGHT} style={{position:'absolute', top:0, left:0, zIndex:0}} />
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{position:'absolute', top:0, left:0, zIndex:1}} />
        <div style={{position:'absolute', top:0, left:0, zIndex:2}}>
          {space}
        </div>
        {flashes.map(f => (
          <div key={f.id} className="flash" style={{
            position: 'absolute',
            left: `${f.x}px`,
            top: `${f.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 3,
          }} />
        ))}
      </div>
      <div id="controls">
        <button className={run ? 'pause' : 'play'} onClick={() => setRun(r => !r)}>
          {run ? '⏸' : '▶'}
        </button>
        <div style={{display:"flex", flexDirection: "column", alignItems: "center"}}> 
          <span>Zoom: {zoomLevel.toFixed(1)}x</span>
          <input type="range" min="0.1" max="5" step="0.1" value={zoomLevel} onChange={e => setZoomLevel(Number(e.target.value))} />
        </div>
        <div style={{display:"flex", flexDirection: "column", alignItems: "center"}}> 
          <span>Speed: {speed}</span>
          <input type="range" min="1" max="300" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        </div>
        <button className="reset" onClick={() => setReset(true)}>⏹</button>
      </div>
    </div>
  );
}

export default App;