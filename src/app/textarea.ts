import { Vector3 } from 'three';
import VRDisplay from './display';

// // @ts-ignore
// import { Primrose, Light } from '../../lib/Primrose/js/package/primrose.js';
// const EditorTheme = {
//     name: 'VRSketch Theme (Light)',
//     cursorColor: '#000000',
//     unfocused: 'transparent',
//     currentRowBackColor: 'transparent',
//     selectedBackColor: '#A3D5FF',
//     lineNumbers: {
//         foreColor: '#d4d4d4',
//         fontStyle: 'bold'
//     },
//     regular: {
//         backColor: 'rgba(255, 255, 255, 0.5)',
//         foreColor: '#000000',
//         fontStyle: 'bold'
//     },
//     strings: {
//         foreColor: '#aa9900',
//         fontStyle: 'italic'
//     },
//     regexes: {
//         foreColor: '#aa0099',
//         fontStyle: 'italic'
//     },
//     numbers: {
//         foreColor: '#098658'
//     },
//     comments: {
//         foreColor: '#008000',
//         fontStyle: 'italic'
//     },
//     keywords: {
//         foreColor: '#098658'
//     },
//     functions: {
//         foreColor: '#0000FF',
//         fontWeight: 'bold'
//     },
//     members: {
//         foreColor: '#098658'
//     },
//     error: {
//         foreColor: '#CD3131',
//         fontStyle: 'underline italic'
//     }
// };

export default class Textarea extends VRDisplay {

    // public scaleFactor: number;
    // public primrose: any;

    public textarea: HTMLTextAreaElement;
    public poster;

    constructor(
        dpu: number = 350,
        origin: Vector3 = new Vector3(0),
        offsetAngle: number = Math.PI / 2,
        widthAngle: number = 10,
        height: number = 5,
        distance: number = 5,
        segments: number = 45
    ) {
        // @ts-ignore
        const poster = new window.poster.Poster();
        super(dpu, origin, offsetAngle, widthAngle, height, distance, segments, poster.canvas._canvas);

        this.poster = poster;
        document.body.appendChild(this.poster.el);
        this.textarea = this.poster.el.querySelector('textarea');
        this.poster.language = 'javascript';

        // this.textarea = document.createElement('textarea');
        // document.body.appendChild(this.textarea);
        // this.primrose = new Primrose({
        //     element: this.canvas,
        //     scaleFactor: this.scaleFactor,
        //     tabWidth: 4,
        //     fontSize: 45
        // });
        // this.primrose.theme = EditorTheme;
        // Primrose.add(this, this.primrose);
        // this.primrose.addEventListener('update', () => {
        //     this.ctx.strokeStyle = '#000000';
        //     this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        //     this.texture.needsUpdate = true;
        // });

        this.resize(this.canvasWidth, this.canvasHeight);

        this.focus();
        window.setInterval(this.focus.bind(this), 1000);
        window.addEventListener('mousedown', this.focus.bind(this));
        window.addEventListener('touchstart', this.focus.bind(this));
        window.addEventListener('mouseup', this.focus.bind(this));


        setTimeout(() => {
            console.log(this.textarea);
            this.textarea.addEventListener('change', () => {
                console.log('change');
            })
        }, 1000);
        // this.textarea.addEventListener('keydown', e => alert(e.type + ' ' + e.key));
        // this.textarea.addEventListener('keypress', e => alert(e.type + ' ' + e.key));
        // this.textarea.addEventListener('keyup', e => alert(e.type + ' ' + e.key));

        console.log(this.poster);
    }

    focus() {
        // this.primrose.focus();
        this.textarea.focus();
        // if (this.poster)
        //     this.poster.focus();
    }

    resize(width: number, height: number) {
        if (this.poster) {
            if (this.poster.width !== width)
                this.poster.width = width;
            if (this.poster.height !== height)
                this.poster.height = height;
            this.poster.value += ' ';
        }
        // if (this.primrose) {
        //     this.primrose.setSize(width / this.scaleFactor, height / this.scaleFactor);
        //     // this.primrose.update();
        // }
    }

    update() {

        this.texture.needsUpdate = true;
    }
}