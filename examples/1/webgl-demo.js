
  
    function isPowerOf2(value) {
      return (value & (value - 1)) === 0;
    }
    /**
     * createShader
     * @param {*} gl 
     * @param {*} type 
     * @param {*} source 
     */
    function createShader(gl, type, source) {
      var shader = gl.createShader(type); // 创建着色器对象
      gl.shaderSource(shader, source); // 提供数据源
      gl.compileShader(shader); // 编译 -> 生成着色器
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }
      gl.deleteShader(shader);
    }
    function createProgramFromSources(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

    function initVertexBuffers(gl, program) {
      var verticesTexCoords = new Float32Array([
        // 顶点坐标, 纹理坐标
        -1.0, 1.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 0.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, -1.0, 1.0, 0.0,
      ]);
      var n = 4; // The number of vertices

      // 为 WebGL 指定着色程序
      gl.useProgram(program);

      // Create the buffer object
      var vertexTexCoordBuffer = gl.createBuffer();
      if (!vertexTexCoordBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

      var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
      var a_Position = gl.getAttribLocation(program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
      // void gl.vertexAttribPointer(index, size, type, normalized, stride, offset);

      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
      gl.enableVertexAttribArray(a_Position);

      var a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
      if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return -1;
      }
      gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
      gl.enableVertexAttribArray(a_TexCoord);
      return n;
    }

    // 初始化纹理，加载图像
    function initTextures(gl, program, url, callback) {
      var texture = gl.createTexture();   // Create a texture object
      if (!texture) {
        console.log('Failed to create the texture object');
        return false;
      }

      // Get the storage location of u_Sampler
      var u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
      if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
      }
      let image = new Image();
      // image.crossOrigin = "Anonymous"
      image.src = url;
      image.onload = () => {
        callback(image, texture, u_Sampler)
      }
    }

    // 配置并使用纹理
    function loadTexture(gl, image, texture, u_Sampler, n) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // 是 2 的幂，一般用贴图
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // 不是 2 的幂，关闭贴图并设置包裹模式（不需要重复）为到边缘
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      // Set the texture image
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

      // Set the texture unit 0 to the sampler
      gl.uniform1i(u_Sampler, 0);

      gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
    }

    function main() {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      var canvas = document.getElementById("canvas");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }
      const VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec2 a_TexCoord;
        varying vec2 v_TexCoord;
        void main() {
          gl_Position = a_Position;
          v_TexCoord = a_TexCoord;
        }`

      // Fragment shader program
      const FSHADER_SOURCE = `
        precision mediump float;
        uniform sampler2D u_Sampler;
        // 纹理坐标插值
        varying vec2 v_TexCoord;
        void main() {
          // 获取纹素
          gl_FragColor = texture2D(u_Sampler, v_TexCoord);
        }`
      var vertexShader = createShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE);
      var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);
      var program = createProgramFromSources(gl, vertexShader, fragmentShader)
      if (!program) {
        console.log('Failed to intialize shaders.');
        return;
      }
      var n = initVertexBuffers(gl, program);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      gl.clearColor(0.0, 0.0, 0.0, 1.0);


      initTextures(gl, program, "./../../image/mwzz.jpeg", (image, texture, u_Sampler) => {
        // 对 image 进行下一步处理
        loadTexture(gl, image, texture, u_Sampler, n)
      })
    }

    main();
