import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// A first-party renderer of our FitSwap composition authored in Spline.
// It does not load, modify, or hide any Spline export or watermark.
export function createJourneyScene(canvas, { onReady, onPhase, onError }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
  const textures = new Set();
  const materials = new Set();
  const geometries = new Set();
  let environmentTarget;
  let disposed = false;
  let moving = false;
  let elapsed = 0;
  let previous = 0;
  let lastFrame = 0;
  let lastPhase = -1;
  let observer;

  function material(color, metalness = 0.2, roughness = 0.35) {
    const result = new THREE.MeshPhysicalMaterial({
      color,
      metalness,
      roughness,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
    });
    materials.add(result);
    return result;
  }
  function mesh(geometry, surface, parent = scene, position = [0, 0, 0]) {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, surface);
    result.position.set(...position);
    parent.add(result);
    return result;
  }
  function roundedBox(width, height, depth, radius, surface, parent, position) {
    const s = new THREE.Shape();
    const x = -width / 2,
      y = -height / 2,
      r = radius;
    s.moveTo(x + r, y);
    s.lineTo(x + width - r, y);
    s.quadraticCurveTo(x + width, y, x + width, y + r);
    s.lineTo(x + width, y + height - r);
    s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    s.lineTo(x + r, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const geometry = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSize: Math.min(2, depth / 4),
      bevelThickness: Math.min(2, depth / 4),
      bevelSegments: 3,
      steps: 1,
      curveSegments: 8,
    });
    geometry.translate(0, 0, -depth / 2);
    return mesh(geometry, surface, parent, position);
  }
  function artwork(
    width,
    height,
    draw,
    worldWidth,
    worldHeight,
    parent,
    position,
  ) {
    const image = document.createElement("canvas");
    image.width = width;
    image.height = height;
    const ctx = image.getContext("2d");
    if (!ctx) throw new Error("Canvas text is unavailable");
    draw(ctx);
    const texture = new THREE.CanvasTexture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    textures.add(texture);
    const surface = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
    });
    materials.add(surface);
    return mesh(
      new THREE.PlaneGeometry(worldWidth, worldHeight),
      surface,
      parent,
      position,
    );
  }
  function label(text, width, parent, position, color = "#d4c9e9") {
    return artwork(
      1024,
      128,
      (ctx) => {
        ctx.fillStyle = color;
        ctx.font = "600 43px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 512, 64);
      },
      width,
      30,
      parent,
      position,
    );
  }
  function group(name, position) {
    const result = new THREE.Group();
    result.name = name;
    result.position.set(...position);
    scene.add(result);
    return result;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("webglcontextlost", contextLost);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    environmentTarget?.dispose();
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
  }
  function contextLost(event) {
    event.preventDefault();
    onError?.();
  }

  let pass, wallet, checkpoint, dumbbell, signals;
  function resize() {
    if (disposed) return;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const visibleHeight = Math.max(600, 1080 / camera.aspect);
    const distance =
      visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const angle = THREE.MathUtils.degToRad(13);
    camera.position.set(
      0,
      215 + distance * Math.sin(angle),
      distance * Math.cos(angle),
    );
    camera.lookAt(0, 215, 0);
    camera.updateProjectionMatrix();
    if (pass) {
      pose(elapsed);
      renderer.render(scene, camera);
    }
  }
  const ease = (p) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, p)))) / 2;
  function pose(t) {
    const u = t % 16;
    let x = -215,
      y = 246,
      z = 110;
    if (u >= 2.5 && u < 5.5) {
      const p = ease((u - 2.5) / 3);
      x += 215 * p;
      y += 32 * Math.sin(p * Math.PI);
    } else if (u >= 5.5 && u < 7.5) x = 0;
    else if (u >= 7.5 && u < 10.5) {
      const p = ease((u - 7.5) / 3);
      x = 215 * p;
      y += 25 * Math.sin(p * Math.PI);
    } else if (u >= 10.5 && u < 12.5) x = 215;
    else if (u >= 12.5) {
      const p = ease((u - 12.5) / 3.5);
      x = 215 - 430 * p;
      y += 45 * Math.sin(p * Math.PI);
      z -= 80 * Math.sin(p * Math.PI);
    }
    pass.position.set(x, y + Math.sin(t * 1.2) * 4, z);
    pass.rotation.set(
      0,
      THREE.MathUtils.degToRad(-10 + Math.sin(t * 0.6) * 12),
      THREE.MathUtils.degToRad(-5 + Math.sin(t * 0.8) * 3),
    );
    wallet.position.y = 85 + Math.sin(t * 1.1) * 3;
    wallet.rotation.set(0, 0.2, 0.14 + Math.sin(t * 0.65) * 0.035);
    dumbbell.position.y = 104 + Math.sin(t * 0.95 + 2) * 4;
    dumbbell.rotation.set(0, -0.21 + Math.sin(t * 0.7) * 0.085, -0.17);
    const pulse =
      u >= 5 && u < 8 ? 1 + Math.sin(((u - 5) / 3) * Math.PI) * 0.07 : 1;
    checkpoint.scale.setScalar(pulse);
    signals.forEach((signal, i) => {
      const a = t * 0.45 + (i / 3) * Math.PI * 2;
      signal.position.set(425 * Math.cos(a), 23, 135 * Math.sin(a));
    });
    const phase = u < 5 ? 0 : u < 9 ? 1 : 2;
    if (phase !== lastPhase) {
      lastPhase = phase;
      onPhase?.(phase);
    }
  }
  function tick(now) {
    if (disposed || !moving) return;
    if (!previous) previous = now;
    elapsed += Math.min(0.1, (now - previous) / 1000);
    previous = now;
    if (now - lastFrame < 32) return;
    lastFrame = now;
    pose(elapsed);
    renderer.render(scene, camera);
  }
  function setMotion(enabled) {
    if (disposed) return;
    moving = enabled;
    previous = 0;
    renderer.setAnimationLoop(enabled ? tick : null);
    if (!enabled) {
      pose(elapsed);
      renderer.render(scene, camera);
    }
  }

  try {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      environmentTarget = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 });
      scene.environment = environmentTarget.texture;
    } finally {
      room.dispose();
      pmrem.dispose();
    }
    scene.environmentIntensity = 0.5;
    scene.add(new THREE.HemisphereLight(0xe5dfff, 0x292138, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-400, 650, 700);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9c76ff, 1.6);
    rim.position.set(450, 350, -300);
    scene.add(rim);
    const violet = material("#7952df", 0.3, 0.24);
    const graphite = material("#191620", 0.12, 0.62);
    const chrome = material("#c3c8d3", 0.88, 0.18);
    const lime = material("#d9ff4b", 0.15, 0.3);

    pass = group("Membership Pass", [-215, 246, 110]);
    roundedBox(176, 238, 14, 18, violet, pass, [0, 0, 0]);
    roundedBox(154, 214, 2, 12, graphite, pass, [0, 0, 8.5]);
    artwork(
      1024,
      1408,
      (ctx) => {
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 172px Arial, sans-serif";
        ctx.fillText("FitSwap", 70, 245);
        ctx.font = "600 66px Arial, sans-serif";
        ctx.fillStyle = "#d4c9e9";
        ctx.fillText("MEMBERSHIP", 80, 400);
        ctx.fillStyle = "#d9ff4b";
        ctx.font = "700 175px Arial, sans-serif";
        ctx.fillText("KEEP", 70, 690);
        ctx.fillText("MOVING.", 70, 895);
        ctx.fillRect(75, 1130, 875, 160);
        ctx.fillStyle = "#1c2414";
        ctx.font = "700 55px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("VALUE PASSED ON", 512, 1230);
      },
      148,
      205,
      pass,
      [0, 0, 12.5],
    );

    const stationLabels = [
      "01  RECOVER VALUE",
      "02  VERIFIED TRANSFER",
      "03  KEEP MOVING",
    ];
    stationLabels.forEach((text, i) => {
      const stage = group(text, [(i - 1) * 320, 0, 0]);
      mesh(new THREE.CylinderGeometry(119, 119, 20, 64), graphite, stage);
      mesh(
        new THREE.CylinderGeometry(113, 113, 3, 64),
        graphite,
        stage,
        [0, 11.5, 0],
      );
      const ring = mesh(
        new THREE.TorusGeometry(112, 1.5, 8, 80),
        i === 2 ? lime : violet,
        stage,
        [0, 14, 0],
      );
      ring.rotation.x = Math.PI / 2;
      label(text, 240, stage, [0, -38, 112]);
    });

    wallet = group("Unused Value Wallet", [-320, 85, 0]);
    roundedBox(130, 100, 16, 12, violet, wallet);
    roundedBox(52, 34, 8, 7, graphite, wallet, [46, 0, 12]);
    const pin = mesh(
      new THREE.CylinderGeometry(5, 5, 3, 20),
      chrome,
      wallet,
      [46, 0, 18],
    );
    pin.rotation.x = Math.PI / 2;
    artwork(
      512,
      256,
      (ctx) => {
        ctx.fillStyle = "#fff";
        ctx.font = "700 72px Arial, sans-serif";
        ctx.fillText("UNUSED", 28, 104);
        ctx.fillText("DAYS", 28, 199);
      },
      108,
      55,
      wallet,
      [-5, 0, 10.5],
    );

    checkpoint = group("Approval Checkpoint", [0, 150, -10]);
    mesh(
      new THREE.TorusGeometry(106, 4.5, 12, 80),
      violet,
      checkpoint,
      [0, 0, -10],
    );
    const shield = new THREE.Shape();
    shield.moveTo(-38, 30);
    shield.lineTo(-35, -11);
    shield.lineTo(0, -51);
    shield.lineTo(35, -11);
    shield.lineTo(38, 30);
    shield.lineTo(0, 43);
    shield.closePath();
    const shieldGeometry = new THREE.ExtrudeGeometry(shield, {
      depth: 10,
      bevelEnabled: true,
      bevelSize: 3,
      bevelThickness: 2,
      bevelSegments: 3,
    });
    mesh(shieldGeometry, lime, checkpoint, [0, 0, 0]);
    const short = roundedBox(11, 29, 4, 2, graphite, checkpoint, [-12, -3, 14]);
    short.rotation.z = Math.PI / 4;
    const long = roundedBox(11, 51, 4, 2, graphite, checkpoint, [8, 5, 14]);
    long.rotation.z = -Math.PI / 4;

    dumbbell = group("Next Member Training", [320, 104, 0]);
    const handle = mesh(
      new THREE.CylinderGeometry(10, 10, 110, 24),
      chrome,
      dumbbell,
    );
    handle.rotation.z = Math.PI / 2;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const plate = mesh(
          new THREE.CylinderGeometry(43 - i * 5, 43 - i * 5, 13, 48),
          i === 1 ? violet : graphite,
          dumbbell,
          [side * (52 + i * 14), 0, 0],
        );
        plate.rotation.z = Math.PI / 2;
      }
      const collar = mesh(
        new THREE.CylinderGeometry(12, 12, 10, 24),
        chrome,
        dumbbell,
        [side * 93, 0, 0],
      );
      collar.rotation.z = Math.PI / 2;
    });
    class ValueLoop extends THREE.Curve {
      getPoint(t, target = new THREE.Vector3()) {
        const a = t * Math.PI * 2;
        return target.set(425 * Math.cos(a), 21, 135 * Math.sin(a));
      }
    }
    mesh(new THREE.TubeGeometry(new ValueLoop(), 96, 1.4, 6, true), chrome);
    signals = [0, 1, 2].map(() =>
      mesh(new THREE.SphereGeometry(7, 16, 12), lime),
    );
    canvas.addEventListener("webglcontextlost", contextLost);
    if (window.ResizeObserver) {
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
    } else window.addEventListener("resize", resize);
    resize();
    onReady?.();
    return { dispose, setMotion };
  } catch (error) {
    dispose();
    throw error;
  }
}
