import { ShipDetails } from './../../../services/interfaces';
import { Subject } from 'rxjs/Subject';
import { LineProgram } from './line-program';
import { Buffers } from './buffers';
import { Program } from './program';
import { StaticService, TextureService } from './../../../services/services';
import { ShipModel } from './../../../services/ship-model';
import { mat4 } from 'gl-matrix';
import { GL } from './gl';
import { Projection, BoundingBox } from './projection';
import { FlatProgram } from './flat-program';

export class Renderer {
    private _model: ShipModel;
    private _ship: ShipDetails;
    public projection: Projection;

    private renderStated = false;
    private context: WebGLRenderingContext;

    private flatProgram: Program;
    private lineProgram: Program;
    private buffers: Buffers;
    private renderBoundingBox: true;

    private elapsedTime = 0;
    private frameCount = 0;
    private lastTime = 0;
    private animationFrameHandle: number;

    public glushort = 1;
    public fps$ = new Subject<number>();
    public drawBoundingBox = false;

    constructor(
        private canvas: HTMLCanvasElement,
        private staticServ: StaticService,
        private textureService: TextureService,
    ) {
        this.projection = new Projection(this.canvas);
    }

    private createContext() {
        try {
            const options = {alpha: true};
            GL.gl = <WebGLRenderingContext>(
                this.canvas.getContext('webgl', options) ||
                this.canvas.getContext('experimental-webgl', options)
            );
            console.log('webgl context okay');
        } catch (e) {
            console.error('no webgl context!', e);
        }
    }

    private get programsLoaded() {
         /* this.texProgram.loaded && */
        return this.buffers.loaded && this.flatProgram.loaded && this.lineProgram.loaded;
    }

    private get sizeValid() {
        return GL.gl.canvas.clientWidth > 0 && GL.gl.canvas.clientHeight > 0;
    }

    get initialized() {
        return !!GL.gl && this.programsLoaded;
    }

    setModel(ship: ShipDetails, model: ShipModel) {
        if (model === undefined) { return; }

        if (!this._model || this._model.id !== model.id || this._model.lod !== model.lod) {
            this._model = model;
            this._ship = ship;

            if (this.animationFrameHandle) {
                cancelAnimationFrame(this.animationFrameHandle);
                this.animationFrameHandle = null;
            }

            this.destroy();
            this.createContext();
            this.initialize();
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

        if (this.buffers) {
            this.buffers.destroy();
        }
        if (this.flatProgram) {
            this.flatProgram.destroy();
        }
        if (this.lineProgram) {
            this.lineProgram.destroy();
        }

        GL.gl = undefined;
        this.renderStated = false;
    }

    private startRenderLoop() {
        if (this.renderStated) { return; }
        this.renderStated = true;
        this.drawFrame();
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
        GL.gl.enable(GL.gl.BLEND);
        GL.gl.depthFunc(GL.gl.LEQUAL);
        GL.gl.blendFunc(GL.gl.ONE, GL.gl.ONE_MINUS_SRC_ALPHA);
        GL.gl.clear(GL.gl.COLOR_BUFFER_BIT);

        for (let i = 0; i < this._model.numMeshes; i++) {
            const vertexCount = this._model.vertexBuffer[i].length / 3;

            this.buffers.bind(i);

            this.flatProgram.use(i, this.projection);
            GL.gl.drawElements(GL.gl.TRIANGLES, vertexCount, GL.gl.UNSIGNED_SHORT, 0);

            if (this.drawBoundingBox) {
                this.buffers.bindBounding();
                this.lineProgram.use(i, this.projection);

                GL.gl.drawElements(GL.gl.LINES, 24, GL.gl.UNSIGNED_SHORT, 0);
            }
        }

        this.updateFPS();
        this.animationFrameHandle = requestAnimationFrame(() => this.drawFrame());
    }

    private updateFPS() {
        const now = new Date().getTime();

        this.frameCount++;
        this.elapsedTime += (now - this.lastTime);
        this.lastTime = now;

        if (this.elapsedTime >= 1000) {
            const fps = (this.frameCount * 1000) / this.elapsedTime;
            this.frameCount = 0;
            this.elapsedTime = 0;
            this.fps$.next(Math.round(fps));
        }
    }

    private initialize() {
        if (!GL.gl) { return; }

        this.flatProgram = new FlatProgram(this.staticServ, this._model, this._ship, this.textureService);
        this.lineProgram = new LineProgram(this.staticServ);
        this.buffers = new Buffers(this._model);

        this.projection.boundingBox = this._model.vertexBuffer;
    }
}
