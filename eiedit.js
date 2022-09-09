/*!
 * EiEdit v0.1.6 
 * 2022 Kostyuchenko Sergey
 */

/**
 * @description inline editor for tables. In the name of Eidelman!
 * @version 0.1.6
 * @author Kostyuchenko Sergey
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


            idDigest: 0,// добавить получение id справочника автоматически
          }, options);

        function info(text){
            if(settings.debug){
                console.log(text);  
            }
        }

        info('EiEdit Текущая версия jQuery ' + $.fn.jquery);
        info('Инициализация EiEdit выполнена!');

        info('Переданные параметры:');
        info(options);

          /**
         * 
         *
         * @type object
         */
           let DrawElement = {
            viewElement: function() {
                if(!$(this).hasClass("input-edit")){

                    $(this).addClass("input-edit");
                    let value = $(this).text().trim();

                    $(this).html('<input class="form-control eiedit-input" type="text">');
                    let input = $(this).find('input');
            
                    input.val(value);

                    input.trigger( "focus" ).val(value);
                }        
            },
            hideElement: function() {
                let element = $(this)
                let inputElement = element.parent('td').find('input');
                    let value = inputElement.val();
                    element.parent('td').removeClass("input-edit");
                    $(this).parent('td').text(value);
                    element.remove();
            
            }
        };

        let DrawModal = {
            delModal: function (){
                 
                const count = $('tbody tr.eiedit-selected').length;

                let okButton = `<input type='button' class='btn btn-secondary ei-btn-modal ei-ok-btn' value='OK'>`
                let buttons = `<div class='ei-modal-buttons'>` + (count ? okButton : '') + 
                `<input type='button' class='btn btn-secondary ei-btn-modal ei-cancel-btn' value='Отмена'>
                </div>`;

                if(count){
                    this.modal("Удалить","Вы уверены что хотите удалить "+count+" ряд(-а)(-ов)?",buttons);
                }
                else{
                    this.modal("Удалить","Не выбраны ряды. Нечего удалять.",buttons);
                }
                
                let wrapModal = $('.wrap-modal'); 

                wrapModal.on('click','.ei-modal-buttons > .ei-ok-btn', function(e){
                    DrawModal.hideModal();
                    //I will create and add class for deleting rows
                });

            },
            addModal: function (){
                this.modal("Добавить","Add!Add!Add!");
            },
            modal: function (header = "",body = "",footer = ""){
                let modal = `<div class='back modal-gradient'></div>
                <div class='wrap-modal'><div class='header-modal'>`
                    +header+
                    `<div class='closing_cross'></div></div><div class='body-modal'>`
                    +body+
                    `</div><div class='footer-modal'>`
                    +footer+    
                    `</div></div>`;
                $('body').append(modal);

                let wrapModal = $('.wrap-modal');

                wrapModal.on('click','.closing_cross', function(e){
                    DrawModal.hideModal();
                });

                wrapModal.on('click','.ei-cancel-btn', function(e){
                    DrawModal.hideModal();
                });
            },
            hideModal: function(){
                const wrapModal = $('.wrap-modal');
                const background = wrapModal.parent('body').find('.back');
                background.addClass('close-back');
                wrapModal.addClass('close-modal');
            }
        }



        /**
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
                        info('test'+i);
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

                                $(this).parent('tr').on("focusout","td.input-edit > input",DrawElement.hideElement);
                            }
                            info(input); 
                            info("it's "+val);
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

                        eieditSquere.on('click','input[type="button"]', function(){
                            eieditSquere.find('.back,.pop').addClass('close-back');
                        });

                        eieditSquere.on('click','input.del', function(){
                            DrawModal.delModal();
                        });

                        eieditSquere.on('click','input.add', function(){
                            DrawModal.addModal();
                        });

                    }
                }

            }


        };

        let DocumentEvents = {
            events: function(){
                $(document).on('click', function(e){
                    let background = $(e.target);
                    let pop = $('.pop');

                    if(background.hasClass('back')){
                        background.addClass('close-back');
                        if (pop.length){
                            pop.addClass('close-back');
                        }
                    }
                });

                $(document).on('animationend',function(e){
                    let background = $(e.target);
                    let pop = $('.pop');

                    if(background.hasClass('close-back')){
                        background.remove();
                        if (pop.length){
                            pop.remove();
                        }
                    }
               });

               $(document).on('click', function(e){
                    console.log('back test');
                    let background = $(e.target);
                    let wrapModal = $('.wrap-modal');

                    if(background.hasClass('back')){
                    background.addClass('close-back');

                        if (wrapModal.length){
                            wrapModal.addClass('close-modal');
                        }

                    }
                });

                $(document).on('animationend',function(e){
                    let background = $(e.target);

                    let wrapModal = $('.wrap-modal.close-modal');

                    if(background.hasClass('close-back')){
                        background.remove();

                        if (wrapModal.length){
                            wrapModal.remove();
                        }
                    }

                });
            }
        }

        /**
        * Формирование сообщений на ответ от сервера.
        * showMsg(type,msg) - отображает сообщения разного типа.
        * Четыре типа сообщений type: ок, info, warning, error.
        * msg- отображаемое сообщение.
        * let obj = checkAnswer() -проверка был ли вообще ответ сервера?
        * Ждем ответа 10 секунд и в случае если ответа нет, 
        * выводим ошибку:"Нет ответа сервера".
        * stopChecking(obj) - отключает проверку в 
        * случае если ответ получен.
        * Где obj - обьект таймера.
        * Поумолчанию все отключено.
        * @type Object 
        */

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
                stopChecking: function(obj) {

                    if(settings.messageOn){ 
                        clearTimeout(obj);
                    }    

                }
            }
        }

         /**
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
                    }

                    if($(this).hasClass('text-input input-edit')){
                        data['item'+index]=$(this).find('input.eiedit-input').val();
                       
                    }else if ($(this).hasClass('checkbox-input')){
                        let checkTemp = $(this).find('input.eiedit-input').is(':checked') ? 1 : 0;
                        data['item'+index]=checkTemp;
                    }else{
                        data['item'+index]=$(this).text().trim();
                    }

                })
                data['action'] = 'insert';

                data['digest'] = this.getTableID();

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
        DocumentEvents.events();
        Draw.columns.updDelColumn();
         
         $(document).on('keyup', function(event) {
            if( !$(event.target).hasClass("eiedit-input")) return;
            switch (event.key) {
                case "Tab":  // Tab.
                    break;
                case "Enter": // Enter.
                    Edit.submit(event.target);
                    break;
                case "Escape": // Escape
					Edit.hideElement(event.target);
                    break;
            }
        });
         
    }

 }(jQuery));
