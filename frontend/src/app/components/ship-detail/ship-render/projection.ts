import { GL } from './gl';
import { mat4 } from 'gl-matrix';

export interface BoundingBox {
    min: [number, number, number];
    max: [number, number, number];
}

export class Projection {
    private lastX: number;
    private lastY: number;
    private mouse = false;

    public projectionMatrix: mat4;
    public modelViewMatrix: mat4;
    public normalMatrix: mat4;

    public rotationX = Math.PI;
    public rotationY = 0;
    public rotationZ = 0;

    public camX = 0;
    public camY = 0;
    public camZ = 0;

    constructor(private canvas: HTMLCanvasElement) {
        this.registerEvents();
    }

    update() {
        this.createMatrices();
    }

    set boundingBox(vertexBuffer: Float32Array[]) {
        const bounds = this.calculateBoundingBox(vertexBuffer);

        console.log(bounds);

        this.camX = 0; // (bounds.min[0] + bounds.max[0]) / 2;
        this.camY = 0; // (bounds.min[1] + bounds.max[1]) / 2;
        this.camZ = bounds.min[2] - 10;
    }

    private calculateBoundingBox(vertices: Float32Array[]): BoundingBox {
        let [maxX, maxY, maxZ] = [-Infinity, -Infinity, -Infinity];
        let [minX, minY, minZ] = [Infinity, Infinity, Infinity];

        for (const mesh of vertices) {
            for (let i = 0; i < mesh.length / 3; i++) {
                const x = mesh[i * 3];
                const y = mesh[i * 3 + 1];
                const z = mesh[i * 3 + 2];

                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                maxZ = Math.max(maxZ, z);

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                minZ = Math.min(minZ, z);
            }
        }

        return {min: [minX, minY, minZ], max: [maxX, maxY, maxZ]}
    }

    private createMatrices() {
        const fieldOfView = 45 * Math.PI / 180;   // in radians
        const aspect = GL.gl.canvas.clientWidth / GL.gl.canvas.clientHeight;
        const zNear = 0.01;
        const zFar = 1000.0;

        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);

        this.modelViewMatrix = mat4.create();

        mat4.translate(
            this.modelViewMatrix,
            this.modelViewMatrix,
            [this.camX, this.camY, this.camZ],
        );

        mat4.rotate(
            this.modelViewMatrix,
            this.modelViewMatrix,
            this.normalizeAngle(this.rotationX),
            [0, 1, 0],
        );

        mat4.rotate(
            this.modelViewMatrix,
            this.modelViewMatrix,
            this.normalizeAngle(this.rotationY),
            [1, 0, 0],
        );

        mat4.rotate(
            this.modelViewMatrix,
            this.modelViewMatrix,
            this.normalizeAngle(this.rotationZ),
            [0, 0, 1],
        );

        this.normalMatrix = mat4.create();
        mat4.invert(this.normalMatrix, this.modelViewMatrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
    }

    private normalizeAngle(angle: number) {
        while (angle < 0) {
            angle += 360 * 0.0174533;
        }
        while (angle > 360 * 0.0174533) {
            angle -= 360 * 0.0174533;
        }
        return angle
    }

    private registerEvents() {
        this.canvas.onmousedown = () => this.handleMouseDown();
        this.canvas.onmouseup = () => this.handleMouseUp();
        this.canvas.onmouseleave = () => this.handleMouseUp();
        this.canvas.onmouseout = () => this.handleMouseUp();
        this.canvas.onmousemove = (event: MouseEvent) => this.handleMouseMove(event);
        this.canvas.onmousewheel = (event: MouseWheelEvent) => this.handleWheel(event);
    }

    private handleMouseDown() {
        this.mouse = true;
    }

    private handleMouseUp() {
        this.mouse = false;
        this.lastX = undefined;
        this.lastY = undefined;
    }

    private handleWheel(event: MouseWheelEvent) {
        const delta = event.deltaY / 1000;
        this.camZ += delta;
    }

    private handleMouseMove(event: MouseEvent) {
        if (!this.mouse) { return; }
        if (!this.lastX || !this.lastY) {
            this.lastX = event.pageX;
            this.lastY = event.pageY;
            return;
        }

        const deltaX = (event.pageX - this.lastX) / 100;
        const deltaY = (event.pageY - this.lastY) / 100;

        this.rotationX += deltaX;
        this.rotationY -= deltaY;

        this.lastX = event.pageX;
        this.lastY = event.pageY;
    }
}
