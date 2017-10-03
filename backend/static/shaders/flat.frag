precision highp float;

uniform sampler2D uSampler;

varying vec3 vLighting;
varying vec2 vTextureCoord;

void main(void){
    vec4 color = texture2D(uSampler, vTextureCoord);
    // gl_FragColor = vec4(color.rgb * color.a, color.a);
    gl_FragColor = vec4((color.rgb * vLighting) * color.a, color.a);
}
