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
    ) {
        this.additionalUniforms = {};
    }

    get loaded() {
        return this._loaded;
    }

    destroy() {
        this._loaded = false;
        GL.gl.deleteProgram(this.program);
        GL.gl.deleteShader(this.vertexShader);
        GL.gl.deleteShader(this.fragmentShader);
        this.additionalUniforms = {};
    }

    use(index: number, projection: Projection) {
        throw new Error('Not implemented');
    }

    getAdditionalUniform(index: string) {
        return this.additionalUniforms[index];
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
            console.error('Error compiling program.');
        } else {
            this.loadUniforms();
            this._loaded = true;
        }
    }

    protected loadShader(url: string, type = GL.gl.FRAGMENT_SHADER | GL.gl.VERTEX_SHADER): WebGLShader {
        const shader = GL.gl.createShader(type);

        this.staticServ.getStatic(url).subscribe((source: string) => {
            GL.gl.shaderSource(shader, source);
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
