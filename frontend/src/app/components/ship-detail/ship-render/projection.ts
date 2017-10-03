import { LineProgram } from './line-program';
import { RenderConstants } from './constants';
import { GL } from './gl';
import { mat4, vec3 } from 'gl-matrix';

export interface BoundingBox {
    min: [number, number, number];
    max: [number, number, number];
}

export class Projection {
    private lastX: number;
    private lastY: number;
    private mouse = false;
    private autoRotate = true;
    private mode: 'rotate' | 'move';
    private bounds: BoundingBox;

    private fov = 45;
    private zFar = 1000;

    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;

    public projectionMatrix: mat4;
    public modelViewMatrix: mat4;
    public normalMatrix: mat4;
    public boundingMatrix: mat4;

    public rotationX = 135 * (Math.PI / 180);
    public rotationY = -10 * (Math.PI / 180);
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
        this.bounds = this.calculateBoundingBox(vertexBuffer);

        this.setCameraOffset();
        this.calculateBoundingMatrix();
    }

    private setCameraOffset() {
        const maxBoxSize = Math.max(
            this.bounds.max[0] - this.bounds.min[0],
            this.bounds.max[1] - this.bounds.min[1],
        );
        this.camZ = -((maxBoxSize / (2 * Math.tan(this.fov / 2)))) + this.bounds.min[2];
        this.camX = (this.bounds.min[0] + this.bounds.max[0]) / 2;
        this.camY = (this.bounds.min[1] + this.bounds.max[1]) / 2;

        const extremes = [
            this.bounds.max[0],
            Math.abs(this.bounds.min[0]),
            this.bounds.max[1],
            Math.abs(this.bounds.min[1]),
            this.bounds.max[2],
            Math.abs(this.bounds.min[2]),
        ].sort();
        this.zFar = Math.max(
            Math.sqrt(Math.pow(extremes[0], 2) * Math.pow(extremes[1], 2)) * 2,
            1000,
        );
    }

    private calculateBoundingMatrix() {
        const size = vec3.fromValues(
            this.bounds.max[0] - this.bounds.min[0],
            this.bounds.max[1] - this.bounds.min[1],
            this.bounds.max[2] - this.bounds.min[2],
        );
        const center = vec3.fromValues(
            (this.bounds.max[0] + this.bounds.min[0]) / 2,
            (this.bounds.max[1] + this.bounds.min[1]) / 2,
            (this.bounds.max[2] + this.bounds.min[2]) / 2,
        );

        const output = mat4.create();
        mat4.identity(output);

        mat4.translate(output, output, center);
        mat4.scale(output, output, size);
        // mat4.multiply(multiplied, translated, scaled)
        this.boundingMatrix = output;
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
        const fieldOfView = this.fov * Math.PI / 180;   // in radians
        const aspect = GL.gl.canvas.clientWidth / GL.gl.canvas.clientHeight;
        const zNear = 1;
        const zFar = this.zFar;

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

        if (this.autoRotate) {
            this.rotationX += 0.01;
        }
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
        this.canvas.onmousedown = (event: MouseEvent) => this.handleMouseDown(event);
        this.canvas.onmouseup = (event: MouseEvent) => this.handleMouseUp(event, true);
        this.canvas.onmouseleave = (event: MouseEvent) => this.handleMouseUp(event);
        this.canvas.onmouseout = (event: MouseEvent) => this.handleMouseUp(event);
        this.canvas.onmousemove = (event: MouseEvent) => this.handleMouseMove(event);
        this.canvas.onmousewheel = (event: MouseWheelEvent) => this.handleWheel(event);
        this.canvas.oncontextmenu = (event: MouseEvent) => this.prevent(event);
    }

    private prevent(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }

    private handleMouseDown(event: MouseEvent) {
        this.prevent(event);
        this.mouse = true;
        this.autoRotate = false;
        this.mode = event.button === 0 ? 'rotate' : 'move';
    }

    private handleMouseUp(event: MouseEvent, prevent = false) {
        if (prevent) {
            this.prevent(event);
        }
        this.mouse = false;
        this.lastX = undefined;
        this.lastY = undefined;
    }

    private handleWheel(event: MouseWheelEvent) {
        const delta = event.deltaY / 100;
        this.camZ += delta;
    }

    private handleMouseMove(event: MouseEvent) {
        if (!this.mouse) { return; }
        if (!this.lastX || !this.lastY) {
            this.lastX = event.pageX;
            this.lastY = event.pageY;
            return;
        }

        const deltaX = (event.pageX - this.lastX);
        const deltaY = (event.pageY - this.lastY);

        if (this.mode === 'rotate') {
            this.rotationX += deltaX / 100;
            this.rotationY -= deltaY / 100;
        } else {
            this.camX +=  deltaX / 20;
            this.camY -=  deltaY / 20;
        }

        this.lastX = event.pageX;
        this.lastY = event.pageY;
    }
}
