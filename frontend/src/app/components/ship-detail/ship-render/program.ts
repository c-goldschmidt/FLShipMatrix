import { GL } from './gl';
import { StaticService } from './../../../services/services';

type ProgramLoadedCallback = () => void;

export class Program {
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    private loadingShaders = 0;

    public program: WebGLProgram;
    public loaded = false;

    constructor(
        private staticServ: StaticService,
        fragUrl: string, vertUrl: string,
    ) {
        this.loadingShaders = 2;
        this.fragmentShader = this.loadShader(fragUrl, GL.gl.FRAGMENT_SHADER);
        this.vertexShader = this.loadShader(vertUrl, GL.gl.VERTEX_SHADER);

        if (this.loadingShaders === 0) {
            this.loadProgram();
        }
    }

    destroy() {
        GL.gl.deleteProgram(this.program);
        GL.gl.deleteShader(this.vertexShader);
        GL.gl.deleteShader(this.fragmentShader);
    }

    private loadProgram() {
        this.program = GL.gl.createProgram();

        console.log(this.vertexShader);

        GL.gl.attachShader(this.program, this.vertexShader);
        GL.gl.attachShader(this.program, this.fragmentShader);
        GL.gl.linkProgram(this.program);

        if (!GL.gl.getProgramParameter(this.program, GL.gl.LINK_STATUS)) {
            console.error('Error compiling program.');
        } else {
            this.loaded = true;
        }
    }

    private loadShader(url: string, type = GL.gl.FRAGMENT_SHADER | GL.gl.VERTEX_SHADER): WebGLShader {
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
