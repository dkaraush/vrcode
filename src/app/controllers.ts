import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, RingBufferGeometry, WebGLRenderer } from "three";
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';

export class VRControllers {
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;

    public activeController?: Group;
    public leftController: Group;
    public leftGrip: Group;
    public rightController: Group;
    public rightGrip: Group;

    private controllerModelFactory: XRControllerModelFactory;

    constructor(renderer: WebGLRenderer, scene: THREE.Scene) {
        this.renderer = renderer;
        this.scene = scene;

        this.controllerModelFactory = new XRControllerModelFactory();

        this.rightController = this.initController(0);
        this.rightGrip = this.initGrip(0);

        this.leftController = this.initController(1);
        this.leftGrip = this.initGrip(1);
    }

    private initController(n : number): Group {
        const controller = this.renderer.xr.getController( n );
        controller.addEventListener( 'selectstart', this.onSelectStart.bind(this, controller) );
        controller.addEventListener( 'selectend', this.onSelectEnd.bind(this, controller) );
        controller.addEventListener( 'connected', ({ data }) =>
            controller.add( this.buildController( data ) )
        );
        controller.addEventListener( 'disconnected', () =>
            controller.remove( controller.children[ 0 ] )
        );
        this.scene.add( controller );
        return controller;
    }
    private initGrip(n: number) {
        const grip = this.renderer.xr.getControllerGrip( n );
        grip.add( this.controllerModelFactory.createControllerModel( grip ) );
        this.scene.add( grip );
        return grip;
    }

    private buildController(data: any) : Mesh | Line {
        const geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
        geometry.setAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

        const material = new LineBasicMaterial({
            vertexColors: true,
            blending: AdditiveBlending
        });

        return new Line( geometry, material );
    }

    private onSelectStart(controller: Group) {
        if (controller.children[0])
            ((controller.children[0] as Mesh | Line).material as LineBasicMaterial).color = new Color( 0x42a5f5 );
    }
    private onSelectEnd(controller: Group) {
        if (controller.children[0])
            ((controller.children[0] as Mesh | Line).material as LineBasicMaterial).color = new Color(1., 1., 1.);
    }
}