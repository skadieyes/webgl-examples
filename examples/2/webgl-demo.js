
  
    function isPowerOf2(value) {
      return (value & (value - 1)) === 0;
    }

    function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}

function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // Called each time an image finished
  // loading.
  var onImageLoad = function() {
    --imagesToLoad;
    // If all the images are loaded call the callback.
    if (imagesToLoad === 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
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
    // 配置并使用纹理
    function loadTexture(gl, image) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis ！！！important 不然是倒的

      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      // Set the texture unit 0 to the sampler
      return texture

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
        uniform sampler2D u_Sampler1;
        // 纹理坐标插值
        varying vec2 v_TexCoord;
        void main() {
          vec4 color0 = texture2D(u_Sampler, v_TexCoord);
          vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
          gl_FragColor = color0 * color1;
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

      loadImages([
        "./../../image/mwzz.jpeg",
        "./../../image/cat.jpg",
      ], (images) => {
        // 对 image 进行下一步处理
        var u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        var u_Sampler1 = gl.getUniformLocation(program, 'u_Sampler1');
        // set which texture units to render with.
        var texture1 = loadTexture(gl, images[0], texture1, u_Sampler, n) // texture unit0
        var texture2 = loadTexture(gl, images[1], texture2, u_Sampler1, n) // texture unit1
        gl.uniform1i(u_Sampler, 0);
        gl.uniform1i(u_Sampler1, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);   
        gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
      });
    }

    main();
    