/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var colorBuffer;    // this contains colors of the vertices 
var triBufferSize; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexColorAttrib;

// ASSIGNMENT HELPER FUNCTIONS

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl2"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles(inputTriangles) {
    if (inputTriangles != String.null) { 
        triBufferSize = 0;
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var colorArray = [];
        var colToAdd = vec3.create() //color to push to col array parametric calculation
        var indexArray = []; // 1D array for indeces
        var vtxBufferSize = 0; // number of vertices in the vertex buffer
        var vtxToAdd =[] // vtx coords to add to the coord array
        var indexOffset = vec3.create(); //the index offset in the current set
        var triToAdd = vec3.create()

        
        // loop over sets
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            // keep track of offset
            vec3.set(indexOffset, vtxBufferSize, vtxBufferSize, vtxBufferSize);
            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
                vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                coordArray.push(vtxToAdd[0], vtxToAdd[1], vtxToAdd[2]);
                //coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                // console.log(inputTriangles[whichSet].vertices[whichSetVert]);
                var Ld = inputTriangles[whichSet].material.diffuse;
                colorArray.push(Ld[0], Ld[1], Ld[2]);
            }
            // add element to color array
            var La = inputTriangles[whichSet].material.ambient;
            var Ld = inputTriangles[whichSet].material.diffuse;
            var Ls = inputTriangles[whichSet].material.specular;
            var n = inputTriangles[whichSet].material.n;

            var BA = vec3.create(); 
            var CA = vec3.create(); 
            var N = vec3.create(); 
            
            var V0 = vec3.fromValues(coordArray[whichSet], coordArray[whichSet+1], coordArray[whichSet+2]);
            var V1 = vec3.fromValues(coordArray[whichSet+3], coordArray[whichSet+4], coordArray[whichSet+5]);
            var V2 = vec3.fromValues(coordArray[whichSet+6], coordArray[whichSet+7], coordArray[whichSet+8]);
            
            //console.log(V0);
            vec3.sub(BA, coordArray[0], vtxToAdd[0]);
            vec3.sub(CA, vtxToAdd[2], vtxToAdd[0]);

            vec3.cross(N, BA, CA);

            var L = vec3.fromValues(-3, 1, 0.5);
            var L_norm = vec3.create();
            vec3.normalize(L_norm, L);

            var V = vec3.fromValues(0, 0, 1);
            
            var H = vec3.create();
            var H_norm = vec3.create();
            vec3.add(H, L, V);
            vec3.normalize(H_norm ,H);

            var NxL = vec3.dot(N, L_norm);
            var NxH = vec3.dot(N, H_norm);

            var KLa = vec3.create();
            vec3.scale(KLa, La, 0.2);

            var KLd = vec3.create();
            var LdxNxL = vec3.create();
            vec3.scale(LdxNxL, KLd, NxL);
            vec3.scale(KLd, LdxNxL, 0.6);

            var KLs = vec3.create();
            var LsxNxH = vec3.create();
            vec3.scale(LsxNxH, KLs, NxH);
            vec3.scale(KLs, LsxNxH, 0.2);

            var add1 = vec3.create();
            //var add2 = vec3.create();
            vec3.add(add1, KLa, KLd);
            vec3.add(colToAdd, add1, KLs); 

            //colToAdd = KLa+ KLd + KLs;//change it up
            //console.log(colToAdd);
            //colorArray.push(colToAdd[0] ,colToAdd[1], colToAdd[2]);
            //colorArray.push(colToAdd[0] ,colToAdd[1], colToAdd[2]);
            //colorArray.push(colToAdd[0] ,colToAdd[1], colToAdd[2]);
            
            // set up triangle index array adjusting offset
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd, indexOffset, inputTriangles[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0], triToAdd[1], triToAdd[2]);
            }

            // loop over inputTriangles[whichSet].triangles
            vtxBufferSize += inputTriangles[whichSet].vertices.length;
            triBufferSize += inputTriangles[whichSet].triangles.length;
            // keep track of vertex and traingle buffer sizes

        } // end for each triangle set 
        triBufferSize *= 3;
        // console.log(coordArray.length);

        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer
        
        // send color indeces to webGL
        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colorArray),gl.STATIC_DRAW); // coords to that buffer

        // send triangle indeces to webGL
        triangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW); // coords to that buffer


    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    // here you need to take care of color attibutes
    var fShaderCode = `#version 300 es
        precision highp float;

        out vec4 FragColor;
        in vec4 oColor;

        void main(void) {
            FragColor = oColor; // all fragments are white
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    // have in/out for vertex colors 
    var vShaderCode = `#version 300 es
        in vec3 vertexPosition;
        in vec3 vertexColor;

        out vec4 oColor;

        void main(void) {
            gl_Position = vec4(vertexPosition, 1.0); // use the untransformed position
            oColor = vec4(vertexColor, 1.0);
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                // set up vertexColorAttrib from vertexColor
                vertexColorAttrib = gl.getAttribLocation(shaderProgram, "vertexColor"); 
                gl.enableVertexAttribArray(vertexColorAttrib)

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

    // color buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // activate
    gl.vertexAttribPointer(vertexColorAttrib,3,gl.FLOAT,false,0,0); // feed

    // triangle buffer: activate and render
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer); // activate
    gl.drawElements(gl.TRIANGLES, triBufferSize, gl.UNSIGNED_SHORT, 0); // feed
     
    gl.drawArrays(gl.TRIANGLES,0,3); // render
} // end render triangles


function doDrawing(inputTriangles) {
    setupWebGL(); // set up the webGL environment
    loadTriangles(inputTriangles); // load in the triangles from tri file
    setupShaders(); // setup the webGL shaders
    renderTriangles(); // draw the triangles using webGL
}

/* MAIN -- HERE is where execution begins after window load */

function main() {
  
        // Hook up the button
        const fileUploadButton = document.querySelector("#fileUploadButton");
        fileUploadButton.addEventListener("click", () => {
            console.log("Submitting file...");
            let fileInput  = document.getElementById('inputFile');
            let files = fileInput.files;
            let url = URL.createObjectURL(files[0]);
    
            fetch(url, {
                mode: 'no-cors' // 'cors' by default
            }).then(res=>{
                return res.text();
            }).then(data => {
                var inputTriangles = JSON.parse(data);
    
                doDrawing(inputTriangles);

            }).catch((e) => {
                console.error(e);
            });
    
        });
  
} // end main
