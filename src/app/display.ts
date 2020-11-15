import { CanvasTexture, ClampToEdgeWrapping, Color, DoubleSide, LinearFilter, LinearMipmapNearestFilter, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";

export default class VRDisplay extends Mesh {
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

    public canvasWidth : number;
    public canvasHeight : number;
    public readonly canvas : HTMLCanvasElement;
    public readonly ctx : CanvasRenderingContext2D;
    // private readonly textarea : HTMLTextAreaElement;

    public texture : CanvasTexture;
    public geometry : PlaneGeometry;

    public primrose : any;

    constructor(
        dpu: number = 350,
        origin: Vector3 = new Vector3(0),
        offsetAngle: number = Math.PI / 2,
        widthAngle: number = Math.PI * 0.2,
        height: number = 5,
        distance: number = 5,
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

        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.bend();
    }

    bend() {
        const plainGeometry = new PlaneGeometry(1, 1, this.segments, 1);

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

        this.canvasWidth = Math.floor(this.texWidth * this.dpu);
        this.canvasHeight = Math.floor(this.texHeight * this.dpu);
        if (this.resize)
            this.resize(this.canvasWidth, this.canvasHeight);
    }
    private procesVertex(t: number): [number, number] {
        return [
            this.origin.x + Math.cos( this.offsetAngle + this.widthAngle * t ) * this.distance,
            this.origin.z + Math.sin( this.offsetAngle + this.widthAngle * t ) * this.distance
        ];
    }

    resize(width: number, height: number) { /* ... */ }
    update() { /* ... */}
}