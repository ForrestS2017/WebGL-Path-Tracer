//VERTEX SHADER - DISPLAY
precision highp float;

varying vec2 uvDevice;
attribute vec2 position;

// Convert incoming normalized device coordinates into @uvDevice coords mapped [(0,0),(1,1)]
void main() {
    gl_Position = vec4(position, 0, 1);
    uvDevice = 0.5 * position + 0.5;
}
