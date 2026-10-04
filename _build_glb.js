const fs = require('fs');
const DIR = 'C:/Users/赖文钊/WorkBuddy/2026-09-28-09-52-41';

let tpl = fs.readFileSync(DIR + '/naitalking.tpl.html', 'utf8');

const NEW = `
// 程序化部件：头部放大（体型，非表情）
// 顶点级"大头"：把局部 x 小端（头上）区域的顶点相对枢轴放大，脸随顶点放大变胖变高
function bigHead(geo){
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const minX = bb.min.x, maxX = bb.max.x;
  const span = maxX - minX;
  const headBottom = minX + span * 0.34;   // -x 超过此开始放大
  const headTop = minX + span * 0.02;      // 接近头顶权重趋近 1
  const pivotX = minX + span * 0.16;       // 头部枢轴
  const hScale = 0.6, hWiden = 0.7;        // 头更高 / 更宽
  const pos = geo.attributes.position;
  if (!pos) return;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = (headBottom - x) / (headBottom - headTop);
    const w = Math.max(0, Math.min(1, t));
    const sw = w * w * (3 - 2 * w);         // smoothstep 平滑过渡，避免脖子裂开
    const nx = pivotX + (x - pivotX) * (1 + hScale * sw);
    const ny = y * (1 + hWiden * sw);
    pos.setXYZ(i, nx, ny, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

const dragon3d = new THREE.Group();
scene.add(dragon3d);

// 模型容器：加载 GLB 后自适应缩放并居中（脚踩地面、水平居中）
// 用 billboard 让薄板立牌始终面朝相机，避免露出无贴图的侧面黑条（左侧那个"表情"）
const billboard = new THREE.Group();
dragon3d.add(billboard);
const modelRoot = new THREE.Group();
billboard.add(modelRoot);

let modelMats = [];          // GLB 原始材质（皮肤着色用）
let modelLoaded = false;
const TARGET_H = 2.6;        // 目标身高（世界单位）
const GROUND_Y = -1.3;       // 地面高度
let fitScale = 1, fitTop = 2.6, fitHeight = 2.6, fitWidth = 1.2;

// 配饰材质（随皮肤 accent 上色）
const costumeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(skin().accent), roughness: 0.4, metalness: 0.25 });

// 配饰（按模型包围盒定位）
const costume = { bow: null, leaf: null, star: null, flame: null, crown: null };
(function buildCostume(){
  const crown = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 20, 1, true), costumeMat);
  crown.add(band);
  for (let i = -1; i <= 1; i++){ const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 12), costumeMat); sp.position.set(i * 0.16, 0.14, 0); crown.add(sp); }
  costume.crown = crown; dragon3d.add(crown);
  const bow = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), costumeMat); b1.scale.set(1, 0.7, 0.4); b1.position.x = -0.2;
  const b2 = b1.clone(); b2.position.x = 0.2;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), costumeMat);
  bow.add(b1, b2, knot); costume.bow = bow; dragon3d.add(bow);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), costumeMat); leaf.scale.set(0.5, 1, 0.15); costume.leaf = leaf; dragon3d.add(leaf);
  const star = new THREE.Mesh(new THREE.SphereGeometry(0.16, 5, 5), costumeMat); star.scale.set(1, 1, 0.3); costume.star = star; dragon3d.add(star);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 16), costumeMat); costume.flame = flame; dragon3d.add(flame);
})();
function layoutCostume(){
  const top = fitTop, h = fitHeight;
  costume.crown.position.set(0, top * 0.9, h * 0.12); costume.crown.scale.setScalar(h * 0.10);
  costume.bow.position.set(h * 0.34, top * 0.82, h * 0.13); costume.bow.scale.setScalar(h * 0.10); costume.bow.rotation.z = 0.3;
  costume.leaf.position.set(h * 0.22, top * 0.86, h * 0.08); costume.leaf.scale.setScalar(h * 0.10); costume.leaf.rotation.z = -0.6;
  costume.star.position.set(0, h * 0.5, h * 0.20); costume.star.scale.setScalar(h * 0.10);
  costume.flame.position.set(0, top + h * 0.06, 0); costume.flame.scale.setScalar(h * 0.10);
}
function showCostume(kind){ Object.keys(costume).forEach(k => { if (costume[k]) costume[k].visible = (k === kind); }); }

// 嘴部锚点（喂食食物/碎屑定位）
const mouthAnchor = new THREE.Object3D();
dragon3d.add(mouthAnchor);
function layoutMouth(){ mouthAnchor.position.set(0, fitHeight * 0.6, fitWidth * 0.42); }

// 加载美术 GLB（base64 内联，file:// 可直接加载）
function loadModel(){
  return new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    const b64 = '__GLB_B64__';
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    loader.parse(bytes.buffer, '', (gltf) => {
      const root = gltf.scene;
      root.traverse(o => {
        if (o.isMesh){
          o.castShadow = true; o.receiveShadow = true;
          if (o.material){
            const arr = Array.isArray(o.material) ? o.material : [o.material];
            arr.forEach(m => { if (m){ if (modelMats.indexOf(m) < 0) modelMats.push(m); m.side = THREE.DoubleSide; } });
          }
        }
        if (o.geometry) bigHead(o.geometry);
      });
      modelRoot.add(root);
      // 81bdff 奶蛙 GLB：身高沿 X 轴（横躺，头在 -X 朝左倒着），绕 Z 轴 -90° 立起身、头朝上、面朝相机
      root.rotation.z = -Math.PI / 2;
      let box = new THREE.Box3().setFromObject(modelRoot);
      const size = new THREE.Vector3(); box.getSize(size);
      fitScale = TARGET_H / Math.max(size.y, 0.001);
      modelRoot.scale.setScalar(fitScale);
      box = new THREE.Box3().setFromObject(modelRoot);
      const c = new THREE.Vector3(); box.getCenter(c);
      modelRoot.position.set(-c.x, -box.min.y, -c.z);
      fitHeight = size.y * fitScale;
      fitWidth = size.x * fitScale;
      fitTop = box.max.y;

      modelLoaded = true;
      layoutCostume(); layoutMouth();
      resolve();
    }, (err) => reject(err));
  });
}

function applySkin(sk){
  modelMats.forEach(m => { if (m && m.color) m.color.set(sk.tint ? sk.body[1] : '#ffffff'); });
  costumeMat.color.set(sk.accent);
  layoutCostume();
  showCostume(sk.costume === 'none' ? null : sk.costume);
}

/* ===================== 动画驱动 ===================== */
function updateDragon(t){
  const a = dragon.anim, at = dragon.animT;
  let bob = Math.sin(t * 0.002) * 0.05;
  let rotZ = 0, rotX = 0, rotY = 0, jump = 0, headTilt = 0;
  if (a === 'idle'){ /* base */ }
  else if (a === 'nod'){ headTilt = Math.sin(at * 0.18) * 0.32; }
  else if (a === 'wave'){ rotZ = Math.sin(at * 0.18) * 0.10; }
  else if (a === 'jump'){ jump = Math.abs(Math.sin(at * 0.14)) * 0.55; }
  else if (a === 'wobble' || a === 'shake'){ rotZ = Math.sin(at * 0.4) * 0.16; }
  else if (a === 'spin'){ rotY = at * 0.08; }
  else if (a === 'laugh'){ rotZ = Math.sin(at * 0.4) * 0.10; rotX = -0.08; headTilt = -0.06; }
  else if (a === 'sleep'){ rotX = 0.07; headTilt = 0.11; bob = Math.sin(t * 0.0012) * 0.03; }

  if (dragon.face === 'surprise'){ headTilt = Math.max(headTilt, 0.12); }
  else if (dragon.face === 'sleep'){ headTilt = 0.06; rotX = 0.04; }

  // —— 状态养成驱动的体态：精力 / 饱腹 / 心情 ——
  if (typeof stats !== 'undefined' && !mini){
    if (stats.energy < 35){                       // 精力不足：打哈欠式后仰 + 下沉
      const ya = Math.max(0, Math.sin(t * 0.0016));
      headTilt += ya * 0.17; rotX -= ya * 0.05; bob -= 0.045 * ya;
    }
    if (stats.full < 25){ rotX -= 0.07; headTilt -= 0.04; }    // 饿了：微微前倾探头
    if (stats.mood < 25){ headTilt += 0.10; rotZ *= 0.5; jump *= 0.5; }   // 心情低落：耷拉脑袋、动作变少
    else if (stats.mood > 80){ bob *= 1.25; }                  // 心情很好：更活泼
  }

  // 喂食时间线：整体放大（背景后退）+ 轻微头身拉伸（拟大头）
  let zoom = 1, stretchY = 1, squashXZ = 1;
  if (state.feed){
    const f = state.feed;
    const p = clamp(f.t / 42, 0, 1);
    const chew = (f.t > 44 && f.t < 80) ? (1 + Math.abs(Math.sin(f.t * 0.5)) * 0.05) : 1;
    zoom = lerp(1, 1.6, clamp((f.t - 30) / 40, 0, 1));
    stretchY = lerp(1, 1.16, p) * chew;
    squashXZ = lerp(1, 0.95, p);
    bob = 0;
  }
  dragon3d.scale.set(zoom * squashXZ, zoom * stretchY, zoom * squashXZ);
  // 小游戏：奶龙随玩家左右横移（世界范围随屏幕宽高比自适应）
  dragon3d.position.x = mini ? mini.dx * (visibleHalfWidth() * 0.62) : 0;
  dragon3d.position.y = GROUND_Y + bob - jump;
  dragon3d.rotation.z = rotZ;
  dragon3d.rotation.x = rotX;
  dragon3d.rotation.y = rotY;
  modelRoot.rotation.x = headTilt;

  // 薄板立牌始终面朝相机，并略向左转把左侧黑边甩出视线
  if (billboard){
    billboard.lookAt(camera.position);
    billboard.rotateY(-0.12);
  }
}
`;

// 1) 替换程序化模型整段
const startMarker = 'const dragon3d = new THREE.Group();';
const endMarker = '/* ===================== 2D 粒子层（金币/泪/碎屑/食物） ===================== */';
const si = tpl.indexOf(startMarker);
const ei = tpl.indexOf(endMarker);
if (si < 0 || ei < 0) { console.error('anchor not found', si, ei); process.exit(1); }
tpl = tpl.slice(0, si) + NEW + '\n' + tpl.slice(ei);

// 2) 启动改为先加载模型
const oldBoot = `  resize();
  applyTheme(state.scene);
  applySkin(skin());
  document.getElementById('coinDisplay').textContent = save.coins;
  document.getElementById('loading').style.display = 'none';
  loop();`;
const newBoot = `  loadModel().then(() => {
    resize(); applyTheme(state.scene); applySkin(skin());
    document.getElementById('coinDisplay').textContent = save.coins;
    document.getElementById('loading').style.display = 'none';
    initSettings(); startGuidance(); updateStatHud(true);
    loop();
  }).catch(err => fail('模型加载失败：' + (err && err.message ? err.message : err)));`;
if (!tpl.includes(oldBoot)) { console.error('boot block not found'); process.exit(1); }
tpl = tpl.replace(oldBoot, newBoot);

// 3) 注入资源
const three = fs.readFileSync(DIR + '/_three_r147.js', 'utf8');
const gltf = fs.readFileSync(DIR + '/_gltfloader.js', 'utf8');
const glbBuf = fs.readFileSync(process.env.GLB || 'C:/Users/赖文钊/Downloads/7b3ef54e2a005644cab65ca3b87a984c.glb');
const glbB64 = glbBuf.toString('base64');
const laugh = fs.readFileSync(DIR + '/_laugh_clip.txt', 'utf8').trim();
tpl = tpl.replace('__THREE_SRC__', three)
         .replace('__GLTF_SRC__', gltf)
         .replace('__GLB_B64__', glbB64)
         .replace('__LAUGH__', laugh);

['__THREE_SRC__','__GLTF_SRC__','__GLB_B64__','__LAUGH__','__THREE_URL__'].forEach(p => {
  if (tpl.includes(p)) { console.error('PLACEHOLDER LEFT:', p); process.exit(1); }
});
const outPath = process.env.OUT || (DIR + '/naitalking.html');
fs.writeFileSync(outPath, tpl);
console.log('built', outPath, (tpl.length/1024/1024).toFixed(1), 'MB');
