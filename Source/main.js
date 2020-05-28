/**
 * ---------------------------------------- *  
 * ---------------------------------------- * 
 *                                          *
 *                 Imports                  *
 *                                          * 
 * ---------------------------------------- *
 * ---------------------------------------- *   
 */


const dat = require('dat.gui');
const Trackball = require('trackball-controller');
const mat4 = require('gl-matrix').mat4;
const vec3 = require('gl-matrix').vec3;
const canvas = document.getElementById('canvas');
canvas.height = canvas.width = 1024;
const getRenderer = require('./renderer');
const renderer = getRenderer(canvas);
const trackball = new Trackball(canvas, {
  drag: 0.025,
  onRotate: renderer.reset,
});



/**
 * ---------------------------------------- *  
 * ---------------------------------------- * 
 *                                          *
 *               UI Methods                 *
 *                                          * 
 * ---------------------------------------- *
 * ---------------------------------------- *   
 */


const Controller = function() {
  this.resolution = 2048;
  this.antialias = true;
  this.samples = 16;
  this.bounces = 3;
  this.light_position = -0.16;
  this.light_radius = 4.0;
  this.light_brightness = 4.0;
  this.light_color = .5;
  this.light_saturation = .15;
  this.ambient_brightness = 0.01;
  this.ambient_color = .5;
  this.ambient_saturation = .15;
  this.roughness_floor = 0.25;
  this.roughness_sphere = 0.25;
  this.soft_shadows = true;
  this.shadow_bias = 0.0001;
  this.shadow_penumbra = 1.0;
}

const gui = new dat.GUI({width: 300});
const controller = new Controller();

gui.add(controller, 'resolution', [128, 256, 512, 1024, 2048, 4096]).name("Resolution").onChange(
  function() {renderer.resize(controller.resolution)}
);
gui.add(controller, 'antialias').name('Antialias').onChange(
  renderer.reset
);
gui.add(controller, 'samples').name('Samples/Frame').min(1).max(64).step(1).onChange(
  renderer.reset
);
gui.add(controller, 'bounces').name("Ray - Bounces").min(0).max(16).step(1).onChange(
  renderer.reset
);
gui.add(controller, 'light_position').name("Light - Position").min(-1.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'light_radius').name("Light - Radius").min(0.0).max(8.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'light_brightness').name("Light - Brightness").min(0.0).max(16.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'light_color').name("Light - Color").min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'light_saturation').name("Light - Saturation").min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'ambient_brightness').name("Ambient - Brightness").min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'ambient_color').name("Ambient - Color").min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'ambient_saturation').name("Ambient - Saturation").min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'roughness_floor').name('Roughness - Floor').min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'roughness_sphere').name("Roughness - Spheres").min(0.0).max(1.0).step(0.01).onChange(
  renderer.reset
);
gui.add(controller, 'soft_shadows').name('Soft Shadows').onChange(
  renderer.reset
);
gui.add(controller, 'shadow_bias').name("Shadow Bias").min(0.0001).max(1.0).onChange(
  renderer.reset
);
gui.add(controller, 'shadow_penumbra').name("Penumbral Intensity").min(0.0001).max(1.0).onChange(
  renderer.reset
);



function constrainCanvas() {
  if (window.innerWidth > window.innerHeight) {
    canvas.style.height = '100%';
    canvas.style.width = `${canvas.clientHeight}px`;
  } else {
    canvas.style.width = '100%';
    canvas.style.height = `${canvas.clientWidth}px`;
  }
}

let eye = [0, 0, 10];
let off = [0, 0, 0];
let target = [0, 0, 0];


window.onkeydown = function(event) {
  var keyCode = event.keyCode;
  switch (keyCode) {
      case 87: // W
          off[1] += Math.PI/10;
          eye[1] = 10*Math.sin(off[1]);
          break;
      case 65: // A
          off[0] -= Math.PI/10;
          eye[0] = 10*Math.sin(off[0]);
          off[2] -= Math.PI/10;
          eye[2] = 10*Math.cos(off[2]);
          break;
      case 83: // S
          off[1] -= Math.PI/10;
          eye[1] = 10*Math.sin(off[1]);
          break;
      case 68: // D
          off[0] += Math.PI/10;
          eye[0] = 10*Math.sin(off[0]);
          off[2] += Math.PI/10;
          eye[2] = 10*Math.cos(off[2]);          
          break;
      case 82: // R - reset
          off = [0, 0, 0];
          eye  = [0,0,10];
          break;
  }
  console.log(eye);
  renderer.reset();
}

/**
 * ---------------------------------------- *  
 * ---------------------------------------- * 
 *                                          *
 *                 Shaders                  *
 *                                          * 
 * ---------------------------------------- *
 * ---------------------------------------- *   
 */


function loop() {
  constrainCanvas();
  for (let i = 0; i < controller.samples; i++) {
    renderer.sample({
      eye: eye,
      target: target,
      bounces: controller.bounces,
      model: trackball.rotation,
      light_radius: controller.light_radius,
      light_position: controller.light_position,
      light_brightness: controller.light_brightness,
      light_color: controller.light_color,
      light_saturation: controller.light_saturation,
      ambient_brightness: controller.ambient_brightness,
      ambient_color: controller.ambient_color,
      ambient_saturation: controller.ambient_saturation,
      roughness_floor: controller.roughness_floor,
      roughness_sphere: controller.roughness_sphere,
      antialias: controller.antialias,
      soft_shadows: controller.soft_shadows,
      shadow_bias: controller.shadow_bias,
      shadow_penumbra: controller.shadow_penumbra
    });
  }
  renderer.display();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
