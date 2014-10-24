var scene, renderer, camera, container, animation;

var clock = new THREE.Clock();

function render() {
        
    renderer.render( scene, camera );
      
}

function animate() {

    requestAnimationFrame( animate );

    if ( animation != null ) {

        var delta = clock.getDelta();
        THREE.AnimationHandler.update( delta );

    }

    render();

}

function onWindowResize() {

    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( container.offsetWidth, container.offsetHeight );

    render();

}

function setupScene( result, data ) {

    scene = new THREE.Scene();
    scene.add( new THREE.GridHelper( 10, 2.5 ) );

}

function setupLights() {

    var directionalLight = new THREE.DirectionalLight( 0xb8b8b8 );
    directionalLight.position.set(1, 1, 1).normalize();
    directionalLight.intensity = 1.0;
    scene.add( directionalLight );
    
    directionalLight = new THREE.DirectionalLight( 0xb8b8b8 );
    directionalLight.position.set(-1, 0.6, 0.5).normalize();
    directionalLight.intensity = 0.5;
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight();
    directionalLight.position.set(-0.3, 0.6, -0.8).normalize( 0xb8b8b8 );
    directionalLight.intensity = 0.45;
    scene.add(directionalLight);

}

function loadObject( data ) {

    var loader = new THREE.ObjectLoader();
    scene = loader.parse( data );


    var hasLights = false;

    var lights = ['AmbientLight', 'DirectionalLight', 'AreaLight',
        'PointLight', 'SpotLight', 'HemisphereLight']

    for ( i = 0; i < data.object.children.length; i ++ ) {

        var index = lights.indexOf( data.object.children[ i ].type );

        if ( index > -1 ) {

            hasLights = true;
            break;

        }

    }

    if ( ! ( hasLights ) ) setupLights();

    scene.add( new THREE.GridHelper( 10, 2.5 ) );

    render();

}

function loadGeometry( data, url ) {

    var loader = new THREE.JSONLoader();
    var texturePath = loader.extractUrlBase( url );
    data = loader.parse( data, texturePath );

    if ( data.materials === undefined ) {
    
        console.log('using default material');
        data.materials = [new THREE.MeshLambertMaterial( { color: 0xb8b8b8 } )];
    
    }

    var material = new THREE.MeshFaceMaterial( data.materials ); 
    var mesh;

    if ( data.geometry.animation !== undefined ) {

        console.log( 'loading animation' );
        data.materials[ 0 ].skinning = true;
        mesh = new THREE.SkinnedMesh( data.geometry, material, false);

        var name = data.geometry.animation.name;
        animation = new THREE.Animation( mesh, data.geometry.animation );

    } else {

        mesh = new THREE.Mesh( data.geometry, material );

    }

    setupScene();
    setupLights();
    scene.add( mesh );

    if ( animation != null ) {

        console.log( 'playing animation' );
        animation.play();
        animate();

    } else {

        render();

    }
}

function loadBufferGeometry( data ) {

    var loader = new THREE.BufferGeometryLoader();

    var bufferGeometry = loader.parse( data );

    var material = new THREE.MeshLambertMaterial( { color: 0xb8b8b8 } );
    var mesh = new THREE.Mesh( bufferGeometry, material );
    setupScene();
    setupLights();
    scene.add( mesh );

    render();

}

function loadData( data, url ) {

    if ( data.metadata.type === 'Geometry' ) {
        
        loadGeometry( data, url );
    
    } else if ( data.metadata.type === 'Object' ) {
    
        loadObject( data );

    } else if ( data.metadata.type === 'BufferGeometry' ) {

        loadBufferGeometry( data );

    } else {

        console.warn( 'can not determine type' );

    }

}

function init( url ) {

    container = document.createElement( 'div' );
    container.id = 'viewport';
    document.body.appendChild( container );

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true  } );
    renderer.setSize( container.offsetWidth, container.offsetHeight );
    renderer.setClearColor( 0x000000, 0 );
    container.appendChild( renderer.domElement );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    
    var aspect = container.offsetWidth / container.offsetHeight;
    camera = new THREE.PerspectiveCamera( 50, aspect, 0.01, 50 );
    orbit = new THREE.OrbitControls( camera, container );
    orbit.addEventListener( 'change', render );
    camera.position.z = 5;
    camera.position.x = 5;
    camera.position.y = 5;
    var target = new THREE.Vector3( 0, 1, 0 );
    camera.lookAt( target );
    orbit.target = target;
    camera.updateProjectionMatrix();

    window.addEventListener( 'resize', onWindowResize, false );

	var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function ( x ) {
    
        if ( xhr.readyState === xhr.DONE ) {

            if ( xhr.status === 200 || xhr.status === 0  ) {

                loadData( JSON.parse( xhr.responseText ), url );

            } else {

                console.error( 'could not load json ' + xhr.status );

            }

        } 
    
    };
    xhr.open( 'GET', url, true );
    xhr.withCredentials = false;
    xhr.send( null );

}
