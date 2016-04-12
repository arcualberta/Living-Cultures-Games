var game;
var selectedImage = 0;
            
function selectEgg(image, i){
    image.click(function(){
        $("#selectPanel img").removeClass("selected");
        $(image).addClass("selected");
                        
        if(selectedImage != i){
            selectedImage = i;
            game.selectEgg(i);
        }
    });
}
            
function saveCanvasImage(link, canvasId, name){
    var canvas = $('#' + canvasId)[0];
    var dataURL = canvas.toDataURL();
                
    link.href = dataURL;
    link.download = name;
}
            
$(document).ready(function(){
    $('#saveColor').click(function() {
        saveCanvasImage(this, 'imagePanel', 'pysanky.png');
    });
                
    game = new EasterEgg('imagePanel', 'eggPanel');
                
    var eggList = game.getEggList();
    for(var i = 0; i < eggList.length; ++i){
        var image = $(eggList[i].image);
        image.css("height", 92);
        image.css("width", Math.round(92 * (image.width / image.height)));
        image.css("cursor", "pointer");
                    
        if(i == 0){
            image.addClass("selected");
            selectedImage = image;
        }
                    
        selectEgg(image, i);
                    
        $("#selectPanel").append(image);
    }
                
    game.start();
});