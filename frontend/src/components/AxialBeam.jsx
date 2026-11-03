'use client';

import React, { useEffect, useRef } from 'react';

// Vertex shader: Full-screen quad
const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment shader: Official React Bits Pro Axial Beam volumetric light shader
const FRAGMENT_SHADER = `
precision highp float;

#define MAX_COLORS 4
#define MAX_RAYS 16

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uLab[MAX_COLORS];
uniform int uColorCount;
uniform vec3 uBackground;
uniform float uTransparent;
uniform float uInk;
uniform vec2 uOrigin;
uniform vec2 uAxis;
uniform vec2 uHinge;
uniform vec3 uTilt;
uniform float uNear;
uniform float uSpread;
uniform int uRays;
uniform vec4 uRay[MAX_RAYS];
uniform float uReach;
uniform float uHaze;
uniform float uIntensity;
uniform float uGrain;
uniform float uSeed;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0) * mix(1.0, 0.62, uInk);
  vec3 lab = uLab[0];
  if (uColorCount > 1) {
    float scaled = t * float(uColorCount - 1);
    for (int i = 1; i < MAX_COLORS; i++) {
      if (i >= uColorCount) break;
      lab = mix(lab, uLab[i], smoothstep(0.0, 1.0, clamp(scaled - float(i - 1), 0.0, 1.0)));
    }
  }
  return max(oklabToLinear(lab), 0.0);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float t = uTime;
  vec2 point = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 side = vec2(uAxis.y, -uAxis.x);

  float visible = 1.0;
  float near = 1.0;
  if (abs(uTilt.x) > 0.0001) {
    vec2 rel = point - uHinge;
    float x = dot(rel, side);
    float y = dot(rel, uAxis);
    float xc = dot(-uHinge, side);
    float yc = dot(-uHinge, uAxis);
    float den = (y - yc) * uTilt.x + uTilt.z * uTilt.y;
    float k = (uTilt.z * uTilt.y - yc * uTilt.x) / max(den, 0.02);
    visible = smoothstep(0.0, 0.12, den);
    point = uHinge + (xc + k * (x - xc)) * side + ((yc + k * (y - yc)) / uTilt.y) * uAxis;
    near = clamp(1.0 / max(k, 0.05), 0.3, 3.0);
  }

  vec2 d = point - uOrigin;
  float r = length(d);
  float theta = atan(dot(d, side), dot(d, uAxis));
  float past = max(r - uNear, 0.0);
  float blur = 0.02 / max(r, 0.001);

  float rays = 0.0;
  for (int i = 0; i < MAX_RAYS; i++) {
    if (i >= uRays) break;
    vec4 ray = uRay[i];
    float width = sqrt(ray.y * ray.y + blur * blur);
    float offset = theta - ray.x;
    rays += exp(-offset * offset / (width * width)) * (ray.y / width) * ray.z * exp(-past / ray.w);
  }

  float haze = clamp(uHaze, 0.0, 2.0);
  float streaks = 1.0 + 0.22 * gradientNoise(vec2(theta * 18.0 + uSeed * 7.0, t * 0.1));
  float drift = gradientNoise(vec2(theta * 5.0 - uSeed * 3.0, past * 2.6 - t * 0.32));
  float body = 1.0 + 0.2 * min(haze, 1.5) * drift;
  float fanWidth = max(uSpread * 0.8, 0.02);
  float fan = exp(-theta * theta / (fanWidth * fanWidth));
  float fill = fan * exp(-past / max(uReach * 1.35, 0.02));
  float ambient = exp(-past / max(uReach * 3.0, 0.02)) * mix(0.1, 1.0, fan);

  float light = rays * streaks * body * 2.0;
  light += fill * body * 0.4 * haze;
  light += ambient * 0.02 * haze;
  light *= uIntensity * visible * sqrt(near);

  float tone = 1.0 - exp(-light * 0.3);
  vec3 hdr = palette(tone) * light * 1.3;

  vec3 color;
  float alpha = 1.0;
  if (uInk < 0.5) {
    vec3 glow = 1.0 - exp(-hdr);
    if (uTransparent > 0.5) {
      color = glow;
      alpha = clamp(max(glow.r, max(glow.g, glow.b)), 0.0, 1.0);
    } else {
      color = 1.0 - (1.0 - uBackground) * (1.0 - glow);
    }
  } else {
    float amount = max(hdr.r, max(hdr.g, hdr.b));
    float coverage = smoothstep(0.02, 0.95, 1.0 - exp(-amount * 1.4));
    vec3 hue = amount > 0.0001 ? hdr / amount : vec3(1.0);
    float grey = dot(hue, vec3(0.299, 0.587, 0.114));
    vec3 pigment = clamp(mix(vec3(grey), hue, 1.12), 0.0, 1.0) * mix(1.0, 0.8, coverage);
    if (uTransparent > 0.5) {
      color = pigment * coverage;
      alpha = coverage;
    } else {
      color = uBackground * mix(vec3(1.0), pigment, coverage);
    }
  }

  vec4 finalColor = vec4(color, alpha);
  float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  finalColor.rgb += (dither - 0.5) / 255.0;
  if (uGrain > 0.0) {
    float noise = hash21(gl_FragCoord.xy + fract(uTime * 7.13) * 91.7) - 0.5;
    finalColor.rgb += noise * uGrain * 0.05 * alpha;
  }
  gl_FragColor = finalColor;
}
`;

// Helper math routines matching Axial Beam specification
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const degToRad = deg => (deg * Math.PI) / 180;
const smoothstep = (min, max, val) => {
  let r = clamp((val - min) / (max - min), 0, 1);
  return r * r * (3 - 2 * r);
};
const hash11 = e => {
  let t = 43758.5453 * Math.sin(127.1 * e + 311.7);
  return t - Math.floor(t);
};
const noise11 = e => {
  let t = Math.floor(e);
  let a = e - t;
  let r = (2 * hash11(t) - 1) * a;
  return (r + ((2 * hash11(t + 1) - 1) * (a - 1) - r) * (a * a * a * (a * (6 * a - 15) + 10))) * 2;
};

// Check transparent background
const isTransparent = str => {
  if (!str) return false;
  let t = str.trim().toLowerCase();
  return (
    t === 'transparent' ||
    (/^#[0-9a-f]{8}$/.test(t) ? t.endsWith('00') : /^#[0-9a-f]{4}$/.test(t) ? t.endsWith('0') : null !== t.match(/^(?:rgba?|hsla?)\(.*[,/]\s*(0|0?\.0+|0%)\s*\)$/))
  );
};

// Hex to RGB
const hexToRgb = hex => {
  let c = (hex || '#000000').replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let num = parseInt(c.slice(0, 6), 16) || 0;
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
};

// RGB to Oklab
const rgbToOklab = rgb => {
  let r = rgb.r, g = rgb.g, b = rgb.b;
  let l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  let m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  let s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
};

export const AXIAL_PRESETS = {
  lantern: {
    colors: ['#0A194A', '#1D4ED8', '#F28C28', '#FFE4D6'],
    background: '#070D1E',
    originX: 0.5,
    originY: -0.7,
    angle: 0,
    tilt: 22,
    spread: 38,
    rays: 11,
    rayWidth: 1.15,
    reach: 1.25,
    swing: 1,
    flicker: 0.55,
    haze: 1.1,
    intensity: 1.15,
    speed: 0.9,
    cursorBoost: 1.2,
    cursorWidth: 6,
  },
  violet: {
    colors: ['#5227FF', '#B84DFF', '#FF9FFC', '#FFE6FA'],
    background: '#06040d',
    originX: 0.5,
    originY: -0.7,
    angle: 0,
    tilt: 20,
    spread: 34,
    rays: 10,
    rayWidth: 1,
    reach: 1.1,
    swing: 1,
    flicker: 0.6,
    haze: 1,
    intensity: 1,
    speed: 1,
    cursorBoost: 1,
    cursorWidth: 5,
  },
  moonlight: {
    colors: ['#1B3A8C', '#4F7BFF', '#A9C6FF', '#F2F7FF'],
    background: '#03050d',
    originX: 0.5,
    originY: 1.7,
    angle: 180,
    tilt: 15,
    spread: 30,
    rays: 10,
    rayWidth: 1,
    reach: 1.1,
    swing: 0.8,
    flicker: 0.5,
    haze: 1,
    intensity: 1,
    speed: 0.8,
    cursorBoost: 1,
    cursorWidth: 5,
  },
  sunrise: {
    colors: ['#7A1238', '#E0445E', '#FF9A5C', '#FFE7C2'],
    background: '#0d0406',
    originX: 0.5,
    originY: -0.5,
    angle: 0,
    tilt: 25,
    spread: 44,
    rays: 11,
    rayWidth: 1,
    reach: 1.2,
    swing: 0.8,
    flicker: 0.5,
    haze: 1.1,
    intensity: 1,
    speed: 0.8,
    cursorBoost: 1,
    cursorWidth: 5,
  },
  aurora: {
    colors: ['#0B5D63', '#12B5A6', '#6FF2CF', '#E8FFF7'],
    background: '#02080a',
    originX: 0.5,
    originY: -0.7,
    angle: 0,
    tilt: 30,
    spread: 34,
    rays: 10,
    rayWidth: 1.1,
    reach: 1.1,
    swing: 1.2,
    flicker: 0.7,
    haze: 1,
    intensity: 1,
    speed: 1,
    cursorBoost: 1,
    cursorWidth: 5,
  },
};

export default function AxialBeam({
  colors = ['#0A194A', '#1D4ED8', '#F28C28', '#FFE4D6'],
  backgroundColor = '#070D1E',
  blend = 'add',
  originX = 0.5,
  originY = -0.7,
  angle = 0,
  tilt = 22,
  spread = 38,
  rays = 11,
  rayWidth = 1.15,
  reach = 1.25,
  swing = 1,
  flicker = 0.55,
  haze = 1.1,
  intensity = 1.15,
  speed = 0.9,
  interactive = true,
  cursorBoost = 1.2,
  cursorWidth = 6,
  grain = 0.05,
  seed = 0,
  paused = false,
  dpr = 1.5,
  className = '',
  style = {},
  children,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, inside: false });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // WebGL context setup
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    // Compile shader
    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Quad geometry: standard full screen quad
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResLoc = gl.getUniformLocation(program, 'uResolution');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uLabLoc = gl.getUniformLocation(program, 'uLab');
    const uColorCountLoc = gl.getUniformLocation(program, 'uColorCount');
    const uBackgroundLoc = gl.getUniformLocation(program, 'uBackground');
    const uTransparentLoc = gl.getUniformLocation(program, 'uTransparent');
    const uInkLoc = gl.getUniformLocation(program, 'uInk');
    const uOriginLoc = gl.getUniformLocation(program, 'uOrigin');
    const uAxisLoc = gl.getUniformLocation(program, 'uAxis');
    const uHingeLoc = gl.getUniformLocation(program, 'uHinge');
    const uTiltLoc = gl.getUniformLocation(program, 'uTilt');
    const uNearLoc = gl.getUniformLocation(program, 'uNear');
    const uSpreadLoc = gl.getUniformLocation(program, 'uSpread');
    const uRaysLoc = gl.getUniformLocation(program, 'uRays');
    const uRayLoc = gl.getUniformLocation(program, 'uRay');
    const uReachLoc = gl.getUniformLocation(program, 'uReach');
    const uHazeLoc = gl.getUniformLocation(program, 'uHaze');
    const uIntensityLoc = gl.getUniformLocation(program, 'uIntensity');
    const uGrainLoc = gl.getUniformLocation(program, 'uGrain');
    const uSeedLoc = gl.getUniformLocation(program, 'uSeed');

    // Pointer event listeners on window so buttons/children don't block beam interaction
    const handlePointerMove = e => {
      const rect = container.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        pointerRef.current.x = (e.clientX - rect.left) / Math.max(rect.width, 1);
        pointerRef.current.y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
        pointerRef.current.inside = true;
      } else {
        pointerRef.current.inside = false;
      }
    };
    const handlePointerLeave = () => {
      pointerRef.current.inside = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    // Animation state
    let animId = null;
    let lastTime = performance.now();
    let simTime = 12.5;
    const glowArray = new Float32Array(16);
    const rayUniformArray = new Float32Array(64); // 16 rays * 4 floats

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, dpr);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Render loop
    const render = now => {
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
      lastTime = now;

      if (!paused && speed > 0) {
        simTime += dt * speed;
      }

      const rect = container.getBoundingClientRect();
      const aspect = rect.width / Math.max(rect.height, 1);

      // Colors to Oklab
      const activeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#0A194A', '#1D4ED8', '#F28C28', '#FFE4D6'];
      const colorCount = Math.min(activeColors.length, 4);
      const labFlat = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        const hex = activeColors[Math.min(i, colorCount - 1)];
        const oklab = rgbToOklab(hexToRgb(hex));
        labFlat[i * 3 + 0] = oklab[0];
        labFlat[i * 3 + 1] = oklab[1];
        labFlat[i * 3 + 2] = oklab[2];
      }

      // Background
      const isTrans = isTransparent(backgroundColor);
      const bgRgb = hexToRgb(isTrans ? '#000000' : backgroundColor);

      // Geometry and angle transforms
      const angleRad = degToRad(angle);
      const tiltClamped = clamp(tilt, -60, 60);
      const tiltRad = degToRad(tiltClamped);
      const origXNorm = (originX - 0.5) * aspect;
      const origYNorm = originY - 0.5;
      const axisX = Math.sin(angleRad);
      const axisY = Math.cos(angleRad);

      // Box / Hinge intersection
      const halfW = aspect / 2;
      const halfH = 0.5;
      let tmin = 0;
      let tmax = Infinity;
      let hingeX = origXNorm;
      let hingeY = origYNorm;

      const dirs = [axisX, axisY];
      const origs = [origXNorm, origYNorm];
      const bounds = [halfW, halfH];
      let valid = true;

      for (let a = 0; a < 2; a++) {
        if (Math.abs(dirs[a]) < 1e-6) {
          if (origs[a] < -bounds[a] || origs[a] > bounds[a]) {
            valid = false;
            break;
          }
          continue;
        }
        let t1 = (-bounds[a] - origs[a]) / dirs[a];
        let t2 = (bounds[a] - origs[a]) / dirs[a];
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      }

      if (valid && tmin <= tmax) {
        hingeX = origXNorm + axisX * tmin;
        hingeY = origYNorm + axisY * tmin;
      }

      const sinTilt = Math.sin(tiltRad);
      const cosTilt = Math.cos(tiltRad);

      // Interactive mouse beam tracking
      let pointerAngle = 0;
      const p = pointerRef.current;
      if (interactive && p.inside) {
        let px = (p.x - 0.5) * aspect;
        let py = p.y - 0.5;

        if (Math.abs(sinTilt) > 1e-4) {
          const sideX = axisY;
          const sideY = -axisX;
          const u = -axisX;
          const d = px - hingeX;
          const c = py - hingeY;
          const h = d * axisX + c * axisY;
          const f = -hingeX * axisY - hingeY * u;
          const pCoord = -hingeX * axisX - hingeY * axisY;
          const m = Math.max((h - pCoord) * sinTilt + 1.2 * cosTilt, 0.02);
          const v = (1.2 * cosTilt - pCoord * sinTilt) / m;
          const g = f + v * (d * axisY + c * u - f);
          const yC = (pCoord + v * (h - pCoord)) / cosTilt;
          px = hingeX + g * axisY + yC * axisX;
          py = hingeY + g * u + yC * axisY;
        }

        const dx = px - origXNorm;
        const dy = py - origYNorm;
        pointerAngle = Math.atan2(dx * axisY - dy * axisX, dx * axisX + dy * axisY);
      }

      // Compute ray fans
      const spreadRad = degToRad(clamp(spread, 2, 85));
      const raysCount = Math.round(clamp(rays, 1, 16));
      const swingVal = clamp(swing, 0, 3);
      const flickerVal = clamp(flicker, 0, 1);
      const reachVal = clamp(reach, 0.05, 4) / 3;
      const rayWidthVal = clamp(rayWidth, 0.2, 4);
      const cursorWidthRad = degToRad(clamp(cursorWidth, 1, 60));
      const cursorBoostVal = clamp(cursorBoost, 0, 3);

      for (let t = 0; t < raysCount; t++) {
        const a = 7.31 * t + 13 * seed + 1.7;
        const r = hash11(a);
        const i = hash11(a + 0.37);
        const n = hash11(a + 0.71);
        const o = hash11(a + 1.13);

        const baseAngle =
          spreadRad * (raysCount > 1 ? ((t + 0.5 + (r - 0.5) * 0.6) / raysCount) * 2 - 1 : 0) * 0.92 +
          noise11(simTime * (0.07 + 0.05 * i) + 61 * n) * swingVal * spreadRad * 0.1;

        const width = (0.024 + 0.07 * Math.pow(o, 1.3)) * rayWidthVal * (0.85 + 0.15 * noise11(0.05 * simTime + 23 * r));
        const rayInt =
          (0.45 + 0.75 * Math.pow(n, 1.2)) *
          (1 - flickerVal + flickerVal * (0.15 + 0.85 * smoothstep(-0.7, 0.8, noise11(simTime * (0.18 + 0.12 * r) + 97 * i))));

        const diff = baseAngle - pointerAngle;
        const cursorHit = p.inside ? Math.exp(-(diff * diff) / (cursorWidthRad * cursorWidthRad)) : 0;
        const currGlow = glowArray[t];
        const rate = cursorHit > currGlow ? 9 : 2.2;
        glowArray[t] = currGlow + (cursorHit - currGlow) * (1 - Math.exp(-dt * rate));

        const baseIdx = t * 4;
        rayUniformArray[baseIdx + 0] = baseAngle;
        rayUniformArray[baseIdx + 1] = width;
        rayUniformArray[baseIdx + 2] = rayInt * (1 + glowArray[t] * cursorBoostVal * 2.6);
        rayUniformArray[baseIdx + 3] = reachVal * (0.7 + 0.6 * i);
      }

      // Set Uniforms
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, simTime);
      gl.uniform3fv(uLabLoc, labFlat);
      gl.uniform1i(uColorCountLoc, colorCount);
      gl.uniform3f(uBackgroundLoc, bgRgb.r, bgRgb.g, bgRgb.b);
      gl.uniform1f(uTransparentLoc, isTrans ? 1 : 0);
      gl.uniform1f(uInkLoc, blend === 'ink' ? 1 : 0);
      gl.uniform2f(uOriginLoc, origXNorm, origYNorm);
      gl.uniform2f(uAxisLoc, axisX, axisY);
      gl.uniform2f(uHingeLoc, hingeX, hingeY);
      gl.uniform3f(uTiltLoc, sinTilt, cosTilt, 1.2);
      gl.uniform1f(uNearLoc, Math.hypot(hingeX - origXNorm, hingeY - origYNorm));
      gl.uniform1f(uSpreadLoc, spreadRad);
      gl.uniform1i(uRaysLoc, raysCount);
      gl.uniform4fv(uRayLoc, rayUniformArray);
      gl.uniform1f(uReachLoc, reachVal);
      gl.uniform1f(uHazeLoc, clamp(haze, 0, 2));
      gl.uniform1f(uIntensityLoc, clamp(intensity, 0, 4));
      gl.uniform1f(uGrainLoc, clamp(grain, 0, 1));
      gl.uniform1f(uSeedLoc, seed);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
    };
  }, [
    colors,
    backgroundColor,
    blend,
    originX,
    originY,
    angle,
    tilt,
    spread,
    rays,
    rayWidth,
    reach,
    swing,
    flicker,
    haze,
    intensity,
    speed,
    interactive,
    cursorBoost,
    cursorWidth,
    grain,
    seed,
    paused,
    dpr,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        backgroundColor: isTransparent(backgroundColor) ? 'transparent' : backgroundColor,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none block"
      />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
