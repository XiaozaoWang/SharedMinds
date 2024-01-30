const myDiv = document.createElement('div');
myDiv.setAttribute('id', 'myDiv');
myDiv.style.position = 'absolute';
myDiv.style.left = '0px'; 
myDiv.style.top = '0px';
myDiv.style.width = '100%';
myDiv.style.height = '100%';
document.body.appendChild(myDiv);

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
//now draw your heart out
context.font = '30px Arial';
context.fillStyle = 'black';
context.fillText("Hello", x, y);
//many people use 'ctx' for variable name instead

document.addEventListener('mousedown', function (event) {
    // use mouse to set location of input
    inputBox.style.left = event.clientX + 'px';
    inputBox.style.top = event.clientY + 'px';
});
