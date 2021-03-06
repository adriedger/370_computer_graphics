main();

/************************************
 * MAIN
 ************************************/

function main() {

    console.log("Setting up the canvas");

    // Find the canavas tag in the HTML document
    const canvas = document.querySelector("#assignmentCanvas");

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");
 
    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

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

            doDrawing(gl, canvas, inputTriangles);

        }).catch((e) => {
            console.error(e);
        });

    });
}

function doDrawing(gl, canvas,inputTriangles) {
    // Create a state for our scene
    var state = {
        camera: {
            position: vec3.fromValues(0.0, 0.0, 3.0),
            center: vec3.fromValues(0.0, 0.0, 0.0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
        },
        lights: [
            {
                position: vec3.fromValues(0.0, 0.0, 0.0),
                colour: vec3.fromValues(1.0, 1.0, 1.0),
                strength: 0.5,
            }
        ],
        objects: [],
        canvas: canvas,
        selectedIndex: 0,
    };

    for(var i = 0; i < inputTriangles.length; i++) {
        state.objects.push(
            {
                model: {
                    position: vec3.fromValues(0.0, 0.0, 0.0),
                    rotation: mat4.create(), // Identity matrix
                    scale: vec3.fromValues(1.0, 1.0, 1.0),
                },
                programInfo: lightingShader(gl),
                buffers: undefined,
				
				// *** TODO: Add more object specific state
				color: {
					ambient: inputTriangles[i].material.ambient,
					diffuse: inputTriangles[i].material.diffuse,
					specular: inputTriangles[i].material.specular,
					n: inputTriangles[i].material.n,
				}
                
				
            }
        );
        initBuffers(gl, state.objects[i], inputTriangles[i].vertices.flat(), inputTriangles[i].normals.flat(), inputTriangles[i].triangles.flat());
    }

    setupKeypresses(state);
    
    console.log(state)

    console.log("Starting rendering loop");
    startRendering(gl, state,);
}


/************************************
 * RENDERING CALLS
 ************************************/

function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;

    // This function is called when we want to render a frame to the canvas
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        // Draw our scene
        drawScene(gl, deltaTime, state);

        // Request another frame when this one is done
        requestAnimationFrame(render);
    }

    // Draw the scene
    requestAnimationFrame(render);
}

/**
 * Draws the scene. Should be called every frame
 * 
 * @param  {} gl WebGL2 context
 * @param {number} deltaTime Time between each rendering call
 */
function drawScene(gl, deltaTime, state) {
    // Set clear colour
    // This is a Red-Green-Blue-Alpha colour
    // See https://en.wikipedia.org/wiki/RGB_color_model
    // Here we use floating point values. In other places you may see byte representation (0-255).
    gl.clearColor(0.55686, 0.54902, 0.52157, 1.0);

    // Depth testing allows WebGL to figure out what order to draw our objects such that the look natural.
    // We want to draw far objects first, and then draw nearer objects on top of those to obscure them.
    // To determine the order to draw, WebGL can test the Z value of the objects.
    // The z-axis goes out of the screen
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearDepth(1.0); // Clear everything

    // Clear the color and depth buffer with specified clear colour.
    // This will replace everything that was in the previous frame with the clear colour.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    state.objects.forEach((object) => {
        // Choose to use our shader
        gl.useProgram(object.programInfo.program);

            // Update uniforms
        {
            var projectionMatrix = mat4.create();
            var fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
            var aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
            var near = 0.1; // Near clipping plane
            var far = 100.0; // Far clipping plane
            // Generate the projection matrix using perspective
            mat4.perspective(projectionMatrix, fovy, aspect, near, far);

            gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);
        
            var viewMatrix = mat4.create();
            mat4.lookAt(
                viewMatrix,
                state.camera.position,
                state.camera.center,
                state.camera.up,
            );
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);


            // Update model transform
            var modelMatrix = mat4.create();
            mat4.translate(modelMatrix, modelMatrix, object.model.position);
            mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
            mat4.scale(modelMatrix, modelMatrix, object.model.scale);
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);
        
            // Update camera position
            gl.uniform3fv(object.programInfo.uniformLocations.cameraPosition, state.camera.position);

            //Update lights
            gl.uniform3fv(object.programInfo.uniformLocations.light0Position, state.lights[0].position);
            gl.uniform3fv(object.programInfo.uniformLocations.light0Colour, state.lights[0].colour);
            gl.uniform1f(object.programInfo.uniformLocations.light0Strength, state.lights[0].strength);

            // *** TODO: Add uniform updates here
			gl.uniform3fv(object.programInfo.uniformLocations.colorAmbient, object.color.ambient);
            gl.uniform3fv(object.programInfo.uniformLocations.colorDiffuse, object.color.diffuse);
			gl.uniform3fv(object.programInfo.uniformLocations.colorSpecular, object.color.specular);
            gl.uniform1f(object.programInfo.uniformLocations.n, object.color.n);
			
        }

        // Draw 
        {
            // Bind the buffer we want to draw
            gl.bindVertexArray(object.buffers.vao);

            // Draw the object
            const offset = 0; // Number of elements to skip before starting
            gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
        }

    });
}


/************************************
 * UI EVENTS
 ************************************/

function setupKeypresses(state){
	var highlight = false;

    document.addEventListener("keydown", (event) => {
        console.log(event.code);

        var object = state.objects[state.selectedIndex];

        switch(event.code) {
        case "KeyA":
            if (event.getModifierState("Shift")) {
                // TODO: Rotate camera about Y axis
				vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.1, 0.0, 0.0));
            } else {
                // TODO: Move camera along X axis
                vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.1, 0.0, 0.0));
				vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.1, 0.0, 0.0));
            }
            break;
        case "KeyD":
            if (event.getModifierState("Shift")) {
                // TODO: Rotate camera about Y axis
				vec3.add(state.camera.center, state.camera.center, vec3.fromValues(-0.1, 0.0, 0.0));
            } else {
                // TODO: Move camera along X axis
                vec3.add(state.camera.center, state.camera.center, vec3.fromValues(-0.1, 0.0, 0.0));
				vec3.add(state.camera.position, state.camera.position, vec3.fromValues(-0.1, 0.0, 0.0));
            }
            break;
        case "KeyW":
            if (event.getModifierState("Shift")) {
                // TODO: Rotate camera about X axis
				vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, 0.1, 0.0));
            } else {
                // TODO: Move camera along Z axis
				vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, 0.0, 0.1));
            }
            break;
        case "KeyS":
            if (event.getModifierState("Shift")) {
                // TODO: Rotate camera about X axis
				vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, -0.1, 0.0));
            } else {
                // TODO: Move camera along Z axis
				vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, 0.0, -0.1));
            }
            break;
        case "KeyQ":
                // TODO: Move camera along Y axis
                vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, 0.1, 0.0));
				vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, 0.1, 0.0));
            break;
        case "KeyE":
                // TODO: Move camera along Y axis
                vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, -0.1, 0.0));
				vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, -0.1, 0.0));
            break;
        case "Space":
            // TODO: Highlight
			if (highlight){
				vec3.add(object.model.scale, object.model.scale, vec3.fromValues(-0.2, -0.2, -0.2));
				highlight = false;
			}
			else {
				//object = state.objects[state.selectedIndex];
				vec3.add(object.model.scale, object.model.scale, vec3.fromValues(0.2, 0.2, 0.2));
				highlight = true;
			}
            break;
        case "ArrowLeft":
            // TODO: Cycle selected object
			if (highlight){
				vec3.add(object.model.scale, object.model.scale, vec3.fromValues(-0.2, -0.2, -0.2));
				state.selectedIndex = (state.selectedIndex - 1 + state.objects.length ) % 3;
				object = state.objects[state.selectedIndex];
				vec3.add(object.model.scale, object.model.scale, vec3.fromValues(0.2, 0.2, 0.2));
			}
            break;
        case "ArrowRight":
            // TODO: Cycle selected object
			if (highlight){
				vec3.add(object.model.scale, object.model.scale, vec3.fromValues(-0.2, -0.2, -0.2));
				state.selectedIndex = (state.selectedIndex + 1) % 3;
				object = state.objects[state.selectedIndex];
				vec3.add(object.model.scale, object.model.scale, vec3.fromValues(0.2, 0.2, 0.2));
			}
            break;


        // TODO: Add additional keypress actions
		case "KeyN":
			object.color.n = (object.color.n + 1) % 20;
			break;
		case "Digit1":
			vec3.add(object.color.ambient, object.color.ambient, vec3.fromValues(0.1, 0.1, 0.1));
			if (object.color.ambient[0] >= 1.0) {
				vec3.add(object.color.ambient, object.color.ambient, vec3.fromValues(-1.0, -1.0, -1.0));
			}
			break;
		case "Digit2":
			vec3.add(object.color.diffuse, object.color.diffuse, vec3.fromValues(0.1, 0.1, 0.1));
			if (object.color.diffuse[0] >= 1.0) {
				vec3.add(object.color.diffuse, object.color.diffuse, vec3.fromValues(-1.0, -1.0, -1.0));
			}
			break;
		case "Digit3":
			vec3.add(object.color.specular, object.color.specular, vec3.fromValues(0.1, 0.1, 0.1));
			if (object.color.specular[0] >= 1.0) {
				vec3.add(object.color.specular, object.color.specular, vec3.fromValues(-1.0, -1.0, -1.0));
			}
			break;
		
		case "KeyK":
			if (highlight){
				if (event.getModifierState("Shift")) {
					// TODO: Rotate selected object about Y axis
					mat4.rotateY(object.model.rotation, object.model.rotation, 0.3);
				} else {
					// TODO: Translate selected object about X axis
					vec3.add(object.model.position, object.model.position, vec3.fromValues(0.1, 0.0 , 0.0));
				}
			}
            break;
        case "Semicolon":
			if (highlight){
				if (event.getModifierState("Shift")) {
					// TODO: Rotate selected object about Y axis
					mat4.rotateY(object.model.rotation, object.model.rotation, -0.3);
				} else {
					// TODO: Translate selected object about X axis
					vec3.add(object.model.position, object.model.position, vec3.fromValues(-0.1, 0.0 , 0.0));
				}
			}
            break;
		case "KeyO":
			if (highlight){
				if (event.getModifierState("Shift")) {
					// TODO: rotate selection around view X (pitch)
					mat4.rotateX(object.model.rotation, object.model.rotation, 0.3);
				} else {
					// translate selection along Z axis
					vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.0 , 0.1));
				}
			}
            break;
		case "KeyL":
			if (highlight){
				if (event.getModifierState("Shift")) {
					// TODO: rotate selection around view X (pitch)
					mat4.rotateX(object.model.rotation, object.model.rotation, -0.3);
				} else {
					// translate selection along Z axis
					vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.0 , -0.1));
				}
			}
            break;
		case "KeyI":
			if (highlight){
				if (event.getModifierState("Shift")) {
					// TODO: rotate selection forward and backward around view X (pitch)
					mat4.rotateZ(object.model.rotation, object.model.rotation, 0.3);
				} else {
					// translate selection up and down along view Y
					vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.1 , 0.0));
				
				}
			}
            break;
		case "KeyP":
			if (highlight){
				if (event.getModifierState("Shift")) {
					// TODO: rotate selection forward and backward around view X (pitch)
					mat4.rotateZ(object.model.rotation, object.model.rotation, -0.3);
				} else {
					// translate selection up and down along view Y
					vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, -0.1, 0.0));
				}
			}
			break;			
			
        default:
			
            break;
        }
    });
}

/************************************
 * SHADER SETUP
 ************************************/
function lightingShader(gl){
// Vertex shader source code
    const vsSource =
    `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;

    uniform vec3 uCameraPosition;

    out vec3 oNormal;
    out vec3 oFragPosition;
    out vec3 oCameraPosition;

    void main() {
        // Position needs to be a vec4 with w as 1.0
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
        
        // Postion of the fragment in world space
        oFragPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;

        oNormal = normalize((uModelMatrix * vec4(aNormal, 0.0)).xyz);
        oCameraPosition = uCameraPosition;
    }
    `;

    // Fragment shader source code
    const fsSource =
    `#version 300 es
    precision highp float;

    out vec4 fragColor;
    in vec3 oNormal;
    in vec3 oFragPosition;
    in vec3 oCameraPosition;

    uniform vec3 uLight0Position;
    uniform vec3 uLight0Colour;
    uniform float uLight0Strength;
	
	uniform vec3 uAmb;
	uniform vec3 uDiff;
	uniform vec3 uSpec;
	uniform float n;

    void main() {
        // Get the dirction of the light relative to the object
        vec3 lightDirection = normalize(uLight0Position - oFragPosition);
        
        // TODO: Add lighting to the scene
        // Make use of the uniform light variables
        // To get colours from the materials of the objects, you will need to create your own uniforms

		vec3 L = normalize(uLight0Position - oFragPosition);
		float NdotL = dot(normalize(oNormal), L);
		
		vec3 H = normalize(L + normalize(oFragPosition - oCameraPosition));
		float HdotN = dot(H, normalize(oNormal));
		
        // Diffuse lighting
        //vec3 diffuse = vec3(0.0, 0.0, 0.0);
        //vec3 diffuseColor = vec3(1.0, 1.0, 1.0);

		vec3 diffuse = vec3(0.8, 0.8, 0.8);
        vec3 diffuseColor =  uDiff * NdotL;
		
        // Specular lighting
        vec3 specular = vec3(0.4, 0.4, 0.4);
        vec3 specularColor = uSpec * pow(HdotN, n);

        vec3 ambientColor = uAmb * 0.2;

        fragColor = vec4(( specular * specularColor + diffuse * diffuseColor + ambientColor), 1.0);
    }
    `;

    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
        },
        uniformLocations: {
            projection: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
            light0Position: gl.getUniformLocation(shaderProgram, 'uLight0Position'),
            light0Colour: gl.getUniformLocation(shaderProgram, 'uLight0Colour'),
            light0Strength: gl.getUniformLocation(shaderProgram, 'uLight0Strength'),
            
			// *** TODO: Add additional uniforms here
			colorAmbient: gl.getUniformLocation(shaderProgram, 'uAmb'),
			colorDiffuse: gl.getUniformLocation(shaderProgram, 'uDiff'),
			colorSpecular: gl.getUniformLocation(shaderProgram, 'uSpec'),
			n: gl.getUniformLocation(shaderProgram, 'n'),
        },
    };

       // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    if (programInfo.attribLocations.vertexPosition === -1 ||
        programInfo.attribLocations.vertexNormal === -1 ||
        programInfo.uniformLocations.projection === -1 ||
        programInfo.uniformLocations.view === -1 ||
        programInfo.uniformLocations.model === -1 ||
        programInfo.uniformLocations.light0Position === -1 ||
        programInfo.uniformLocations.light0Colour === -1 ||
        programInfo.uniformLocations.light0Strength === -1 ||
        programInfo.uniformLocations.cameraPosition === -1) {
        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }

    return programInfo;
}

/************************************
 * BUFFER SETUP
 ************************************/

function initBuffers(gl, object, positionArray, normalArray, indicesArray) {

    // We have 3 vertices with x, y, and z values
    const positions = new Float32Array(positionArray);

    const normals = new Float32Array(normalArray);

    // We are using gl.UNSIGNED_SHORT to enumerate the indices
    const indices = new Uint16Array(indicesArray);

    // Allocate and assign a Vertex Array Object to our handle
    var vertexArrayObject = gl.createVertexArray();

    // Bind our Vertex Array Object as the current used object
    gl.bindVertexArray(vertexArrayObject);

    object.buffers = {
        vao: vertexArrayObject,
        attributes: {
            position: initPositionAttribute(gl, object.programInfo, positions),
            normal: initNormalAttribute(gl, object.programInfo, normals),
        },
        indices: initIndexBuffer(gl, indices),
        numVertices: indices.length,
    };
}

function initPositionAttribute(gl, programInfo, positionArray) {

    // Create a buffer for the positions.
    const positionBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        positionArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3; // pull out 3 values per iteration, ie vec3
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from


        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    return positionBuffer;
}


function initColourAttribute(gl, programInfo, colourArray) {

    // Create a buffer for the positions.
    const colourBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        colourArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 4; // pull out 4 values per iteration, ie vec4
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from

        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColour,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColour);
    }

    return colourBuffer;
}


function initNormalAttribute(gl, programInfo, normalArray) {

    // Create a buffer for the positions.
    const normalBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        normalArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3; // pull out 4 values per iteration, ie vec3
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from

        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal);
    }

    return normalBuffer;
}

function initIndexBuffer(gl, elementArray) {

    // Create a buffer for the positions.
    const indexBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER, // The kind of buffer this is
        elementArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    return indexBuffer;
}
