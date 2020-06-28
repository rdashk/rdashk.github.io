$(document).ready(function(){
    var cardWidth;
    var cardHeight;
    var size;
    var flag;
    var ident_of_timer;
    var timer;
    var level;
    var userNameInGame="Игрок";
    //количество очков текущего игрока
    var point;
    //максимальное количество очков за уровень
    var all_points;
    $("#timer").hide();
    $("#divButtons").hide();
    $("#info").load("help.html");
    var windowClose;
    //начало игры
    GetInformation();
    function GetInformation(){
        $.get("information.xml").done(StartGame);
    }; 

    function StartGame(xmlDom){
        CloseHelpWindow();
        //создание начальной страницы
        $("#area").append($("<div id='startGame'>"));
        $("#startGame").append($("<p id='name'>"));
        $("#name").append($(xmlDom).find("name").text());
        $("#startGame").append("<u>Правила игры:</u>"+"<br />"+$(xmlDom).find("rules").text()+"<br />"+"<br />"+"Введите ваше имя ");
        $("#startGame").append($("<input type='text' id='user' placeholder='Игрок' />"+"<br />"+"<br />"+"<input type='button' id='startGameButton' value='Играть'>"));
        $("#startGameButton").css({"height":40,
                          "margin-left":30+"%"});
        //имя пользователя
        $("#user").change(function(){
            if ($(this).val().length>1) userNameInGame=$("#user").val();
        }); 
        //кнопка начала игры
        $("#startGameButton").click(function(){
            $("#startGame").empty();
            level=1;
            BeginLevel(24,5.5,7.2,900);
        });
    };

    //функция начала уровня
    function BeginLevel(number,widt,heig,timee){
       $("#area").each(function(){
           $(this).effect("highlight");
       });
       $("#area").empty(); 
       size=number;
       cardWidth=widt;
       cardHeight=heig;
       $("#timer").show();
       $("#divButtons").show();
       $("#helpBut").show();
       $("#nextBut").hide();
       if (localStorage.getItem(userNameInGame+"_level_"+level)!=null) $("#nextBut").show();
       //номера карт
       var k=-1;
       //максимум очков(за 20 сек.)
       all_points=Math.round(((timee/10-20)/60)*(size/2));
       //проверка на собранные пары подряд
       var pair_next=false;
       //установка таймера
       timer=timee;
       ident_of_timer=setTimeout(clock,timee);
       var min=Math.floor(timee/600);
       var sec=timee/10-min*60;
       $("#timer").html(min+":"+sec);
       function clock(){
            if (sec==0 && min!=0){
                min--;
                sec=59;
            } 
            else if (sec!=0) sec--;
            if (sec<10) sec="0"+sec;
            $("#timer").html(min+":"+sec);
            if (min==0 && sec==0){
                $("#area").empty();
                alert("Время закончилось...Попробуйте еще раз!");
                BeginLevel(number,widt,heig,timee);
            } 
            else {
                ident_of_timer=setTimeout(clock,timee);
            }
       };

        //добавление карт
        for (i=0;i<size;i++){
            if (i%2==0) k++;
            var pic=$("<div class='pict'><img class='front' src='images/"+k+".jpg'><img class='back' src='images/back.jpg'></div>");
            $(pic).css({width: cardWidth+"em", 
                       height: cardHeight+"em",
                        order:Math.floor(Math.random() * size)}).attr("id",""+k).addClass(""+k);
            $(pic).appendTo("#area");
        }

        //номера id в массиве m
        var m=[-1,-1];
        //количество видимых карт
        var wantSee=0;
        //переменная-флаг для разрешения переворота следующей пары
        flag=true;
        $(".pict").click(function(){
            CloseHelpWindow();
            //проверка на наличе собранной пары
            if (!$(this).hasClass("disable")){
                wantSee++;
                //разрешение переворота следующей пары
                if (flag){
                    $(this).addClass("rotateCardfront");
                    //проверка открытых картинок
                    if (wantSee<2){
                        m[0]=$(this);
                        $(m[0]).addClass("disable");
                    }
                    //если две открытые картинки
                    else {
                        wantSee=0;
                        m[1]=$(this);
                        if (m[0].attr("id")!=m[1].attr("id")){
                            $(m[0]).removeClass("disable");
                            pair_next=false;
                            Back(m[0],m[1]);
                        }
                        else{
                            //бонусы
                            if (pair_next){
                                var a=(Number)(localStorage.getItem(userNameInGame+"_forhelp"));
                                localStorage.setItem(userNameInGame+"_forhelp",a+1);
                            } 
                            pair_next=true;
                            $(m[1]).addClass("disable");
                            CheckAllPairs();
                        }
                    }
                }
            }
        });  
    };
    //проверка на прохождение уровня
    function CheckAllPairs(){
        if ($(".disable").length==size){
            $("#timer").hide();
            CloseHelpWindow();
            $("#helpBut").hide();
            //подсчет очков
            var timeLeft=$("#timer").html().split(":");
            var time_for_points=(Number)(timeLeft[0]+"."+timeLeft[1]);
            point=Math.round((size/2)*time_for_points);
            localStorage.setItem(userNameInGame+"_level_"+level,point);
            clearTimeout(ident_of_timer);
            //чтобы перед исчезновением показывалась последняя картинка
            setTimeout(() => {
                $(".pict").effect("explode",{"pieces": 4});
            }, 600);
            setTimeout(() => { 
                $("#area").append($("<p id='name' class='column'>   Очки("+level+" уровень): "+point+"/"+all_points+"</p>"));
                $("#area").append($("<div id='startGame'>").
                           css({"line-height":"1em","font-size":"140%"}).
                           html("Перейти на следующий уровень?<br /><br />").
                           append("<input type='button' id='answer_yes' value='Да'>").
                           append("   ").
                           append("<input type='button' id='answer_no' value='Сброс'>"));
                //следующий уровень
                $("#answer_yes").click(StartNextLevel);
                //начать данный уровень сначала
                $("#answer_no").click(ThisLevel);
            },1200);
        }
    };
        
    //настройки для нового уровня
    function StartNextLevel(){
        timer+=300;
        size+=8;
        if (size>32){
            cardWidth=4.5;
            cardHeight=6.4;
        }
        level++;
        if (level>3){
            End_All_Levels();
        }
        else BeginLevel(size,cardWidth,cardHeight,timer);
    };

    //переход на следующий уровень, если данный уже был пройден
    $("#nextBut").click(function(){
        clearTimeout(ident_of_timer);
        StartNextLevel();
    });

    //начать данный уровень сначала
    function ThisLevel(){
        clearTimeout(ident_of_timer);
        BeginLevel(size,cardWidth,cardHeight,timer);
    };
    $("#resetBut").click(ThisLevel);

    //помощь
    $("#helpBut").click(function(){
        if (windowClose) OpenHelpWindow();
        $("#make_pair").click(function(){
            CloseHelpWindow();
            var a=localStorage.getItem(userNameInGame+"_forhelp");
            localStorage.removeItem(userNameInGame+"_forhelp");
            localStorage.setItem(userNameInGame+"_forhelp",a-1);
            $(".pict").each(function(){
                if (!$(this).hasClass("disable")){
                    var id=$(this).attr("id");
                    $("."+id).addClass("rotateCardfront").addClass("disable");
                    CheckAllPairs();
                    return false;
                } 
            });
        });
    });
    //открыть окно помощи
    function OpenHelpWindow(){
        $("#info").show();
        $("#info").append("<p id='showPointsForHelp'><u>Бонусы: "+(Number)(localStorage.getItem(userNameInGame+"_forhelp")));
        if (localStorage.getItem(userNameInGame+"_forhelp")>0) $("#info").append("<input type='button' id='make_pair' value='Использовать'>");
        else $("#make_pair").remove();
        windowClose=false;
    };
    //закрыть окно помощи
    function CloseHelpWindow(){
        $("#make_pair").remove();
        $("#showPointsForHelp").remove();
        $("#info").hide();
        windowClose=true;
    }

    //приостановить игру
    $("#pauseBut").click(function(){
        alert(userNameInGame+", вы приостановили игру. Для продолжения нажмите ОК.");
    });
    
    //переворачивание обратно различных карт
    function Back(m0,m1) {
        flag=false;
        pair_next=false;
        setTimeout(() => {
            $(m0).removeClass("rotateCardfront");
            $(m1).removeClass("rotateCardfront");
            flag=true;
        }, 200);
    };

    //конец игры(результаты)
    function End_All_Levels(){
        $("#timer").hide();
        $("#divButtons").hide();
        $("#timer").empty();
        $("#area").empty();
        $("#area").append($("<table id='tableInf'>"));
        $("#tableInf").append($("<tr><th>Имя</th><th>Очки</th></tr>"));
        var sum;
        for(i=0; i<localStorage.length; i++) {
            var key=localStorage.key(i);
            var word=key.split("_");
            if (word.length==3 && word[1]=="level" && word[2]>0){
                sum=(Number)(localStorage.getItem(word[0]+"_sum"))+(Number)(localStorage.getItem(key));
                localStorage.setItem(word[0]+"_sum",sum);
            }
        }
        for(i=0; i<localStorage.length; i++){
            var key=localStorage.key(i);
            var word=key.split("_");
            if (word.length==2 && word[1]=="sum"){
                $("#tableInf").append($("<tr><td>"+word[0]+"</td><td>"+localStorage.getItem(key)+"</td></tr>"));
                localStorage.removeItem(key);
            } 
        }
        $("#area").append($("<input type='button' id='closeTable' value='Завершить просмотр'>"));
        $("#closeTable").click(function(){
            $("#area").empty();
            GetInformation();
        });
    };
});