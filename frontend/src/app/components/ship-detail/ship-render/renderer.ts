import { Program } from './program';
import { StaticService } from './../../../services/services';
import { ShipModel } from './../../../services/ship-model';
import { mat4 } from 'gl-matrix';
import { GL } from './gl';
import { Projection, BoundingBox } from './projection';

export class Renderer {
    private _model: ShipModel;
    private projection: Projection;

    private buffersLoaded = false;
    private renderStated = false;
    private context: WebGLRenderingContext;

    private texProgram: Program;
    private flatProgram: Program;
    private lineProgram: Program;
    private vertexBuffers: WebGLBuffer[];
    private indexBuffers: WebGLBuffer[];
    private normalBuffers: WebGLBuffer[];

    private aVertexPosition: number;
    private aVertexNormal: number;
    private uProjectionMatrix: WebGLUniformLocation;
    private uModelViewMatrix: WebGLUniformLocation;
    private uNormalMatrix: WebGLUniformLocation;
    private uLineProjectionMatrix: WebGLUniformLocation;
    private uLineModelViewMatrix: WebGLUniformLocation;

    public mode: 'flat' | 'tex' = 'flat';

    constructor(private canvas: HTMLCanvasElement, private staticServ: StaticService) {
        this.indexBuffers = [];
        this.vertexBuffers = [];
        this.normalBuffers = [];
    }

    private createContext() {
        try {
            GL.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

            this.projection = new Projection(this.canvas);
            this.projection.boundingBox = this._model.vertexBuffer;

            console.log('webgl context okay');
        } catch (e) {
            console.error('no webgl context!', e);
        }
    }

    private get programsLoaded() {
         /* this.texProgram.loaded && */
        return this.buffersLoaded && this.flatProgram.loaded && this.lineProgram.loaded;
    }

    private get sizeValid() {
        return GL.gl.canvas.clientWidth > 0 && GL.gl.canvas.clientHeight > 0;
    }

    get initialized() {
        return !!GL.gl && this.programsLoaded;
    }

    set model(model: ShipModel) {
        if (model === undefined) {
            return;
        }

        if (!this._model || this._model.id !== model.id || this._model.lod !== model.lod) {
            console.log('create new model');
            this._model = model;

            this.destroy();
            this.createContext();
            this.loadPrograms();
            this.createBuffers();

            this.startRenderLoop();
        }
    }

    resize(height: number, width: number) {
        if (!this.initialized) { return; };

        this.canvas.width  = width;
        this.canvas.height = height;

        GL.gl.viewport(0, 0, GL.gl.canvas.width, GL.gl.canvas.height);
    }

    destroy() {
        if (!GL.gl) { return; }
        this.deleteBuffers();

        this.flatProgram.destroy();
        this.lineProgram.destroy();
        GL.gl = undefined;
    }

    private deleteBuffers() {
        this.buffersLoaded = false;
        this.renderStated = false;

        for (const buffer of this.vertexBuffers) {
            GL.gl.deleteBuffer(buffer);
        }
        for (const buffer of this.indexBuffers) {
            GL.gl.deleteBuffer(buffer);
        }
        for (const buffer of this.normalBuffers) {
            GL.gl.deleteBuffer(buffer);
        }

        this.indexBuffers = [];
        this.vertexBuffers = [];
        this.normalBuffers = [];
    }

    private startRenderLoop() {
        if (this.renderStated) {
            return;
        }
        this.renderStated = true;
        this.drawFrame();
    }

    private createBuffers() {
        for (let i = 0; i < this._model.numMeshes; i++) {
            const vertices = this._model.vertexBuffer[i];
            const normals = this.flattenNormals(this._model.normalBuffer[i]);

            const vertexCount = vertices.length / 3;
            const indices = this.getIndexArray(vertexCount);

            const vertexBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, vertexBuffer);
            GL.gl.bufferData(GL.gl.ARRAY_BUFFER, vertices, GL.gl.STATIC_DRAW);

            this.vertexBuffers.push(vertexBuffer);

            const normalBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, normalBuffer);
            GL.gl.bufferData(GL.gl.ARRAY_BUFFER, normals, GL.gl.STATIC_DRAW);

            this.normalBuffers.push(normalBuffer);

            const indexBuffer = GL.gl.createBuffer();
            GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            GL.gl.bufferData(GL.gl.ELEMENT_ARRAY_BUFFER, indices, GL.gl.STATIC_DRAW);

            this.indexBuffers.push(indexBuffer);
        }

        this.buffersLoaded = this.vertexBuffers.length > 0;
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

    private drawFrame() {
        if (!this.initialized || !this.sizeValid) {
            setTimeout(() => this.drawFrame(), 100);
            return;
        };
        this.projection.update();

        GL.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        GL.gl.clearDepth(1.0);
        GL.gl.enable(GL.gl.DEPTH_TEST);
        GL.gl.depthFunc(GL.gl.LEQUAL);

        GL.gl.clear(GL.gl.COLOR_BUFFER_BIT);

        const prog = this.getProgram();

        for (let i = 0; i < this._model.numMeshes; i++) {
            const vertexCount = this._model.vertexBuffer[i].length / 3;

            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this.vertexBuffers[i]);
            GL.gl.vertexAttribPointer(this.aVertexPosition, 3, GL.gl.FLOAT, false, 0, 0);
            GL.gl.enableVertexAttribArray(this.aVertexPosition);

            GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this.normalBuffers[i]);
            GL.gl.vertexAttribPointer(this.aVertexNormal, 3, GL.gl.FLOAT, false, 0, 0);
            GL.gl.enableVertexAttribArray(this.aVertexNormal);

            GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffers[i]);

            GL.gl.useProgram(prog);

            GL.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projection.projectionMatrix);
            GL.gl.uniformMatrix4fv(this.uModelViewMatrix, false, this.projection.modelViewMatrix);
            GL.gl.uniformMatrix4fv(this.uNormalMatrix, false, this.projection.normalMatrix);

            // GL.gl.drawElements(GL.gl.TRIANGLES, vertexCount, GL.gl.UNSIGNED_SHORT, 0);
            GL.gl.drawElements(GL.gl.TRIANGLES, vertexCount, GL.gl.UNSIGNED_SHORT, 0);

            GL.gl.useProgram(this.lineProgram.program);

            GL.gl.uniformMatrix4fv(this.uLineProjectionMatrix, false, this.projection.projectionMatrix);
            GL.gl.uniformMatrix4fv(this.uLineModelViewMatrix, false, this.projection.modelViewMatrix);
            GL.gl.drawElements(GL.gl.LINES, vertexCount, GL.gl.UNSIGNED_SHORT, 0);

        }

        requestAnimationFrame(() => this.drawFrame());
    }

    private getIndexArray(length: number) {
        const arr = new Uint16Array(length);
        for (let x = 0; x < arr.length; x++) {
            arr[x] = x;
        }
        return arr;
    }

    private getProgram() {
        let program: WebGLProgram;
        if (this.mode === 'tex') {
            program = this.texProgram.program;

        } else {
            program = this.flatProgram.program;

            this.aVertexPosition = GL.gl.getAttribLocation(this.flatProgram.program, 'aVertexPosition');
            this.aVertexNormal = GL.gl.getAttribLocation(this.flatProgram.program, 'aVertexNormal');
            this.uProjectionMatrix = GL.gl.getUniformLocation(this.flatProgram.program, 'uProjectionMatrix');
            this.uModelViewMatrix = GL.gl.getUniformLocation(this.flatProgram.program, 'uModelViewMatrix');
        }

        this.uLineProjectionMatrix = GL.gl.getUniformLocation(this.lineProgram.program, 'uProjectionMatrix');
        this.uLineModelViewMatrix = GL.gl.getUniformLocation(this.lineProgram.program, 'uModelViewMatrix');

        return program;
    }

    private loadPrograms() {
        /* this.texProgram = new Program(
            this.staticServ,
            '/static/shaders/tex.frag',
            '/static/shaders/tex.vert', () => {

            },
        );*/

        this.flatProgram = new Program(
            this.staticServ,
            '/static/shaders/flat.frag',
            '/static/shaders/flat.vert',
        );

        this.lineProgram = new Program(
            this.staticServ,
            '/static/shaders/line.frag',
            '/static/shaders/line.vert',
        );
    }
}
