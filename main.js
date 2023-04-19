import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Planet Proto
let planetProto = {
  sphere: function(size) {
    let sphere = new THREE.SphereGeometry(size, 32, 32);

    return sphere;
  },

  material: function(options) {
    let material = new THREE.MeshPhongMaterial();
    if (options) {
      for (var property in options) {
        material[property] = options[property];
      }
    }
    return material;
  },

  glowMaterial: function(intensity, fade, color) {
    // Custom glow shader from https://github.com/stemkoski/stemkoski.github.com/tree/master/Three.js
    let glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        'c': {
          type: 'f',
          value: intensity },

        'p': {
          type: 'f',
          value: fade },

        glowColor: {
          type: 'c',
          value: new THREE.Color(color) },

        viewVector: {
          type: 'v3',
          value: camera.position } },


      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() 
        {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }`,

      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true });


    return glowMaterial;
  },

  texture: function (material, property, uri) {
    let textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = true;
    textureLoader.load(
    uri,
    function (texture) {
      material[property] = texture;
      material.needsUpdate = true;
    });
  }
};

let createPlanet = function (options) {
  // Create the planet's surface
  let surfaceGeometry = planetProto.sphere(options.surface.size);
  let surfaceMaterial = planetProto.material(options.surface.material);
  let surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

  // Create the planet's Atmosphere
  let atmosphereGeometry = planetProto.sphere(options.surface.size + options.atmosphere.size);
  let atmosphereMaterialDefaults = {
    side: THREE.DoubleSide,
    transparent: true };

  let atmosphereMaterialOptions = Object.assign(atmosphereMaterialDefaults, options.atmosphere.material);
  let atmosphereMaterial = planetProto.material(atmosphereMaterialOptions);
  let atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

  // Create the planet's Atmospheric glow
  let atmosphericGlowGeometry = planetProto.sphere(options.surface.size + options.atmosphere.size + options.atmosphere.glow.size);
  let atmosphericGlowMaterial = planetProto.glowMaterial(options.atmosphere.glow.intensity, options.atmosphere.glow.fade, options.atmosphere.glow.color);
  let atmosphericGlow = new THREE.Mesh(atmosphericGlowGeometry, atmosphericGlowMaterial);

  // Nest the planet's Surface and Atmosphere into a planet object
  let planet = new THREE.Object3D();
  surface.name = 'surface';
  atmosphere.name = 'atmosphere';
  atmosphericGlow.name = 'atmosphericGlow';
  planet.add(surface);
  planet.add(atmosphere);
  planet.add(atmosphericGlow);

  // Load the Surface's textures
  for (let textureProperty in options.surface.textures) {
    planetProto.texture(
    surfaceMaterial,
    textureProperty,
    options.surface.textures[textureProperty]);
  }

  // Load the Atmosphere's texture
  for (let textureProperty in options.atmosphere.textures) {
    planetProto.texture(
    atmosphereMaterial,
    textureProperty,
    options.atmosphere.textures[textureProperty]);

  }

  return planet;
};

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.set(-window.innerWidth/900, 0, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Create Mars
let mars = createPlanet({
  surface: {
    size: 1,
    material: {
      bumpScale: 0.05,
      specular: new THREE.Color('grey'),
      shininess: 10
    },
    textures: {
      map: '/map.jpg',
      bumpMap: '/bump_map.png',
      specularMap: '/rgb_sketchmap.jpg' 
    } 
  },

  atmosphere: {
    size: 0.003,
    material: {
      opacity: 0.3
    },
    textures: {
      map: '/cloud_map.png',
      alphaMap: '/cloud_map.png'
    },
    glow: {
      size: 0.02,
      intensity: 0.0005,
      fade: 7,
      color: 0x250b0c
    }
  }
});
mars.position.set(0, 0, 0);
mars.rotation.set(0, 0, -0.25)
scene.add(mars);

// Lights
const spotLight = new THREE.SpotLight(0xffffff, 1, 0, 10, 2);
spotLight.position.set(-15, 5, 10)
scene.add(spotLight)

// Galaxy
let galaxyGeometry = new THREE.SphereGeometry(100, 32, 32);
let galaxyMaterial = new THREE.MeshBasicMaterial({
  side: THREE.BackSide });

let galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);

textureLoader.crossOrigin = true;
textureLoader.load(
'/background.jpg',
function (texture) {
  galaxyMaterial.map = texture;
  scene.add(galaxy);
});

// Orbit Controls
// const controls = new OrbitControls(camera, renderer.domElement);

// Resize function
function resize() {
    camera.position.setX(-window.innerWidth/900)
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
// Add event listener to window
window.addEventListener('resize', resize);
  
// Game loop
function animate() {
    requestAnimationFrame(animate);

    mars.rotation.y += 0.002;

    // controls.update();

    renderer.render(scene, camera);
}
resize();
animate();