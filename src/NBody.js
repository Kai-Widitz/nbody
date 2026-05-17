import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react'
function App() {
  const G = 6.6743 * Math.pow(10,-11)
  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight;
  const ZOOM = (3.47 * Math.pow(10,8)) / 150;
  const [bodies, setBodies] = useState([])
  const [run, setRun] = useState(true)
  const [reset, setReset] = useState(true)
  const [speed, setSpeed] = useState(10)
  class Body {
    constructor(xs, ys, x, y, mass ,name ,color) {
      this.xs = xs;
      this.ys = ys;
      this.x = x;
      this.y = y;
      this.mass = mass;
      this.name = name;
      this.dx = 0;
      this.dy = 0;
      this.color = color;
    }
  }

  useEffect(() => {
    if (run) {
      if (bodies.length <= 1) return;

      let current = bodies;
      for (let i = 0; i < speed; i++) {
        current = updateBodies(current);
      }
      drawSim(current);
      setBodies(current);
    }
  }, [run, bodies])

  function updateBodies(bodies) {
  const newBodies = bodies.map(b => ({...b}));
  
  for (let i = 0; i < newBodies.length; i++) {
    for (let j = i + 1; j < newBodies.length; j++) {
      updateVel(newBodies[i], newBodies[j]);
    }
  }
  
  for (let body of newBodies) {
    body.xs += body.x;
    body.ys += body.y;
  }
  
  return newBodies;
}

  function updateVel(b1, b2) {
  const dx = b2.xs - b1.xs;
  const dy = b2.ys - b1.ys;
  const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
  const force = (G * b1.mass * b2.mass) / (dist * dist);
  const angle = Math.atan2(dy, dx);
  
  const fx = force * Math.cos(angle);
  const fy = force * Math.sin(angle);
  
  b1.x += fx / b1.mass;
  b1.y += fy / b1.mass;
  b2.x -= fx / b2.mass;
  b2.y -= fy / b2.mass;
}

  function calMag(b1, b2) {
    return (G * b1.mass * b2.mass) / Math.pow((calDis(b1,b2)), 2);
  }

  function calDis(b1,b2) {
    return Math.max(Math.pow((Math.pow((b1.xs - b2.xs), 2) + Math.pow((b1.ys-b2.ys), 2)), 0.5), 1);
  }

  function drawSim(bodies) {
    const frame = [];
    let i = 0;
    const mx = WIDTH / 2
    const my = HEIGHT / 2
    for (let body of bodies) {
      frame.push(
        <div key={i} style={{
          position: 'absolute',
          left: `${mx + body.xs / ZOOM - 10}px`,
          top: `${my + body.ys / ZOOM - 10}px`,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: body.color || '#ffffff',
        }} />
      )
      i += 1
    }
    setSpace(frame)
  }

  useEffect(() => {
    if (reset) {
      const colors = {
        'E': '#4fa3e0',
        'M': '#aaaaaa',
        'T': '#e07f4f',
        'S': '#e0d44f',
      }
      console.log("RESET")
      const bodies = []
      bodies.push(new Body(0, 0, 0, 0, 5.972 * Math.pow(10,25),"E", colors["E"]));
      bodies.push(new Body(3.47 * Math.pow(10,8),0,0,3071.41588, 7.34767309 * Math.pow(10,22),"M", colors["M"]));
      setBodies(bodies);
      setReset(false)
    }
  }, [reset])
  const [space, setSpace] = useState([])
  return (
    <div className="App">
      <header>N-body</header>
      <div id="display" style={{width:'100vw', height:'100vh', position:'relative'}}>
        {space}
      </div>
      <div id="controls">
        <button onClick={() => {setRun(true)}}>
          Start
        </button>
        <button onClick={() => {setRun(false)}}>
          Pause
        </button>
        <button onClick={() => {setReset(true)}}>
          Reset
        </button>
        <input type="range" min="1" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        <span>{speed} steps</span>
      </div>
    </div>
  );
}

export default App;
