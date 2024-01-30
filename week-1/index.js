// Get the input box and the canvas element
const inputBox = document.getElementById('inputBox');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d'); // ?
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Global variables
let balls = [];
const G = new Vector(0, -0.001);


function draw() {

  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  gradientBackground();
  
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'none';

  



    for (let i = 0; i < balls.length; i++) {
      for (let j = 0; j < balls.length; j++) {
        if (i !== j) {
          let ball = balls[i];
          let other = balls[j];
          ball.collide(other);
        }
      }
    }
  
    for (let i = 0; i < balls.length; i++) {
      let ball = balls[i];
      ball.applyForce(G);
      ball.move();
      ball.edgeBounce();
      ball.fraction();
      ball.speedControl();
      ball.show(ctx);
    }


    requestAnimationFrame(draw);
}



function gradientBackground() {
   // color1: (251, 194, 235)
   // color2: (166, 193, 238)
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgb(251, 194, 235)');
    gradient.addColorStop(1, 'rgb(166, 193, 238)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
}



// Add event listener to the input box
inputBox.addEventListener('keydown', function (event) {
    // Check if the Enter key is pressed

    if (event.key === 'Enter') {
        const inputValue = inputBox.value;
        const ctx = canvas.getContext('2d');
        ctx.font = '4vw Arial';
        const inputBoxRect = inputBox.getBoundingClientRect();
        const x = inputBoxRect.left;
        const y = inputBoxRect.top;
        // ctx.fillStyle = 'black';
        // ctx.fillText(inputValue, x, y);
        balls.push(new Ball(x, y, inputValue));
        inputBox.value = '';
    }
});

// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse location
    inputBox.style.left = event.clientX + 'px';
    inputBox.style.top = event.clientY + 'px';

});



// Executing:
draw();