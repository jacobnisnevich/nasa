/**
 * I didn't know what to call this file; feel free to rename
 */

/**
 * Start rendering/ticking and drawing with drawSpace()
 */
function startPlaying() {
    app.mode = GAMESTATE_PLAYING;
    app.drawScene = drawSpace;
    app.lastTime = window.performance.now();
    requestAnimFrame(tick);
}

/**
 * Stop rendering/ticking
 * Used for end of level or end of game score screen
 */
function stopPlaying() {
    app.mode = GAMESTATE_LOADED;
    app.drawScene = function() {};
    cancelAnimationFrame(app.animFrame);
}

/**
 * Draw the space environment. Draws the spaceship, skybox, and planets
 * corresponding to the current level
 */
function drawSpace() {
    // do the drawing for all space objects
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    var pMatrix = perspective(50, canvas.width / canvas.height, app.camera.near, app.camera.far);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, flatten(pMatrix));
    var viewMatrix = translate(add(app.camera.position, app.ship.position));
    viewMatrix = mult(rotate(app.ship.heading, [0, 1, 0]), viewMatrix);
    // Only need the next line if we end up switching shaders
    // gl.useProgram(shaderProgram)
    var mvMatrix = scale(0.05, 0.05, 0.05);
    mvMatrix = mult(translate(app.ship.position.map(function(e){return -e;})), mvMatrix);

    mvMatrix = mult(rotate(-1*app.ship.heading, [0, 1, 0]), mult(viewMatrix, mvMatrix));
    drawObject(app.models.spaceship, mvMatrix);
    app.levels[app.currentLevel].forEach(function(planet) {
        mvMatrix = scale(planet.size, planet.size, planet.size);
        mvMatrix = mult(translate(planet.position), mvMatrix);
        mvMatrix = mult(viewMatrix, mvMatrix);
        drawObject(app.models.planet, mvMatrix);
    });

    gl.uniform1f(shaderProgram.textureScaleUniform, 8.0);
    mvMatrix = scale(6000, 6000, 6000);
    mvMatrix = mult(viewMatrix, mvMatrix);
    drawObject(app.models.skybox, mvMatrix);
    gl.uniform1f(shaderProgram.textureScaleUniform, 1.0);
    moveShip();
    updateUI();
}

/**
 * Helper function for drawSpace()
 * @param  {Model} model    The model to be drawn
 * @param  {mat4} mvMatrix Model-view matrix associated with the model
 */
function drawObject(model, mvMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, model.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, model.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, model.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if ('texture' in model) {
        gl.activeTexture(gl.TEXTURE0 + model.num);
        gl.bindTexture(gl.TEXTURE_2D, model.texture);
        gl.uniform1i(shaderProgram.samplerUniform, model.num);
        gl.uniform1i(shaderProgram.hasTexture, true);
    }
    else
        gl.uniform1i(shaderProgram.hasTexture, false);

    // TODO: Send lighting/material data
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, flatten(mvMatrix));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function moveShip() {
    // Increment position by x = v*dt
    // Divide dt just to make it smaller 
    for (var i = 0; i < 3; i++) {
        app.ship.position[i] += app.ship.velocity[i] * app.elapsed/1000.0;
    }
    // Decrement fuel proportionally to your thrust (1000 is just an arbitrary constant that works for now)
    app.ship.fuel -= app.ship.thrust / 1000.0;
    // No fuel == no thrust
    if (app.ship.fuel <= 0)
        app.ship.thrust = 0;
    // TODO: Calculate the acceleration vectors from all planets
    // Calculate the acceleration created by the ship's thrust
    // (How do we find a vector for the ship's thrust based off of its heading?)
    // Add them together; alter velocity by v = a * dt like below
    var accelVector = calculateAcceleration();
    for (var i = 0; i < 3; i++) {
        app.ship.velocity[i] += accelVector[i] * app.elapsed/120.0;
    }
}

function calculateAcceleration() {
    var thrustVector = vec3(app.ship.thrust/60 * Math.sin(radians(-app.ship.heading)), 0, app.ship.thrust/60 * Math.cos(radians(-app.ship.heading)));
    return thrustVector;
}