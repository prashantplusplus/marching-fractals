import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';
const currentShader = 'shaders/basic.frag'; // current fragment shader path
//import matcap from '../matcap1.png';
/**
 * read a file from the server.
 * @param {*} path - path to the file
 */
async function readFile(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('HTTP error ' + response.status);
  }
  return await response.text();
}
/**
 * Render scene
 */
async function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.autoClearColor = false;

  const camera = new THREE.OrthographicCamera(
      -1, // left
      1, // right
      1, // top
      -1, // bottom
      -1, // near,
      1, // far
  );
  const scene = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    iTime: {value: 0},
    //matcap: {value: new THREE.TextureLoader().load(matcap)},
    mouse : {value: new THREE.Vector2(0,0)},
    keyboard: {value: new THREE.Vector2(0,0)},
    iResolution: {value: new THREE.Vector3()},
  };
  const fragmentShader = await readFile(currentShader);
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
  });
  scene.add(new THREE.Mesh(plane, material));
  /**
   * Update canvas pixel size to match view window size
   * @param {THREE.renderer} renderer - the renderer handle
   * @return {Boolean} - true if a resize took place
   */
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  let mouse = new THREE.Vector2();
  
  document.addEventListener('mousemove',(e)=>{
    mouse.x = e.pageX/canvas.clientWidth - 0.5;
    mouse.y = -e.pageY/canvas.clientHeight + 0.5;
  });

  let keyboard = new THREE.Vector2();
  keyboard.x = 0.;
  keyboard.y = 0.;
  keyboard.z = 2.;
  document.addEventListener("keydown", (e)=>{
    var keyCode = e.code;
    
    switch(keyCode){
      case 'KeyW':
        keyboard.y += 0.08;
        break;
      case 'KeyA':
        keyboard.x += -0.08;
        break;
      case 'KeyS':
        keyboard.y += -0.08;
        break;
      case 'KeyD':
        keyboard.x += 0.08;
        break;
      case 'ArrowUp':
        keyboard.z += -0.08;
        break;
      case 'ArrowDown':
        keyboard.z += +0.08;
        break;
      default:
        break;
    }
  });
  //function KeyboardEvent
  /**
   * The render function.
   * @param {Number} time - Render time
   */
   
  //let controls = new OrbitControls(camera, renderer.domElement);
  function render(time) {
    time *= 0.001; // convert to seconds

    resizeRendererToDisplaySize(renderer);
    
    const canvas = renderer.domElement;
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value = time;
    if(mouse)
      uniforms.mouse.value =  mouse;
    if(keyboard)
      uniforms.keyboard.value =  keyboard;

    
    renderer.render(scene, camera);
    //controls.update();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
main();
