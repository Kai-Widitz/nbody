import './App.css';
import { useState, useEffect, useRef } from 'react'

function App() {
  const G = 6.6743 * Math.pow(10,-11)
  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight;
  const ZOOM = (3.47 * Math.pow(10,8)) / 150;
  const [bodies, setBodies] = useState([])
  const [run, setRun] = useState(true)
  const [reset, setReset] = useState(true)
  const [speed, setSpeed] = useState(50)
  const canvasRef = useRef(null);
  const starsRef = useRef(null);
  const stepRef = useRef(0);

  useEffect(() => {
    const canvas = starsRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 400; s++) {
      const x = (Math.sin(s * 127.1) * 0.5 + 0.5) * WIDTH;
      const y = (Math.sin(s * 311.7) * 0.5 + 0.5) * HEIGHT;
      const r = (Math.sin(s * 74.3) * 0.5 + 0.5) * 1.2;
      ctx.globalAlpha = (Math.sin(s * 53.1) * 0.5 + 0.5) * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  class Body {
    constructor(xs, ys, x, y, mass, name, color) {
      this.xs = xs;
      this.ys = ys;
      this.x = x;
      this.y = y;
      this.mass = mass;
      this.name = name;
      this.dx = 0;
      this.dy = 0;
      this.color = color;
      this.trail = [];
    }
  }

  useEffect(() => {
    if (run) {
      if (bodies.length <= 1) return;

      let current = bodies;
      for (let i = 0; i < speed; i++) {
        stepRef.current += 1;
        current = updateBodies(current, stepRef.current);
      }

      drawSim(current, canvasRef);
      setBodies(current);
    }
  }, [run, bodies])

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
        if (body.trail.length > 300) body.trail.shift();
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
    const com = getCentreOfMass(bodies);
    const mx = WIDTH / 2 - com.x / ZOOM;
    const my = HEIGHT / 2 - com.y / ZOOM;
    const frame = [];
    let i = 0;

    for (let body of bodies) {
      const EARTH_MASS = 5.972e25;
      const size = Math.pow(body.mass / EARTH_MASS, 0.1) * 30;

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
        }} />
      );
      i += 1;
    }
    setSpace(frame);
  }

  function getCentreOfMass(bodies) {
    let totalMass = 0;
    let cx = 0, cy = 0;
    for (let body of bodies) {
      cx += body.xs * body.mass;
      cy += body.ys * body.mass;
      totalMass += body.mass;
    }
    return {x: cx / totalMass, y: cy / totalMass};
  }

  useEffect(() => {
    if (reset) {
      const colors = {
        'E': '#4fa3e0',
        'M': '#aaaaaa',
        'T': '#e07f4f',
        'S': '#e0d44f',
      }
      const bodies = []
      bodies.push(new Body(0, 0, 0, 0, 5.972 * Math.pow(10,26), "S", colors["S"]));
      bodies.push(new Body(9e8, 0, 0, 5071.41588, 7.34767309 * Math.pow(10,24), "E", colors["E"]));
      bodies.push(new Body(1e9, 0, 0, 5200, 7.34767309 * Math.pow(10,22), "M", colors["M"]));
      bodies.push(new Body(-3e8, 0, 0, 8200, 7.34e10, "T", colors["T"]));
      setBodies(bodies);
      setReset(false)
    }
  }, [reset])

  const [space, setSpace] = useState([])

  return (
    <div className="App">
      <div id="display" style={{width:'100vw', height:'100vh', position:'relative', backgroundColor:'#111115'}}>
        <canvas ref={starsRef} width={WIDTH} height={HEIGHT} style={{position:'absolute', top:0, left:0, zIndex:0}} />
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{position:'absolute', top:0, left:0, zIndex:1}} />
        <div style={{position:'absolute', top:0, left:0, zIndex:2}}>
          {space}
        </div>
      </div>
      <div id="controls">
        <button className={run ? 'pause' : 'play'} onClick={() => setRun(r => !r)}>
          {run ? '⏸' : '▶'}
        </button>
        <div style={{display:"flex", flexDirection: "column", alignItems: "center"}}> 
          <span>Speed: {speed}</span>
          <input type="range" min="1" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        </div>
        <button className="reset" onClick={() => setReset(true)}>⏹</button>
      </div>
    </div>
  );
}

export default App;