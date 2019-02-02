/**
 * particles.js
 * Current version : 1.0
 * Author(s) : Lilian Gallon (N3ROO)
 * Troubleshooting : Instructions are available on the github page.
 * Contribute here : https://github.com/N3ROO/particles.js
 * GPL-3.0 License
 */

 /**
  * It sets up the environment, and handle all the particles.
  */
class ParticlesHandler{

    /**
     * It creates a graph is the specified canvas.
     * @param canvas_id id of the canvas where we will draw.
     *      No modifications will be done on this canvas. You can even
     *      do something else on it, the particles will be drawn over it.
     * @param settings all the settings are stored in this variable. Check
     *      github for details.
     * @param verbose the script writes what is happenning to the console.
     */
    constructor(canvas_id, settings, verbose){
        this.canvas_id = canvas_id;
        this.running = false;
        this.starting = false;

        // We will need to check the settings juste before starting the loop
        this.settings = settings;

        // Used to troubleshoot
        if(verbose === undefined){
            this.verbose = false;
        }else{
            this.verbose = verbose;
        }

        // Event handling
        this.isMouseOver = false;
    }

    /**
     * Starts the graph (or resume it)
     */
    start(){
        this.running = true;
        this.starting = true;
        this.run();
    }

    /**
     * Stops the graph.
     */
    stop(){
        this.running = false;
    }

    /**
     * @param {number} multiplierIn multiplier when the mouse is in the canvas.
     */
    setMultiplierIn(multiplierIn){
        this.settings.multiplierIn = multiplierIn;
    }

    /**
     * @param {number} multiplierOut multiplier when the mouse is out of the canvas.
     */
    setMultiplierOut(multiplierOut){
        this.settings.multiplierOut = multiplierOut;
    }

    /**
     * This is the loop function.
     */
    run(){
        if(this.starting) {
            if(this.verbose){
                console.log("First start, we need to init everything.");
            }

            this.init();
            this.initParticleList();
            this.starting = false;

            if(this.verbose && this.running){
                console.log("Everything is ready.");
            }else if(this.verbose){
                console.log("A problem occurred during init.");
            }
        }

        // It could have been cancelled during init if an error occurred
        if(this.running){
            this.update();
            this.draw();

            this.requestRedraw();
        }else{
            if(this.verbose){
                console.log("Loop stopped.");
            }
        }
    }

    /**
     * Tells the browser that we wish to perform an animation and requests that the browser call a specified function
     * to update an animation before the next repaint.
     */
    requestRedraw(){
        // We use a workaround to not lose the context (ParticlesHandler)
        let self = this;
        window.requestAnimationFrame(function () {self.run()});
    }

    /**
     * Used to init all the variables used to run the graph.
     */
    init(){
        if(this.verbose){
            console.log("particlesHandler initialization.");
        }

        // We need to retrieve the canvas information
        this.canvas = document.getElementById(this.canvas_id);
        if(this.canvas === null){
            console.error({
                error: "The canvas id '" + this.canvas_id + "' was not found.",
                troubleshooting: "Make sure that it is spelled corretly, and that it does not have the # prefix.",
                impact: "Cancelling particlesHandler initialization."
            });
            this.stop();
            return;
        }

        // Make it visually fill the positioned parent
        this.canvas.width = window.getComputedStyle(document.getElementById("header")).getPropertyValue("width").replace("px", "");
        this.canvas.height = window.getComputedStyle(document.getElementById("header")).getPropertyValue("height").replace("px", "");
        this.canvas.style.width = window.getComputedStyle(document.getElementById("header")).getPropertyValue("width");
        this.canvas.style.height = window.getComputedStyle(document.getElementById("header")).getPropertyValue("height");

        if(this.canvas.width === 0 || this.canvas.height === 0){
            let error_msg = "";
            if(this.canvas.width === 0){
                error_msg += "The canvas as a width of 0. ";
            }
            if(this.canvas.height === 0){
                error_msg += "The canvas as an height of 0. ";
            }

            console.error({
                error: error_msg,
                troubleshooting: "Make sure that the canvas is in a parent div and that the parent div has a non-null size.",
                impact: "Cancelling particlesHandler initialization."
            });
            this.stop();
            return;
        }

        if(this.verbose){
            console.log("Canvas size (w, h) : (" + this.canvas.width + "," + this.canvas.height + ")");
        }

        // Now we can get the information
        this.context = this.canvas.getContext("2d");

        this.loadSettings(this.settings);

        // We need a variable to store all the particles
        this.particles = [];

        // Set up mouse event listeners
        let self = this;
        this.canvas.addEventListener("mouseover", self.mouseOver.bind(this), false);
        this.canvas.addEventListener("mouseout", self.mouseOut.bind(this), false);
    }

    /**
     * It verifies and loads the settings.
     * @param {object} settings variable with all the settings (check github for details)
     */
    loadSettings(settings){
        if(this.verbose){
            console.log("Loading settings.");
        }

        if(settings === undefined){
            if(this.verbose){
                console.log("Settings variable is undefined, we need to create it.");
            }

            settings = {
                amount: -1,
                tolerance: -1,
                lineWidth: -1,
                sizeMin: -1,
                sizeMax: -1,
                positionXMin: -1,
                positionXMax: -1,
                positionYMin: -1,
                positionYMax: -1,
                speedMin: -1,
                speedMax: -1,
                directionMin: -1,
                directionMax: -1,
                colorMin: -1,
                colorMax: -1,
                multiplierIn: -1,
                multiplierOut: -1
            }
        };

        this.loadSetting(settings, "amount"   , this.canvas.width * this.canvas.height / 4000, 0, Number.MAX_SAFE_INTEGER);
        this.loadSetting(settings, "tolerance", 150, 0, Number.MAX_SAFE_INTEGER);
        this.loadSetting(settings, "lineWidth", 3  , 0, Number.MAX_SAFE_INTEGER);

        this.loadSetting(settings, "sizeMin"     , 2, 0, Number.MAX_SAFE_INTEGER);
        this.loadSetting(settings, "sizeMax"     , 6, 0, Number.MAX_SAFE_INTEGER);

        this.loadSetting(settings, "positionXMin", settings.sizeMax + 1, settings.sizeMax + 1, this.canvas.width - settings.sizeMax - 1);
        this.loadSetting(settings, "positionXMax", this.canvas.width - settings.sizeMax, settings.sizeMax + 1, this.canvas.width - settings.sizeMax - 1);
        this.loadSetting(settings, "positionYMin", settings.sizeMax + 1, settings.sizeMax + 1, this.canvas.height - settings.sizeMax - 1);
        this.loadSetting(settings, "positionYMax", this.canvas.height - settings.sizeMax, settings.sizeMax + 1, this.canvas.height - settings.sizeMax - 1);
        this.loadSetting(settings, "speedMin"    , 200, 0, Number.MAX_SAFE_INTEGER);
        this.loadSetting(settings, "speedMax"    , 400, 0, Number.MAX_SAFE_INTEGER);
        this.loadSetting(settings, "directionMin", 0, 0, Math.PI * 2);
        this.loadSetting(settings, "directionMax", Math.PI * 2, 0, Math.PI * 2);
        this.loadSetting(settings, "colorMin"    , 0, 0, 360);
        this.loadSetting(settings, "colorMax"    , 360, 0, 360);

        this.loadSetting(settings, "multiplierIn" , 1.5, 0.001, Number.MAX_SAFE_INTEGER);
        this.loadSetting(settings, "multiplierOut", 1, 0.001, Number.MAX_SAFE_INTEGER);

        this.settings = settings;
    }

    loadSetting(settings, settingName, defaultValue, minValue, maxValue){
        let status;
        if(settings[settingName] === undefined){
            settings[settingName] = defaultValue;
            status = "undefined";
        }else if(settings[settingName] === -1){
            settings[settingName] = defaultValue;
            status = "default";
        }else if(settings[settingName] < minValue){
            settings[settingName] = minValue;
            status = "too low";
        }else if(settings[settingName] > maxValue){
            settings[settingName] = maxValue
            status = "too high";
        }

        if(this.verbose){
            console.log("Loaded setting '" + settingName + "', status : " + status + ".");
        }
        // If none of these statements is reached, it means that the setting is set correctly
    }

    /**
     * Used to create particles.
     */
    initParticleList(){

        if(this.verbose){
            console.log("Creating " + this.settings.amount + " particles.");
        }

        for(let i = 0; i < this.settings.amount; i++){

            // We create the size first since we will use it to find the positions
            let size = ParticlesHandler.random(this.settings.sizeMin, this.settings.sizeMax);

            // Position (make sure that it is not out of bounds)
            let x = ParticlesHandler.random(this.settings.positionXMin, this.settings.positionXMax);
            let y = ParticlesHandler.random(this.settings.positionYMin, this.settings.positionYMax);

            // Then, we need the velocity vector (speed and direction)
            let speed = ParticlesHandler.random(this.settings.speedMin, this.settings.speedMax);
            let direction = ParticlesHandler.random(this.settings.directionMin, this.settings.directionMax);

            let color = ParticlesHandler.random(this.settings.colorMin, this.settings.colorMax);

            // Now we can create the particle
            let dot = new Particle(x, y, size, speed / 1000, direction, color);

            // Add this dot to the particle list
            this.particles.push(dot)
        }
    }

    /**
     * It updates all the particles (positions and springs).
     */
    update(){
        for(let index in this.particles){
            this.particles[index].update(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * It draws all the particles.
     */
    draw(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for(let index in this.particles){
            // We need to draw the springs between particles before them otherwise, the springs
            // will be over and not under the particles
            for(let neighbor_index in this.particles){
                if(neighbor_index !== index){
                    // Retrieve the distance
                    let dist = this.particles[index].distanceTo(this.particles[neighbor_index]);

                    if(dist < this.settings.tolerance){
                        // Draw the spring
                        this.context.beginPath();
                        this.context.strokeWidth = this.settings.lineWidth;
                        this.context.strokeStyle = "rgba(255,255,255," + (1 - dist/this.settings.tolerance) + ")";
                        this.context.moveTo(this.particles[index].x, this.particles[index].y);
                        this.context.lineTo(this.particles[neighbor_index].x, this.particles[neighbor_index].y);
                        this.context.stroke();
                        this.context.closePath();
                    }
                }
            }
        }

        // We draw it here so the springs are under the particles
        for(let index in this.particles){
            this.particles[index].draw(this.context);
        }
    }

    /**
     * Called when the mouse is over the canvas.
     */
    mouseOver(){
        // We make sure that we apply the multiplier only once, and not
        // at every tick when the mouse is over.
        if(!this.isMouseOver) {
            if(this.verbose){
                console.log("Mouse in, changing multiplier to " + this.settings.multiplierIn + ".");
            }

            for (let index in this.particles) {
                this.particles[index].setMultiplier(this.settings.multiplierIn);
            }
            this.isMouseOver = true;
        }
    }

    /**
     * Called when the mouse is out of the canvas.
     */
    mouseOut(){
        // We make sure that we apply the multiplier only once, and not
        // at every tick when the mouse is out.
        if(this.isMouseOver) {
            if(this.verbose){
                console.log("Mouse out, changing multiplier to " + this.settings.multiplierOut + ".");
            }

            for (let index in this.particles) {
                this.particles[index].setMultiplier(this.settings.multiplierOut);
            }
            this.isMouseOver = false;
        }
    }

    /**
     * Gives a random number between min and max [min; max].
     * @param min,
     * @param max.
     */
    static random(min, max){
        return Math.random() * ((max + 1) - min) + min;
    }
}

/**
 * All the particle properties are in this class.
 */
class Particle{

    /**
     * Creates a particle.
     * @param {number} x position on horizontal axis,
     * @param {number} y position on vertical axis,
     * @param {number} size the size of the particle,
     * @param {number} speed the speed obviously,
     * @param {number} direction in radians,
     * @param {number} color hsl color.
     * @constructor
     */
    constructor(x, y, size, speed, direction, color){
        this.x = x;
        this.y = y;

        this.size = size;

        this.vx = Math.cos(direction) * speed;
        this.vy = Math.sin(direction) * speed;

        this.color = color;

        this.multiplier = 1;

        return this;
    }

    /**
     * It moves the particle by taking in account its environment.
     * @param {number} width in pixels of the environment,
     * @param {number} height in pixels of the environment.
     */
    update(width, height){

        let multiplier_increment = 0;
        if(this.multiplier !== 1){
            multiplier_increment = this.multiplier / 2;
        }

        this.setSpeed(this.getSpeed() + multiplier_increment);

        // Change the position of the particles according to the borders
        if(this.x + this.size > width || this.x - this.size < 0){
            this.vx *= -1;
            this.x = this.x + this.size > width ? width - this.size : this.size
        }else{
            this.x += this.vx;
        }

        if(this.y + this.size > height || this.y - this.size < 0){
            this.vy *= - 1;
            this.y = this.y + this.size > height ? height - this.size : this.size
        }else{
            this.y += this.vy;
        }

        this.setSpeed(this.getSpeed() - multiplier_increment);
    }

    /**
     * It draws the particle with all its properties.
     * @param {canvas 2D context} context used to draw on the canvas.
     */
    draw(context){
        context.beginPath();

        // Figure
        context.arc(this.x, this.y, this.getSize(), 0,Math.PI*2, false);

        // Coloration
        let brightness = 100;
        if(this.multiplier > 1){
            // TODO: check if it is okay (10: magic number)
            brightness = 100 - (this.multiplier * 10);
        }

        context.fillStyle = 'hsl(' + this.color + ', 100%, ' + brightness + '%, 100%)';
        context.fill();

        context.closePath();
    }

    /**
     * @returns {number} the size of the particle by taking in account the current multiplier.
     */
    getSize(){
        return this.size * this.multiplier;
    }

    /**
     * @returns {number} : speed of the particle.
     */
    getSpeed(){
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    /**
     * Changes the speed of the particle.
     * @param {number} speed new speed.
     */
    setSpeed(speed){
        // Set the speed
        const direction = this.getDirection();
        this.vx = Math.cos(direction) * speed;
        this.vy = Math.sin(direction) * speed;
    }

    /**
     * @returns {number} : the direction of the particle (radians).
     */
    getDirection(){
        return Math.atan2(this.vy, this.vx);
    }

    /**
     * Changes the direction of the particle.
     * @param {number} direction new direction (radians).
     */
    setDirection(direction){
        const speed = this.getSpeed();
        this.vx = Math.cos(direction) * speed;
        this.vy = Math.sin(direction) * speed;
    }

    /**
     * Changes the current multiplier of the particle.
     * @param {number} multiplier (1 = default).
     */
    setMultiplier(multiplier){
        this.multiplier = multiplier;
    }

    /**
     * Gives the distance between this particle and the given one.
     * @param {Particle} particle,
     * @returns {number} : distance to the specified particle.
     */
    distanceTo(particle){
        let dx = particle.x - this.x;
        let dy = particle.y - this.y;
        return Math.sqrt(dx*dx + dy*dy);
    }
}