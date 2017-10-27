import { ShaderSettings } from './renderer.interfaces';
import { Dictionary } from './../../../services/interfaces';
import { ShipModel } from './../../../services/ship-model';
import { Projection } from './projection';
import { mat4 } from 'gl-matrix';
import { GL } from './gl';
import { StaticService } from './../../../services/services';

type ProgramLoadedCallback = () => void;

export class Program {
    protected vertexShader: WebGLShader;
    protected fragmentShader: WebGLShader;
    protected loadingShaders = 0;
    protected _loaded = false;
    protected additionalUniforms: Dictionary<WebGLUniformLocation>;

    public program: WebGLProgram;

    constructor(
        private staticServ: StaticService,
        protected settings?: ShaderSettings,
    ) {
        this.additionalUniforms = {};

        if (!this.settings) {
            this.settings = {};
        }

        this.initialize();
    }

    get loaded() {
        return this._loaded;
    }

    destroy() {
        this._loaded = false;
        GL.gl.deleteProgram(this.program);
        GL.gl.deleteShader(this.vertexShader);
        GL.gl.deleteShader(this.fragmentShader);

        this.vertexShader = null;
        this.fragmentShader = null;

        this.additionalUniforms = {};
    }

    use(index: number, projection: Projection) {
        throw new Error('Not implemented');
    }

    getAdditionalUniform(index: string) {
        return this.additionalUniforms[index];
    }

    updateSettings(settings: ShaderSettings) {
        this.settings = settings;
        this.destroy();
        this.initialize();
    }

    initialize() {
        throw new Error('Not implemented!');
    }

    private setDefinitions(shader: string) {
        const definitions = [];
        for (const key of Object.keys(this.settings)) {
            if (this.settings[key]) {
                definitions.push(`#define ${key.toUpperCase()}`);
            }
        }
        console.log(definitions);
        return shader.replace('%DEFINITIONS%', definitions.join('\n'));
    }

    protected loadUniforms() {
        throw new Error('Not implemented');
    }

    protected loadProgram() {
        this.program = GL.gl.createProgram();

        GL.gl.attachShader(this.program, this.vertexShader);
        GL.gl.attachShader(this.program, this.fragmentShader);
        GL.gl.linkProgram(this.program);

        if (!GL.gl.getProgramParameter(this.program, GL.gl.LINK_STATUS)) {
            console.error('Error compiling program.', GL.gl.getProgramInfoLog(this.program));
        } else {
            this.loadUniforms();
            this._loaded = true;
            console.log('shader loaded!');
        }
    }

    protected loadShader(url: string, type = GL.gl.FRAGMENT_SHADER | GL.gl.VERTEX_SHADER): WebGLShader {
        const shader = GL.gl.createShader(type);

        this.staticServ.getStatic(url).subscribe((source: string) => {
            GL.gl.shaderSource(shader, this.setDefinitions(source));
            GL.gl.compileShader(shader);

            if (!GL.gl.getShaderParameter(shader, GL.gl.COMPILE_STATUS)) {
                console.error('shader compile error: ', GL.gl.getShaderInfoLog(shader), source);
                return null;
            }

            this.loadingShaders--;
            if (this.loadingShaders === 0 && this.fragmentShader && this.vertexShader) {
                this.loadProgram();
            }
        });

        return shader;
    }

}
