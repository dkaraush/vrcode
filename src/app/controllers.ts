import { AdditiveBlending, ArrowHelper, BufferGeometry, Color, Euler, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, Object3D, Quaternion, Raycaster, RingBufferGeometry, Vector3, WebGLRenderer } from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import VRDisplay, { isVRDisplay } from './display';
import { getVRKeyboard, isVRKeyboard, VRKeyboard } from './keyboard';

export type DraggingStateKeyboard = {
    distance: number;
    startPos: Vector3;
    startRot: Euler;
    startOffsetPos: Vector3;
    object: VRKeyboard;
    objStartPos: Vector3;
    objStartRot: Euler;
    startOffsetRotY: number;
};
export type DraggingStateDisplay = {
    distance: number;
    startPos: Vector3;
    startRot: Euler;
    startOffsetPos: Vector3;
    object: VRDisplay;
    displayStartOriginY: number;
    displayStartOffsetAngle: number;
    displayStartWidthAngle: number;
    displayStartDistance: number;
    displayStartHeight: number;
}
export type DraggingState = DraggingStateKeyboard | DraggingStateDisplay | null;

export class VRControllers {
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;

    public activeController?: Group;
    public leftController: Group;
    public leftGrip: Group;
    public rightController: Group;
    public rightGrip: Group;

    public state: [DraggingState, DraggingState] = [null, null];

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
        controller.addEventListener( 'selectstart', this.onSelectStart.bind(this, n, controller) );
        controller.addEventListener( 'selectend', this.onSelectEnd.bind(this, n, controller) );
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

    private onSelectStart(n: number, controller: Group) {
        if (controller.children[0])
            ((controller.children[0] as Mesh | Line).material as LineBasicMaterial).color = new Color( 0x42a5f5 );

        this.state[n] = this.getState(controller);
    }
    private onSelectEnd(n: number, controller: Group) {
        if (controller.children[0])
            ((controller.children[0] as Mesh | Line).material as LineBasicMaterial).color = new Color(1., 1., 1.);

        this.state[n] = null;
    }

    private getSceneChildren() : Object3D[] {
        const children = [...this.scene.children];
        for (const child of children)
            if (getVRKeyboard(child))
                children.push(...child.children);
        return children;
    }

    private getDirection(quaternion: Quaternion) {
        return new Vector3( 0, 0, -1 ).applyQuaternion( quaternion );
    }

    private ray(controller: Group) : [number, Vector3, VRDisplay | VRKeyboard] | null {
        const position = controller.position;
        const direction = this.getDirection(controller.quaternion);

        this.scene.add(new ArrowHelper(direction, position, 1000, 0xff0000));

        this.raycaster.set(position, direction);
        const intersects = this.raycaster.intersectObjects( this.getSceneChildren() );

        const intersection = intersects.filter(o =>
            (isVRDisplay(o.object) && !o.object.locked) ||
            getVRKeyboard(o.object)
        )[0];
        if (!intersection)
            return null;

        let obj = intersection.object as VRDisplay | Group;

        if (obj && getVRKeyboard(obj))
            obj = getVRKeyboard(obj) as VRKeyboard;
        return [intersection.distance, intersection.point, obj as VRDisplay | VRKeyboard];
    }

    private getState(controller: Group) : DraggingState {
        const intersection = this.ray(controller);
        if (!intersection)
            return null;
        const [distance, pos, object] = intersection;

        const startPos = controller.position.clone();
        const startRot = controller.rotation.clone();
        const startOffsetPos = pos.clone();

        const state = {distance, startPos, startOffsetPos, startRot};

        if (isVRKeyboard(object)) {
            return {
                ...state,
                object,
                objStartPos: object.position.clone(),
                objStartRot: object.rotation.clone(),
                startOffsetRotY: Math.atan2(
                    controller.position.x - pos.x,
                    controller.position.z - pos.z
                )
            };
        } else if (isVRDisplay(object)) {
            return {
                ...state,
                object,
                displayStartOriginY: object.origin.y,
                displayStartDistance: object.distance,
                displayStartHeight: object.height,
                displayStartOffsetAngle: object.offsetAngle,
                displayStartWidthAngle: object.widthAngle
            };
        } else
            return null;
    }

    // public arrowHelper : ArrowHelper | null = null;
    public raycaster = new Raycaster();
    update() {
        this.handleDragging(0);
        this.handleDragging(1);
    }


    private handleDragging(n: number) {
        const state = this.state[n];
        if (!state)
            return;

        const controller = n === 0 ? this.rightController : this.leftController;
        const pos = controller.position.clone().add( this.getDirection(controller.quaternion).multiplyScalar(state.distance) );

        if (isVRKeyboard(state.object)) {
            const stateKeyboard = state as DraggingStateKeyboard;
            stateKeyboard.object.position.copy(
                stateKeyboard.objStartPos.clone().add(
                    pos.sub(stateKeyboard.startOffsetPos)
                )
            );
            // stateKeyboard.object.quaternion = Quaternion.fr(stateKeyboard.startRot).slerp()
            // stateKeyboard.object.rotation.y = Math.atan2(
            //     controller.position.x - pos.x,
            //     controller.position.z - pos.z
            // );
        } else if (isVRDisplay(state.object)) {
            const stateDisplay = state as DraggingStateDisplay;
            const currentAngle = Math.atan2(pos.z, pos.x) + Math.PI * 2;
            const startDistance = stateDisplay.startOffsetPos.multiply(new Vector3(1, 0, 1)).length();
            const currentDistance = controller.position.multiply(new Vector3(1, 0, 1)).length();

            stateDisplay.object.offsetAngle = currentAngle;
            stateDisplay.object.origin.y = stateDisplay.displayStartOriginY + pos.sub(stateDisplay.startOffsetPos).y;
            stateDisplay.object.distance = Math.max(1, stateDisplay.displayStartDistance + (currentDistance - startDistance) * 4);
            stateDisplay.object.bend();
        }
    }
}