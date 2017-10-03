import { Projection } from './projection';
import { GL } from './gl';
import { StaticService } from './../../../services/services';
import { Program } from './program';

export class LineProgram extends Program {
    private uProjectionMatrix: WebGLUniformLocation;
    private uModelViewMatrix: WebGLUniformLocation;
    private uTransformMatrix: WebGLUniformLocation;

    constructor(
        staticServ: StaticService,
    ) {
        super(staticServ);
        this.loadingShaders = 2;
        this.fragmentShader = this.loadShader('/static/shaders/line.frag', GL.gl.FRAGMENT_SHADER);
        this.vertexShader = this.loadShader('/static/shaders/line.vert', GL.gl.VERTEX_SHADER);

        if (this.loadingShaders === 0) {
            this.loadProgram();
        }
    }

    use(index: number, projection: Projection) {
        GL.gl.useProgram(this.program);

        GL.gl.uniformMatrix4fv(this.uProjectionMatrix, false, projection.projectionMatrix);
        GL.gl.uniformMatrix4fv(this.uModelViewMatrix, false, projection.modelViewMatrix);
        GL.gl.uniformMatrix4fv(this.uTransformMatrix, false, projection.boundingMatrix);
    }

    protected loadUniforms() {
        this.uProjectionMatrix = GL.gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uModelViewMatrix = GL.gl.getUniformLocation(this.program, 'uModelViewMatrix');
        this.uTransformMatrix = GL.gl.getUniformLocation(this.program, 'uTransformMatrix');
    }
}
