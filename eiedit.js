/*!
 * EiEdit v0.0.1 
 * 2022 Kostyuchenko Sergey
 */

/**
 * @description inline editor for tables. In the name of Eidelman!
 * @version 0.0.2
 * @author Kostyuchenko Sergey
 */

/**
 * Проверка подключен ли jquery 
 */
 if (typeof jQuery === 'undefined') {
    throw new Error('jQuery не подключен !');
 }



(function ($) {



    $.fn.eiedit = function(options) {

        

        if (!this.is('table')) {
            throw new Error('EiEdit работает только с табличками!');
        }

        const $table = this;
        
        
        /**
         * Объединение конфигурационных настроек поумолчанию 
         * и заданных при инициализации плагина. 
         * При совпадении заданные при инициализации плагина 
         * перекрывают заданные поумолчанию. 
         */
        const settings = $.extend( {
            /**
             * Вывод отладочной информации в консоль.
             * Поумолчанию отключено.
             * @property debug
             * @type string
             * 
             */
            debug: false,

            /**
             * Прячет столбец с id.
             * Поумолчанию id отображается.
             * @property hideIdentifier
             * @type boolean
             * 
             */
            hideIdentifier: false,

            /**
             * Название аттрибута с значением идентификатора для кортежа.
             * Поумолчаннию название 'id'.
             * @property rowIdentifier
             * @type string
             *
             */
            rowIdentifier: 'id',

            /**
             * Лежим редактирования таблицы.
             * Поумолчанию 'default'.
             * default - при клике на ячейку таблицы появляется поле ввода длч изменения знаяения.
             * popover - при клике на ячейку таблицы появляется всплывающее окно с полем ввода и кнопками.
             * @property typeOfEdit
             * @type string
             * 
             */
            typeOfEdit: 'default',

            /**
             * Путь по которому стучимся на бэкэнд.
             * Поумолчанию стучится на текущую страницу.
             * @property url
             * @type string
             * 
             */
            url: window.location.href,

            
             /**
             * Формирование дополнительной колонки для предоставления
             * добавления рядов в таблице и их удаления.
             * @property updDelColumn
             * @type boolean
             * 
             */
            updDelColumn: false,

            /**
             * Формирование сообщений на ответ от сервера при редактировании.
             * Смотреть Messages.showMsg(type,msg);
             * Четыре типа сообщений type: ок, info, warning, error.
             * msg- отображаемое сообщение.
             * Поумолчанию отключено.
             * @property messageOn
             * @type boolean
             * 
             */
            messageOn:false,

             /**
             * Время через которое появляется ошибка: "Нет ответа от сервера"
             * @property timeOut
             * @type ineger
             * 
             */
            timeOut:6000,

              /**
             * Время на которое будет появляться собщение.
             * Должно быть меньше timeOut
             * @property delay
             * @type ineger
             * 
             */
            delay:3000,

            
          }, options);

        function info(text){
            if(settings.debug){
                console.log(text);  
            }
        }

        /**
        * Проверка подключен ли bootstrap popover 
        */
        // if(settings.typeOfEdit === 'popover'){
          
        //     if ($.isFunction($.fn.popover)) {
        //         info('Bootstrap Popover подключен!');
        //     }
        //     else {
        //         throw new Error('Bootstrap Popover не подключен!');
        //     }
        // }

    

        info('EiEdit Текущая версия jQuery ' + $.fn.jquery);
        info('Инициализация EiEdit выполнена!');

        info('Переданные параметры:');
        info(options);
        info('урл :');
        info(window.location.pathname.split( '/' ).length);
        info(window.location.pathname.split( '/' ));

        let TestElement = {
            newElement: function() {
                alert('NEW');
            }

        }

        /**
         * 
         *
         * @type object
         */
        let DrawElement = {
            viewElement: function() {
                let element = $(this);
                let eieditElem = '<input class="form-control eiedit-block eiedit-input" type="text">';
                let eieditCssClass = 'input-edit';

                if(settings.typeOfEdit === 'popover') {
                    eieditElem = "<div class='pop-wraper eiedit-block'><div class='pop' style='bottom: calc(50% - -10px);'>"+
                    "<div class = 'triangle'></div><input class='form-control eiedit-input' type='text'>"+
                    "<input type='button' class='btn btn-secondary btn-pop' value='ВСТАВКА'><input type='button' class='btn btn-secondary btn-pop' value='ОБНОВЛЕНИЕ'>"+
                    "</div><span class='extraVal'>2</span></div>";
                }

                if(!element.hasClass(eieditCssClass)){

                    element.addClass(eieditCssClass);
                    let value = element.text().trim();

                    element.html(eieditElem);

                    let input = element.find('.eiedit-input');
            
                    input.val(value);

                    input.trigger( "focus" ).val(value);
                } 
                      
            },
            hideElement: function(e) {
                console.log(e.target);
                let element = $(this)

                    let inputElement = element.parent('td').find('input.eiedit-input');

                    let value = inputElement.val();
                   // console.log('input value:');
                   // console.log(value);
                    element.parent('td').removeClass("input-edit");
        
                    
                    element.parent('td').text(value);
                    element.remove();

            }
        };

        /**
         * Draw Tabledit structure (identifier column, editable columns, toolbar column).
         *
         * @type {object}
         */
         let Draw = {
            columns: {
                identifier: function() {
                    // Прячем колонку id.
                    if (settings.hideIdentifier) {
                        $table.find('th:nth-child(' + parseInt(settings.columns.identifier[0]) + 1 + '), tbody td:nth-child(' + parseInt(settings.columns.identifier[0]) + 1 + 
                        '), tfoot td:nth-child(' + parseInt(settings.columns.identifier[0]) + 1 + ')').hide();
                    }

                    const $td = $table.find('tbody td:nth-child(' + (parseInt(settings.columns.identifier[0]) + 1) + ')');

                    //цикл для работы с столбцом идентификатора
                    $td.each(function() {
                        // добавление к tr аттрибута с значением равным "id".
                        $(this).parent('tr').attr(settings.rowIdentifier, $(this).text().trim());
                     });
                },
                editable: function() {
                    info('количество редактируемых столбцов: '+settings.columns.editable.length);
                    //пробегаемся по колонкам в которые заданы для редактирования в настройках
                    let inputType = 'text'; 
                    for (let i = 0; i < settings.columns.editable.length; i++) {

                        const $td = $table.find('tbody td:nth-child(' + (parseInt(settings.columns.editable[i][0]) + 1) + ')');

                        inputType = settings.columns.editable[i][1];
                       
                        //своего рода фильтр если значение андефайнд или неверно написано
                        switch (inputType) {
                            case 'checkbox':
                                inputType = 'checkbox'; 
                            
                              
                              break;
                            default:
                                inputType = 'text';
                                
                          }

                        $td.each(function(){

                            let input = document.createElement("INPUT");
                            input.setAttribute("type", inputType);
                            $(input).addClass("eiedit-input");

                            let val = $(this).text().trim();

                            if(inputType === 'checkbox'){
                                //инпут типа чекбокс
                                
                                $(this).addClass("checkbox-input"); 
                                
                                val = Boolean(parseInt(val));
                                input.checked = val;
                                $(this).html(input).on("change","input",function(e){
                                    Edit.submit($(this));
                                });

                            }else{
                                //инпуты другого типа

                                let attr = $(this).attr("tabindex");

                                $(this).addClass("text-input"); 

                                if (typeof attr === 'undefined' || attr === false || attr !== "0" ) {
                                    $(this).attr("tabindex",0);
                                }
                               
                                $(this).on("click focus",DrawElement.viewElement);

                                $(this).parent('tr').on("focusout","td.input-edit>.eiedit-block",DrawElement.hideElement);
                            }
                           

                        });
                        
               
                    }
                },
                updDelColumn: function() {
                    if(settings.updDelColumn){
                        let eieditHead = $table.find("thead tr");
                        let eieditBody = $table.find("tbody tr");
                        let headRowLength = eieditHead.length;

                        eieditHead.each(function( index ) {

                            if(!index){
                                $(this).prepend("<th class='eiedit-select-checkbox' rowspan='"+headRowLength+"' colspan='1' ><div class='eiedit-square'><i class='fa fa-pencil-square-o' aria-hidden='true'></i></div></th>");
                            }

                        });

                        eieditBody.each(function() {

                            $(this).prepend("<td class='eiedit-select-checkbox'></td>");

                        });

                        eieditBody.find("td.eiedit-select-checkbox").on("click",function(){

                            let row = $(this).parent('tr');

                            if(row.hasClass('eiedit-selected')){
                                row.removeClass("eiedit-selected");
                            } else{
                                row.addClass("eiedit-selected");
                            }

                        });

                        let eieditSquere = eieditHead.find('.eiedit-square');

                        eieditSquere.on('click', function(){

                            let eieButton = $(this);
                   
                            if(!eieButton.children('div.pop').length > 0){
                                eieButton.append("<div class='pop' style='bottom:100%;'>"+
                                    "<div class = 'triangle'></div><input type='button' class='btn btn-secondary btn-pop del' value='Удалить'>"+
                                    "<input type='button' class='btn btn-secondary btn-pop add' value='Добавить'></div><div class='back'></div>"
                                );
                            }
                      
                        })

                        $(document).on('click', function(e){

                            if($(e.target).hasClass('back')){
                            $('.eiedit-square').find('.pop').remove();
                            $('.back').remove();
                            }

                        });

                    }
                }

            }


        };

        let Messages = {
            showMsg: function(type, msg){
                if(settings.messageOn){  
                    switch (type) {
                        case 'ok ':
                            type = 'success';
                        break;
                        case 'info':
                            type = 'info';
                        break;
                        case 'warning':
                            type = 'warning';
                        break;
                        case 'error':
                            type = 'error';
                        break;
                        default:
                            type = 'error';
                            msg = 'Неопознанная ошибка';
                    }

                    let msgBody ="<div id='"+type+"' class='message'>"+
                    "<a id='close' title='Закрыть'>&times;</a>"+
                    "<span>Важно!</span>"+ msg +"</div>";

                    $('body').append(msgBody);

                    $('.message > #close').on('click',function(){
                        $(this).parent('.message').addClass('close');
                    });

                    $('.message').on('animationend',function(){

                        let elem = $(this);
                            if (elem.hasClass('close')) {
                                elem.remove();
                            }
                            else{
                            setTimeout(function(){
                                elem.addClass('close');
                            }, settings.delay);     
                        }
                    });
                }

            },
            checkServerAnswer:{
                checkAnswer: function() {
                    let obj = {};

                    if(settings.messageOn){ 

                        obj = setTimeout(function(){
                            Messages.showMsg('error','Нет ответа от сервера!');
                        }, settings.timeOut);
  
                    }

                    return obj;

                },
                stopChecking: function(e,obj) {

                    if(settings.messageOn){ 
                        clearTimeout(obj);
                    }

                }
            }
        }

         /**
         *
         *
         * @type object
         */
          let Edit = {
             submit: function(td) {

                let node = $(td).parent('td').parent('tr');
                let data = {};

                node.find('td').each(function(index){
   

                 /**
                  * Условие для корректной отправки данных 
                  * при добалении новой колонки с чекбоксами для удаления
                  */
                    if(settings.updDelColumn){
                        if(!index){
                            return; 
                        }
                     index -= 1;
                     console.log(index); 
                    }
                    console.log('test');
                    if($(this).hasClass('text-input input-edit')){
                        data[index]=$(this).find('input.eiedit-input').val();
                       
                    }else if ($(this).hasClass('checkbox-input')){
                        let checkTemp = $(this).find('input.eiedit-input').is(':checked') ? 1 : 0;
                        data[index]=checkTemp;
                    }else{
                        data[index]=$(this).text().trim();
                        
                    }

                })
                data['action'] = 'insert';

                data['tableid'] = this.getTableID();

                AjaxSender.sendData(data);

            },
            hideElement: function(elem) {

                let inputElement = $(elem);
                if(!$(inputElement).parent('td').hasClass('checkbox-input')){
                    let value = inputElement.val();
                    inputElement.parent('td').removeClass("input-edit");
                    inputElement.parent('td').text(value);
                    inputElement.remove();
                }
            },
            getTableID: function() {
                    const attr = $table.attr('tableid');
                    if (typeof attr !== typeof undefined && attr !== false) {
                        return attr;
                    }      
                }
 


        };
        
        let AjaxSender = {
            sendData: function(data) {

                const timer = Messages.checkServerAnswer.checkAnswer();

                fetch(settings.url,{
                    method: 'POST',
                    headers: {
                        "Content-type": "application/json",
                    },
                    body: JSON.stringify(data),
                }).then((response) => response.json())
                .then((data) => {
        
                        Messages.showMsg(data[0],'Данные обновлены!');
                        Messages.checkServerAnswer.stopChecking(timer);
        
                });

            }

        }

        Draw.columns.identifier();
        Draw.columns.editable();
        Draw.columns.updDelColumn();
         
         $(document).on('keyup', function(event) {
          
           if(!$(event.target).hasClass('eiedit-input')){
                return;
           }

         
            switch (event.key) {
                case "Tab":  // Tab.
                   
                
                    break;
                case "Enter": // Enter

                    Edit.submit(event.target);
                
                    break;
                case "Escape": // Escape.
                    Edit.hideElement(event.target);
                    break;
            }
        });
         
    }

 }(jQuery));
