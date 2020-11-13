import { DirectionalLight, Color, Mesh, PerspectiveCamera, Scene, sRGBEncoding, Vector3, WebGLRenderer, AmbientLight, Fog } from 'three';
import { Box } from './box';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { VRControllers } from './controllers';

import InfiniteGridHelper from '../../lib/THREE.InfiniteGridHelper/InfiniteGridHelper';
// @ts-ignore
import * as _Sky from 'three-sky';
import Textarea from './textarea';
const Sky = _Sky as typeof Mesh;

export class App {
    private readonly scene = new Scene();
    private readonly camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 10000);
    private readonly renderer = new WebGLRenderer({
        antialias: true,
        canvas: document.getElementById('main-canvas') as HTMLCanvasElement,
    });

    private readonly sky = this.initSky();
    private readonly grid = new InfiniteGridHelper(0.5, 10);
    private readonly light = new DirectionalLight(0xffffff, 1);
    private readonly fog = new Fog(new Color(0xffffff), 0, 100);

    private readonly textarea = new Textarea(
        new Vector3(0., 2, 0),
        Math.PI * 1.5,
        Math.PI * 2,
        2,
        7,
        45
    );

    private controllers: VRControllers;
    private box: Box;

    constructor() {
        this.box = new Box(1, new Color(0xFF0000));
        this.box.position.set(0, 0, -10);
        this.scene.add(this.box);

        this.camera.position.set(0, 1.6, 0);
        this.camera.lookAt(this.box.position);

        this.adjustCanvasSize();
        window.addEventListener('resize', this.adjustCanvasSize.bind(this));

        // this.renderer.setClearColor(0);

        this.scene.add( this.sky );
        this.scene.add( this.grid );
        this.scene.fog = this.fog;

        this.light.position.set(0, 2, 0);
        this.light.lookAt(0.5, 0, 0.2);
        this.scene.add( this.light );
        this.scene.add( new AmbientLight( 0x666666 ) );

        this.scene.add( this.textarea );

        // this.render(true);

        document.body.appendChild( VRButton.createButton( this.renderer ) );
        this.renderer.xr.enabled = true;
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.setAnimationLoop(this.render.bind(this, false));

        this.controllers = new VRControllers(this.renderer, this.scene);
        
    }

    private adjustCanvasSize() {
        this.renderer.setPixelRatio( devicePixelRatio );
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
    }

    private render(requestNextFrame: boolean = true) {
        this.textarea.update();
        this.renderer.render(this.scene, this.camera);

        if (requestNextFrame)
            requestAnimationFrame(() => this.render());

        // this.controllers.update();


        this.box.rotateY(0.03);
    }


    private initSky() {
        const effectController = {
            turbidity: 10,
            rayleigh: 2,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            inclination: 0.49, // elevation / inclination
            azimuth: 0.25, // Facing front,
            sun: true
        };

        const sky = new Sky();
        sky.scale.setScalar(1000);
        // @ts-ignore
        const uniforms = sky.material.uniforms;

        uniforms[ "turbidity" ].value = effectController.turbidity;
        uniforms[ "rayleigh" ].value = effectController.rayleigh;
        uniforms[ "mieCoefficient" ].value = effectController.mieCoefficient;
        uniforms[ "mieDirectionalG" ].value = effectController.mieDirectionalG;
        uniforms[ "sunPosition" ].value.set(400000, 400000, 400000);

        return sky;
    }
}
