{
    requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, maxFrameRate);
                };
    })();

    function SVGElement(tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs) {
            if (k === 'xlink:href') {
                el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attrs[k]);
            } else {
                el.setAttribute(k, attrs[k]);
            }
        }
        return el;
    }
    
    function TransformElement(element, x, y, halfWidth, halfHeight, rotation) {
        var transform = "translate(" + x + "," + y + ") rotate(" + rotation + "," + halfWidth + "," + halfHeight + ")";
        element.setAttribute("transform",  transform);
    }
    
    function MessageWindow(message){
        this.message = $("<p class='message-text'></p>");
        this.element = SVGElement("g", {
            
        });
        
        this.rect = SVGElement("rect", {
            x: 0,
            y: 0,
            rx: 10,
            ry: 10,
            stroke: '#CCC',
            'stroke-width': 1,
            fill: '#FFF'
        });
        this.element.appendChild(this.rect);
        
        this.messageHolder = SVGElement('foreignObject', {
            x: 10,
            y: 10
        });
        this.messageHolder.appendChild(this.message[0]);
        this.element.appendChild(this.messageHolder);
        
        this.setMessage(message);
    }
    MessageWindow.prototype.setMessage = function(message){
        this.message.text(message);
    };
    MessageWindow.prototype.resize = function(x, y, width, height){
        this.element.setAttribute("transform", "translate(" + x + "," + y +")");
        this.rect.setAttribute("width", width);
        this.rect.setAttribute("height", height);
        this.messageHolder.setAttribute("width", width - 20);
        this.messageHolder.setAttribute("height", height - 20);
    };

    function ArrowRight(color, x, y) {
        this.g = SVGElement('g', {});
        this.dim = [0.0, 0.0, 0.5, 0.5];

        var path = SVGElement('path', {
            d: 'm 886.21785,318.23637 -300,-200 0,107.75 -212,0 0,184.5 212,0 0,107.75 300,-200 z',
            fill: color
        });

        this.g.appendChild(path);

        this.move(x, y);
    }
    ArrowRight.prototype.move = function (x, y) {
        this.dim[0] = x;
        this.dim[1] = y;
        this.update();
    };
    ArrowRight.prototype.scale = function (width, height) {
        this.dim[2] = scale;
        this.update();
    };
    ArrowRight.prototype.update = function () {

        $(g).attr('transform', "translate(" + this.dim[0] + "," + this.dim[1] + ") scale(" + this.dim[2] + ")");
    };

    function Card(imageId, name, parent) {
        this.imageId = imageId;
        this.dim = [0, 0, 120, 120, 0, 0]; //x, y, width, height
        this.name = name;
        this.element = SVGElement('g', {
            transform: "translate(" + this.dim[0] + "," + this.dim[1] + ")"
        });

        var rect = SVGElement('rect', {
            x: 0,
            y: 0,
            rx: 10,
            ry: 10,
            width: this.dim[2],
            height: this.dim[3],
            stroke: '#CCC',
            'stroke-width': 1,
            fill: 'url(#' + imageId + ')'
        });

        this.element.appendChild(rect);

        var foreignObject = SVGElement('foreignObject', {
            x: 0,
            y: this.dim[3] / 2.0,
            width: this.dim[2],
            height: this.dim[3] / 2.0
        });

        this.element.appendChild(foreignObject);

        var p = $("<p class='card-text'></p>");
        p.text(this.name);
        p.off("click");

        foreignObject.appendChild(p[0]);

        var _this = this;

        $(_this.element).mousedown(function (ev) {
            var event = ev.originalEvent;
            var x = event.pageX - $(ev.target).offset().left;
            var y = event.pageY - $(ev.target).offset().top;

            parent.selectCard(_this, x, y);
        });
        
        $(_this.element).bind("touchstart", function (ev) {
            var event = ev.originalEvent.touches[0];
            var x = event.pageX - $(ev.target).offset().left;
            var y = event.pageY - $(ev.target).offset().top;

            parent.selectCard(_this, x, y);
        });

        $(_this.element).mouseup(function () {
            parent.dropCard();
        });
        
        $(_this.element).bind("touchend", function () {
            parent.dropCard();
        });
        
        $(_this.element).mouseout(function(){
            parent.dropCard();
        });
        
        $(_this.element).bind("touchout", function () {
            parent.dropCard();
        });
    }
    Card.prototype.recalculate = function () {
        this.dim[4] = this.dim[0] + this.dim[2];
        this.dim[5] = this.dim[1] + this.dim[3];
    };
    Card.prototype.move = function (x, y) {
        this.dim[0] = x;
        this.dim[1] = y;

        this.element.setAttribute('transform', "translate(" + x + "," + y + ")");

        var $element = $(this.element);
        $($element).parent().append($element);
    };

    function PlayArea(sWidth, sHeight, cWidth, cHeight, cardCount, parent) {
        this.cardDrops = [];
        this.arrows = [];

        this.init(sWidth, sHeight, cWidth, cHeight, cardCount, parent);
    }
    PlayArea.prototype.init = function (sWidth, sHeight, cWidth, cHeight, cardCount, parent) {
        var sWMid = sWidth / 2.0;
        var sHMid = sHeight / 2.0;
        var arrowWidth = 60;
        var arrowHeight = 40;
        var startX, startY;
        var arrowCount = cardCount - 1;

        if (cardCount % 2 == 0) {
            startX = sWMid;
            startX -= (arrowWidth / 2.0);
            startX -= (cardCount >> 1) * cWidth;
            startX -= (arrowCount >> 1) * arrowWidth;
        } else {
            startX = sWMid;
            startX -= (cWidth / 2.0);
            startX -= (arrowCount >> 1) * arrowWidth;
            startX -= (cardCount >> 1) * cWidth;
        }

        startY = sHMid - (cHeight / 2.0);

        for (var i = 0; i < cardCount; ++i) {
            var card = [startX, startY, cWidth, cHeight, startX + cWidth, startY + cHeight, null];
            this.cardDrops.push(card);

            parent.appendChild(SVGElement('rect', {
                x: card[0],
                y: card[1],
                rx: 10,
                ry: 10,
                width: card[2],
                height: card[3],
                stroke: '#000',
                'stroke-width': 1,
                fill: '#fff'
            }));
            startX += cWidth;

            // Add arrow
            // TODO
            startX += arrowWidth;
        }
    };
    PlayArea.prototype.evaluateCards = function (cards, orderList) {
        var checkCard;
        var count = 0;

        for (var i = 0; i < cards.length; ++i) {
            checkCard = this.cardDrops[i][6];

            if (checkCard !== null) {
                ++count;

                if (checkCard !== cards[orderList[i]]) {
                    return false;
                }
            }
        }

        return count === cards.length ? true : null;
    };
    PlayArea.prototype.dropCard = function (card) {
        var i, drop;
        var found = false;
        var isOutside = true;
        var scale = 0.5;
        for (var i = 0; i < this.cardDrops.length; ++i) {
            drop = this.cardDrops[i];

            if (drop[6] === card) {
                drop[6] = null; // Remove the card from any spot
            }

            if (!found && drop[6] === null) {
                isOutside = drop[4] < (card.dim[0] + (card.dim[2] * scale))
                        || drop[5] < (card.dim[1] + (card.dim[3] * scale))
                        || drop[0] > (card.dim[4] - (card.dim[2] * scale))
                        || drop[1] > (card.dim[5] - (card.dim[3] * scale));

                if (!isOutside) {
                    found = true;
                    drop[6] = card;
                    card.move(drop[0], drop[1]);
                    card.recalculate();
                }
            }
        }
    };
    
    function Game(svgElement, imageUrls, names, winItems, message) { // the images must be provided in order
        this.cards = [];
        this.orderList = [];
        this.selectedCard = null;
        this.cardOffset = [0, 0];
        this.playArea = null;
        this.state = Game.STATE_PLAYING;
        this.messageWindow = new MessageWindow(message);

        var point = svgElement.createSVGPoint();

        var _this = this;

        function getCursorPoint(x, y) {
            point.x = x;
            point.y = y;

            return point.matrixTransform(svgElement.getScreenCTM().inverse());
        }

        $(svgElement).mousemove(function (ev) {
            var event = ev.originalEvent;
            var svg = $(svgElement);

            if (_this.selectedCard && _this.selectedCard != null) {
                var loc = getCursorPoint(
                        event.clientX - _this.cardOffset[0],
                        event.clientY - _this.cardOffset[1]);
                var x = loc.x - svg.offset().left - _this.cardOffset[0];
                var y = loc.y - svg.offset().top - _this.cardOffset[1];
                //var x = event.clientX - svg.offset().left - _this.cardOffset[0];
                //var y = event.clientY - svg.offset().top - _this.cardOffset[1];

                _this.selectedCard.move(loc.x, loc.y);
            }
        });
        
        $(svgElement).bind('touchmove', function (ev) {
            var event = ev.originalEvent.touches[0];
            var svg = $(svgElement);

            if (_this.selectedCard && _this.selectedCard != null) {
                var loc = getCursorPoint(
                        event.clientX - _this.cardOffset[0],
                        event.clientY - _this.cardOffset[1]);
                var x = loc.x - svg.offset().left - _this.cardOffset[0];
                var y = loc.y - svg.offset().top - _this.cardOffset[1];
                //var x = event.clientX - svg.offset().left - _this.cardOffset[0];
                //var y = event.clientY - svg.offset().top - _this.cardOffset[1];

                _this.selectedCard.move(loc.x, loc.y);
            }
        });

        this.init(svgElement, imageUrls, names, winItems, message);
    }
    Game.STATE_PLAYING = 0;
    Game.STATE_WIN = 1;
    Game.prototype.selectCard = function (card, x, y) {
        if (Game.STATE_PLAYING === this.state) {
            this.selectedCard = card;
            this.cardOffset[0] = x;
            this.cardOffset[1] = y;
        }
    };
    Game.prototype.dropCard = function () {
        if (Game.STATE_PLAYING === this.state) {
            var card = this.selectedCard;
            
            if(card != null){
                this.selectedCard = null;
                card.recalculate();

                this.playArea.dropCard(card);
            }

            this.evaluate();
        }
    };
    Game.prototype.init = function (svgElement, imageUrls, names, winItems, message) {
        var card;
        var imgId;
        var pattern;
        var image;
        var i;
        var width = svgElement.viewBox.baseVal.width;
        var height = svgElement.viewBox.baseVal.height;

        // Create the main elements
        var defs = SVGElement('defs', {});
        svgElement.appendChild(defs);

        //this.playArea = new PlayArea((width >> 1) - 250, 100, 500, 300);
        this.playArea = new PlayArea(width, height, 120, 120, imageUrls.length, svgElement);
        //svgElement.appendChild(this.playArea.element);

        // Create the cards
        for (i = 0; i < imageUrls.length; ++i) {
            imgId = 'img_card_' + i;
            pattern = SVGElement('pattern', {
                id: imgId,
                x: 0,
                y: 0,
                width: 1,
                height: 1
            });

            image = SVGElement('image', {
                'xlink:href': imageUrls[i],
                'width': 120,
                'height': 120,
                preserveAspectRatio: 'xMidYMid slice'
            });

            pattern.appendChild(image);
            defs.appendChild(pattern);

            card = new Card(imgId, names[i], this);
            card.recalculate();
            this.cards.push(card);
            this.orderList.push(i);

            //add the card to the page
            svgElement.appendChild(card.element);
        }

        // Shuffle the cards
        for (i = 0; i < this.orderList.length; ++i) {
            var orderIndex = Math.floor((Math.random() * this.orderList.length));
            var cardIndex = this.orderList[orderIndex];
            var cardI = this.orderList[i];

            var card = this.cards[cardI];

            this.cards[cardI] = this.cards[cardIndex];
            this.cards[cardIndex] = card;

            this.orderList[i] = cardIndex;
            this.orderList[orderIndex] = cardI;
        }

        // Set the Cards location
        var y = 20;//height - 120 - 10;
        var x = (width >> 1) - 220;
        for (i = 0; i < this.cards.length; ++i) {
            this.cards[i].move(x + (i * 90), y);
            this.cards[i].recalculate();
        }
        
        // Create the message window
        svgElement.appendChild(this.messageWindow.element);
        this.messageWindow.resize((width / 2.0) - 150, height - 150, 300, 100);

        // Default state actions
        this.onWin = function () {
            // Create the animation
            var items = [];
            for (var i = 0; i < 30; ++i) {
                var item = {
                    element: SVGElement('image', {
                        'xlink:href': winItems[i % winItems.length],
                        'width': 44 + i,
                        'height': 44 + i,
                        preserveAspectRatio: 'xMidYMid slice'
                    }),
                    x: Math.random() * (width - 64),
                    y: 0 - 64 - (Math.random() * height * 1.5),
                    rot: Math.random() * 360.0,
                    v: (60.0 + (((i + 1) / 30) * 50.0)) / 1000.0
                };

                svgElement.appendChild(item.element);
                items.push(item);
            }
            
            var start = 0;
            var time = 0;
            var animate = function(timestamp){
                requestAnimFrame(animate);
                
                time = timestamp - start;                
                start = timestamp;
                var item;
                var rot = time * 0.045;
                for(i = 0; i < items.length; ++i){
                    item = items[i];
                    
                    item.y += item.v * time;
                    
                    if(item.y > height){
                        item.y = 0 - 64 - (Math.random() * height);
                        item.x = Math.random() * (width - 64);
                    }
                    
                    item.rot += rot;
                    
                    if(item.rot > 360){
                        item.rot -= 360;
                    }
                    
                    TransformElement(item.element, item.x, item.y, 32, 32, item.rot);
                }
            };
            
            animate(0);
            
            // Create the text
            var text = SVGElement('text', {
                x: width / 2.0,
                y: height / 2.0,
                'text-anchor': 'middle',
                'font-size': 60,
                'fill': '#FFFFDD',
                'stroke': '#D61212',
                'stroke-width': 2
            });

            $(text).text("You Win!");
            $(text).hide();

            svgElement.appendChild(text);

            $(text).show('slow');
        };

        this.onFail = function () {
            this.messageWindow.setMessage("Something is not right...");
        };

        this.onNormal = function () {
            this.messageWindow.setMessage(message)
        };
    };
    Game.prototype.evaluate = function () {
        var result = this.playArea.evaluateCards(this.cards, this.orderList);

        if (result == true) {
            this.state = Game.STATE_WIN;
            this.onWin();
        } else if (result == false) {
            this.onFail();
        } else {
            this.onNormal();
        }
    };
}

