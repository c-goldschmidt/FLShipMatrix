%DEFINITIONS%

precision lowp float;

#ifdef DASHED
varying vec4 vPos;
#endif

void main(void){
#ifdef DASHED
    lowp float a = abs(floor(sin((vPos.x * vPos.y * vPos.z) * 360.0)));
    gl_FragColor = vec4(a, a, a, a);
#else
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
#endif
}