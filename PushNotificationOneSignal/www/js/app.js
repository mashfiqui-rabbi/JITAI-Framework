// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('starter', ["ionic", "ion-datetime-picker","ion-autocomplete"])

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

app.directive('compile', function($compile) {
    // directive factory creates a link function
    return function(scope, element, attrs) {
        scope.$watch(
            function(scope) {
                // watch the 'compile' expression for changes
                return scope.$eval(attrs.compile);
            },
            function(value) {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);

                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
            }
        );
    };
});

app.controller('myCtrl', function($scope,$interval,$http,$rootScope) {
    //$scope.name = "holla";

    $rootScope.datetimeValue = new Date();


    var survey_data = [];
    surveygenerator();
    var autocomplete_options = [];

    // this function takes the JSON file and creates the survey
    function surveygenerator() {

        //this is a callback.
        $http.get('js/morning.json').success(function(data) {
            //$http.get('js/data.json').success(function(data) {
            //console.log("Questions: " + data);
            //console.log(JSON.stringify(data));

            survey_data = data;
            $scope.qs = data;
            $scope.survey = {};
            $scope.reponse_ts = {};


            //
            var survey_string = "";
            for (var i = 0; i < survey_data.length; i++) {

                var obj = survey_data[i];
                //console.log(JSON.stringify(obj));
                //console.log(JSON.stringify(obj.name));
                survey_string = process_survey(obj, survey_string, obj.name);
                //console.log(survey_string);
  
            }

            $scope.thisCanBeusedInsideNgBindHtml = survey_string;
            $scope.survey.starttimeUTC = new Date().getTime();
            
            //console.log(JSON.stringify($scope.survey));
            //console.log(survey_string);
        });
    }

    //
    $scope.callbackMethod = function (query, isInitializing,componentId) {
        // depends on the configuration of the `items-method-value-key` (items) and the `item-value-key` (name) and `item-view-value-key` (name)
        

        //return { "items": [ 'test1 ' + query, 'test2 ' + query, 'test3', 'mash'] }
        var results = [];
        var index;
        var entry;
        console.log(componentId);
        console.log(autocomplete_options);
        var source = autocomplete_options[componentId] ;//[ 'test1 ', 'test2 ', 'test3', 'mash'] ; //
        // Look for componentID to set the element for specific elements 
        // https://github.com/guylabs/ion-autocomplete
        var unchanged_query = query;
        query = query.toUpperCase();
        for (index = 0; index < source.length; ++index) {
          entry = source[index];
          if (entry.toUpperCase().indexOf(query) != -1) {
            results.push(entry);
          }
        }

        if(results.length == 0)
          results = [unchanged_query];

        console.log('Survey:\n ' + $scope.survey);
        return { "items": results };

    };

    $scope.clickedMethod = function (callback) {
      // print out the selected item
      console.log("Clicked item is: " + callback.item); 

      if(typeof callback.item == 'undefined')
          return;

      //I have to change based on id, and add them
      $scope.autocomplete_options = JSON.parse(window.localStorage['ema_ac_' + callback.componentId] || '[]'); 
      //options = [];
      var found = false;
      for(var k = 0; k < $scope.autocomplete_options.length; k++){
          //-- options.push($scope.autocomplete_options[k].text);
          if($scope.autocomplete_options[k].text == callback.item){
              $scope.autocomplete_options[k].times++;
              found = true;
          }
          //-- $scope.autocomplete_options.push({"text": options[k] + "_test2", "times": 1});
      }
      if(found == false){
          $scope.autocomplete_options.push({"text": callback.item, "times": 1});
      }
      window.localStorage['ema_ac_' + callback.componentId] = JSON.stringify($scope.autocomplete_options);

      // print out the component id
      console.log(JSON.stringify(callback));
 

      // print out the selected items if the multiple select flag is set to true and multiple elements are selected
      console.log($scope.name); 
      if($scope.surveydependency!=undefined && $scope.surveydependency[callback.componentId]!=undefined) {
          console.log(JSON.stringify($scope.surveydependency));
          $scope.hackQ3d($scope.surveydependency[callback.componentId],callback.componentId);
      }
    }


    // this function takes the JSON file and creates the survey
    function process_survey(obj, survey_string, i) {

        //------------------------------------------------------                  
        // Random 
        //------------------------------------------------------   
        // 'component-id="Q' + i + '" ' + 
        if (obj.type == 'random') {
            var filename = obj.extra;
            console.log("location: " + filename);
            var has_returned = 0;
            survey_string = survey_string + '<p compile="randomq""></p>';
            $http.get(filename).success(function(data2) {
                var obj_random_q = data2;
                var rand_index = getRandomInt(0, obj_random_q.length - 1)
                $scope.randomq = process_survey(obj_random_q[rand_index], "", i);
                $scope.rand_index = rand_index;
            });

        } else {
            //
            if (obj.type == "captcha") {


                survey_string = [survey_string,
                    '<div class="card"><div class="quetiontextstyle">',
                    obj.text + "<br><b>" + '<img src="js/captcha_images/{{survey.q7answer}}" alt="Smiley face" height="60" width="auto">' + "</b>",
                    '</div>'
                ].join(" ");

                var filename = obj.extra.filesnames;
                var dir_loc = obj.extra.captchdir;
                $http.get(filename).success(function(data3) {
                    var obj_captcha_q = data3[0].data;
                    console.log("captcha data: " + obj_captcha_q + ", length: " + obj_captcha_q.length);
                    $scope.survey.q7answer = data3[0].data[getRandomInt(0, obj_captcha_q.length - 1)];
                });

                obj.type = "textbox";

            } else {
                if (("extra" in obj) && ("dependency" in obj.extra)) {
                       //$scope.survey.test = obj.extra.dependency.question == obj.extra.dependency.show;
                        //'<div class="card" ng-show=' + '{{survey.' + obj.extra.dependency.question + '=="' + obj.extra.dependency.show + '"}}' +'>', 
                       if($scope.name == undefined)
                         $scope.name = {};

                       if($scope.name[obj.extra.dependency.question] == undefined)
                         $scope.name[obj.extra.dependency.question] = [];

                       $scope.name[obj.extra.dependency.question].push(i);

                       console.log(obj.name);
                       var show_array = obj.extra.dependency.show;
                       if(show_array == undefined) {

                         //console.log(obj.extra.dependency.question);
                         //console.log($scope.choices[obj.extra.dependency.question]);
                         if($scope.choices[obj.extra.dependency.question] instanceof Array ) {
                           show_array = $scope.choices[obj.extra.dependency.question].slice();
                         }

                         for (var j = 0; j < obj.extra.dependency.hide.length; j++){
                            //console.log(obj.extra.dependency.hide[j]);

                            var index = show_array.indexOf(obj.extra.dependency.hide[j]);
                            show_array.splice(index, 1);
                         }
                         //console.log(show_array);
 
                        }


                        console.log(show_array);
                        if(show_array instanceof Array){
                          //console.log(show_array);
                          // var does_exist = false;
                          // for (var j = 0; j < show_array.length; j++){
                          //    console.log(show_array[j]);
                          //    console.log($scope.survey[obj.extra.dependency.question] );
                          //     does_exist = ($scope.survey[obj.extra.dependency.question] == show_array[j]);
                          //     if(does_exist == true)
                          //       break;
                          // }


                          //    survey_string = [survey_string,
                          //     '<div class="card" ng-show=(' + 'survey.' + obj.extra.dependency.question + '=="' + obj.extra.dependency.show[0] + '"' + ')>',
                          //     //'<div class="card" ng-show=' + '"' + 'true"}}' + '>', 
                          //     '<div class="quetiontextstyle">',
                          //     obj.text,
                          //     '</div>'
                          //   ].join(" ");
                          //   console.log(survey_string);
                           //var show_array = obj.extra.dependency.show;

                              console.log("blah"+show_array);
                              var does_exist = "";
                              for (var j = 0; j < show_array.length; j++){

                                  if(j>0) {
                                      does_exist = does_exist + "||";
                                   }

                                   does_exist = does_exist + "$scope.survey." + obj.extra.dependency.question + '=="' + show_array[j] + '"';

                              }
                              console.log(obj.extra.dependency.question);
                              console.log(does_exist);

                              // var does_exist = "";

                              //  does_exist = does_exist + "$scope.survey." + obj.extra.dependency.question + '=="' + show_array[0] + '"';
                              //  does_exist = does_exist + " || ";
                              //  does_exist = does_exist + "$scope.survey." + obj.extra.dependency.question + '=="' + show_array[1] + '"';
                              // console.log($scope.survey[obj.extra.dependency.question] + " " + does_exist);

        
                              if($scope.surveydependency == undefined)
                                $scope.surveydependency = {};

                              $scope.surveydependency[i+obj.extra.dependency.question] = does_exist;
                              $scope[i + obj.extra.dependency.question + "Show"] = false;

                              survey_string = [survey_string,
                                  '<div class="card" ng-show="'+ i + obj.extra.dependency.question + "Show" +'">',
                                  //'<div class="card" ng-show='+false + '>', 
                                  '<div class="quetiontextstyle">',
                                  obj.text,
                                  '</div>'
                              ].join(" ");

                        } else if(show_array.indexOf(' ') >= 0){

                              if($scope.namedependency == undefined)
                                $scope.namedependency = {};

                              $scope.namedependency[i+obj.extra.dependency.question] = show_array;

                              console.log(i + obj.extra.dependency.question + "Show "+show_array);
                              $scope[i + obj.extra.dependency.question + "Show"] = false;
                              survey_string = [survey_string,
                              '<div class="card" ng-show="'+ i + obj.extra.dependency.question + "Show" +'">',
                              //'<div class="card" ng-show=' + false + '>', 
                              //'<div class="card" ng-show="compareSelectionWithDependency(\'' + i + '\', \''+ obj.extra.dependency.show + '\')">', 
                              '<div class="quetiontextstyle">',
                              obj.text,
                              '</div>'
                          ].join(" ");
                          //console.log(survey_string);

                        } else {
                          //console.log(obj.extra.dependency.show);
           
                          survey_string = [survey_string,
                              '<div class="card" ng-show=(' + "survey." + obj.extra.dependency.question + '=="'+ obj.extra.dependency.show + '"' + ')>',
                              //'<div class="card" ng-show=' + false + '>', 
                              '<div class="quetiontextstyle">',
                              obj.text,
                              '</div>'
                          ].join(" ");
                          //console.log(survey_string);
                        }
                 } else {
                    survey_string = [survey_string,
                        '<div class="card"><div class="quetiontextstyle">',
                        obj.text,
                        '</div>'
                    ].join(" ");
                    
                 }
             }

            //------------------------------------------------------                  
            //text box  
            //------------------------------------------------------                 
            if (obj.type == "textbox") {
                survey_string = [survey_string,
                    '<label class="item item-input">',
                    '<input type="text" ng-model="survey.' + i + '"', ' ng-change="inputchanged(\'' + i + '\')"></label>'
                ].join(" ");
            }

          //------------------------------------------------------                  
            //time picker
            //------------------------------------------------------                 
            if (obj.type == "timepicker") {
                $scope.survey[i] = new Date();
                survey_string = [survey_string,
                    '<div class="item item-icon-left" ion-datetime-picker time am-pm ng-model="survey.' + i + '"', ' ng-change="inputchangedtimepicker(\'' + i + '\')">',
                    '<i class="icon ion-ios-clock positive"></i>',
                    '<strong>{{survey.' + i + '| date: "h:mm a"}}</strong>',
                    '</div>'
                ].join(" ");
            }

            //------------------------------------------------------                  
            //paragraph
            //------------------------------------------------------                 
            if (obj.type == "comment") {
               survey_string = [survey_string,
                   '<div>',
                   '<p>',
                   "",
                   '</p>',
                   '</div>'
               ].join(" ");
            }

            //------------------------------------------------------                  
            //image
            //------------------------------------------------------  
            if (obj.type == "image") {
               survey_string = [survey_string,
                   '<div>',
                   '<p>',
                   "",
                   '</p>',
                   '<img style="height: 100%; width: 100%; object-fit: contain" src="' + obj.image_location + '">',
                   '</div>'
               ].join(" ");
            }


            //------------------------------------------------------
            //  mood
            //------------------------------------------------------
            if (obj.type == 'mood') {

                survey_string = [survey_string,
                    '<div class="radioimages">',
                    '<label><input type="radio" ng-model="survey.' + i + '" value="high-sad" ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/5.png></label>',
                    '<label><input type="radio" ng-model="survey.' + i + '" value="low-sad" ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/4.png></label>',
                    '<label><input type="radio" ng-model="survey.' + i + '" value="neutral" ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/3.png></label>',
                    '<label><input type="radio" ng-model="survey.' + i + '" value="low-happy"  ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/2.png></label>',
                    '<label><input type="radio" ng-model="survey.' + i + '" value="high-happy"  ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/1.png></label>',
                    '</label></div>'
                ].join(" ");
                /*
                survey_string = [ survey_string, 
                '<div class="radioimages">',
                '<label><input type="radio" ng-model="survey.' + i + '" value="high-sad"/><img style="width:18%;" src=img/5.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="low-sad"/><img style="width:18%;" src=img/4.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="neutral"/><img style="width:18%;" src=img/3.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="low-happy"/><img style="width:18%;" src=img/2.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="high-happy"/><img style="width:18%;" src=img/1.png></label>',
                '</label></div>'].join(" ");
                */
            }


            //------------------------------------------------------
            //  mood-grid
            //------------------------------------------------------
            if (obj.type == 'moodgrid') {

                $scope.affect = ['Afraid', 'Tense', 'Excited', 'Delighted', 'Frustrated', 'Angry', 'Happy', 'Glad', 'Miserable', 'Sad', 'Calm', 'Satisfied', 'Gloomy', 'Tired', 'Sleepy', 'Serene'];

                var affect = $scope.affect;
                var colors = ['#ff99a3', '#ff99a3', '#ffc266', '#ffc266', '#ffb3ba', '#ffb3ba', '#FFE0B2', '#FFE0B2', '#BBDEFB', '#BBDEFB', '#C8E6C9', '#C8E6C9', '#e7f3fe', '#e7f3fe', '#eef7ee', '#eef7ee'];
                /*
                survey_string = [ survey_string, 
                '<div class="radioimages">',
                '<label><input type="radio" ng-model="survey.' + i + '" value="high-sad" ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/5.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="low-sad" ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/4.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="neutral" ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/3.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="low-happy"  ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/2.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="high-happy"  ng-change="inputchanged(\'' + i + '\')"/><img style="width:18%;" src=img/1.png></label>',
                '</label></div>'].join(" ");
                */

                var html_string = [];
                for (var j = 0; j < 4; j++) {

                    html_string.push('<div class = "row">');

                    for (var ii = 0; ii < 4; ii++) {
                        var index = j * 4 + ii;
                        html_string.push('<div ng-click="affectclick(' + (index + 1) + ',\'' + i + '\'' + ',\'' + affect[index] + '\')" class = "col col-25"><div style="width:100%;padding-bottom:15%;padding-top:25%;background-color:' + colors[index] + '" align="center">' +
                            '<p ng-bind-html="affect[' + index + ']"></p></div></div>');
                    }
                    html_string.push('</div>');
                }
                html_string = html_string.join(" ");
                survey_string = [survey_string, html_string].join(" ");

                /*
                survey_string = [ survey_string, 
                '<div class="radioimages">',
                '<label><input type="radio" ng-model="survey.' + i + '" value="high-sad"/><img style="width:18%;" src=img/5.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="low-sad"/><img style="width:18%;" src=img/4.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="neutral"/><img style="width:18%;" src=img/3.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="low-happy"/><img style="width:18%;" src=img/2.png></label>',
                '<label><input type="radio" ng-model="survey.' + i + '" value="high-happy"/><img style="width:18%;" src=img/1.png></label>',
                '</label></div>'].join(" ");
                */
            }

            if (obj.type == "moodgrid2") {
                survey_string = [survey_string,
                    '<canvas id="myCanvas" width="310" height="310" style="border:0px solid #000000;padding:10px;">',
                    'Your browser does not support the HTML5 canvas tag.',
                    '</canvas>'
                ].join(" ");
            }



            //------------------------------------------------------                  
            // Autocomplete 
            //------------------------------------------------------   
            // 'component-id="Q' + i + '" ' + 
            if (obj.type == 'autocomplete') {
                survey_string = survey_string +
                    '<label class="item item-input">' +
                    '<input ion-autocomplete type="text" readonly="readonly" ' +
                    'class="ion-autocomplete" autocomplete="on" ng-model="survey.' + i +
                    '" max-selected-items="1" items-method-value-key="items" ' +
                    'items-method="callbackMethod(query,isInitializing,componentId)" ' +
                    'items-clicked-method="clickedMethod(callback)" ' +
                    'title-text = "' + obj.text + '" ' +
                    'id="Q' + i + '" ' +
                    'component-id="' + i + '"' +
                    ' ng-change="inputchanged(\'' + i + '\')"/>' +
                    '</label>';
                options = obj.extra;


                //if i have records for the question load from there. 
                $scope.autocomplete_options = JSON.parse(window.localStorage['ema_ac_' + i] || '[]');
                if ($scope.autocomplete_options.length == 0) {
                    for (var k = 0; k < options.length; k++) {
                        $scope.autocomplete_options.push({
                            "text": options[k],
                            "times": 1
                        });
                    }
                    window.localStorage['ema_ac_' + i] = JSON.stringify($scope.autocomplete_options);
                } else {
                    options = [];

                    $scope.autocomplete_options.sort(function(a, b) {
                        return b.times - a.times;
                    });

                    for (var k = 0; k < $scope.autocomplete_options.length; k++) {
                        options.push($scope.autocomplete_options[k].text);

                        //  
                        //console.log("Item " + k + ": " + $scope.autocomplete_options[k].text + " " + $scope.autocomplete_options[k].times);
                    }
                    //
                }

                autocomplete_options[i] = options;

                //auto complete assigned
                console.log("Autocomplete options: " + autocomplete_options[i]);
                 if($scope.choices == undefined)
                  $scope.choices = {};
                $scope.choices[obj.name]= autocomplete_options[i];
            }


            //------------------------------------------------------ 
            // radio button       
            //------------------------------------------------------            
            if (obj.type == "radiobutton") {

                //------------------------------------------------------ 
                //radio button, vertical     
                //------------------------------------------------------   
                if (obj.extra.orientation == "vertical") {
                    survey_string = survey_string + '<div class="radiovertical"><ul>';

                    for (var j = 0; j < obj.extra.choices.length; j++) {

                        /*  
                        survey_string = survey_string + '<li><input type="radio" id="optionQ' + 
                          i + "I" + j + '" name="Q' + i + '"><label for="optionQ' + i + "I" + 
                          j + '">' + obj.extra.choices[j] + 
                          '</label><div class="check"></div></li>';
                          */


                        survey_string = [survey_string,
                            '<li><input type="radio" id="option' + i + "I" + j + '" name="' + i + '" ng-model="survey.' + i + '" value="' + obj.extra.choices[j] + '"  ng-change="inputchanged(\'' + i + '\')">',
                            '<label for="option' + i + "I" + j + '">' + obj.extra.choices[j] + '</label>',
                            '<div class="check"></div></li>'
                        ].join(" ");

                    }

                   if($scope.choices == undefined)
                      $scope.choices = {};
                   $scope.choices[obj.name]= obj.extra.choices;
                    survey_string = survey_string + '</ul></div>';
                }

                //------------------------------------------------------ 
                //radio button, vertical     
                //------------------------------------------------------
                if (obj.extra.orientation == "horzontal") {

                    survey_string = survey_string + '<div class="radiohorizontal"><ul>';

                    //starting text
                    survey_string = survey_string + '<li><p>' + obj.extra.choices[0] + '</p></li>';

                    //middle text
                    for (var j = 0; j < obj.extra.levels; j++) {
                        survey_string = [survey_string,
                            '<li><input type="radio" id="option' + i + "I" + j + '" name="' + i + '" ng-model="survey.' + i + '" value="' + j + '"  ng-change="inputchanged(\'' + i + '\')">',
                            '<label for="option' + i + "I" + j + '"></label>',
                            '<div class="check"></div></li>'
                        ].join(" ");
                    }

                    //ending text
                    survey_string = survey_string + '<li><p>' + obj.extra.choices[1] + '</p></li>';

                    survey_string = survey_string + '</ul></div>';
                }

            }


            /*
                   <div class="item range">
                      <i class="icon ion-volume-low"></i>
                      <input type="range" min="0" max="{{user.max}}" value="{{user.min}}" step="1000" ng-model="user.value" name="volume">
                      <i class="icon ion-volume-high"></i>
                      {{user.value}}
                   </div>
                 */

            //------------------------------------------------------                  
            //text box  
            //------------------------------------------------------                 
            if (obj.type == "range") {
                var min = obj.extra.choices[2];
                var max = obj.extra.choices[3];
                var step = obj.extra.choices[4];
                $scope.survey[i] = 0;
                survey_string = [survey_string,
                    '<div class = "row" style="margin-bottom=0px;">',
                    '<div class = "col col-10"><p align="center" style="padding-top:2px;padding-bottom:2px;margin:0px;border-radius:5px;background:#4e5dca;color:white;">' + min + '</p></div>',
                    '<div class = "col col-10"></div>',
                    '<div class = "col col-20 col-offset-20"><p align="center" style="padding-top:2px;padding-bottom:2px;margin:0px;border-radius:25px;background:#303F9F;color:white;"><b>{{survey.' + i + '}}</b></p></div>',
                    '<div class = "col col-10"></div>',
                    '<div class = "col col-10 col-offset-20"><p align="center" style="padding-top:2px;padding-bottom:2px;margin:0px;border-radius:5px;background:#4e5dca;color:white;">' + max + '</p></div>',
                    '</div>',
                    '<div class="item range range-balanced" style="padding:10px;padding-top:1px;border-width:0px;">',
                    '<p style="text-align: center;color: black;">' + obj.extra.choices[0] + "</p>",
                    '<input type="range" min="' + min + '" max="' + max + '" value="' + min + '" step="' + step + '" ng-model="survey.' + i + '" name="' + i + '" ng-change="inputchanged(\'' + i + '\')"' + '>',
                    '<p style="text-align: center;color:black;">' + obj.extra.choices[1] + "</p>",
                    '</div>',
                ].join(" ");

                /*
                    '<div class = "row">',
                    '<div class = "col col-33"><p align="left" style="padding-top:2px;">0</p></div>',
                    '<div class = "col col-33"><p align="center" style="padding-top:2px;"><b>{{survey.' + i + '}}</b></p></div>',
                    '<div class = "col col-33"><p align="right" style="padding-top:2px;">10</p></div>',
                    '</div>',
                */
            }

            if (obj.type == "range2") {
                var min = obj.extra.choices[2];
                var max = obj.extra.choices[3];
                var step = obj.extra.choices[4];
                $scope.survey[i] = 25*60;
                survey_string = [survey_string,
                    '<div class = "row">',
                    '<div class = "col col-33 col-offset-67"><p align="center" style="padding:5px;border-radius:25px;background:#303F9F;color:white;"><b>{{survey.' + i + '/60}} hours</b></p></div>',
                    '</div>',
                    '<div class="item range range-balanced" style="padding:10px;border-width:0px;">',
                    '<p style="text-align: center;color: black;">' + obj.extra.choices[0] + "</p>",
                    '<input type="range" min="' + min + '" max="' + max + '" value="' + min + '" step="' + step + '" ng-model="survey.' + i + '" name="' + i + '" ng-change="inputchanged(\'' + i + '\')"' + '>',
                    '<p style="text-align: center;color:black;">' + "24<br>hours" + "</p>",
                    '</div>',
                ].join(" ");
            }


            //------------------------------------------------------                  
            //checkbox  
            //------------------------------------------------------                 
            if (obj.type == "checkbox") {
                survey_string = survey_string + '<div class="list">';
                for (var j = 0; j < obj.extra.choices.length; j++) {
                    survey_string = [survey_string, '<ion-checkbox style="border-color:#fff;border-width: 0px;" ng-model="survey.' + i + 'O' + j + '" ng-change="inputchanged(\'' + i + '\')"' + '>' + obj.extra.choices[j] + '</ion-checkbox>'].join(" ");
                }
                survey_string = survey_string + '</div>';
                if($scope.choices == undefined)
                  $scope.choices = {};
                $scope.choices[obj.name]= obj.extra.choices;

            }

            survey_string = survey_string + '</div>';
        }
        return survey_string;

    }


    $scope.submitsurvey = function() {
       console.log(JSON.stringify($scope.survey));

    }

    var promise = $interval(init, 500);
    //init();
    function init(){
        var c = document.getElementById("myCanvas");
        //alert("holla");
        if(c==null)
            return;
        else
            $interval.cancel(promise);

        c.style.width ='100%';
        c.width  = c.offsetWidth;
        c.height = c.width;


        var ctx = c.getContext("2d");
        var imageObj = new Image();
        imageObj.src = 'img/affect_grid.png';
        imageObj.onload = function(){
        ctx.drawImage(imageObj, 0, 0, imageObj.width,    imageObj.height, // source rectangle
                       0, 0, c.width, c.height); // destination rectangle
        }

        //corner points
        var top_x = (42.0/354.0)*c.width;
        var top_y = (32.0/354.0)*c.height;
        var bottom_x = (320.0/354.0)*c.width;
        var bottom_y = (320.0/354.0)*c.height;
        
        c.addEventListener("click", function (e) {
            drawing = true;
            lastPos = getMousePos(c, e);
            //console.log("x:" + lastPos.x + ", y:" + lastPos.y + ":::: " + c.width + "," + c.height);

            var x = -1;
            var y = -1;
            if((lastPos.x >= top_x) && (lastPos.y >= top_y) && (lastPos.x <= bottom_x) && (lastPos.y <= bottom_y)){
                x = 10 * (lastPos.x - top_x) / (bottom_x - top_x) - 5;
                y = 5 - 10 * (lastPos.y - top_y) / (bottom_y - top_y) - 5;
                //console.log("x:" + x + ", y:" + y);
                $scope.survey.QMood = "" + x + ":" + y;

                //
                $scope.inputchanged("QMood");
            }else{
                return;
            }
            
            var rect = c.getBoundingClientRect();
            ctx.beginPath();
            ctx.clearRect(0, 0, rect.right-rect.left, rect.bottom-rect.top);
            ctx.closePath();
            
            //
            ctx.drawImage(imageObj, 0, 0, imageObj.width,    imageObj.height, // source rectangle
                       0, 0, c.width, c.height); // destination rectangle
            
            //ctx.drawImage(imageObj, 0, 0);
            ctx.beginPath();
            ctx.arc(lastPos.x,lastPos.y,10,0,2*Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'red';
            ctx.stroke();
            
            
            
        }, false);
        //alert("holla");
    }

    function getMousePos(canvasDom, mouseEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
          x: mouseEvent.clientX - rect.left,
          y: mouseEvent.clientY - rect.top
        };
    }

    //function affectclick(index,mood){
    //$scope.affect = [];
    //$scope.affect[0] = 'Afraid';  
    $scope.affectclick = function(index, q, mood) {
        console.log("" + index + ", " + mood);

        //
        //if(index == 1){
        if ($scope.affect[index - 1].includes("<u>"))
            $scope.affect[index - 1] = $scope.affect[index - 1].replace('<u><b>', '').replace('</b></u>', '');
        else
            $scope.affect[index - 1] = '<u><b>' + $scope.affect[index - 1] + '</b></u>';
        //}

        for (var i = 0; i < $scope.affect.length; i++) {
            if ((i + 1) == index)
                continue;
            else {
                $scope.affect[i] = $scope.affect[i].replace('<u><b>', '');
                $scope.affect[i] = $scope.affect[i].replace('</b></u>', '');
                //console.log($scope.affect);
            }
        }

        $scope.reponse_ts[q] = {};
        $scope.reponse_ts[q].ts = Date.now();
        $scope.reponse_ts[q].readable_ts = moment().format("MMMM Do YYYY, h:mm:ss a");

        $scope.survey[q] = mood;
        console.log(JSON.stringify($scope.survey));
    }


   $scope.inputchanged = function(questions) {
        //console.log("Qs:" + questions + ", ts:" + Date.now() + ", readable_time:" + moment().format("MMMM Do YYYY, h:mm:ss a"));

        $scope.reponse_ts[questions] = {};
        $scope.reponse_ts[questions].ts = Date.now();
        $scope.reponse_ts[questions].readable_ts = moment().format("MMMM Do YYYY, h:mm:ss a");

        //console.log(JSON.stringify($scope.survey));
        console.log(questions);
        for (var j = 0; j < $scope.name[questions].length; j++){
         var name= $scope.name[questions][j];
          if($scope.surveydependency!=undefined && $scope.surveydependency[name+questions]!=undefined) {
              //console.log(JSON.stringify($scope.surveydependency));
              $scope.hackQ3d($scope.surveydependency[name+questions],name+questions);
          }
 
        //handle the case when there is empty space in the show array
        if($scope.namedependency!=undefined && $scope.namedependency[name+questions]!=undefined) {
           console.log(JSON.stringify($scope.namedependency));
           $scope.hackQ10d($scope.namedependency[name+questions],name+questions,questions);
         }
      }
    }

   $scope.hackQ3d = function(s,label){
        //console.log("True " +  ($scope.survey.Q3d==undefined || $scope.survey.Q3d=='0' || $scope.survey.Q3d=='0.5'));
         $scope[label+ "Show"] = eval(s);
         console.log("hackQ3d "+label + "Show "+$scope[label + "Show"]);
   }

   $scope.hackQ10d = function(s,label,questions){
        //console.log("True " +  ($scope.survey.Q3d==undefined || $scope.survey.Q3d=='0' || $scope.survey.Q3d=='0.5'));
        var sel = $scope.survey[questions];
        var dep = s ;
        //console.log("compareSelectionWithDependency "+questions+" "+sel+" "+s);
        if(sel!=undefined && s!= undefined){
           sel = sel.replace(/\s+/g, "");
           dep = s.replace(/\s+/g, "");
        }
        $scope[label + "Show"] = false;
        if(sel === dep)
        { 
          $scope[label + "Show"]=true;
        }

        console.log("hackQ10d "+name+" for "+questions+" "+$scope[label + "Show"]);

    }


    $scope.inputchangedtimepicker = function(questions) {
        var x = $scope.survey[questions];
        $scope.survey[questions] = moment(x).format('h:mm a');
        $scope.survey[questions + "_tz"] = moment(x).format('h:mma Z');
        $scope.inputchanged(questions);
    }


});