window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
        window.setTimeout(callback, 1000 / 40);
    };
})();

var LIGHT_AMBIENT = 0;
var LIGHT_DIRECTION = 1;
var LIGHT_POINT = 2;
var TWO_PI = 6.2831853;
var EGG_SPLIT_HALF = 0x01;
var EGG_SPLIT_QUARTER = 0x02;
var EGG_SPLIT_SHOW_BORDER = 0x04;

function EasterEgg(imagePanelId, canvasId){
    var __this = this;
    var gl = null;
    
    var drawing = false;
    
    var vBuffer;
    var nBuffer;
    var tBuffer;
    var iBuffer;
    var program;
    var texture;
    
    this.pMatrix = mat4.create();
    this.mvMatrix = mat4.create();
    this.nMatrix = mat4.create();
    
    this.xRot = 0.0;
    this.yRot = 0.0;
    
    var eggList = [
        
    ];
    
    var selectedEgg = null;
    
    this.lights = [
    {
        color: [0.1, 0.1, 0.1],
        position: [1.0, 0.0, 1.0],
        radius: 40.0,
        type: LIGHT_AMBIENT
    },
    {
        color: [0.8, 0.8, 0.8],
        position: [1.0, 0.0, 1.0],
        radius: 40.0,
        type: LIGHT_DIRECTION
    },
    {
        color: [0.0, 0.0, 0.2],
        position: [-2.0, 2.0, -2.0],
        radius: 15.0,
        type: LIGHT_POINT
    },
    {
        color: [0.2, 0.2, 0.0],
        position: [-2.0, -2.0, -2.0],
        radius: 15.0,
        type: LIGHT_POINT
    }
    ];
    
    //Rotation information
    var mouseOrigin = [0, 0];
    var isMouseDown = false;
    
    //$("#" + canvasId).css("cursor", "all-scroll");
    
    var startRotate = function(x, y){
        mouseOrigin[0] = x;
        mouseOrigin[1] = y;
        
        isMouseDown = true;
    }
    
    var endRotate = function(x, y){
        __this.xRot -= (mouseOrigin[1] - y) * 0.02;
        __this.yRot -= (mouseOrigin[0] - x) * 0.02;
            
        mouseOrigin[0] = x;
        mouseOrigin[1] = y;
    }
    
    $("#" + canvasId).bind('mousedown', function(e){
        var x = e.pageX - $(this).position().left;
        var y = e.pageY - $(this).position().top;
        
        startRotate(x, y);
    });
    
    $("#" + canvasId).bind('touchstart', function(e){
        var x = e.originalEvent.changedTouches[0].pageX - $(this).position().left;
        var y = e.originalEvent.changedTouches[0].pageY - $(this).position().top;
        
        startRotate(x, y);
    });
    
    $("#" + canvasId).bind('mouseup touchend', function(e){
        isMouseDown = false;
    });
    
    $("#" + canvasId).bind('mousemove', function(e){
        if(isMouseDown){
            var x = e.pageX - $(this).position().left;
            var y = e.pageY - $(this).position().top;
            
            endRotate(x, y);
        }
    });
    
    $("#" + canvasId).bind('touchmove', function(e){
        if(isMouseDown){
            e.preventDefault();
            
            var x = e.originalEvent.changedTouches[0].pageX - $(this).position().left;
            var y = e.originalEvent.changedTouches[0].pageY - $(this).position().top;
            
            endRotate(x, y);
        }
    });
    
    var fillColor = [255, 0, 0];
    var dragColor = [0, 0, 0];
    
    $(".color").click(function(){
        $(".color").removeClass("selected");
        $(this).addClass("selected");
        
        fillColor = JSON.parse($(this).attr("data-color"));
    });

    var imagePanelCanvas = $('#' + imagePanelId)[0];
    var imageContext = imagePanelCanvas.getContext("2d");
    imageContext.imageSmoothingEnabled = false;
    var imageData = null;
    
    var setModelViewMatrix = function(){
        mat4.identity(__this.mvMatrix);
        mat4.translate(__this.mvMatrix, [0.0, 0.0, -5.0]);
        
        mat4.rotate(__this.mvMatrix, __this.xRot, [1.0, 0.0, 0.0]);
        mat4.rotate(__this.mvMatrix, __this.yRot, [0.0, 1.0, 0.0]);
            
        mat4.inverse(__this.mvMatrix, __this.nMatrix);
        mat4.transpose(__this.nMatrix, __this.nMatrix);
    }

    this.getEggList = function(){
        return eggList;
    }
    
    this.selectEgg = function(index){
        var egg = eggList[index];
        imageContext.drawImage(egg.image, 0, 0, imagePanelCanvas.width, imagePanelCanvas.height);
        imageData = imageContext.getImageData(0, 0, imagePanelCanvas.width, imagePanelCanvas.height);
        
        imageData.width = imagePanelCanvas.width;
        imageData.height = imagePanelCanvas.height;

        loadTexture();
        
        selectedEgg = egg;
    };
    
    var loadTexture = function(){
        if(texture != null){
            gl.deleteTexture(texture);
        }
        
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagePanelCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    
    
    
    var setPixelColor = function(index, r, g, b, a){
        imageData.data[index] = r;
        imageData.data[index + 1] = g;
        imageData.data[index + 2] = b;
        imageData.data[index + 3] = a;
    }
    
    var fillSection = function(x, y){
        // Perform fill
        if(imageData != null){
            var data = imageData.data;
            var index = (x + (y * imageData.width)) << 2;
            var checkColor = [data[index], data[index + 1], data[index + 2]];
            var stack = [[x, y]];
            
            if(checkColor[0] == fillColor[0] &&
                checkColor[1] == fillColor[1] &&
                checkColor[2] == fillColor[2]){
                return;
            }
            
            while(stack.length > 0){
                var p = stack.pop();
                
                if(p[0] < 0 || p[0] >= imageData.width || p[1] < 0 || p[1] >= imageData.height){
                    continue;
                }
                
                index = (p[0] + (p[1] * imageData.width)) << 2;
                
                // Compare the color
                if(checkColor[0] != data[index] ||
                    checkColor[1] != data[index + 1] ||
                    checkColor[2] != data[index + 2]){
                    continue;
                }
                
                // Set the color
                setPixelColor(index, fillColor[0], fillColor[1], fillColor[2], 255);  
                
                // Add surounding points to the stack
                stack.push([p[0] - 1, p[1]]);
                stack.push([p[0] + 1, p[1]]);
                stack.push([p[0], p[1] - 1]);
                stack.push([p[0], p[1] + 1]);
            }  
            
            imageContext.putImageData(imageData, 0, 0);
        }
        
        loadTexture();
    }
    
    $(".color").bind("dragstart", function(e){
        dragColor = JSON.parse($(this).attr("data-color"));
    });
    
    $("#" + imagePanelId).bind("drop", function(e){
        var oldFill = fillColor;
        
        fillColor = dragColor;
        
        var x = e.originalEvent.pageX - $(this).position().left;
        var y = e.originalEvent.pageY - $(this).position().top;
        
        fillSection(x, y);
        
        fillColor = oldFill;
    });
    
    $('#' + imagePanelId).click(function(e){
        var x = e.pageX - $(this).position().left;
        var y = e.pageY - $(this).position().top;
        
        fillSection(x, y);
    });
    
    var initGL = function(canvas){
        var usingGL = true;
        
        try{
            gl = canvas.getContext("experimental-webgl");
        } catch(e) {
            try{
                gl = canvas.getContext("webgl");
            } catch(e) {
            }
        }
        
        if (!gl) {
            usingGL = false;
            //gl = new GL(canvas);
            throw "Could not initialize WebGL.";
        //alert("Could not initialize WebGL.");
        }
        
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, __this.pMatrix);
        
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
        
        return usingGL;
    }
    
    var createShader = function(gl, type, code){
        var shader = gl.createShader(type);
        
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
        }
        
        return shader;
    };
    
    var createFragShader = function(useSpecular){
        var fragShader = createShader(gl, gl.FRAGMENT_SHADER,
            "precision mediump float;\n" +
            "uniform sampler2D uTexture;\n" +
            "uniform lowp vec3 lColor;\n" +
            "uniform highp vec3 lPosition;\n" +
            "uniform highp float lRadius;\n" +
            "uniform mediump int lType;\n" +
            "uniform mediump int eSplit;\n" +
            "uniform vec2 textureSize;\n" +
            "uniform vec4 eggRect;\n" +
            "varying lowp vec2 textureCoord;\n" +
            "varying mediump vec3 normal;\n" +
            "varying highp vec3 position;\n" + 
            "varying vec3 origNormal;\n" +
            "void main(void){\n" +
            "lowp vec3 n;" +
            // Calculate the texture coordinates
            "vec2 tCoord = textureCoord;" +
            "if(eSplit == " + EGG_SPLIT_HALF + "){" +
            "tCoord = (normalize(origNormal).xy + 1.0) * 0.5;" +
            "}else if(eSplit == " + EGG_SPLIT_QUARTER + "){" +
            "n = abs(origNormal);" +
            "if(n.x > n.y){" +
            "if(n.x > n.z){" +
            "tCoord = origNormal.zy;" +
            "}else{" +
            "tCoord = origNormal.xy;" +
            "}" +
            "}else if(n.y > n.z){" +
            "tCoord = origNormal.xz;" +
            "}else{" +
            "tCoord = origNormal.xy;" +
            "}" +
            "tCoord = (tCoord + 1.0) * 0.5;" +
            "}" +
            "tCoord = ((tCoord * eggRect.zw) + eggRect.xy) / textureSize;" +
            // Calculate the lighting
            "highp float d = 1.0;\n" +
            "lowp vec3 lVec;\n" +
            "lowp vec3 diffuse;\n" +
            "vec4 texVal = vec4(1.0);" +
            "highp vec3 spec = vec3(0.0, 0.0, 0.0);\n" +
            "if(lType == 2){\n" +
            "d = distance(lPosition, position);\n" +
            "if(d > lRadius){ discard; }\n" +
            "d = pow(1.0 - (d / lRadius), 2.0);\n" +
            "}\n" +
            "if(lType != 0){\n" +
            "if(lType == 1){\n" +
            "lVec = lPosition;\n" +
            "}else{\n" +
            "lVec = lPosition - position;\n" +
            "}\n" +
            "lVec = normalize(lVec);" +
            "n = normalize(normal);\n" +
            "lowp float NdotL = dot(n, lVec);\n" +
            "if(NdotL < 0.0){ discard; }\n" +
            "if(eSplit == " + EGG_SPLIT_HALF + " && abs(origNormal.z) < 0.02){" +
            "}else{" +
            "texVal = texture2D(uTexture, tCoord);\n" +
            "}" +
            "diffuse = texVal.rgb * NdotL * d * lColor;\n" +
            
            (useSpecular ?
                "lowp vec3 eyeDirection = normalize(-position.xyz);\n" +
                "lowp vec3 reflectDirection = reflect(-lVec, n);\n" +
                "spec = 0.5 * (pow(max(dot(reflectDirection, eyeDirection), 0.0), 10.0) * lColor);\n"
                : "") +
            
            "}else{\n" +
            "if(eSplit == " + EGG_SPLIT_HALF + " && abs(origNormal.z) < 0.02){" +
            "}else{" +
            "texVal = texture2D(uTexture, tCoord);\n" +
            "}" +
            "diffuse = texVal.rgb * lColor;" +
            "}\n" +
            (useSpecular ? 
                "gl_FragColor = vec4(diffuse + spec, 1.0);\n"
                : "gl_FragColor = vec4(diffuse, 1.0);\n") +
            "}");
        
        return fragShader;
    }
    
    var initShaders = function(){
        var fragShader = createFragShader(true);
        var vertexShader = createShader(gl, gl.VERTEX_SHADER,
            "precision mediump float;\n" +
            "attribute vec3 aVertPos;\n" +
            "attribute vec2 aTexPos;\n" +
            "attribute vec3 aNormalPos;\n" +
            "uniform mat4 uMvMatrix;\n" +
            "uniform mat4 uPMatrix;\n" +
            "uniform mat4 uNormalMatrix;\n" +
            "varying vec2 textureCoord;\n" +
            "varying vec3 normal;\n" +
            "varying vec3 position;\n" +
            "varying vec3 origNormal;\n" +
            "void main(void){\n" +
            "textureCoord = aTexPos;\n" +
            "origNormal = aNormalPos;\n" +
            "normal = (uNormalMatrix * vec4(aNormalPos, 1.0)).xyz;\n" +
            "gl_Position = uMvMatrix * vec4(aVertPos, 1.0);\n" +
            "position = gl_Position.xyz;\n" + 
            "gl_Position = uPMatrix * gl_Position;\n" +
            "}");
    
        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        
        if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.detachShader(program, vertexShader);
            gl.detachShader(program, fragShader);
            fragShader = createFragShader(false);
            
            program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragShader);
            gl.linkProgram(program);
            
            if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
                alert("Could not initialize shaders.");
                console.log(gl.getProgramInfoLog(program));
            }
        }
        
        gl.useProgram(program);
        
        program.vertAttr = gl.getAttribLocation(program, "aVertPos");
        gl.enableVertexAttribArray(program.vertAttr);
        
        program.texAttr = gl.getAttribLocation(program, "aTexPos");
        gl.enableVertexAttribArray(program.texAttr);
        
        program.normAttr = gl.getAttribLocation(program, "aNormalPos");
        gl.enableVertexAttribArray(program.normAttr);
        
        program.pMatrix = gl.getUniformLocation(program, "uPMatrix");
        program.mvMatrix = gl.getUniformLocation(program, "uMvMatrix"); 
        program.nMatrix = gl.getUniformLocation(program, "uNormalMatrix"); 
        program.texture = gl.getUniformLocation(program, "uTexture");
        program.lColor = gl.getUniformLocation(program, "lColor");
        program.lPosition = gl.getUniformLocation(program, "lPosition");
        program.lRadius = gl.getUniformLocation(program, "lRadius");
        program.lType = gl.getUniformLocation(program, "lType");
        program.eSplit = gl.getUniformLocation(program, "eSplit");
        program.eggRect = gl.getUniformLocation(program, "eggRect");
        program.textureSize = gl.getUniformLocation(program, "textureSize");
    };
    
    var initBuffers = function(latitudeBands, longitudeBands, radius){
        var latNumber;
        var longNumber; 
        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];
        var c = 0.2;
        var b = 1.65;
        
        // Create the buffer data
        for (latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = (1 + (c * theta)) * cosPhi * sinTheta;
                var y = b * cosTheta;
                var z = (1 + (c * theta)) * sinPhi * sinTheta;
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                textureCoordData.push(u);
                textureCoordData.push(v);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }
            
        // Create the index data
        var indexData = [];
        for (latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }
            
        // Create the webgl Buffers
        vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        vBuffer.itemSize = 3;
        vBuffer.numItems = vertexPositionData.length / 3;
            
        tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
        tBuffer.itemSize = 2;
        tBuffer.numItems = textureCoordData.length / 2;
            
        nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
        nBuffer.itemSize = 3;
        nBuffer.numItems = normalData.length / 3;
            
        iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
        iBuffer.itemSize = 3;
        iBuffer.numItems = indexData.length;
    };
    
    
    var draw = function(){   
        requestAnimFrame(draw); 
        
        if(selectedEgg == null){
            return;
        }
        
        setModelViewMatrix();
        
        // Setup the shader
        gl.uniformMatrix4fv(program.pMatrix, false, __this.pMatrix);
        gl.uniformMatrix4fv(program.mvMatrix, false, __this.mvMatrix);
        gl.uniformMatrix4fv(program.nMatrix, false, __this.nMatrix);
        
        gl.uniform4fv(program.eggRect, selectedEgg.rect);
        gl.uniform2fv(program.textureSize, selectedEgg.size);
        gl.uniform1i(program.eSplit, selectedEgg.split);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(program.vertAttr, vBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.vertexAttribPointer(program.texAttr, tBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(program.normAttr, nBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.texture, 0);
        
        // Draw the room
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        
        if(gl.isSoft){
            gl.bindBuffer(gl.ARRAY_BUFFER, iBuffer);
            gl.drawElements(gl.TRIANGLES, iBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }else{
            for(var key in __this.lights){
                var light = __this.lights[key];
            
                gl.uniform3f(program.lColor, light.color[0], light.color[1], light.color[2]);
                gl.uniform3f(program.lPosition, light.position[0], light.position[1], light.position[2]);
                gl.uniform1f(program.lRadius, light.radius);
                gl.uniform1i(program.lType, light.type);
            
                gl.bindBuffer(gl.ARRAY_BUFFER, iBuffer);
                gl.drawElements(gl.TRIANGLES, iBuffer.numItems, gl.UNSIGNED_SHORT, 0);
            }
        }
        
        gl.disable(gl.BLEND);
    };
    
    var softRender = {
        context: null,
        worker: null,
        texture: null,
        tWidth: 1,
        tHeight: 1
    };
    
    var loadSoftRender = function(canvas){
        loadTexture = function(){   
            softRender.texture = imageData;
            
            if(imageData != null){
                softRender.tWidth = imageData.width;
                softRender.tHeight = imageData.height;
            }
        };
        
        softRender.worker = new Worker("js/egg_worker.js");
        softRender.worker.onerror = function(e){
            console.log(e);
        }
        
        softRender.worker.onmessage = function(e){
            if(e.data[0] === 'draw'){
                renderImageData(e.data[1]);
                
            }
        }
        
        softRender.context = canvas.getContext("2d");
        softRender.worker.postMessage(['resize', canvas.width, canvas.height, softRender.context.getImageData(0, 0, canvas.width, canvas.height)]);
    }
    
    var softRender = function(){
        setModelViewMatrix();
        softRender.worker.postMessage(['render', __this.mvMatrix, __this.nMatrix, softRender.texture, softRender.tWidth, softRender.tHeight]);
    }
    
    var renderImageData = function(imageData){
        requestAnimFrame(softRender); 
        
        softRender.context.putImageData(imageData, 0, 0);
    }
    
    this.start = function(){
        var canvas = $('#' + canvasId)[0];
        var usingGL = false;
        
        try{
            usingGL  = initGL(canvas);
        }catch(e){
            console.log(e);
            usingGL = false;
        }
        
        if(usingGL){
            initShaders();
            initBuffers(40, 40, 1.0);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.enable(gl.DEPTH_TEST);
        }else{
            loadSoftRender(canvas);
        }
        
        //gl.antialias = true;
        
        loadTexture();
        
        if(usingGL){
            draw();
        }else{
            softRender();
        }
    };
    
    // Load the eggs into memory
    // Load the eggs into memory
    var image = new Image();
    image.onload = function(){
        __this.selectEgg(0);
    };
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        image.src = "./images/egg1_small.gif";
        eggList.push({
            image: image, 
            size: [734, 1024], 
            rect: [0, 0, 734, 1024],
            split: EGG_SPLIT_HALF
        });
        
        image = new Image();
        image.src = "./images/egg2_small.gif";
        eggList.push({
            image: image, 
            size: [685, 1024], 
            rect: [0, 0, 685, 1024],
            split: EGG_SPLIT_QUARTER
        });  
		
        image = new Image();
        image.src = "./images/egg3_small.gif";
        eggList.push({
            image: image, 
            size: [685, 1024], 
            rect: [0, 0, 685, 1024],
            split: EGG_SPLIT_HALF
        }); 
        image = new Image();
        image.src = "./images/egg4_small.gif";
        eggList.push({
            image: image, 
            size: [685, 1024], 
            rect: [0, 0, 685, 1024],
            split: EGG_SPLIT_HALF
        }); 
        image = new Image();
        image.src = "./images/egg5_small.gif";
        eggList.push({
            image: image, 
            size: [685, 1024], 
            rect: [0, 0, 685, 1024],
            split: EGG_SPLIT_HALF
        }); 		
    }else{
        image.src = "./images/egg1.gif";
        eggList.push({
            image: image, 
            size: [2149, 2997], 
            rect: [0, 0, 2149, 2997],
            split: EGG_SPLIT_HALF
        });
        
        image = new Image();
        image.src = "./images/egg2.gif";
        eggList.push({
            image: image, 
            size: [2657, 3438], 
            rect: [0, 0, 2657, 3438],
            split: EGG_SPLIT_QUARTER
        });
   
        image = new Image();
        image.src = "./images/egg3.gif";
        eggList.push({
            image: image, 
            size: [2657, 3438], 
            rect: [0, 0, 2657, 3438],
            split: EGG_SPLIT_HALF
        });
   
        image = new Image();
        image.src = "./images/egg4.gif";
        eggList.push({
            image: image, 
            size: [2657, 3438], 
            rect: [0, 0, 2657, 3438],
            split: EGG_SPLIT_HALF
        });
 
        image = new Image();
        image.src = "./images/egg5.gif";
        eggList.push({
            image: image, 
            size: [2657, 3438], 
            rect: [0, 0, 2657, 3438],
            split: EGG_SPLIT_HALF
        });
    }
    
    
        
    /*image = new Image();
    image.src = "./images/egg3.gif";
    eggList.push({
        image: image, 
        size: [2035, 2729], 
        rect: [112, 143, 1832, 2468],
        split: EGG_SPLIT_HALF 
        });*/
    
    return this;
}
