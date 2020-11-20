import { AdditiveBlending, ArrowHelper, BufferGeometry, Color, Euler, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, Object3D, Quaternion, Raycaster, RingBufferGeometry, Vector3, WebGLRenderer } from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import VRDisplay, { isVRDisplay } from './display';
import { getVRKeyboard, isVRKeyboard, VRKeyboard } from './keyboard';
import * as THREE from 'three';
window.THREE = THREE;

export interface DraggingState {
    rayStartSrcPos: Vector3;
    rayStartDestPos: Vector3;
    rayLength: number;
    rayStartRot: Quaternion;
    obj: Object3D;
    objStartScale: Vector3;
    objStartPos: Vector3;
    objStartRot: Quaternion;
}

export class VRControllers {
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;
    private canMoveItem: (obj: Object3D) => boolean;

    public activeController?: Group;
    public leftController: Group;
    public leftGrip: Group;
    public rightController: Group;
    public rightGrip: Group;

    public state: [DraggingState | null, DraggingState | null] = [null, null];

    private controllerModelFactory: XRControllerModelFactory;

    constructor(renderer: WebGLRenderer, scene: THREE.Scene, canMoveItem: (obj: Object3D) => boolean) {
        this.renderer = renderer;
        this.scene = scene;
        this.canMoveItem = canMoveItem;

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
        this.updateAnotherController(n === 0 ? 1 : 0);
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

    private ray(controller: Group) : [number, Vector3, Object3D | Group] | null {
        const position = controller.position;
        const direction = this.getDirection(controller.quaternion);

        // this.scene.add(new ArrowHelper(direction, position, 1000, 0xff0000));

        this.raycaster.set(position, direction);
        const intersects = this.raycaster.intersectObjects(
            this.getSceneChildren()
                .filter(obj3d => this.canMoveItem(obj3d))
        );

        const intersection = intersects[0];
        if (!intersection)
            return null;

        let obj = intersection.object as VRDisplay | Group;

        if (obj && getVRKeyboard(obj))
            obj = getVRKeyboard(obj) as VRKeyboard;
        return [intersection.distance, intersection.point, obj];
    }

    private getState(controller: Group) : DraggingState | null {
        const intersection = this.ray(controller);
        if (!intersection)
            return null;
        const [rayLength, rayStartDestPos, obj] = intersection;

        return {
            obj,
            objStartPos: obj.position.clone(),
            objStartRot: obj.quaternion.clone(),
            objStartScale: obj.scale.clone(),
            rayLength,
            rayStartSrcPos: controller.position.clone(),
            rayStartDestPos,
            rayStartRot: controller.quaternion.clone()
        };
    }
    private updateAnotherController(n: number) {
        const thisState = this.state[n];
        const updatedState = this.state[n === 0 ? 1 : 0];
        if (thisState && updatedState && 
            thisState.obj === updatedState.obj) {

            const thisController = n === 0 ? this.rightController : this.leftController;
            thisState.rayStartSrcPos = thisController.position.clone();
            thisState.rayStartDestPos = thisState.rayStartSrcPos.clone().addScaledVector(this.getDirection(thisController.quaternion), thisState.rayLength);
            thisState.rayStartRot = thisController.quaternion.clone();
        }
    }

    // public arrowHelper : ArrowHelper | null = null;
    public raycaster = new Raycaster();
    update() {
        if (this.state[0] && this.state[1] && this.state[0].obj === this.state[1].obj) {
            this.handleMultiDragging();
        } else {
            this.handleSingleDragging(0);
            this.handleSingleDragging(1);
        }
    }


    private handleSingleDragging(n: number) {
        const state = this.state[n];
        if (!state)
            return;

        const controller = (n === 0 ? this.rightController : this.leftController)
        const raySrcPos = controller.position.clone();
        const rayRot = controller.quaternion.clone();
        const rayDirection = this.getDirection(rayRot);
        const rayDestPos = raySrcPos.clone().addScaledVector(rayDirection, state.rayLength);
        state.obj.position.copy(
            state.objStartPos.clone().add(
                rayDestPos.clone().sub(
                    state.rayStartDestPos
                )
            )
        );
        state.obj.quaternion.copy(
            state.objStartRot.clone().multiply(
                // rayRot.multiply(state.rayStartRot.clone().inverse())
                state.rayStartRot.clone().inverse().multiply(rayRot.clone())
            )
        );
    }

    private handleMultiDragging() {
        // const state1 = this.state[0];
        // const state2 = this.state[1];
        // const controller1 = this.rightController;
        // const controller2 = this.leftController;

        // if (state1 === null || state2 === null)
        //     return;

        // const { obj, objStartPos, objStartRot, objStartScale } = state1;

        // const ray1SrcPos = controller1.position.clone();
        // const ray1Rot = controller1.quaternion.clone();
        // const ray1DestPos = ray1SrcPos.clone().addScaledVector(this.getDirection(ray1Rot), state1.rayLength);

        // const ray2SrcPos = controller2.position.clone();
        // const ray2Rot = controller2.quaternion.clone();
        // const ray2DestPos = ray2SrcPos.clone().addScaledVector(this.getDirection(ray2Rot), state2.rayLength);

        // const raysStartDist = state1.rayStartDestPos.distanceTo(state2.rayStartDestPos);
        // const raysDist = ray1DestPos.distanceTo(ray2DestPos);

        // const raysMiddleStartDest = state1.rayStartDestPos.lerp(state2.rayStartDestPos, 0.5);
        // const raysMiddleDest = ray1DestPos.lerp(ray2DestPos, 0.5);

        // if (isVRDisplay(obj)) {

        // } else {
        //     obj.scale.copy(
        //         objStartScale.clone().add(
        //             new Vector3().setScalar((raysDist - raysStartDist) * 0.1)
        //         )
        //     )
        // }
    }
}