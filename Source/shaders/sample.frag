//FRAGEMENT SHADER - SAMPLE
precision highp float;

uniform vec3 eye;
uniform sampler2D source, MCOffsetTexture;
uniform mat4 model, invpvM;
uniform float count;
uniform float roughness_sphere, roughness_floor;
uniform float shadow_bias, shadow_penumbra;
uniform float light_brightness, light_position, light_color, light_saturation, light_radius;
uniform float ambient_brightness, ambient_color, ambient_saturation;
uniform float focal_plane, focal_length;
uniform float randsize;
uniform vec2 resolution, rand;
uniform bool antialias, soft_shadows;
uniform int bounces;
uniform float resolutionMC;

/**
* 
* 1) Handle our noise & extra helper functions
*
*/


vec3 getMCOffset() {
    return texture2D(
        MCOffsetTexture,
        gl_FragCoord.xy/resolutionMC + rand.xy
    ).rgb;                      // This time we need 3 channels
}


vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/**
* Note: Justification for hard-coded objects
* The best way to implement shapes in this demo is to hard code in the fragment shader.
* There will be no dynamic animations or updating to the topology or shape of the models.
*/

/**
* 
* 2) Setup objects and  assemble scene
*
*/

struct object {
    float radius;
    vec3 color;
    vec3 position;
};

object objects[15];

void initObjects() {
    // Random objects
    objects[ 0] = object(1.2, vec3(1.0, 1.0, 1.0), vec3(-3.0, -1.0, 0.5));
    objects[ 1] = object(0.5, vec3(0.1, 0.1, 1.0), vec3( 1.0, -1.0, -1.0));
    objects[ 2] = object(0.3, vec3(1.0, 1.0, 0.1), vec3( 0.4,  0.5, 0.2));
    objects[ 3] = object(0.5, vec3(0.6, 0.0, 0.6), vec3( 0.0,  0.0, 0.0));
    objects[ 4] = object(0.3, vec3(1.0, 0.01, 0.01), vec3(-2, 3, 0.5));
    objects[ 5] = object(0.7, vec3(0.01, 0.01, 0.01), vec3(0.0, -1.5, 1.0));
    objects[ 6] = object(0.8, vec3(0.2, 0.8, 0.9), vec3(1.2, 1.0, 0.5));

    // Ring of objects
    objects[ 7] = object(0.3, vec3(0.1, 0.8, 0.1), vec3( 0.0, -2.0,  4.0));
    objects[ 8] = object(0.3, vec3(0.1, 0.8, 0.1), vec3( 2.8, -2.0,  2.8));
    objects[ 9] = object(0.3, vec3(0.1, 0.8, 0.1), vec3( 4.0, -2.0,  0.0));
    objects[10] = object(0.3, vec3(0.1, 0.8, 0.1), vec3( 2.8, -2.0, -2.8));
    objects[11] = object(0.3, vec3(0.1, 0.8, 0.1), vec3( 0.0, -2.0, -4.0));
    objects[12] = object(0.3, vec3(0.1, 0.8, 0.1), vec3(-2.8, -2.0, -2.8));
    objects[13] = object(0.3, vec3(0.1, 0.8, 0.1), vec3(-4.0, -2.0,  0.0));
    objects[14] = object(0.3, vec3(0.1, 0.8, 0.1), vec3(-2.8, -2.0,  2.8));
}


/**
* 
* 3) Light & Ground setup
* 
*/

vec3 groundPos = vec3(0,-2,0);
vec3 groundColor = vec3(0.05, 0.05, 0.05);
vec3 lightPos;
vec3 lightColor;
vec3 ambientColor;

void initLight() {
    lightPos = vec3(sin(light_position) * 16.0, 
                    cos(3.14*(1.0+light_position))*-8.0, 
                    sin(light_position) * 16.0);
    lightColor = hsv2rgb(vec3(light_color,light_saturation,light_brightness));
    ambientColor = hsv2rgb(vec3(ambient_color,ambient_saturation,ambient_brightness));
}

/**
*
*   4) Line-Sphere Intersection Function
*
*/

/**
*   P = Point on ray
*   U = Unit vector in direction of ray
*   C = Center of sphere
*   R = Sphere radius
*   t = time of interection
*/
bool objectIntersect(vec3 P, vec3 U, vec3 C, float R, out float t) {
  vec3 Q = P - C;
  float a = dot(U,U);                       // Should be 1
  float b = 2.0 * dot(U, Q);
  float c = dot(Q,Q) - (R*R);
  float d = b*b - 4.0 * a * c;              // Discriminant
  if (d < 0.0) return false;                // Complex solution - no intersection
  t = (-b - sqrt(d)) * 0.5;                 // Real solution - intersection. Get discriminant
  return t >= 0.0;
}


/**
*
*   5) Intersection Function
*
*/

// Iterates over all objects and returns the first hit
bool intersect(vec3 P, vec3 U, out vec3 pos, out vec3 norm, 
            out vec3 color, out float roughness, out bool isLight) {
    // Init our min time and hit results
    float tmin = 1e38, t;
    bool hit = false;

    // Check for object intersection
    for(int i = 0; i < 15; i++) {
        mat4 inv = mat4(  1.0,  0.0, 0.0,  0.0,
                         0.0,  1.0,  0.0,  0.0,
                         0.0,  0.0,  1.0,  0.0,
                         0.0,  0.0,  0.0,  1.0);
        // Orient our objects
        vec3 s = vec3(model * vec4(objects[i].position, 1));
        // Intersecion Test
        if( objectIntersect(P, U, s, objects[i].radius, t)) {
            if (t < tmin) {
                tmin = t;
                pos = P + U * t;
                norm = normalize(pos - s);
                roughness = roughness_sphere;
                color = objects[i].color;
                isLight = false;
                hit = true;
            }
        }
    }

    // Check for ground intersection at y = -2.0
    t = (groundPos.y - P.y) / U.y;
    if (t < tmin && t > 0.0) {
        tmin = t;
        pos = P + U*t;
        norm = vec3(0,1,0);
        color = groundColor;
        roughness = roughness_floor;
        isLight = false;
        hit = true;
    }

    // CHeck for light intersection
    if (objectIntersect(P, U, lightPos, light_radius, t)) {
        if (t < tmin) {
            tmin = t;
            pos = P + U * t;
            norm = normalize(pos - lightPos);
            roughness = 0.0;
            color = lightColor;
            isLight = true;
            hit = true;
        }
    }
    return hit;
}

/**
*
*   6) Light Intensity Function
*
*/

float getLightIntensity(vec3 P, vec3 N, vec3 shadowRay)
{
    float lightIncidenceScale = clamp(dot(N, shadowRay), 0.0, 1.0);
    float lightApparentSize = pow(asin(light_radius/distance(P, lightPos)),2.0);
    return lightIncidenceScale * lightApparentSize;
}

vec3 calculateLighting(vec3 P, vec3 N, vec3 shadowRay, vec3 mask) {
    return getLightIntensity(P, N, shadowRay) * light_brightness * lightColor * mask;
}



/**
*
*   6) Light Transport Function
*   Get new ray direction by mixing the diffuse ray and the reflection ray
*
*/

vec3 getReflectedRay(vec3 R, vec3 N, float G) {
    vec3 rayReflected = reflect(R, N);
    vec3 rayDiffused = N + getMCOffset();
    vec3 mx = mix(rayReflected, rayDiffused, G);
    return normalize(mx);
}


void main() {
    // Initialize objects
    initObjects();
    initLight();

    // Get data from last frame. First time = 0
    vec3 frag = texture2D(source, gl_FragCoord.xy/resolution).rgb;

    // Anti-Alias
    vec2 jitter = vec2(0);
    if (antialias) {
        jitter = rand - 0.5;
    }

    // Convert frag coords to normalized deviec coords
    vec2 px = 2.0 * (gl_FragCoord.xy+jitter)/resolution - 1.0;

    // Use px to raycast into scene
    vec3 ray = vec3(invpvM * vec4(px, 1, 1));
    ray = normalize(ray);
    vec3 pos = eye;

    // Init our accum and mask
    vec3 accum = vec3(0);
    vec3 mask = vec3(1);

    // Finally bounce the rays!
    // 100 is a random value because we can only loop over a constant value
    for(int i = 0; i < 64; i++) {
        if (i > bounces) break;
        
        // Init the outputs of the intersect function
        vec3 norm, color, _v3;
        float roughness, _f;
        bool isLight;
        
        // First Intersection test to find next point
        if (!intersect(pos, ray, pos, norm, color, roughness, isLight)) {
            // If we didn't hit anything, we just use ambient light and break
            accum += ambientColor * mask;
            break;
        }
        if (isLight) {
            // If we hit a light, update the accumulator
            accum += lightColor * mask;
            break;
        }
        // Now if we hit an object
        mask *= color;
        // First initialize shadow ray
        vec3 lightTarget = lightPos;
        if (soft_shadows) {
             lightTarget += light_radius * getMCOffset() * shadow_penumbra;
        }
        
        // Second Intersection test to cast shadow ray
        vec3 shadowRay = normalize(lightTarget - pos);
        // Perform intersection test. Use +0.0001 to offset from the surface
        vec3 P = pos+shadowRay * shadow_bias;
        if (intersect(P, shadowRay, _v3, _v3, _v3, _f, isLight) && isLight) {
                accum += calculateLighting(pos, norm, shadowRay, mask);
            }
        // Get new ray direction
        ray = getReflectedRay(ray,norm, roughness);
        pos = pos + ray * .0001;
    }
    // Finally color the pixel
    gl_FragColor = vec4(accum + frag, 1.0);
}
