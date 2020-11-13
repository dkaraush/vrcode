import { CanvasTexture, Color, DoubleSide, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";
import * as hljs from 'highlight.js';

export default class Textarea extends Mesh {
    public origin: Vector3;
    public offsetAngle: number;
    public distance: number;
    public widthAngle: number;
    public height: number;
    private segments: number;

    // dots per unit (threejs unit)
    private readonly dpu;
    private texWidth : number;
    private texHeight : number;

    public background: string;
    private readonly canvas : HTMLCanvasElement;
    private readonly ctx : CanvasRenderingContext2D;
    private readonly textarea : HTMLTextAreaElement;

    public texture : CanvasTexture;
    public geometry : PlaneGeometry;

    constructor(
        origin: Vector3 = new Vector3(0),
        offsetAngle: number = Math.PI / 2,
        widthAngle: number = 10,
        height: number = 5,
        distance: number = 5,
        segments: number = 45,
        background: string = 'rgba(255, 255, 255, 0.2)'
    ) {
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        const texture = new CanvasTexture(canvas);

        const geometry = new PlaneGeometry(1, 1., segments, 1);
        const material = new MeshPhongMaterial({
            transparent: true,
            opacity: 0.99,
            side: DoubleSide,
            map: texture,
            alphaTest: 0.1
        });

        super(geometry, material);

        this.dpu = 100;

        this.background = background;
        this.origin = origin;
        this.height = height;
        this.widthAngle = widthAngle;
        this.offsetAngle = offsetAngle;
        this.distance = distance;
        this.segments = segments;
        this.texWidth = (2 * Math.PI * this.distance) * (this.widthAngle / (Math.PI * 2));
        this.texHeight = this.height;

        this.geometry = geometry;
        this.material = material;
        this.texture = texture;

        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.textarea = this.initTextarea();

        this.bend();

        console.log(hljs.highlightAuto(`
            var a = 1;
            console.log( a );
            if (a > 3)
                console.log('bigger than 3');
        `))
    }

    bend() {
        const plainGeometry = new PlaneGeometry(1, 1., this.segments, 1);

        for (let i = 0; i < plainGeometry.vertices.length / 2; ++i) {
            const vertex1 = this.geometry.vertices[2*i];
            const t1 = plainGeometry.vertices[2*i].x;

            const vertex2 = this.geometry.vertices[2*i+1];
            const t2 = plainGeometry.vertices[2*i+1].x;

            const [x1, z1] = this.procesVertex(t1);
            vertex1.x = x1;
            vertex1.z = z1;

            const [x2, z2] = this.procesVertex(t2);
            vertex2.x = x2;
            vertex2.z = z2;
        }
        for (const vertex of this.geometry.vertices)
            vertex.y = this.origin.y + Math.sign(vertex.y) * (this.height / 2);

        this.geometry.verticesNeedUpdate = true;

        // canvas
        this.texWidth = (2 * Math.PI * this.distance) * (this.widthAngle / (Math.PI * 2));
        this.texHeight = this.height;

        const canvasWidth = Math.floor(this.texWidth * this.dpu);
        const canvasHeight = Math.floor(this.texHeight * this.dpu);
        if (this.canvas.width !== canvasWidth)
            this.canvas.width = canvasWidth;
        if (this.canvas.height !== canvasHeight)
            this.canvas.height = canvasHeight;
    }
    private procesVertex(t: number): [number, number] {
        return [
            this.origin.x + Math.cos( this.offsetAngle + this.widthAngle * t ) * this.distance,
            this.origin.z + Math.sin( this.offsetAngle + this.widthAngle * t ) * this.distance
        ];
    }

    private initTextarea() : HTMLTextAreaElement {
        const textarea = document.createElement('textarea');

        textarea.addEventListener('keydown', e => {
            if (e.keyCode === 9 && e.preventDefault)
                e.preventDefault();
        });

        document.body.appendChild(textarea);
        this.focus();
        window.addEventListener('mousedown', this.focus.bind(this));
        window.addEventListener('touchstart', this.focus.bind(this));
        window.addEventListener('mouseup', this.focus.bind(this));

        return textarea;
    }

    focus() {
        if (this.textarea)
            this.textarea.focus();
    }

    update() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);
        this.ctx.fillStyle = this.background;
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.fillStyle = 'black';
        this.ctx.font = '24px monospace';

        // console.log(hljs.highlightAuto(this.textarea.value))
        this.ctx.fillText(this.textarea.value, 0, 24);

        this.texture.needsUpdate = true;
    }
}