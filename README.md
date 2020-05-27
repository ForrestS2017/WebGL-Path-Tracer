# WebGL Path Tracer

![](https://cdn.discordapp.com/attachments/692519039490326608/715344184633983056/unknown.png)

## Introduction

This project demonstrates path tracing concepts through WebGL 2.0.
Main dependencies used: *regl*, *glslify*, *gl-matrix*, *glslify*, *dat.gui*, *browserify*.

I've been doing 3D Computer graphics since middle school, specifically for video game development. However, I've always found the limitations of raster-based graphics frustrating when I knew ray-tracing techniques could produce much better results. I've never dabbled in much graphics programming until now, but I figured I might as well make a real-time demo of what I dreamed of as a child.


## References

[Scratchapixel](https://www.scratchapixel.com/)

_Explains rasterization, ray tracing, and more 3D topics with theory and code examples_

  

[Wikipedia - Path Tracing](https://en.wikipedia.org/wiki/Path_tracing)

_Another overview of the Monte Carlo Method, Kajiya's rendering equation, etc_

  

[Wikipedia - Apparent Size](https://en.wikipedia.org/wiki/Angular_diameter)

_Overview of apparent size of a sphere, which I apply to the light source_

  

[Íñigo Quílez's Gamma Correction](http://iquilezles.org/www/articles/outdoorslighting/outdoorslighting.htm)

_Explains how to gamma correct an image when using any Ray Tracing algorithm_

  

[Improved GLSL rand() Technique](http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/)

_Monte-Carlo based random number generation_