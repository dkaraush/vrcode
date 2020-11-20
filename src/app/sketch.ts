import { Scene } from 'three';
import * as THREE from 'three';

export class SketchManager {
    public scene: Scene;
    constructor() {
        this.scene = new Scene();
    }

    launchCode(code: string) {
        this.scene.clear();

        let func;
        try {
            func = new Function(
                'THREE',
                'scene',
                '"use strict";\n' + code
            );
        } catch (e) {
            console.error('error while creating function: ', e);
            return;
        }

        try {
            func(THREE, this.scene);
        } catch (e) {
            console.error('error while executing function:', e);
        }
    }
}