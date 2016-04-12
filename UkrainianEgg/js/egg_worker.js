importScripts("glMatrix-0.9.5.min.js");

var canvasData = null;
var canvasDataArray = null;
var width = 0;
var height = 0;
var wDiv = 0;
var hDiv = 0;
var planeDist = 4.5;
var total = 0;
var totalRender = 0;
var pointIndex = null;
var index = 0;
var isReady = false;
var radius = 1.0;
var rSquared = radius * radius;

function resize(inWidth, inHeight, inCanvasData){
    isReady = false;
    
    canvasData = inCanvasData;
    canvasDataArray = canvasData.data;
    
    width = inWidth;
    height = inHeight;
    
    wDiv = 2.0 / width;
    hDiv = 2.0 / height;
    
    //planeDist = 0.70710678118 * (width/height);
    
    total = width * height;
    totalRender = Math.min(total, total >> 2);
    
    // Randomize the drawn points
    pointIndex = [];
    for(var x = 0; x < width; ++x){
        for(var y = 0; y < height; ++y){
            pointIndex.push([x, y]);
        }
    }
    
    for(var j, q, i = pointIndex.length; i; j = parseInt(Math.random() * i), q = pointIndex[--i], pointIndex[i] = pointIndex[j], pointIndex[j] = q);
    
    index = 0;
    
    isReady = true;
}

function drawPixel(x, y, r, g, b, a){
    if(x >= 0 && x < width && y >= 0 && y < height){
        var index = x + y * width;
        index = index << 2;
        
        /*canvasDataArray[index + 0] = Math.round(Math.min(r, 1.0) * 255.0);
        canvasDataArray[index + 1] = Math.round(Math.min(g, 1.0) * 255.0);
        canvasDataArray[index + 2] = Math.round(Math.min(b, 1.0) * 255.0);
        canvasDataArray[index + 3] = Math.round(Math.min(a, 1.0) * 255.0);*/
        
        canvasDataArray[index + 0] = r;
        canvasDataArray[index + 1] = g;
        canvasDataArray[index + 2] = b;
        canvasDataArray[index + 3] = Math.round(Math.min(a, 1.0) * 255.0);
    }else{
        console.log("Too Big: " + x + ", " + y);
    }
}

function obtainRay(x, y, out){
    out[0] = (x * wDiv) - 1.0;
    out[1] = 1.0 - (y * hDiv);
    out[2] = planeDist;
    vec3.normalize(out);
}

function getTextureEggHalf(n, width, height, data, out){      
    if(n[2] < 0.02 && n[2] > -0.02){
        out[0] = 255;
        out[1] = 255;
        out[2] = 255;
        
        return;
    }
    
    var tCoord = [(n[0] + 1.0) * 0.5, (n[1] + 1.0) * 0.5];
    
    tCoord[0] = Math.round(tCoord[0] * (width - 1));
    tCoord[1] = Math.round((1.0 - tCoord[1]) * (height - 1));
    
    var i = (tCoord[1] * width) + tCoord[0];
    i = i << 2;
    
    out[0] = data[i + 0];
    out[1] = data[i + 1];
    out[2] = data[i + 2];
}

function getTexturePixel(n, width, height, data, out){
    getTextureEggHalf(n, width, height, data, out);
// TODO: egg split in quarters
}

function render(mvMatrix, nMatrix, textureData, tWidth, tHeight){
    if(isReady && textureData != null){
        var data = textureData.data;
        var color = vec3.create();
    
        var c = [0.0, 0.0, 0.0];
        mat4.multiplyVec3(mvMatrix, c);
    
        var v = [0.0 + c[0], 0.0 + c[1], 0.0 + c[2]];
        var dotV = vec3.dot(v, v);
    
        var y = vec3.create();
        var n = vec3.create();
        var ray = vec3.create();
        var l = [1.0, 1.0, -1.0];
        vec3.normalize(l);
        
        for(var i = 0; i < totalRender; ++i){
            var p = pointIndex[index];
            obtainRay(p[0], p[1], ray);
            
            var VdotD = vec3.dot(v, ray);
            var vMinusR = dotV - rSquared;
            var checkVal = (VdotD * VdotD) - vMinusR;
            
            // Check if the point intersects
            if(checkVal < 0.0){
                drawPixel(p[0], p[1], 0.0, 0.0, 0.0, 0.0);
            }else{
                // Calculate the intersecting point
                checkVal = Math.sqrt(checkVal);
                var t1 = (VdotD - checkVal);
                var t2 = (VdotD + checkVal);
                
                if(t1 < t2){
                    var temp = t2;
                    t2 = t1;
                    t1 = temp;
                }
                
                // Get the normal
                vec3.scale(ray, t1, y);
                vec3.subtract(c, y, n);
                
                vec3.normalize(n);
                
                var NdotL = Math.max(vec3.dot(n, l), 0.1);
                
                mat4.multiplyVec3(nMatrix, n);
                vec3.normalize(n);
                
                getTexturePixel(n, tWidth, tHeight, data, color);
                
                drawPixel(p[0], p[1], Math.round(color[0] * NdotL), Math.round(color[1] * NdotL), Math.round(color[2] * NdotL), 1.0);
            }
            
            //Update the index
            ++index;
            if(index >= total){
                index = 0;
            }
        }
    }
    
    self.postMessage(['draw', canvasData]);
}

self.onmessage = function(e){
    if(e.data[0] === 'resize'){
        resize(e.data[1], e.data[2], e.data[3]);
    }else if(e.data[0] === 'render'){
        render(e.data[1], e.data[2], e.data[3], e.data[4], e.data[5]);
    }
}