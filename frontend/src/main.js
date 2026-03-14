import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth, window.innerHeight);