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

var Item = function(name, imageUrl){
    this.init(name, imageUrl);
};
{
    Item.prototype.init = function(name, imageUrl){
        this.src = imageUrl;
        this.name = name;
        this.dim = [0, 0, 120, 120, 0, 0];

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
            fill: 'url(' + imageUrl + ')'
        });

        this.element.appendChild(rect);
    };
    Item.prototype.move = function (x, y) {
        this.dim[0] = x;
        this.dim[1] = y;

        this.element.setAttribute('transform', "translate(" + x + "," + y + ")");

        var $element = $(this.element);
        $($element).parent().append($element);
    };
}

var Game = function(allObjects, matchingPairs, width, height, svgAreaPath){
    this.init(allObjects, matchingPairs, width, height, svgAreaPath);
};
{

    function shuffleArray(inArray){
        for(var i = 0; i < inArray.length; ++i){
            var newId = Math.floor(Math.random() * inArray.length);
            var temp = inArray[i];
            inArray[i] = inArray[newId];
            inArray[newId] = temp;
        }
    }

    Game.prototype.init = function(allObjects, matchingPairs, width, height, svgAreaPath) {
        this.items = {};
        this.svg = $(svgAreaPath);

        for(var key in allObjects){
            var item = new Item(key, allObjects[key]);
            this.items[key] = item;
        }

        var topItems = [];
        var bottomItems = [];
        var top = 20;
        var bottom = height - 130;
        for(var key in matchingPairs){
            var pair = matchingPairs[key];

            topItems.push(this.items[pair[0]]);
            bottomItems.push(this.items[pair[1]]);
        }

        var xStart = 0;
        for(var i = 0; i < topItems.length; ++i){
            var x = xStart + (i * 140);

            topItems[i].move(x, top);
            this.svg.append(topItems[i].element);

            bottomItems[i].move(x, bottom);
            this.svg.append(bottomItems[i].element);
        }
    };
    Game.prototype.evaluate = function(){
        
        return true;
    };
}