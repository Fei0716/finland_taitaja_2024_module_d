document.addEventListener('DOMContentLoaded', function(){
    //const variables
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 10;//the width and height of grid
    const gridXCount = canvas.width / gridSize;
    const gridYCount = canvas.height / gridSize;
    const animationInterval = 100;//10fps

    //classes
    class Snake{
        constructor(x ,color) {
            this.bodyParts = [ [x,0] , [x,10] , [x,20]];//initially snakes consists of three cubes and start at the top left corner
            this.speedX = 0;
            this.speedY = 1;
            this.color = color;
            this.draw();
        }
        draw(){
            //to draw the snake on the canvas
            ctx.beginPath();
            ctx.fillStyle = this.color;

            for(let i of this.bodyParts){
                ctx.roundRect(i[0], i[1] , gridSize, gridSize , [3, 3, 3,3] );
                ctx.fill();
            }
        }
        move(){
            const head = this.bodyParts[this.bodyParts.length - 1];
            let headX = 0;
            //when move to the right end
            if(head[0] + gridSize * this.speedX >= gridSize * gridXCount){
                headX = 0;//move to the left end
            }else if(head[0] + gridSize * this.speedX < 0){
                //when move to the left end
                headX = gridXCount * gridSize;
            }else{
                headX = head[0] + gridSize * this.speedX;//move normally
            }
            let headY = 0;
            //when move to the bottom end
            if(head[1] + gridSize * this.speedY >= gridSize * gridYCount){
                headY = 0;//move to the top
            }else if(head[1] + gridSize * this.speedY < 0){
                //when move to the top end
                headY = gridYCount * gridSize;//move to the bottom
            }else{
                headY = head[1] + gridSize * this.speedY;//move normally
            }


            const newHead = [ headX, headY];
            //remove the tail
            this.bodyParts.shift();
            //add the head
            this.bodyParts.push(newHead);
        }

        grow(){
            //append a new body part to the tail
            //if the snake is moving vertically
            if(this.speedY !== 0){
                this.bodyParts.unshift( [ this.bodyParts[0][0], this.bodyParts[0][1] - gridSize ]);
            }else if(this.speedX !== 0){
                //if the snake is moving horizontally
                this.bodyParts.unshift( [ this.bodyParts[0][0] - gridSize, this.bodyParts[0][1]]);
            }
        }
        //to check for self collision
        hasCollision(currentSnakeIndex){
            if(gameHasEnded){
                return;
            }
            //check whether head collides with the other body parts
            if(this.bodyParts.some((p , i)=>{
                let headIndex = this.bodyParts.length - 1
                if(i < headIndex)
                return p[0] === this.bodyParts[headIndex][0] &&  p[1] === this.bodyParts[headIndex][1]
            })){
                endGame();
                return;
            }

            //check for snakes collision
            if(currentSnakeIndex === 1){
                //compare with snake 2
                this.bodyParts.forEach((p1 , i)=>{
                        //both snakes might have different length so we can not compare each of the body parts directly using index
                      let hasCollided =   snake2.bodyParts.some(( p2 , i) =>{
                           return p1[0] === p2[0] && p1[1] === p2[1];
                        });
                      if(hasCollided){
                          endGame();
                      }
                });
            }else if(currentSnakeIndex === 2){
                //compare with snake 1
                this.bodyParts.forEach((p1 , i)=>{
                    //both snakes might have different length so we can not compare each of the body parts directly using index
                    let hasCollided =   snake1.bodyParts.some(( p2 , i) =>{
                       return p1[0] === p2[0] && p1[1] === p2[1];
                    });
                    if(hasCollided){
                        endGame();
                    }
                });
            }
        }
    }
    class Score{
        constructor() {
            this.currentScore = 0;
        }

        draw(){
            //draw the score at the top right corner of the canvas
            ctx.fillStyle = '#2b3d10';
            ctx.font = "bold 32px Arial ";
            ctx.fillText(this.currentScore.toString() , canvas.width - 40 , 40);
        }
        update(){
            this.currentScore++;
        }
    }
    class Apple{
        constructor() {
            this.position = this.placeApple();//to generate random position for the apple
        }
        placeApple(){
            let position = [];
            position[0] = Math.floor(Math.random() * gridXCount) * gridSize;//get a random grid position
            position[1] = Math.floor(Math.random() * gridYCount) * gridSize;//get a random grid position

            while(snake1.bodyParts.some((part,index,array) => {
                return part[0] === position[0] && part[1] === position[1]
            }) || snake2.bodyParts.some((part,index,array) => {
                return part[0] === position[0] && part[1] === position[1]
            })){
                //regenerate the position x and y
                position[0] = Math.floor(Math.random() * gridXCount);//get a random grid position
                position[1] = Math.floor(Math.random() * gridYCount);//get a random grid position
            }
            return position;
        }
        hasCollision(){
            if(snake1.bodyParts.some((part,index,array) => {
                return part[0] === this.position[0] && part[1] === this.position[1]
            })){
                score.currentScore++;//increase score
                snake1.grow();//grow the length of the snake
                return true;
            }
            if(snake2.bodyParts.some((part,index,array) => {
                return part[0] === this.position[0] && part[1] === this.position[1]
            })){
                score.currentScore++;//increase score
                snake2.grow();//grow the length of the snake
                return true;
            }
            return false;
        }
        draw(){
            ctx.beginPath();
            ctx.fillStyle = '#2b3d10';
            ctx.arc(this.position[0] + (gridSize / 2) ,this.position[1] + (gridSize / 2) , gridSize/2 , 0 , 2*Math.PI);
            ctx.fill();
            ctx.closePath();
        }
        clear(){
            ctx.clearRect( 0, 0 ,canvas.width, canvas.height);
        }

    }
    //states
    let snake1 = new Snake(0 , '#2b3d10');//create the snake here
    let snake2 = new Snake(gridSize * gridXCount - gridSize , '#576101');//create the snake here
    let score = new Score();// object of game score
    let apples = [new Apple() , new Apple()];
    let lastUpdateAnimationTime = 0;
    let gameHasEnded  = false;
    //game loop function here to render the game in 10fps
    function gameLoop(t){
        if(gameHasEnded){
            return;
        }
        let deltaTime  = t - lastUpdateAnimationTime ;
        if(deltaTime >= animationInterval){
            ctx.clearRect(0,0, canvas.width, canvas.height);
            //draw the apple
            apples.forEach((apple , i)=>{
                apple.draw();
                //check for collision with snake
                if(apple.hasCollision()){
                    apple.clear();
                    apples.splice( i, 1);//remove the apple from the apples array
                    //place a new apple
                    apples.push(new Apple());
                }
            });
            //update
            snake1.move();
            snake1.draw();
            snake2.move();
            snake2.draw();
            //check for snake collisions
            snake1.hasCollision(1);
            snake2.hasCollision(2);
            //draw the score;
            score.draw();
            lastUpdateAnimationTime = t;
        }
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);

    //global functions
    function endGame(){
        //to stop the game loop
        gameHasEnded = true;
        document.querySelector('#score').innerHTML = score.currentScore;
        document.querySelector('#modal-end').showModal();
    }
    function restartGame(){
        ctx.clearRect( 0,0, canvas.width, canvas.height);
        snake1 = new Snake(0 , '#2b3d10');//create the snake here
        snake2 = new Snake(gridSize * gridXCount - gridSize , '#576101');//create the snake here
        score = new Score();// object of game score
        apples = [new Apple() , new Apple()];
        lastUpdateAnimationTime = 0;
        gameHasEnded  = false;
        document.querySelector('#modal-replay').close();
        requestAnimationFrame(gameLoop);

    }
    async function submitScore(){
        try{
            const response = await fetch('http://192.168.10.2/module_c/public/api/v1/games/submit-score',{
                method: 'POST',
                headers :{
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body:JSON.stringify({
                    'name': document.querySelector('#name').value,
                    'score': score.currentScore,
                    'datetime': new Date(),
                    'gameId': 1,
                })
            });
            if(!response.ok){
                throw Error;
            }
            const data = await response.json();
            document.querySelector('#message-success').innerHTML = data.message;


        }catch(e){
            console.error(e);
        }finally {
            document.querySelector('#modal-form').close();
            document.querySelector('#modal-replay').showModal();
        }
    }
    //event listeners
    document.addEventListener('keydown' , function(e){
        switch(e.key){
            //movements for snake 1
            case 'w'://move up
                //we can only change direction if the snake wasnt moving in vertical direction already
                if(snake1.speedY !== 1){
                    snake1.speedY = -1;
                    snake1.speedX = 0;
                }
                break;
            case 'a'://move to left
                if( snake1.speedX !== 1) {
                    snake1.speedX = -1;
                    snake1.speedY = 0;
                }
                break;
            case 's'://move down
                if(snake1.speedY !== -1) {
                    snake1.speedY = 1;
                    snake1.speedX = 0;
                }
                break;
            case 'd'://move to right
                if(snake1.speedX !== -1) {
                    snake1.speedX = 1;
                    snake1.speedY = 0;
                }
                break;

            //movement for snake 2
            case 'ArrowUp'://move up
                //we can only change direction if the snake wasnt moving in vertical direction already
                if(snake2.speedY !== 1){
                    snake2.speedY = -1;
                    snake2.speedX = 0;
                }
                break;
            case 'ArrowLeft'://move to left
                if( snake2.speedX !== 1) {
                    snake2.speedX = -1;
                    snake2.speedY = 0;
                }
                break;
            case 'ArrowDown'://move down
                if(snake2.speedY !== -1) {
                    snake2.speedY = 1;
                    snake2.speedX = 0;
                }
                break;
            case 'ArrowRight'://move to right
                if(snake2.speedX !== -1) {
                    snake2.speedX = 1;
                    snake2.speedY = 0;
                }
                break;

            default:break;
        }
    })

    document.querySelector('#btn-yes').addEventListener('click', function(){
        document.querySelector('#modal-end').close();
        //bring out the modal form
        document.querySelector('#modal-form').showModal();

    });
    document.querySelector('#btn-no').addEventListener('click', function(){
        document.querySelector('#modal-end').close();
        document.querySelector('#modal-replay').showModal();

    });

    document.querySelector('#form-score').addEventListener('submit', function(e){
        e.preventDefault();
        submitScore();

    });

    document.querySelector('#btn-play').addEventListener('click', function(){
        restartGame();
    });
});