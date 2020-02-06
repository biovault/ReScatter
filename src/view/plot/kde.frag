precision highp float;

// Sampler for the kernel sprite
uniform sampler2D u_KernelSampler;
// Render into a float texture: RGBA where each is float32
void main(void)
{
    vec4 color = texture2D(u_KernelSampler, gl_PointCoord);
    int iCol = int(100.0*color.r);
    gl_FragColor = vec4(float(iCol), float(iCol), float(iCol), 1.0);
    //gl_FragColor = vec4 (1.0, 1.0, 1.0, 1.0);, // fixed color for texting
}
