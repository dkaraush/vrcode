import { BoxGeometry, Color, Mesh,MeshDepthMaterial, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, MeshToonMaterial } from 'three';

export class Box extends Mesh {
  constructor(size: number, color: Color) {
    super();
    this.geometry = new BoxGeometry(size, size, size);
    this.material = new MeshLambertMaterial({ color });
  }
}
