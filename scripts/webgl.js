/**
 * WebGL Setup Code
 */
function meshesLoaded(meshes) {
    app.meshes = meshes;
    app.mode = GAMESTATE_LOADED;
    canvas = document.getElementById("gl-canvas");
    initGL();
    initSounds();
    initAllShaders();
    initBuffers();
    initTextures();
    // Might as well do this now
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

window.onload = function() {
    OBJ.downloadMeshes({
            'spaceship': 'assets/models/higher-poly-spaceship-narrow.obj',
            'skybox': 'assets/models/cube2.obj',
            'exit': 'assets/models/exit-sign.obj',
            'fuel': 'assets/models/fuel-bottle.obj',
        },
        meshesLoaded);
}

/**
 * Animation Code
 */
function tick(timeNow) {
    app.animFrame = requestAnimFrame(tick);
    // Clamp elapsed time (dt) to 30 msec so that switching tabs (and pausing render)
    // doesn't cause a jump when switching back
    app.elapsed = Math.min(timeNow - app.lastTime, 30);
    app.lastTime = timeNow;
    app.theta += app.elapsed / 10
    app.sounds["thrust"].volume(app.ship.thrust / 100.0);
    app.drawScene();
    handleKeysPressed();
}