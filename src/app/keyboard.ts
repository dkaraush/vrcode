import { BoxGeometry, BufferGeometry, BufferGeometryLoader, Color, Geometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, ObjectLoader, PlaneGeometry, TextureLoader, Vector3 } from "three";

import * as KeyGeometryJSON from '../KeyGeometry.json';

interface KeyData {
    code: string;
    primary?: string;
    secondary?: string;
    width?: number;
}

export const isVRKeyboard = (a: any) : a is VRKeyboard =>
    typeof a === 'object' && a.isVRKeyboard;

export const getVRKeyboard = (a: Object3D | Group | null) : VRKeyboard | null => {
    if (a === null)
        return null;
    if (isVRKeyboard(a))
        return a;
    return getVRKeyboard(a.parent);
}

export class VRKeyboard extends Group {

    public isVRKeyboard = true;

    private TextureLoader = new TextureLoader();
    private KeyGeometry = new BufferGeometryLoader().parse(KeyGeometryJSON);

    private readonly keyWidth = 1;
    private readonly keyGap = 0.1;
    private state: {[code: string]: boolean} = {};
    private keys: {[code: string]: Object3D} = {};

    public board: Object3D | undefined;

    constructor() {
        super();

        const [width, height] = this.keyboardTable([
            [
                { code: 'Backquote', primary: '`', secondary: '~' },
                { code: 'Digit1', primary: '1', secondary: '!' },
                { code: 'Digit2', primary: '2', secondary: '@' },
                { code: 'Digit3', primary: '3', secondary: '#' },
                { code: 'Digit4', primary: '4', secondary: '$' },
                { code: 'Digit5', primary: '5', secondary: '%' },
                { code: 'Digit6', primary: '6', secondary: '^' },
                { code: 'Digit7', primary: '7', secondary: '&' },
                { code: 'Digit8', primary: '8', secondary: '*' },
                { code: 'Digit9', primary: '9', secondary: '(' },
                { code: 'Digit0', primary: '0', secondary: ')' },
                { code: 'Minus', primary: '-', secondary: '_' },
                { code: 'Equal', primary: '=', secondary: '+' },
                { code: '0', primary: 'Backspace', width: 2 },
            ],
            [
                { code: 'Tab', primary: 'Tab', width: 1.4 },
                { code: 'KeyQ', primary: 'Q' },
                { code: 'KeyW', primary: 'W' },
                { code: 'KeyE', primary: 'E' },
                { code: 'KeyR', primary: 'R' },
                { code: 'KeyT', primary: 'T' },
                { code: 'KeyY', primary: 'Y' },
                { code: 'KeyU', primary: 'U' },
                { code: 'KeyI', primary: 'I' },
                { code: 'KeyO', primary: 'O' },
                { code: 'KeyP', primary: 'P' },
                { code: 'BracketLeft', primary: '[', secondary: '{' },
                { code: 'BracketRight', primary: ']', secondary: '}' },
                { code: 'Backslash', primary: '\\', secondary: '|', width: 1.6 }
            ],
            [
                { code: 'CapsLock', primary: 'Caps Lock', width: 1.6 },
                { code: 'KeyA', primary: 'A' },
                { code: 'KeyS', primary: 'S' },
                { code: 'KeyD', primary: 'D' },
                { code: 'KeyF', primary: 'F' },
                { code: 'KeyG', primary: 'G' },
                { code: 'KeyH', primary: 'H' },
                { code: 'KeyJ', primary: 'J' },
                { code: 'KeyK', primary: 'K' },
                { code: 'KeyL', primary: 'L' },
                { code: 'Semicolon', primary: ';', secondary: ':' },
                { code: 'Quote', primary: '\'', secondary: '"' },
                { code: 'Enter', primary: 'Enter', width: 2.5 }
            ],
            [
                { code: 'ShiftLeft', primary: 'Shift', width: 2.1 },
                { code: 'KeyZ', primary: 'Z' },
                { code: 'KeyX', primary: 'X' },
                { code: 'KeyC', primary: 'C' },
                { code: 'KeyV', primary: 'V' },
                { code: 'KeyB', primary: 'B' },
                { code: 'KeyN', primary: 'N' },
                { code: 'KeyM', primary: 'M' },
                { code: 'Key,', primary: ',', secondary: '<' },
                { code: 'Key.', primary: '.', secondary: '>' },
                { code: 'Semicolon', primary: '/', secondary: '?' },
                { code: 'ShiftRight', primary: 'Shift', width: 3.1 }
            ],
            [
                { code: 'ControlLeft', primary: 'Ctrl', width: 1.3 },
                { code: 'MetaLeft', primary: '', width: 0.9 },
                { code: 'AltLeft', primary: 'Alt', width: 1.3 },
                { code: 'Space', primary: '', width: 8.7 },
                { code: 'AltRight', primary: 'Alt', width: 1.3 },
                { code: 'MetaRight', primary: '', width: 0.9 },
                { code: 'ControlRight', primary: 'Ctrl', width: 1.3 },
            ],
        ]);

        this.addBoard(width, height);

        this.scale.setScalar(0.02);
        this.position.set(0, 0.7, 0);

        this.listen();
    }

    private addBoard(width: number, depth: number) {
        width += this.keyGap * 3;
        depth += this.keyGap * 3;
        this.board = new Mesh(
            new BoxGeometry(width, 0.6, depth),
            new MeshLambertMaterial({ color: new Color(0x333333) })
        );

        this.board.position.sub(
            new Vector3(
                this.keyGap,
                0.7,
                this.keyGap
            )
        );

        this.add(this.board);
    }

    private keyboardTable(table: KeyData[][]) : [number, number] {
        const depth = table.length * (1 + this.keyGap) - this.keyGap;
        let z = 0;
        let maxWidth = 0;
        for (const row of table) {
            const width = this.addRow(z + 0.5 - depth / 2, row);
            if (width > maxWidth)
                maxWidth = width;
            z += 1 + this.keyGap;
        }
        return [maxWidth, depth]
    }

    private addRow(z: number, row: KeyData[]): number {
        let x = 0;
        const rowWidth = row.map(({width}) => width || 1).reduce((a, w) => a + w, 0) + (row.length - 1) * this.keyGap;
        for (const {primary, secondary, width = 1, code} of row) {
            const object = this.makeKey(
                new Vector3(x + width / 2 - rowWidth / 2, 0, z),
                primary,
                secondary,
                width
            );
            if (code)
                this.keys[code] = object;
            this.add(object);
            x += width + this.keyGap;
        }
        return rowWidth;
    }

    private makeKey(
        pos: Vector3,
        primary?: string,
        secondary?: string,
        width: number = 1
    ) : Object3D {
        let geometry : BufferGeometry | Geometry = this.KeyGeometry.clone();
        if (width !== 1) {
            geometry = new Geometry().fromBufferGeometry(geometry);
            for (const vertex of geometry.vertices)
                vertex.x += Math.sign(vertex.x) * (width - 1);
        }

        const keystroke = new Mesh(
            geometry,
            new MeshBasicMaterial({ color: new Color(0x000000) })
        );

        if (primary)
            primary = primary.trim();
        if (secondary)
            secondary = secondary.trim();

        if (primary || secondary) {
            const group = new Group();
            group.add(keystroke);

            // drawing texture for key
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            canvas.width = width * 64;
            canvas.height = 64;

            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '15px Arial';
            if (primary && secondary) {
                const primaryWidth = ctx.measureText(primary).width;
                const secondaryWidth = ctx.measureText(secondary).width;

                ctx.fillText(secondary, 24 - secondaryWidth / 2, 24);
                ctx.fillText(primary, 24 - primaryWidth / 2, 50);
            } else {
                if (primary) {
                    ctx.fillText(primary, 16, 36);
                }
                if (secondary) {
                    const textWidth = ctx.measureText(secondary).width;
                    ctx.fillText(secondary, 16, 24);
                }
            }

            this.TextureLoader.load(
                canvas.toDataURL(),
                map => {
                    canvas.remove();
                    const plane = new Mesh(
                        new PlaneGeometry(width * 2, 2, 1, 1),
                        new MeshBasicMaterial({ map, transparent: true })
                    );
                    plane.position.set(0, 0.31, 0);
                    plane.rotation.set(-Math.PI/2, 0, 0);
                    group.add(plane);
                }
            )

            group.position.copy(pos);
            group.scale.setScalar(0.5);
            // group.scale.setScalar(this.keyWidth / 2);

            return group;
        }

        keystroke.position.copy(pos);
        keystroke.scale.setScalar(0.5);
        // keystroke.scale.setScalar(this.keyWidth / 2);
        return keystroke;
    }

    private listen() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keypress', this.onKeyPress.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    private onKeyDown(e: KeyboardEvent) {
        this.state[e.code] = true;
        if (this.keys[e.code])
            this.select(this.keys[e.code]);
    }
    private onKeyPress(e: KeyboardEvent) {
        this.state[e.code] = true;
        if (this.keys[e.code])
            this.select(this.keys[e.code]);
    }
    private onKeyUp(e: KeyboardEvent) {
        this.state[e.code] = false;
        if (this.keys[e.code])
            this.deselect(this.keys[e.code]);
    }


    private select(obj: Object3D) {
        obj.position.y = -0.1;
        this.changeKeyColor(obj, 0x000011);
    }
    private deselect(obj: Object3D) {
        obj.position.y = -0;
        this.changeKeyColor(obj, 0x000000);
    }
    private changeKeyColor(obj: Object3D, color: number) {
        let key;
        if (obj.children && obj.children.length === 2) {
            key = obj.children[0];
        } else {
            key = obj;
        }
        ((key as Mesh).material as MeshBasicMaterial).color = new Color(color);
    }
}