//VERTEX SHADER - SAMPLE
precision highp float;

attribute vec2 position;    // Vertices of the full-screen quad so we can execute on GPU

// Basic  vertex shader
void main() {
    gl_Position = vec4(position, 0, 1);
}
