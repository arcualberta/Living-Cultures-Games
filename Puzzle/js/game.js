{
    requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, maxFrameRate);
                };
    })();

    function guid() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    function drawPieceGrid(piece, context, image) {
        context.drawImage(image, piece.x, piece.y, piece.width, piece.height, piece.location[0], piece.location[1], piece.dimension[0], piece.dimension[1]);
    }

    function drawPieceJigsaw(piece, context, image) {
        return drawPieceGrid(piece, context, image);
    }

    function splitPiecesGrid(width, height, splitX, splitY, displayWidth, displayHeight, pieces) {
        var xPiece, yPiece;
        var xSize = Math.floor(width / splitX);
        var ySize = Math.floor(height / splitY);
        var piece = null;
        var x, y, i;

        if (xSize < 1) {
            xSize = 1;
        }

        if (ySize < 1) {
            ySize = 1;
        }

        for (x = 0; x < width; ) {
            xPiece = width - (x + xSize) < xSize ? width - x : xSize;

            for (y = 0; y < height; ) {
                yPiece = height - (y + ySize) < ySize ? height - y : ySize;

                piece = {
                    x: x,
                    y: y,
                    width: xPiece,
                    height: yPiece,
                    radius: Math.sqrt(Math.pow(xPiece, 2.0) + Math.pow(yPiece, 2.0))/2.0,
                    location: [Math.floor(Math.random() * (displayWidth - xPiece)), Math.floor(Math.random() * (displayHeight - xPiece))],
                    dimension: [xPiece, yPiece],
                    connected: [false, false, false, false], // top, right, bottom, left
                    connectionPieces: [null, null, null, null]
                };

                pieces.push(piece);

                y += yPiece;
            }

            x += xPiece;
        }

        for (i = 0; i < pieces.length; ++i) {
            y = Math.floor(i / splitX);
            x = i - y;
            piece = pieces[i];

            if (x > 0) {
                piece.connectionPieces[3] = pieces[i - 1];
            }

            if (x < (splitX - 1)) {
                piece.connectionPieces[1] = pieces[i + 1];
            }

            if (y > 0) {
                piece.connectionPieces[0] = pieces[i - splitX];
            }

            if (y < (splitY - 1)) {
                piece.connectionPieces[2] = pieces[i + splitX];
            }
        }
    }

    function splitPiecesJigsaw(width, height, splitX, splitY, pieces) {
        return splitPiecesGrid(width, height, splitX, splitY, pieces);
    }

    function Game(parentId, imageUrl, splitX, splitY, mode) {
        var _this = this;
        var image = new Image();
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var parent = $('#' + parentId);
        var pieces = [];
        var dimensions = [0, 0];
        var drawPiece = null;
        var scaleX = 1;
        var scaleY = 1;

        image.onload = function () {
            dimensions[0] = image.width;
            dimensions[1] = image.height;

            switch (mode) {
                case Game.PUZZEL_JIGSAW:
                    splitPiecesJigsaw(dimensions[0], dimensions[1], splitX, splitY, canvas.width, canvas.height, pieces);
                    drawPiece = drawPieceJigsaw;
                    break;

                default:
                    splitPiecesGrid(dimensions[0], dimensions[1], splitX, splitY, canvas.width, canvas.height, pieces);
                    drawPiece = drawPieceGrid;
            }

            parent.append(canvas);
        };

        var draw = function () {
            var max = pieces.length;

            context.clearRect(0, 0, canvas.width, canvas.height);

            for (var i = 0; i < max; ++i) {
                drawPiece(pieces[i], context, image);
            }
        };

        var drawLoop = function () {
            requestAnimFrame(drawLoop);

            draw();
        };

        // Public variables
        this.pieces = pieces;
        this.dimensions = dimensions;
        this.canvas = canvas;
        this.movePiece = null;


        // Events
        $(canvas).bind("touchstart", function(event){
            var rect = canvas.getBoundingClientRect();
            touch = event.originalEvent.touches[0];
            _this.mouseDown(touch.clientX - rect.left, touch.clientY - rect.top);
        });
        $(canvas).bind("mousedown", function (event) {
            var rect = canvas.getBoundingClientRect();
            _this.mouseDown(event.clientX - rect.left, event.clientY - rect.top);
        });
        $(canvas).bind("touchmove", function(event){
            var rect = canvas.getBoundingClientRect();
            touch = event.originalEvent.touches[0];
            _this.mouseMove(touch.clientX - rect.left, touch.clientY - rect.top);
        });
        $(canvas).bind("mousemove", function (event) {
            var rect = canvas.getBoundingClientRect();
            _this.mouseMove(event.clientX - rect.left, event.clientY - rect.top);
        });
        $(canvas).bind("mouseup touchend focusout", function (event) {
            _this.mouseUp();
        });

        // Initialize
        this.resize(parent.innerWidth(), parent.innerHeight());
        image.src = imageUrl;
        drawLoop();
    }
    Game.PUZZLE_GRID = 0;
    Game.PUZZEL_JIGSAW = 1;
    Game.prototype.resize = function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        // Move pieces if needed

    };
    Game.prototype.mouseDown = function (x, y) {
        var piece = null;
        var i = this.pieces.length - 1;
        if (i > -1) { // Go in reverse to grab the topmost element
            do {
                piece = this.pieces[i];

                if (x >= piece.location[0] && y >= piece.location[1] && x <= piece.location[0] + piece.dimension[0] && y <= piece.location[1] + piece.dimension[1]) {
                    this.movePiece = {
                        piece: piece,
                        xOffset: x - piece.location[0],
                        yOffset: y - piece.location[1]
                    };

                    return;
                }
            } while (i--);
        }
    };
    Game.prototype.mouseMove = function (x, y) {
        var movePiece = this.movePiece;
        if (movePiece != null) {
            var piece = movePiece.piece;
            var xOffset = movePiece.xOffset;
            var yOffset = movePiece.yOffset;

            piece.location[0] = x - xOffset;
            piece.location[1] = y - yOffset;
        }
    };
    Game.prototype.getTopPiece = function(piece){
        // We will assume the uppermost row is the highest level, after that, the leftmost is the highest.
        var topY = piece.y;
        var leftX = piece.x;
        
        
    };
    Game.prototype.intersects = function(p1, p2){
        var r1 = p1.radius;
        var r2 = p2.radus;
        var x1 = p1.x + (p1.width * 0.5);
        var x2 = p2.x + (p2.width * 0.5);
        var y1 = p1.y + (p1.height * 0.5);
        var y2 = p2.y + (p2.height * 0.5);
        var x = x1 - x2;
        var y = y1 - y2;
        var dist = Math.sqrt((x * x) + (y * y));
        
        return dist < r1 + r2 ? dist : null;
    };
    Game.prototype.mouseUp = function () {
        var _this = this;
        
        // Check if we found a connecting piece
        var findMax = function(piece, distance){
            var i = 3, index;
            var check = null;
            var result = null;
            var connect = null;
            
            do{
                if(piece.connected[i]){
                    // No snapping
                    return null;
                }else{
                    check = piece.connectionPieces[i];
                    if(check !== null){
                        result = _this.intersects(piece, check);
                        
                        if(result !== null && result < distance){
                            connect = check;
                        }
                    }
                }
            }while(i--);
            
            return {
                closest: connect,
                closestTo: piece
            };
        }; 
        
        var checkPiece = function (piece) {
            var i = 3;
            var r1 = piece.radius;
            var closest = null;
            var distance = Number.MAX_VALUE;
            
            // find the closest piece
            closest = findMax(piece, distance);
            
            if(closest.closest != null){
                console.log("FOUND");
            }
        };
        
        checkPiece(this.movePiece.piece);

        this.movePiece = null;
    };
    Game.prototype.check = function () {
    };
    Game.prototype.onwin = function () {
    };
    Game.prototype.onbadobject = function () {
    };

    window.Game = Game;
}

