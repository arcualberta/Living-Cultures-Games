/**
 * Software based opengl support for the Ukrain Alive Projects
 */

function GLBuffer(){
    return this;
}

function GLShader(type){
    this.type = type;
    this.source = null;
    
    return this;
}

function GLProgram(){
    this.attributes = {};
    this.uniforms = {};
    
    this.attachShader = function(shader){
        
    }
    
    return this;
}

function GLTexture(){
    this.image = null;
    
    return this;
}

function GL(canvas){
    /** Constants **/
    this.ZERO = 0;
    this.ONE = 1;
    this.LESS = 0x0201;
    this.EQUAL = 0x0202;
    this.LEQUAL = 0x0203;
    this.SRC_ALPHA = 0x0302;
    this.CW = 0x0900;
    this.CCW = 0x0901;
    this.DEPTH_TEST = 0x0B71;
    this.TEXTURE_2D = 0x0DE1;
    this.UNSIGNED_BYTE = 0x1401;
    this.RGBA = 0x1908;
    this.TEXTURE0 = 0x84C0;
    this.TEXTURE1 = 0x84C1;
    this.TEXTURE2 = 0x84C2;
    this.ARRAY_BUFFER = 0x8892;
    this.ELEMENT_ARRAY_BUFFER = 0x8893;
    this.STREAM_DRAW = 0x88E0;
    this.STATIC_DRAW = 0x88E4;
    this.FRAGMENT_SHADER = 0x8B30;
    this.VERTEX_SHADER = 0x8B31;
    this.COMPILE_STATUS = 0x8B81;
    this.LINK_STATUS = 0x8B82;
    this.UNPACK_FLIP_Y_WEBGL = 0x9240;
    this.COLOR_BUFFER_BIT = 0x00004000;
    this.DEPTH_BUFFER_BIT = 0x00000100;
    
    /** Public Properties **/
    this.isSoft = true;
    
    /** private properties **/
    var __this = this;
    var enabledFields = {};
    var clearColor = "blue";
    var texture = null;
    var viewport = [0, 0, 0, 0, 0, 0];
    var blendFunc = [this.ZERO, this.ONE];
    var frontFace = this.CCW;
    var useProgram = null;
    var buffer = null;
    var activeTexture = this.TEXTURE0;
    var textureVals = {};
    var depthFunc = this.LESS;
    
    /** Setup **/
    var context = canvas.getContext("2d");
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var depthBuffer = new Float32Array(canvas.width * canvas.height);
    
    /** private Functions **/
    var calculatePoint = function(pMatrix, mvMatrix, point, tex){
        var location = [point[0], point[1], point[2], 1.0];
        
        mat4.multiplyVec4(mvMatrix, location);
        var world = [location[0], location[1], location[2]];
        mat4.multiplyVec4(pMatrix, location);
        
        if(location[3] != 0){
            location[0] /= location[3];
            location[1] /= location[3];
            location[2] /= location[3];
        }
        
        location[0] = Math.round(canvas.width * 0.5 * (location[0] + 1));
        location[1] = Math.round(canvas.height * 0.5 * (-location[1] + 1));
        
        return {
            location: location,
            world: world,
            texture: tex
        };
    };
    
    var isVisible = function(p1, p2, p3){
        var u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        var v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
        
        var n = [0.0, 0.0, 0.0];
        vec3.cross(u, v, n);
        
        var cameraToFace = [(p1[0] + p2[0] + p3[0]) / -3.0, (p1[1] + p2[1] + p3[1]) / -3.0, (p1[2] + p2[2] + p3[2]) / -3.0];
        
        if(vec3.dot(cameraToFace, n) > 0.0){
            return false;
        }
        
        return true;
    }
    
    var getLineFunction = function(l1, l2){
        if(l1[0] == l2[0]){
            return [null, l1[1], l1[0]];
        }
        
        var b = (l2[1] - l1[1]) / (l2[0] - l1[0]);
        var m = l1[1] - (b * l1[0]);
        
        if(b != 0){
            b = 1/b;
        }
        
        return [b, m];
    }
    
    var drawScanLine = function(rowIndex, left, right, texture){
        var dStep = right[0] - left[0];
        dStep = dStep == 0.0 ? 0.0 : 1.0/dStep;
        
        var d = 0.0;
        var dl = [left[1].texture[0] * (1.0 - left[3]) + left[2].texture[0] * (left[3]),
            left[1].texture[1] * (1.0 - left[3]) + left[2].texture[1] * (left[3])];
        var dr = [right[1].texture[0] * (1.0 - right[3]) + right[2].texture[0] * (right[3]),
            right[1].texture[1] * (1.0 - right[3]) + right[2].texture[1] * (right[3])];
        
        if(left[0] >= viewport[4]){
            return;
        }
        
        if(right[0] < viewport[0]){
            return;
        }
        
        var index = left[0];
        if(index < viewport[0]){
            d = dStep * (viewport[0] - index);
            index = viewport[0];
        }
        index = index + rowIndex;
        
        var endIndex = right[0];
        if(endIndex >= viewport[4]){
            endIndex = viewport[4] - 1;
        }
        endIndex = endIndex + rowIndex;
        
 
        /*var index = x1 + rowIndex;
        var endIndex = index + x2 - x1;*/
        
        index = index << 2;
        endIndex = endIndex << 2;
        
        for(;index < endIndex; ++index){
            var u = (dl[0] * (1.0 - d)) + (dr[0] * d);
            var v = (dl[1] * (1.0 - d)) + (dr[1] * d);
            
            var tIndex = (Math.round(u * (texture.image.width - 1)) + (Math.round(v * (texture.image.height - 1)) * texture.image.width)) << 2;
            
            imageData.data[index] = texture.data[tIndex + 0];
            ++index;
            
            imageData.data[index] = texture.data[tIndex + 1];
            ++index;
            
            imageData.data[index] = texture.data[tIndex + 2];
            ++index;
            
            imageData.data[index] = 255;
            
            d += dStep;
        }
    }
    
    var getEdge = function(p1, p2, y){
        // Get the line
        var line = getLineFunction(p1.location, p2.location);
        
        // Find the edge
        var x = null;
        if(line[0] == null){
            x = line[2];
        }else if(line[0] == 0){
            // TODO: On the line
            x = p1[0];
        }else{
            x = (y - line[1]) * line[0];
        }
        
        // Check if the edge is confined to the line
        var d = 0.0;
        if(x != null){
            if(x < Math.min(p1.location[0], p2.location[0]) || x > Math.max(p1.location[0], p2.location[0])){
                return null;
            }
            
            // Find its distance
            d = Math.sqrt(Math.pow(p2.location[0] - p1.location[0], 2.0) + Math.pow(p2.location[1] - p1.location[1], 2.0));
            var dp = Math.sqrt(Math.pow(x - p1.location[0], 2.0) + Math.pow(y - p1.location[1], 2.0));
            
            if(d == 0.0 || dp == 0.0){
                d = 0.0;
            }else if(dp == d){
                d = 1.0;
            }else{
                d = dp / d;
            }
        }
        
        
        return x == null ? null : [Math.round(x), p1, p2, d];
    }
    
    var fillPolygon = function(id, p1, p2, p3, texture){
        if(!isVisible(p1.world, p2.world, p3.world)){
            return;
        }
        
        var l1 = p1.location;
        var l2 = p2.location;
        var l3 = p3.location;
        
        //Find the bounding box
        var max = [Math.max(Math.max(l1[0], l2[0]), p3.location[0]), Math.max(Math.max(l1[1], l2[1]), l3[1])];
        var min = [Math.min(Math.min(l1[0], l2[0]), p3.location[0]), Math.min(Math.min(l1[1], l2[1]), l3[1])];
        
        if(min[0] >= viewport[0] + viewport[2] || max[0] < viewport[0] || min[1] >= viewport[1] + viewport[3] || max[1] < viewport[1]){
            return;
        }
        
        // Fill each line
        var inside = false;
        var rowIndex = min[1] * canvas.width;
        for(var y = min[1]; y <= max[1]; ++y){
            // Do not draw anything not in the viewport
            if(y < viewport[1] || y >= viewport[5]){
                continue;
            }
            
            // Get the edges
            var edges = [];
            var edge = getEdge(p1, p2, y);
            if(edge != null){
                edges.push(edge);
            }
            
            edge = getEdge(p2, p3, y);
            if(edge != null){
                edges.push(edge);
            }
            
            edge = getEdge(p3, p1, y);
            if(edge != null){
                edges.push(edge);
            }
            
            edges = edges.sort(function(a,b){return b[0]-a[0]});
            
            // Draw the information
            inside = false;
            var lastEdge = min[0];
            while(edges.length > 0){
                edge = edges.pop();
                
                if(edge[0] == lastEdge[0]){
                    inside != inside;
                    continue;
                }
                
                if(inside){
                    drawScanLine(rowIndex, lastEdge, edge, texture);
                }
                inside = !inside;
                
                lastEdge = edge;
            }
            
            rowIndex += canvas.width
        }
        
        context.putImageData(imageData, 0, 0);
    }
    
    var drawTriangles = function(numItems, type, start){
        var endIndex = start + numItems;
        var vertexBuffer = useProgram.attributes[1].data;
        var texBuffer = useProgram.attributes[2].data;
        var pMatrix = useProgram.uniforms[1];
        var mvMatrix = useProgram.uniforms[2];
        var index = 0;
        var vIndex = 0;
        var tIndex = 0;
        var id = 0;
        
        for(var i = start; i < endIndex;){
            index = buffer.data[i];
            vIndex = index * 3;
            tIndex = index << 1;
            var p1 = calculatePoint(pMatrix, mvMatrix, [vertexBuffer[vIndex + 0], vertexBuffer[vIndex + 1], vertexBuffer[vIndex + 2], 1.0], [texBuffer[tIndex + 0], texBuffer[tIndex + 1]]);
            ++i;
            
            index = buffer.data[i];
            vIndex = index * 3;
            tIndex = index << 1;
            var p2 = calculatePoint(pMatrix, mvMatrix, [vertexBuffer[vIndex + 0], vertexBuffer[vIndex + 1], vertexBuffer[vIndex + 2], 1.0], [texBuffer[tIndex + 0], texBuffer[tIndex + 1]]);
            ++i;
            
            index = buffer.data[i];
            vIndex = index * 3;
            tIndex = index << 1;
            var p3 = calculatePoint(pMatrix, mvMatrix, [vertexBuffer[vIndex + 0], vertexBuffer[vIndex + 1], vertexBuffer[vIndex + 2], 1.0], [texBuffer[tIndex + 0], texBuffer[tIndex + 1]]);
            ++i;
            
            fillPolygon(id, p1, p2, p3, texture);
            ++id;
        }
    }
    
    /** Setup functions **/
    this.enable = function(enumVal){
        enabledFields[enumVal] = true;
    }
    
    this.disable = function(enumVal){
        enabledFields[enumVal] = false;
    }
    
    this.clearColor = function(r, g, b, a){
        clearColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    };
    
    this.viewport = function(x, y, width, height){
        viewport[0] = x;
        viewport[1] = y;
        viewport[2] = width;
        viewport[3] = height;
        viewport[4] = x + width;
        viewport[5] = y + height;
        
        imageData = context.getImageData(viewport[0], viewport[1], viewport[2], viewport[3]);
    };
    
    this.blendFunc = function(sfactor, dfactor){
        blendFunc[0] = sfactor;
        blendFunc[1] = dfactor;
    };
    
    this.frontFace = function(enumType){
        frontFace = enumType;
    };
    
    this.depthFunc = function(enumType){
        depthFunc = enumType;
    };
    
    /** Texture Functions **/
    this.createTexture = function(){
        return new GLTexture();
    };
    
    this.bindTexture = function(enumType, tex){
        texture = tex;
        
        textureVals[activeTexture] = tex;
    };
    
    this.pixelStorei = function(enumType, val){
        
    };
    
    this.texImage2D = function(target, level, internalFormat, format, type, data){
        if(texture != null){
            texture.image = data;
            texture.context = data.getContext("2d");
            texture.data = texture.context.getImageData(0, 0, data.width, data.height).data;
        }
    };
    
    this.texParameteri = function(target, enumType, value){
        
    };
    
    this.activeTexture = function(enumType){
        activeTexture = enumType;
    };
    
    this.deleteTexture = function(texture){
        
    };
    
    /** Shader Functions **/
    this.createShader = function(type){
        return new GLShader(type);
    };
    
    this.shaderSource = function (shader, code){
        shader.source = code;
    };
    
    this.compileShader = function(shader){
        
    };
    
    this.getShaderParameter = function(shader, enumType){
        return true;
    };
    
    /** Program Functions **/
    this.createProgram = function(){
        return new GLProgram;
    }
    
    this.attachShader = function(program, shader){
        program.attachShader(shader);
    }
    
    this.linkProgram = function(program){
        
    }
    
    this.getProgramParameter = function(program, enumType){
        return true;
    }
    
    this.useProgram = function(program){
        useProgram  = program;
    }
    
    this.getAttribLocation = function(program, name){
        if(name === "aVertPos"){
            return 1;
        }else if(name === "aTexPos"){
            return 2;
        }else if(name === "aNormalPos"){
            return 3;
        }
        
        return 0;
    }
    
    this.getUniformLocation = function(program, name){
        // TEMPCODE
        if(name === "uPMatrix"){
            return 1;
        }else if(name === "uMvMatrix"){
            return 2;
        }else if(name === "uNormalMatrix"){
            return 3;
        }else if(name === "uTexture"){
            return 4;
        }else if(name === "lColor"){
            return 5;
        }else if(name === "lPosition"){
            return 6;
        }else if(name === "lRadius"){
            return 7;
        }else if(name === "lType"){
            return 8;
        }
        
        return 0;
    };
    
    this.enableVertexAttribArray = function(array){
        
    };
    
    /** Buffer Functions **/
    this.createBuffer = function(){
        return new GLBuffer();
    };
    
    this.bindBuffer = function(enumType, buff){
        buffer = buff;
    };
    
    this.bufferData = function(type, data, drawType){
        buffer.data = data;
    };
    
    /** Draw Functions **/
    this.uniformMatrix4fv = function(code, transpose, data){
        if(useProgram){
            useProgram.uniforms[code] = data;
        }
    }
    
    this.uniform1i = function(code, d1){
        if(useProgram){
            useProgram.uniforms[code] = d1;
        }
    };
    
    this.uniform1f = function(code, d1){
        if(useProgram){
            useProgram.uniforms[code] = d1;
        }
    };
    
    this.uniform3f = function(code, d1, d2, d3){
        if(useProgram){
            useProgram.uniforms[code] = [d1, d2, d3];
        }
    };
    
    this.vertexAttribPointer = function(code, size, type, normalizes, stride, pointer){
        if(useProgram){
            useProgram.attributes[code] = buffer;
        }
    };
    
    this.clear = function(value){
        if((value & __this.COLOR_BUFFER_BIT) == __this.COLOR_BUFFER_BIT){
            /*context.fillStyle = clearColor;
            context.fillRect(viewport[0], viewport[1], viewport[2], viewport[3]);*/
            for(var i = 0; i < imageData.data.length; ++i){
                imageData.data[i] = 0;
                ++i;
                
                imageData.data[i] = 0;
                ++i;
                
                imageData.data[i] = 0;
                ++i;
                
                imageData.data[i] = 255;
            }
        }
        
        if((value & __this.DEPTH_BUFFER_BIT) == __this.DEPTH_BUFFER_BIT){
            for(var i = 0; i < depthBuffer.length; ++i){
                depthBuffer[i] = 0;
            }
        }
    };
    
    this.drawElements = function(drawType, numItems, type, start){
        // Temp code
        if(!useProgram){
            return;
        }
        
        drawTriangles(numItems, type, start);
    };
    
    return this;
}