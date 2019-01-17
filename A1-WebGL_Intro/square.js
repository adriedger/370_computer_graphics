// Andre Driedger 1805536
// Prof: Dana Cobzas CMPT370 Computer Vision

var canvas;
var gl;

var NumVertices = 6; //One face instead of six

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var thetaLoc;

var flag = true;

window.onload = function init()
{
    // setup canvas
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // define geometry 
    square();

    // view position 
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // canvas color
    gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
    // visibility
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    // link to shader
    thetaLoc = gl.getUniformLocation(program, "theta");
    posLoc = gl.getUniformLocation(program, "pos");
    
    //event listeners for buttons
    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
        
    render();
}

function square() {
	// Only one face in a square
    quad( 1, 0, 3, 2 );
}

function quad(a, b, c, d) {
	// Only 4 vertices in a square
    var vertices = [
        vec4( -0.5, -0.5,  0.0, 1.0 ),
        vec4( -0.5,  0.5,  0.0, 1.0 ),
        vec4(  0.5,  0.5,  0.0, 1.0 ),
        vec4(  0.5, -0.5,  0.0, 1.0 ),
    ];

    var vertexColors = [
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow       
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan        
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );
    
        colors.push([1.0, 0.0, 0.0, 1.0]); // solid red
        
    }
}

function render()
{
    // buffers must be cleared (depth buffer is used for visibility)
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // for animation 
    if(flag) theta[axis] += 2.0; //rotation speed
    gl.uniform3fv(thetaLoc, theta);
    //gl.uniform3fv(posLoc, pos);
    // initiate vertex shader
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    // needed for redrawing 
    requestAnimFrame( render );
}
