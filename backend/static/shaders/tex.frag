uniform sampler2D texture1;
uniform bool inversion;

void main(void){
    float tex_y = gl_TexCoord[0].t;
    if(inversion){
        tex_y = 1.0 - tex_y;
    }
    gl_FragColor = texture2D(texture1, vec2(gl_TexCoord[0].s, tex_y));
}