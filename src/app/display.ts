import { borderTopRightRadius } from "html2canvas/dist/types/css/property-descriptors/border-radius";
import { CanvasTexture, ClampToEdgeWrapping, Color, DoubleSide, LinearFilter, LinearMipmapNearestFilter, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";

export const isVRDisplay = (a: any) : a is VRDisplay =>
    typeof a === 'object' && a.isVRDisplay;

export default class VRDisplay extends Mesh {
    public isVRDisplay: boolean;

    public locked: boolean;

    public width: number;
    public height: number;
    public curviness: number;
    private segments: number;

    // dots per unit (threejs unit)
    private readonly dpu;
    private texWidth : number;
    private texHeight : number;

    public canvasWidth : number;
    public canvasHeight : number;
    public readonly canvas : HTMLCanvasElement;
    public readonly ctx : CanvasRenderingContext2D;
    // private readonly textarea : HTMLTextAreaElement;

    public texture : CanvasTexture;
    public geometry : PlaneGeometry;

    public primrose : any;

    constructor(
        width: number = 2,
        height: number = 1,
        curviness: number = 0,
        dpu: number = 350,
        segments: number = 45,
        canvas?: HTMLCanvasElement
    ) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
        }

        const texture = Object.assign(
            new CanvasTexture(canvas),
            {
                wrapS: ClampToEdgeWrapping,
                wrapT: ClampToEdgeWrapping,
                minFilter: LinearMipmapNearestFilter,
                magFilter: LinearFilter,
                anisotropy: 8
            }
        );;

        const geometry = new PlaneGeometry(1, 1., segments, 1);
        const material = new MeshPhongMaterial({
            transparent: true,
            opacity: 0.99,
            side: DoubleSide,
            map: texture,
            alphaTest: 0.1
        });

        super(geometry, material);

        this.dpu = dpu;
        this.locked = false;
        this.isVRDisplay = true

        this.width = width;
        this.height = height;
        this.curviness = curviness;
        this.segments = segments;
        // this.texWidth = (2 * Math.PI * this.distance) * (this.widthAngle / (Math.PI * 2));
        this.texWidth = this.width;
        this.texHeight = this.height;

        this.geometry = geometry;
        this.material = material;
        this.texture = texture;

        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;

        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.resize();
    }

    resize() {
        const plainGeometry = new PlaneGeometry(1, 1, this.segments, 1);

        for (let i = 0; i < plainGeometry.vertices.length / 2; ++i) {
            const vertex1 = this.geometry.vertices[2*i];
            const t1 = plainGeometry.vertices[2*i].x;

            const vertex2 = this.geometry.vertices[2*i+1];
            const t2 = plainGeometry.vertices[2*i+1].x;

            vertex1.z = this.calcZ(t1);
            vertex2.z = this.calcZ(t2);
        }
        // for (const vertex of this.geometry.vertices)
        //     vertex.y = this.origin.y + Math.sign(vertex.y) * (this.height / 2);

        this.scale.x = this.width;
        this.scale.y = this.height;
        this.geometry.verticesNeedUpdate = true;

        // canvas
        // this.texWidth = (2 * Math.PI * this.distance) * (this.widthAngle / (Math.PI * 2));
        this.texWidth = this.width;
        this.texHeight = this.height;

        this.canvasWidth = Math.floor(this.texWidth * this.dpu);
        this.canvasHeight = Math.floor(this.texHeight * this.dpu);
        if (this.resizeCanvas)
            this.resizeCanvas(this.canvasWidth, this.canvasHeight);
    }
    // private procesVertex(t: number): [number, number] {
    //     return [
    //         this.origin.x + Math.cos( this.offsetAngle + this.widthAngle * t ) * this.distance,
    //         this.origin.z + Math.sin( this.offsetAngle + this.widthAngle * t ) * this.distance
    //     ];
    // }

    private calcZ(t: number) {
        return -Math.sqrt( 1 - 4 * t * t ) * this.curviness;
    }

    resizeCanvas(width: number, height: number) { /* ... */ }
    update() { /* ... */}
}