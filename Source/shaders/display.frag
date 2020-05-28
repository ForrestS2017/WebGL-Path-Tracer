//FRAGEMENT SHADER - DISPLAY
precision highp float;

uniform sampler2D source;
uniform float count;

varying vec2 uvDevice;

// Render out pixel with gamma correction with for an input texture
// Ref: Íñigo Quílez's Gamma Correction article 
// (http://iquilezles.org/www/articles/outdoorslighting/outdoorslighting.htm)
void main() {
    vec3 src = texture2D(source, uvDevice).rgb/count;
    src = pow(src, vec3(1.0/2.2));  // Corrected gamma correction curve
    gl_FragColor = vec4(src, 1.0);
}
