import { RenderConstants } from './constants';
import { GL } from './gl';
import { ShipModel } from './../../../services/ship-model';
export class Buffers {
    private vertexBuffers: WebGLBuffer[];
    private normalBuffers: WebGLBuffer[];
    private indexBuffers: WebGLBuffer[];
    private uvBuffers: WebGLBuffer[];
    private boundingVertexBuffer: WebGLBuffer;
    private boundingIndexBuffer: WebGLBuffer;

    public loaded = false;

    constructor(private model: ShipModel) {
        this.indexBuffers = [];
        this.vertexBuffers = [];
        this.normalBuffers = [];
        this.uvBuffers = [];

        this.createBuffers();
    }

    bind(index: number) {
        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this.vertexBuffers[index]);
        GL.gl.vertexAttribPointer(RenderConstants.aVertexPosition, 3, GL.gl.FLOAT, false, 0, 0);
        GL.gl.enableVertexAttribArray(RenderConstants.aVertexPosition);

        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this.normalBuffers[index]);
        GL.gl.vertexAttribPointer(RenderConstants.aVertexNormal, 3, GL.gl.FLOAT, false, 0, 0);
        GL.gl.enableVertexAttribArray(RenderConstants.aVertexNormal);

        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this.uvBuffers[index]);
        GL.gl.vertexAttribPointer(RenderConstants.aTextureCoord, 2, GL.gl.FLOAT, false, 0, 0);
        GL.gl.enableVertexAttribArray(RenderConstants.aTextureCoord);

        GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffers[index]);
    }

    bindBounding() {
        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this.boundingVertexBuffer);
        GL.gl.vertexAttribPointer(RenderConstants.aVertexPosition, 3, GL.gl.FLOAT, false, 0, 0);
        GL.gl.enableVertexAttribArray(RenderConstants.aVertexPosition);

        GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, this.boundingIndexBuffer);
    }

    destroy() {
        this.loaded = false;

        for (const buffer of this.vertexBuffers) {
            GL.gl.deleteBuffer(buffer);
        }
        for (const buffer of this.indexBuffers) {
            GL.gl.deleteBuffer(buffer);
        }
        for (const buffer of this.normalBuffers) {
            GL.gl.deleteBuffer(buffer);
        }
        for (const buffer of this.uvBuffers) {
            GL.gl.deleteBuffer(buffer);
        }
        GL.gl.deleteBuffer(this.boundingVertexBuffer);
        GL.gl.deleteBuffer(this.boundingIndexBuffer);

        this.indexBuffers = [];
        this.vertexBuffers = [];
        this.normalBuffers = [];
        this.uvBuffers = [];
    }

    private createBuffers() {
        for (let i = 0; i < this.model.numMeshes; i++) {
            const vertices = this.model.vertexBuffer[i];
            const uvs = this.model.uvBuffer[i];
            const normals = this.flattenNormals(this.model.normalBuffer[i]);

            const vertexCount = vertices.length / 3;
            const indices = this.getIndexArray(vertexCount);

            const vertexBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, vertexBuffer);
            GL.gl.bufferData(GL.gl.ARRAY_BUFFER, vertices, GL.gl.STATIC_DRAW);
            this.vertexBuffers.push(vertexBuffer);

            const uvBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, uvBuffer);
            GL.gl.bufferData(GL.gl.ARRAY_BUFFER, uvs, GL.gl.STATIC_DRAW);
            this.uvBuffers.push(uvBuffer);

            const normalBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, normalBuffer);
            GL.gl.bufferData(GL.gl.ARRAY_BUFFER, normals, GL.gl.STATIC_DRAW);
            this.normalBuffers.push(normalBuffer);

            const indexBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            GL.gl.bufferData(GL.gl.ELEMENT_ARRAY_BUFFER, indices, GL.gl.STATIC_DRAW);
            this.indexBuffers.push(indexBuffer);
        }

        this.createBoundingBuffer();
        this.loaded = this.vertexBuffers.length > 0;
    }

    private createBoundingBuffer() {
        const vertices = new Float32Array([
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            -0.5, -0.5, 0.5,
            -0.5, -0.5, -0.5,
        ]);

        const indices = this.getIndexArray(vertices.length / 3);

        const vertexBuffer = GL.gl.createBuffer();
        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, vertexBuffer);
        GL.gl.bufferData(GL.gl.ARRAY_BUFFER, vertices, GL.gl.STATIC_DRAW);
        this.boundingVertexBuffer = vertexBuffer;

        const indexBuffer = GL.gl.createBuffer();
        GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        GL.gl.bufferData(GL.gl.ELEMENT_ARRAY_BUFFER, indices, GL.gl.STATIC_DRAW);
        this.boundingIndexBuffer = indexBuffer;

        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, null);
        GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    private flattenNormals(normals: Float32Array[]) {
        const output = new Float32Array(normals.length * 3);

        for (let i = 0; i < normals.length; i++) {
            output[i * 3] = normals[i][0];
            output[i * 3 + 1] = normals[i][1];
            output[i * 3 + 2] = normals[i][2];
        }

        return output;
    }

    private getIndexArray(length: number) {
        const arr = new Uint16Array(length);
        for (let x = 0; x < arr.length; x++) {
            arr[x] = x;
        }
        return arr;
    }

}
