import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react'
function App() {
  const G = 6.6743 * Math.pow(10,-11)
  const WIDTH = 500;
  const HEIGHT = 500;
  const ZOOM = (3.47 * Math.pow(10,8)) / 150;
  const [bodies, setBodies] = useState([])
  const [run, setRun] = useState(false)
  const [reset, setReset] = useState(true)
  const [speed, setSpeed] = useState(15)
  class Body {
    constructor(xs,ys,x,y,mass,name) {
      this.xs = xs;
      this.ys = ys;
      this.x = x;
      this.y = y;
      this.mass = mass;
      this.name = name;
      this.dx = 0;
      this.dy = 0;
    }
  }

  useEffect(() => {
    console.log(`RUN: ${run}`)
    if (run) {
      if (bodies.length <= 1) {
        return
      }

      drawSim(bodies);
      for (let i = 0; i < speed; i++) {
        setBodies(updateBodies(bodies));
      }
      console.log(bodies)
    }
  }, [run, bodies])

  function updateBodies(bodies) {
    let i = 0;
    const newBodies = [...bodies]
    for (let body of newBodies) {
      i += 1;
      let j = i;
      while (j < newBodies.length) {
        const b1 = body;
        const b2 = newBodies[j];
        const tempx = b1.x;
        const tempy = b1.y;
        const tempx2 = b2.x;
        const tempy2 = b2.y;
        updateVel(b1, b2);
        b1.dx = b1.x - tempx;
        b1.dy = b1.y - tempy;
        b2.dx = b2.x - tempx2;
        b2.dy = b2.y - tempy2;
        b1.xs += b1.x;
        b1.ys += b1.y;
        b2.xs += b2.x;
        b2.ys += b2.y;
        j += 1;
      }
    }
    return newBodies
  }

  function updateVel(b1, b2) {
    const mag = calMag(b1, b2);
    if (b1.xs - b2.xs === 0) {
      if (b1.ys > b2.ys) {
        b2.y += mag / b2.mass;
        b1.y -= mag / b1.mass;
      } else {
        b1.y += mag / b1.mass;
        b2.y -= mag / b2.mass;
      }
    } else {
      const gradient = (b1.ys - b2.ys) / (b1.xs - b2.xs);
      const angle = Math.atan(gradient);
      const ymag = Math.abs(mag * Math.sin(angle));
      const xmag = Math.abs(mag * Math.cos(angle));
      if (b1.xs > b2.xs) {
        b2.x += xmag / b2.mass;
        b1.x -= xmag / b1.mass;
      } else {
        b1.x += xmag / b1.mass;
        b2.x -= xmag / b2.mass;
      }

      if (b1.ys > b2.ys) {
        b2.y += ymag / b2.mass;
        b1.y -= ymag / b1.mass;
      } else {
        b1.y += ymag / b1.mass;
        b2.y -= ymag / b2.mass;
      }
    }
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
        <div className="body" key={i} style={{position: 'absolute', left: `${(mx + body.xs / ZOOM - 5) }px`, top: `${(my + body.ys / ZOOM - 5) }px`}}>
          {body.name}
        </div>
      )
      i += 1
    }
    setSpace(frame)
  }

  useEffect(() => {
    if (reset) {
      console.log("RESET")
      const bodies = []
      bodies.push(new Body(0, 0, 0, 0, 5.972 * Math.pow(10,25),"E"));
      bodies.push(new Body(3.47 * Math.pow(10,8),0,0,1071.41588, 7.34767309 * Math.pow(10,22),"M"));
      bodies.push(new Body(-3.47 * Math.pow(10,8),0,0,971.41588, 7.34767309 * Math.pow(10,22),"T"));
      bodies.push(new Body(3.0 * Math.pow(10,8),0,0, -871.41588, 7.34767309 * Math.pow(10,22),"S"));
      setBodies(bodies);
      setReset(false)
    }
  }, [reset])
  const [space, setSpace] = useState([])
  return (
    <div className="App">
      <header>N-body</header>
      <div id="display" style={{width:`${WIDTH}px`, height:`${HEIGHT}px`}}>
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
      </div>
    </div>
  );
}

export default App;
