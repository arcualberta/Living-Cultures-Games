/** JQuery Animations setup **/
{
    var A = 1.3;
    var B = Math.asin(1 / (A / 2.0)) / Math.PI;
    
    function gaussian(x, a, b, c){
        let d = -(Math.pow(x - b, 2));
        let e = 2 * c * c;
        return a * Math.pow(Math.E, d / e);
    }
    
    $.extend(jQuery.easing, {
        scrollOpen:  function(x, t, b, c, d){
            return Math.sin(x * (A * Math.PI) / 2.0) * 1.2;
        }
    });
}

/** Angular JS Code **/
var quizApp = angular.module('quizApp', []);
        
quizApp.controller('MainController', ['$scope', function($scope){
        $scope.page = -1;
        $scope.data = {
            "Title": "China Alive Quiz",
            "Questions": []
        };
        $scope.currentQuestion = null;
        $scope.answers = [];
        $scope.QUESTION_PREFIX = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        
        let shuffle = function(a){
            let i, r, s;
            for(i = a.length; i; --i){
                r = Math.floor(Math.random() * i);
                s = a[i - 1];
                a[i - 1] = a[r];
                a[r] = s;
            }
        }
        
        let setPage = function(page){
            $scope.$applyAsync(function(){
                $scope.page = page;
                
                if(page >= 0 || page <= $scope.data.Questions.length){
                    let index = 0, answer;
                    $scope.currentQuestion = $scope.data.Questions[page];
                    $scope.answers.length = 0;
                    
                    $scope.answers.push({
                        "Answer": $scope.currentQuestion.Answer,
                        "Image": $scope.currentQuestion.Images[$scope.currentQuestion.Answer]
                    });
                    
                    for(index = 0; index < $scope.currentQuestion.Decoys.length; ++index){
                        answer = $scope.currentQuestion.Decoys[index];
                        
                        $scope.answers.push({
                            "Answer": answer,
                            "Image": $scope.currentQuestion.Images[answer]
                        });
                    }
                    
                    shuffle($scope.answers);
                }
            });
        };
        
        $scope.getData = function(dataUrl){
            $.getJSON(dataUrl, function(data){
                $scope.$apply(function(){
                   $scope.page = -1;
                   $scope.data = data;
                });
            });
        };
        
        $scope.start = function(){
            setPage(0);
        };
        
        $scope.getQuestionPage = function(){
            if($scope.page < 0){
                return "welcome.html";
            }else if($scope.page >= $scope.data.Questions.length){
                return "complete.html";
            }else{
                return "question.html";
            }
        };
        
        $scope.answerQuestion = function(answer){
            if($scope.currentQuestion.Answer == answer.Answer){
                setPage($scope.page + 1);
            }else{
                //TODO: On error
            }
        }
        
        $scope.showHintIcon = function() {
            if($scope.page > -1 && $scope.page < $scope.data.Questions.length){
                return true;
            }
            
            return false;
        }
        
        $scope.showScroll = function() {
            $("#hintBook").fadeIn("fast", function(){
                $("#hintContent").animate({
                    width: "50%"
                }, {
                    duration: 500,
                    easing: 'scrollOpen',
                    complete: function(){
                    }
                });
            });
        }
        
        $scope.hideScroll = function() {
            $("#hintContent").animate({
                width: "0%"
            }, 500, function(){
                $("#hintBook").fadeOut("fast", function(){
                });
            });
        }
}]);