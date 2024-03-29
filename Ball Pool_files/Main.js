var canvas;

var delta = [ 0, 0 ];
var stage = [ window.screenX, window.screenY, window.innerWidth, window.innerHeight ];
getBrowserDimensions();

var themes = [ [ "#10222B", "#95AB63", "#BDD684", "#E2F0D6", "#F6FFE0" ],
		[ "#362C2A", "#732420", "#BF734C", "#FAD9A0", "#736859" ],
		[ "#0D1114", "#102C2E", "#695F4C", "#EBBC5E", "#FFFBB8" ],
		[ "#2E2F38", "#FFD63E", "#FFB54B", "#E88638", "#8A221C" ],
		[ "#121212", "#E6F2DA", "#C9F24B", "#4D7B85", "#23383D" ],
		[ "#343F40", "#736751", "#F2D7B6", "#BFAC95", "#8C3F3F" ],
		[ "#000000", "#2D2B2A", "#561812", "#B81111", "#FFFFFF" ],
		[ "#333B3A", "#B4BD51", "#543B38", "#61594D", "#B8925A" ] ];
var theme;

var worldAABB, world, iterations = 1, timeStep = 1 / 200;

var walls = [];
var wall_thickness = 200;
var wallsSetted = false;

var bodies, elements, text;

var createMode = false;
var destroyMode = false;

var isMouseDown = false;
var isMouseMove = false;
var mouseJoint;
var mouse = { x: 0, y: 0 };
var gravity = { x: 0, y: 1 };

var PI2 = Math.PI * 2;

var timeOfLastTouch = 0;
var createDelay = 10;
var createCount = 0;

init();
play();

function init() {

	canvas = document.getElementById( 'canvas' );

	document.onmousedown = onDocumentMouseDown;
	document.onmouseup = onDocumentMouseUp;
	document.onmousemove = onDocumentMouseMove;
	document.ondblclick = onDocumentDoubleClick;

	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	document.addEventListener( 'touchend', onDocumentTouchEnd, false );

	window.addEventListener( 'deviceorientation', onWindowDeviceOrientation, false );

	// init box2d

	worldAABB = new b2AABB();
	worldAABB.minVertex.Set( -200, -200 );
	worldAABB.maxVertex.Set( window.innerWidth + 200, window.innerHeight + 200 );

	world = new b2World( worldAABB, new b2Vec2( 0, 0 ), true );

	setWalls();
	reset();
}


function play() {

	setInterval( loop, 0);
}

function reset() {
	var i;
	if ( bodies ) {
		for ( i = 0; i < bodies.length; i++ ) {
			var body = bodies[ i ]
			if(body) {
				canvas.removeChild( body.GetUserData().element );
				world.DestroyBody( body );
			}
			body = null;
		}
	}
	
	createCount = 0;

	// color theme
	theme = themes[ Math.random() * themes.length >> 0 ];
	document.body.style[ 'backgroundColor' ] = theme;

	bodies = [];
	elements = [];

	// createInstructions();
}

//

function onDocumentMouseDown() {

	isMouseDown = true;
	return false;
}

function onDocumentMouseUp() {

	isMouseDown = false;
	return false;
}

function onDocumentMouseMove( event ) {

	mouse.x = event.clientX;
	mouse.y = event.clientY;
	isMouseMove = true;
}

function onDocumentDoubleClick() {

	reset();
}

function onDocumentTouchStart( event ) {

	if( event.touches.length == 1 ) {

		event.preventDefault();

		// Faking double click for touch devices

		var now = new Date().getTime();

		if ( now - timeOfLastTouch  < 250 ) {

			reset();
			return;
		}

		timeOfLastTouch = now;

		mouse.x = event.touches[ 0 ].pageX;
		mouse.y = event.touches[ 0 ].pageY;
		isMouseDown = true;
	}
}

function onDocumentTouchMove( event ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		mouse.x = event.touches[ 0 ].pageX;
		mouse.y = event.touches[ 0 ].pageY;
		isMouseMove = true;

	}

}

function onDocumentTouchEnd( event ) {

	if ( event.touches.length == 0 ) {

		event.preventDefault();
		isMouseDown = false;

	}

}

function onWindowDeviceOrientation( event ) {

	if ( event.beta ) {

		gravity.x = Math.sin( event.gamma * Math.PI / 180 );
		gravity.y = Math.sin( ( Math.PI / 4 ) + event.beta * Math.PI / 180 );

	}

}

//

function createInstructions() {

	var size = 250;

	var element = document.createElement( 'div' );
	element.width = size;
	element.height = size;	
	element.style.position = 'absolute';
	element.style.left = -200 + 'px';
	element.style.top = -200 + 'px';
	element.style.cursor = "default";

	canvas.appendChild(element);
	elements.push( element );

	var circle = document.createElement( 'canvas' );
	circle.width = size;
	circle.height = size;

	var graphics = circle.getContext( '2d' );

	graphics.fillStyle = theme[ 3 ];
	graphics.beginPath();
	graphics.arc( size * .5, size * .5, size * .5, 0, PI2, true );
	graphics.closePath();
	graphics.fill();

	element.appendChild( circle );

	text = document.createElement( 'div' );
	text.onSelectStart = null;
	text.innerHTML = '<span style="color:' + theme[0] + ';font-size:40px;">Hello!</span><br /><br /><span style="font-size:15px;"><strong>This is how it works:</strong><br /><br />1. Drag a ball.<br />2.&nbsp;Click&nbsp;on&nbsp;the&nbsp;background.<br />3. Shake your browser.<br />4. Double click.<br />5. Play!</span>';
	text.style.color = theme[1];
	text.style.position = 'absolute';
	text.style.left = '0px';
	text.style.top = '0px';
	text.style.fontFamily = 'Georgia';
	text.style.textAlign = 'center';
	element.appendChild(text);

	text.style.left = ((250 - text.clientWidth) / 2) +'px';
	text.style.top = ((250 - text.clientHeight) / 2) +'px';	

	var b2body = new b2BodyDef();

	var circle = new b2CircleDef();
	circle.radius = size / 2;
	circle.density = 1;
	circle.friction = 0.3;
	circle.restitution = 0.3;
	b2body.AddShape(circle);
	b2body.userData = {element: element};

	b2body.position.Set( Math.random() * stage[2], Math.random() * -200 );
	b2body.linearVelocity.Set( Math.random() * 400 - 200, Math.random() * 400 - 200 );
	bodies.push( world.CreateBody(b2body) );	
}



function createBall( x, y ) {	

	// var x = x || Math.random() * stage[2];
	// var y = y || Math.random() * -200;

	var size = (Math.random() * 30 >> 0) + 60;

	var element = document.createElement("canvas");
	element.width = size;
	element.height = size;
	element.style['position'] = 'absolute';
	element.style['left'] = -200 + 'px';
	element.style['top'] = -200 + 'px';

	var graphics = element.getContext("2d");

	//var num_circles = Math.random() * 10 >> 0;
	// var num_circles = 1;
	var img = document.getElementById("img"+createCount);
	var bg = document.getElementById("bg");

	// for (var i = size; i > 0; i-= (size/num_circles)) {
// 
		// graphics.fillStyle = "#FFFFFF";
		// // graphics.fillRect(0,0,300,300);
		// graphics.beginPath();
		// // graphics.arc(size * .1, size * .5, i * .1, 1, PI2 , true);
		// graphics.moveTo(0,0);
		// graphics.quadraticCurveTo(size , 0 , size, size);
		// graphics.moveTo(0,0);
		// graphics.quadraticCurveTo(0 , size, size, size);
		// // graphics.quadraticCurveTo(x+10, y+10 ,x + size * .5,y + size * .5);
		// graphics.closePath();
		// // graphics.stroke();
		// graphics.fill();
	// }
	
	graphics.drawImage(bg,0,0,size,size);
	graphics.drawImage(img,size * .1,size * .2, size * .8, size * .6);
	

	canvas.appendChild(element);

	elements.push( element );

	var b2body = new b2BodyDef();

	var circle = new b2CircleDef();
	circle.radius = size * 0.3;
	//circle.radius = 0.1;
	circle.density = 0.1;	
	circle.friction = 0.4;
	circle.restitution = 0.5;
	
	b2body.AddShape(circle);
	b2body.userData = {element: element};

	b2body.position.Set( x, y );
	// b2body.linearVelocity.Set( Math.random() * 400 - 200, Math.random() * 400 - 200 );
	b2body.linearVelocity.Set( Math.random() * 200 - 100 , Math.random() * 50);
	bodies.push( world.CreateBody(b2body) );
}

//

function loop() {

	if (getBrowserDimensions()) {
		setWalls();
	}
	
	// delta[0] += (0 - delta[0]) * .5;
	// delta[1] += (0 - delta[1]) * .5;

	world.m_gravity.x = gravity.x * 5 + delta[0];
	world.m_gravity.y = gravity.y * 5 + delta[1];

	mouseDrag();
	world.Step(timeStep, iterations);

	for (i = 0; i < bodies.length; i++) {

		var body = bodies[i];
		var element = elements[i];
		
		if(body) {

			element.style.left = (body.m_position0.x - (element.width >> 1)) + 'px';
			element.style.top = (body.m_position0.y - (element.height >> 1)) + 'px';
	
			if (element.tagName == 'DIV') {
	
				var rotationStyle = 'rotate(' + (body.m_rotation0 * 57.2957795) + 'deg)';
				text.style.WebkitTransform = rotationStyle;
				text.style.MozTransform = rotationStyle;
				text.style.OTransform = rotationStyle;
				text.style.msTransform = rotationStyle;
	
			}
		}

	}

}


// .. BOX2D UTILS

function createBox(world, x, y, width, height, fixed) {

	if (typeof(fixed) == 'undefined') {

		fixed = true;

	}

	var boxSd = new b2BoxDef();

	if (!fixed) {

		boxSd.density = 1.0;

	}

	boxSd.extents.Set(width, height);

	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x,y);

	return world.CreateBody(boxBd);

}

function mouseDrag()
{	
	// mouse press
	if (createMode) {
		if(createCount == 0) {
			createCount++;
			createBall( mouse.x, mouse.y );
		}
		if(isMouseMove) {
			createDelay++;
			isMouseMove = false;
			if(createDelay > 1) {
				createDelay = 0;
				if(createCount < 6) {
					createCount++;
					createBall( mouse.x, mouse.y );
				}
			}
		}

	} else if (isMouseDown && !mouseJoint) {

		var body = getBodyAtMouse();

		if (body) {

			var md = new b2MouseJointDef();
			md.body1 = world.m_groundBody;
			md.body2 = body;
			md.target.Set(mouse.x, mouse.y);
			md.maxForce = 30000 * body.m_mass;
			md.timeStep = timeStep;
			mouseJoint = world.CreateJoint(md);
			body.WakeUp();  
						
			// canvas.removeChild( body.GetUserData().element );
			// world.DestroyBody( body );

		} else {
			createMode = true;
		}

	}

	// mouse release
	if (!isMouseDown) {

		createMode = false;
		destroyMode = false;
		isMouseMove = false;

		if (mouseJoint) {

			world.DestroyJoint(mouseJoint);
			mouseJoint = null;
			
			var body = getBodyAtMouse();
			if (body) {		
				if(bodies[0] == body) {						
						window.open("http://mobile.uplus.co.kr/");
						//bodies[0] = null;				
				} else if(bodies[1] == body) {
					window.open("http://m.naver.com");
					//bodies[1] = null;				
				} else if(bodies[2] == body) {
					window.open("http://m.daum.net");
					//bodies[2] = null;				
				} else if(bodies[3] == body) {
					window.open("http://m.yahoo.com/");
					//bodies[3] = null;				
				} else if(bodies[4] == body) {
					window.open("http://m.slrclub.com");
					//bodies[4] = null;				
				}
				
				//canvas.removeChild( body.GetUserData().element );
				//world.DestroyBody( body );				
				
			}
	
			}
	}

	// mouse move
	if (mouseJoint) {

		var p2 = new b2Vec2(mouse.x, mouse.y);
		mouseJoint.SetTarget(p2);
	}
}

function getBodyAtMouse() {

	// Make a small box.
	var mousePVec = new b2Vec2();
	mousePVec.Set(mouse.x, mouse.y);

	var aabb = new b2AABB();
	aabb.minVertex.Set(mouse.x - 1, mouse.y - 1);
	aabb.maxVertex.Set(mouse.x + 1, mouse.y + 1);

	// Query the world for overlapping shapes.
	var k_maxCount = 5;
	var shapes = new Array();
	var count = world.Query(aabb, shapes, k_maxCount);
	var body = null;

	for (var i = 0; i < count; ++i) {

		if (shapes[i].m_body.IsStatic() == false) {

			if ( shapes[i].TestPoint(mousePVec) ) {
				body = shapes[i].m_body;
				break;

			}

		}

	}

	return body;

}

function setWalls() {

	if (wallsSetted) {

		world.DestroyBody(walls[0]);
		world.DestroyBody(walls[1]);
		world.DestroyBody(walls[2]);
		world.DestroyBody(walls[3]);

		walls[0] = null; 
		walls[1] = null;
		walls[2] = null;
		walls[3] = null;
	}

	walls[0] = createBox(world, stage[2] / 2, - wall_thickness, stage[2], wall_thickness);
	walls[1] = createBox(world, stage[2] / 2, stage[3] + wall_thickness, stage[2], wall_thickness + 10);
	walls[2] = createBox(world, - wall_thickness, stage[3] / 2, wall_thickness, stage[3]);
	walls[3] = createBox(world, stage[2] + wall_thickness, stage[3] / 2, wall_thickness, stage[3]);	

	wallsSetted = true;

}

// BROWSER DIMENSIONS

function getBrowserDimensions() {

	var changed = false;

	if (stage[0] != window.screenX) {

		delta[0] = (window.screenX - stage[0]) * 50;
		stage[0] = window.screenX;
		changed = true;

	}

	if (stage[1] != window.screenY) {

		delta[1] = (window.screenY - stage[1]) * 50;
		stage[1] = window.screenY;
		changed = true;

	}

	if (stage[2] != window.innerWidth) {

		stage[2] = window.innerWidth;
		changed = true;

	}

	if (stage[3] != window.innerHeight) {

		stage[3] = window.innerHeight;
		changed = true;

	}

	return changed;

}
