%DEFINITIONS%

precision highp float;

attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uTransformMatrix;

#ifdef DASHED
varying vec4 vPos;
#endif

void main(void){
#ifdef DASHED
    vPos = aVertexPosition;
#endif

    gl_Position = uProjectionMatrix * uModelViewMatrix * uTransformMatrix  * aVertexPosition;
}
