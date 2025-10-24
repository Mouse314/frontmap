import Color from "../color/Color";
import Point from "../math/Point";

export default class Effector {
    public canvas: HTMLCanvasElement;
    public ctx: WebGL2RenderingContext;

    private downloaded: boolean = false;

    private program: WebGLProgram | null = null;
    private positionBuffer: WebGLBuffer | null = null;
    private positionAttributeLocation: number = -1;
    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private colorUniformLocation: WebGLUniformLocation | null = null;
    private textureLocation: WebGLUniformLocation | null = null;

    private framebuffer: WebGLFramebuffer | null = null;
    private renderTexture: WebGLTexture | null = null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('webgl2')!;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.clearColor(0, 0, 0, 0);

        this.initGL();
        this.initRenderTarget();
    }

    /**
     * Initializes framebuffer and texture for render-to-texture
     */
    public initRenderTarget() {
        const gl = this.ctx;
        // Create texture
        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create framebuffer
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Bind framebuffer for render-to-texture
     */
    public bindRenderTarget() {
        if (this.framebuffer) {
            this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, this.framebuffer);
            this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Unbind framebuffer (render to screen)
     */
    public unbindRenderTarget() {
        this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, null);
        this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get the render texture (after drawing)
     */
    public getRenderTexture(): WebGLTexture | null {
        return this.renderTexture;
    }

    public clear() {
        this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    private simpleShader() {
        // Vertex shader source
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_position;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
                v_position = a_position;
            }
        `;
        // Fragment shader source
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 u_color;
            uniform sampler2D u_renderTexture;
            varying vec2 v_position;
            void main() {
                vec4 text_color = texture2D(u_renderTexture, v_position);
                vec4 mixed_color = mix(u_color, text_color, 0.0);
                gl_FragColor = mixed_color;
            }
        `;
        return {
            fragmentShader: this.createShader(this.ctx.FRAGMENT_SHADER, fragmentShaderSource),
            vertexShader: this.createShader(this.ctx.VERTEX_SHADER, vertexShaderSource)
        };
    }

    private composeShader() {
        // Vertex shader source
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_position;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
                v_position = a_position;
            }
        `;
        // Fragment shader source
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 u_color;
            uniform sampler2D u_renderTexture;
            varying vec2 v_position;
            void main() {
                vec4 text_color = texture2D(u_renderTexture, v_position);
                vec4 mixed_color = mix(u_color, text_color, 0.0);
                gl_FragColor = mixed_color;
            }
        `;
        return {
            fragmentShader: this.createShader(this.ctx.FRAGMENT_SHADER, fragmentShaderSource),
            vertexShader: this.createShader(this.ctx.VERTEX_SHADER, vertexShaderSource)
        };
    }
    
    private initGL() {
        const { vertexShader, fragmentShader } = this.simpleShader();
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.positionAttributeLocation = this.ctx.getAttribLocation(this.program, 'a_position');
        this.resolutionUniformLocation = this.ctx.getUniformLocation(this.program, 'u_resolution');
        this.colorUniformLocation = this.ctx.getUniformLocation(this.program, 'u_color');
        this.textureLocation = this.ctx.getUniformLocation(this.program, 'u_renderTexture');
        this.positionBuffer = this.ctx.createBuffer();
    }

    public convertCoord(p: Point): Point {
        return new Point(
            p.x / this.canvas.width * 2 - 1,
            (this.canvas.height - p.y) / this.canvas.height * 2 - 1
        );
    }


    /**
     * Draws a polygon using already converted clip-space coordinates (x, y in [-1, 1])
     */
    private drawRawPolygon(clipCoords: Array<Point>, color: Color) {
        if (!this.program || !this.positionBuffer || this.positionAttributeLocation === -1 || !this.resolutionUniformLocation || !this.colorUniformLocation) {
            this.initGL();
        }
        this.ctx.useProgram(this.program);
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionBuffer);
        // Flatten points
        const positions: number[] = [];
        for (const p of clipCoords) {
            positions.push(p.x, p.y);
        }
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(positions), this.ctx.STATIC_DRAW);
        this.ctx.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
        this.ctx.uniform4f(this.colorUniformLocation, color.r, color.g, color.b, color.a);
        this.ctx.uniform1i(this.textureLocation, 0);
        this.ctx.enableVertexAttribArray(this.positionAttributeLocation);
        this.ctx.vertexAttribPointer(this.positionAttributeLocation, 2, this.ctx.FLOAT, false, 0, 0);
        this.ctx.drawArrays(this.ctx.TRIANGLES, 0, clipCoords.length);
    }

    /**
     * Draws a rectangle in screen coordinates (top-left origin)
     */
    public drawSquare(x: number, y: number, width: number, height: number, color: Color = new Color('rgba(255, 0, 0, 0.5)')) {
        this.bindRenderTarget();
        const p1 = this.convertCoord(new Point(x, y));
        const p2 = this.convertCoord(new Point(x + width, y));
        const p3 = this.convertCoord(new Point(x, y + height));
        const p4 = this.convertCoord(new Point(x + width, y + height));
        // 2 triangles
        this.drawRawPolygon([
            p1, p2, p3,
            p3, p2, p4
        ], color);
        this.unbindRenderTarget();
        this.drawRawPolygon([
            p1, p2, p3,
            p3, p2, p4
        ], color);
    }

    /**
     * Draws a polygon in screen coordinates (top-left origin)
     */
    public drawPolygon(vertices: Point[], color: Color = new Color('rgba(9, 255, 0, 0.5)')) {
        this.bindRenderTarget();
        const clipCoords = vertices.map(p => this.convertCoord(p));
        this.drawRawPolygon(clipCoords, color);
        this.unbindRenderTarget();
    }

    /**
     * Saves the current render texture (framebuffer) to a PNG file
     */
    public saveRenderTextureToFile(filename: string = 'effector.png') {
        const gl = this.ctx;
        if (!this.framebuffer || this.downloaded) return;
        console.log('Saving render texture to file:', filename);
        const width = this.canvas.width;
        const height = this.canvas.height;
        // Bind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        // Read pixels
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        // Unbind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // Create 2D canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx2d = tempCanvas.getContext('2d')!;
        // Flip Y (WebGL origin is bottom-left, canvas is top-left)
        const imageData = ctx2d.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = ((height - y - 1) * width + x) * 4;
                const dstIdx = (y * width + x) * 4;
                imageData.data[dstIdx] = pixels[srcIdx];
                imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
                imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
                imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
            }
        }
        ctx2d.putImageData(imageData, 0, 0);
        // Save as PNG
        const url = tempCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        this.downloaded = true;
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.ctx.createShader(type)!;
        this.ctx.shaderSource(shader, source);
        this.ctx.compileShader(shader);
        if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
            console.error('Error compiling shader:', this.ctx.getShaderInfoLog(shader));
            this.ctx.deleteShader(shader);
            return null!;
        }
        return shader;
    }

    private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = this.ctx.createProgram()!;
        this.ctx.attachShader(program, vertexShader);
        this.ctx.attachShader(program, fragmentShader);
        this.ctx.linkProgram(program);
        if (!this.ctx.getProgramParameter(program, this.ctx.LINK_STATUS)) {
            console.error('Error linking program:', this.ctx.getProgramInfoLog(program));
            this.ctx.deleteProgram(program);
            return null!;
        }
        return program;
    }
}