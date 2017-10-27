import { PBRProgram } from './pbr-program';
import { RenderSettings } from './renderer.interfaces';
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

    private lineProgram: Program;
    private useProgram: Program;
    private buffers: Buffers;
    private renderBoundingBox: true;

    private elapsedTime = 0;
    private frameCount = 0;
    private lastTime = 0;
    private animationFrameHandle: number;

    private _settings: RenderSettings = {
        autoRotate: true,
        selectedLOD: 'Level0',
        boundingBox: false,
        drawTextures: true,
        drawLights: true,
        shader: 'flat',
        pbrSettings: {},
    }

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
        // tslint:disable-next-line:no-string-literal
        window['debug'] = this;
        try {
            const options = {alpha: true};
            GL.gl = <WebGLRenderingContext>(
                this.canvas.getContext('experimental-webgl', options) ||
                this.canvas.getContext('webgl', options)
            );
            console.log('webgl context okay');
        } catch (e) {
            console.error('no webgl context!', e);
        }
    }

    private get programsLoaded() {
         /* this.texProgram.loaded && */
        return this.buffers.loaded && this.useProgram.loaded && this.lineProgram.loaded;
    }

    private get sizeValid() {
        return GL.gl.canvas.clientWidth > 0 && GL.gl.canvas.clientHeight > 0;
    }

    get initialized() {
        return !!GL.gl && this.programsLoaded;
    }

    set settings(settings: RenderSettings) {
        this.projection.autoRotate = settings.autoRotate;

        const switchProgram = settings.shader !== this._settings.shader;
        let updateShaders = settings.drawLights !== this._settings.drawLights;
        updateShaders = updateShaders || settings.drawTextures !== this._settings.drawTextures;

        this._settings = JSON.parse(JSON.stringify(settings));
        if (switchProgram) {
            this.switchProgram();
        } else if (updateShaders) {
            this.updateShaders();
        }
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
        if (this.useProgram) {
            this.useProgram.destroy();
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

            if (this.useProgram instanceof PBRProgram) {
                this.useProgram.runtimeSettings = this._settings.pbrSettings;
            }

            this.useProgram.use(i, this.projection);
            GL.gl.drawElements(GL.gl.TRIANGLES, vertexCount, GL.gl.UNSIGNED_SHORT, 0);

            if (this._settings.boundingBox) {
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

    private updateShaders() {
        console.log('updating shader');

        if (this._settings.shader === 'flat') {
            this.useProgram.updateSettings({
                lamberts: this._settings.drawLights,
                textures: this._settings.drawTextures,
                debug_lights: false,
            });
        }
    }

    private switchProgram() {
        this.useProgram.destroy();
        this.initializeProgram();
    }

    private initializeProgram() {
        if (this._settings.shader === 'flat') {
            this.useProgram = new FlatProgram(
                this.staticServ, this._model, this._ship, this.textureService,
                {
                    lamberts: this._settings.drawLights,
                    textures: this._settings.drawTextures,
                    debug_lights: false,
                },
            );
        } else {
            this.useProgram = new PBRProgram(
                this.staticServ, this._model, this._ship, this.textureService,
                {
                    has_basecolormap: true,
                    has_uv: true,
                    has_normals: true,
                    has_emissivemap: true,
                    has_normalmap: true,
                },
            );
        }
    }

    private initialize() {
        if (!GL.gl) { return; }

        this.initializeProgram();
        this.lineProgram = new LineProgram(this.staticServ, {dashed: true});
        this.buffers = new Buffers(this._model);

        this.projection.boundingBox = this._model.vertexBuffer;
    }
}
