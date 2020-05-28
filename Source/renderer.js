
const glsl = require('glslify');
const reglIN = require('regl'); 
const mat4 = require('gl-matrix').mat4;
const vec3 = require('gl-matrix').vec3;

module.exports = function(canvas) {
    
    const regl = reglIN({
        canvas: canvas,
        extensions: ['OES_texture_float'],  // Use floating point values for textures
        attributes: {
          preserveDrawingBuffer: true,
        }
    });

    const resolutionMC = 1024;      // Monte-Carlo sampler resolution
    let count = 0;                  // Sample index
    let bufferID = 0;
    const buffers = [
        regl.framebuffer({width: canvas.width, height: canvas.height, colorType: 'float'}),
        regl.framebuffer({width: canvas.width, height: canvas.height, colorType: 'float'})
    ]

    /**
     * 
     * 1) Monte-Carlo Based Random Noise
     * 
     *
     */

    // 1A) Generate list of randomized 3D vectors
    const rand3DVecs = new Float32Array(Math.pow(resolutionMC,2)*3);
    for (let i = 0; i < Math.pow(resolutionMC,2); i++) {
        const r = vec3.random([]);
        rand3DVecs[i*3  ] = r[0];
        rand3DVecs[i*3+1] = r[1];
        rand3DVecs[i*3+2] = r[2];
    }

    // 1B) Map to RGB (3D) texture
    const MCOffsetTexture = regl.texture({
        width: resolutionMC,
        height: resolutionMC,
        data: rand3DVecs,
        type: 'float',
        format: 'rgb',
        wrap: 'repeat'
    })


    /**
     * 
     * 2) Render Functions
     *
     */
    
     // Custom draw command to be invoked by @sample()
    const sampler = regl({
        vert: glsl('./shaders/sample.vert'),    // Shaders
        frag: glsl('./shaders/sample.frag'),
        attributes: {   // Verts of the full screen quad to render on the GPU
            position: [-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]      
        },
        uniforms: {
            invpvM: regl.prop('invpvM'),                        // Inverse projection Matrix
            eye: regl.prop('eye'),                              // Camera position
            source: regl.prop('source'),                        // Double-buffer
            rand: regl.prop('rand'),                            // MC random sampler
            resolutionMC: resolutionMC,                         // MC random sampler size
            MCOffsetTexture: MCOffsetTexture,                   // 3D Vectors
            model: regl.prop('model'),                          // Orientation of our spheres
            resolution: regl.prop('resolution'),                // Surface resolution
            antialias: regl.prop('antialias'),                  // Anti-alias toggle
            bounces: regl.prop('bounces'),                      // Max light bounces
            light_position: regl.prop('light_position'),        // Position of light
            light_radius: regl.prop('light_radius'),            // Radius of light
            light_brightness: regl.prop('light_brightness'),    // Brightness of light
            light_color: regl.prop('light_color'),              // Color of light
            light_saturation: regl.prop('light_saturation'),    // Saturation of light color
            ambient_brightness: regl.prop('ambient_brightness'),// Brightness of ambient light
            ambient_color: regl.prop('ambient_color'),          // Color of ambient light
            ambient_saturation: regl.prop('ambient_saturation'),// Saturation of ambient light color
            roughness_sphere: regl.prop('roughness_sphere'),    // Roughness of objects
            roughness_floor: regl.prop('roughness_floor'),      // Roughness of floor
            soft_shadows: regl.prop('soft_shadows'),            // Soft shadows toggle
            shadow_bias: regl.prop('shadow_bias'),              // Shadow bias (offset)
            shadow_penumbra: regl.prop('shadow_penumbra'),      // Penumbra intensity of shadow
        },
        framebuffer: regl.prop('destination'),
        viewport: regl.prop('viewport'),
        depth: {enable: false},
        count: 6                                                // 6 verts for the quad
    });

    /**
     * Construct our viewing matricies and invoke sampler
     * @param {object} atts - Object holding M properties
     */
    function sample(atts) {
        const viewM = mat4.lookAt([],atts.eye, atts.target, [0,1,0]);
        const projM = mat4.perspective([], Math.PI/3, 1.0, 0.1, 1000);
        const pvM = mat4.multiply([], projM, viewM);
        const invpvM = mat4.invert([], pvM);

        sampler({
            invpvM: invpvM,                                 // Inverse projection Matrix
            eye: atts.eye,                                  // Camera position
            source: buffers[bufferID],                      // Back buffer
            destination: buffers[1 - bufferID],             // Front buffer
            rand: [Math.random(), Math.random()],           // MC random sampler
            resolution: [canvas.width, canvas.height],      // Canvas resolution
            model: atts.model,                              // Orientation of our spheres
            antialias: atts.antialias,                      // Anti-alias toggle
            bounces: atts.bounces,                          // Max light bounces
            light_position: atts.light_position,            // Position of light
            light_radius: atts.light_radius,                // Radius of light
            light_color: atts.light_color,                  // Color of light
            light_saturation: atts.light_saturation,        // Saturation of light color
            light_brightness: atts.light_brightness,        // Brightness of color
            ambient_brightness: atts.ambient_brightness,    // Brightness of ambient light
            ambient_color: atts.ambient_color,              // Color of ambient light
            ambient_saturation: atts.ambient_saturation,    // Saturation of ambient light color
            roughness_sphere: atts.roughness_sphere,        // Roughness of objects
            roughness_floor: atts.roughness_floor,          // Roughness of floor
            soft_shadows: atts.soft_shadows,                // Soft shadow toggle
            shadow_bias: atts.shadow_bias,                  // Shadow bias (offset)
            shadow_penumbra: atts.shadow_penumbra,          // Penumbra intensity of shadow
            viewport: {x:0, y:0, width:canvas.width, height: canvas.height}

        });
        count++;                    // Increment quad count
        bufferID = 1 - bufferID;    // Swap buffers
    }

    
    /**
     * 
     * 3) Display Functions
     * 
     */

    const displayer = regl({
        vert: glsl('./shaders/display.vert'),
        frag: glsl('./shaders/display.frag'),
        attributes: {
           position: [-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1],
         },
         uniforms: {
           source: regl.prop('source'),
           count: regl.prop('count'),
         },
         framebuffer: regl.prop('destination'),
         viewport: regl.prop('viewport'),
         depth: { enable: false },
         count: 6
    });

    // Invoke our displayer function and swap buffers
    function display() {
        displayer({
            destination: null,
            source: buffers[bufferID],
            count: count,
            viewport: {x:0, y:0, width: canvas.width, height: canvas.height}
        });
    }

    /**
     * 
     * 4) Screen & Camera adjustments
     * 
     */

    // Called when the scene changes because of a change in camera/object positions
    // or any other controls. The buffer is cleared and samples get reset
    function reset() {
        regl.clear({ color: [0,0,0,1], depth: 1, framebuffer: buffers[0] });
        regl.clear({ color: [0,0,0,1], depth: 1, framebuffer: buffers[1] });
        count = 0;
    }

    // This is called when the canvas gets resized if the window gets resized
    function resize(resolution) {
        canvas.height = canvas.width = resolution;
        buffers[0].resize(canvas.width, canvas.height);
        buffers[1].resize(canvas.width, canvas.height);
        reset();
    }
    
    return {
        sample: sample,
        display: display,
        reset: reset,
        resize: resize,
    };
}
