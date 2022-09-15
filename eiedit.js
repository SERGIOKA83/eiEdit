/*!
 * EiEdit v1.0.0 
 * 2022 Kostyuchenko Sergey
 */

/**
 * @description inline editor for tables. In the name of Eidelman!
 * @version 1.0.0
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

        $table.addClass('eiedit');

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
             * Поля ввода при добавлении нового ряда в таблице.
             * Поумолчанию пытается взять информацию из editable о том
             * какие инпуты использовать для ввода нового ряда в таблице.
             * Названия полей пытается взять из шапки.
             * В случае необходимости можно сконфигурировать вручную:
             * fields: [
             * { label: 'First name', column: 4 },
             * { label: 'Last name',  column: 5 },
             * //etc
             * ]
             * @property fields
             * @type array
             * 
             */
            fields: [],

            /**
             * Указываем номер колонки с id таблицы и его название, 
             * которое будет атрибутом ряда.
             * idColumn - номер столбца с id
             * idName - название атрибута
             * Поумолчаннию название 'id'.
             * @property identifier
             * @type object
             *
             */
              identifier: {idColumn: 0, idName: 'id'},

            /**
             * Редактируемые столбцы.
             * editable: [
             *  {column: 4},
             *  {column: 5, type: 'checkbox'}
             * ]
             * где column - номер столбца. type - тип 
             * поля ввода, если пусто, то простой текстовый инпут.
             * type: 'checkbox' - вместо текстового ввода появится чекбокс. 
             * Поумолчанию не один не редактируется.
             * @property editable
             * @type array
             * 
             */
            editable: [],

            /**
             * Прячет столбец с id.
             * Поумолчанию id отображается.
             * @property hideIdentifier
             * @type boolean
             * 
             */
            hideIdentifier: false,

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

                    Delete.submit();
                    
                });

            },
            addModal: function (){
                let form = '<div class="modal-form">';
                let labelsInput;
                let inputType;
                let okButton = `<input type='button' class='btn btn-secondary ei-btn-modal ei-ok-btn' value='OK'>`
               
   
                if(settings.fields.length){
                    for (let i = 0; i < settings.fields.length; i++) {
                            inputType = settings.editable[i];
                            if(typeof inputType == "undefined"){
                                inputType ="";
                            }else{
                                inputType = inputType.type;    
                            }

                            switch (inputType) {
                                case 'checkbox':
                                    labelsInput = "<span><input type='checkbox' id='"+settings.fields[i].column+"'></span>"; 
                                break;
                                default:
                                    labelsInput = "<input class='form-control' type='text' id='"+settings.fields[i].column+"'>";
                            }   
                            
                            form += "<div><label for='"+settings.fields[i].column+"'>"+settings.fields[i].label+"</label>"+labelsInput+"</div>";
                    }

                }
                else{
                    if(settings.editable.length){
                        const tr = $table.find('thead tr');
                        let i = 0;
                        let str = "";
                        
                        tr.each(function(){
                            if(i>=settings.editable.length){
                                return false;
                            }else{
                                i=0;
                            }
                            
                            for (; i < settings.editable.length; i++) {
                               str = $(this).find('th:nth-child(' + (parseInt(settings.editable[i].column) + 2) + ')').text().trim();
                               if(str == ''){
                                    break;
                               }

                               inputType = settings.editable[i].type;
                               switch (inputType) {
                                case 'checkbox':
                                    labelsInput = "<span><input type='checkbox' id='"+settings.editable[i].column+"'></span>"; 
                                  break;
                                default:
                                    labelsInput = "<input class='form-control' type='text' id='"+settings.editable[i].column+"'>";
                                    
                              }

                               form += "<div><label for='"+settings.editable[i].column+"'>"+str+"</label>"+labelsInput+"</div>";
                            
                            }
                            
                        });

                        
                    }
                    else{

                        okButton = "";
                        form = "<strong>Отсутствуют редактируемые поля.<br>Проверьте настройки плагина.</strong>";

                    }


                }
              
                form += '</div>';

                let buttons = `<div class='ei-modal-buttons'>` +okButton+ 
                                `<input type='button' class='btn btn-secondary ei-btn-modal ei-cancel-btn' value='Отмена'>
                                </div>`;

                this.modal("Добавить",form,buttons);

                let wrapModal = $('.wrap-modal'); 

                wrapModal.on('click','.ei-modal-buttons > .ei-ok-btn', function(){

                    Add.submit();

                    DrawModal.hideModal();

                });
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
                        $table.find('th:nth-child(' + parseInt(settings.identifier.idColumn) + 1 + '), tbody td:nth-child(' + parseInt(settings.identifier.idColumn) + 1 + 
                        '), tfoot td:nth-child(' + parseInt(settings.identifier.idColumn) + 1 + ')').hide();
                    }

                    const $td = $table.find('tbody td:nth-child(' + (parseInt(settings.identifier.idColumn) + 1) + ')');

                    //цикл для работы с столбцом идентификатора
                    $td.each(function() {
                        // добавление к tr аттрибута с значением равным "id".
                        $(this).parent('tr').attr(settings.identifier.idName, $(this).text().trim());
                     });
                },
                editable: function() {
                    info('количество редактируемых столбцов: '+settings.editable.length);
                    //пробегаемся по колонкам в которые заданы для редактирования в настройках
                    let inputType = 'text'; 
                    for (let i = 0; i < settings.editable.length; i++) {
                        info('test'+i);
                        const $td = $table.find('tbody td:nth-child(' + (parseInt(settings.editable[i].column) + 1) + ')');

                        inputType = settings.editable[i].type;
 
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
                }
                

            }


        };

        let Service = {
            getTableID: function() {
                const attr = $table.attr('tableid');
                if (typeof attr !== typeof undefined && attr !== false) {
                    return attr;
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
                            console.log('modal removed!');
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
            showMsg: function(type, msg, reload = false){
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
                                if (reload){
                                    location.reload();
                                }
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
                data['action'] = 'update';

                Sender.sendData(data);
                
            },
			hideElement: function(elem) {

                let inputElement = $(elem);
                if(!$(inputElement).parent('td').hasClass('checkbox-input')){
                    let value = inputElement.val();
                    inputElement.parent('td').removeClass("input-edit");
                    inputElement.parent('td').text(value);
                    inputElement.remove();
                }
            }   
        };


        let Delete = {
            submit: function() {
                let data = {};
                $($table).find('tbody > tr.eiedit-selected').each(function(rowIndex){
                    data['id'+rowIndex] = $(this).attr(settings.identifier.idName);
                });
                data['action'] = 'delete';
                Sender.sendData(data);

            }


        };

        let Add = {
            submit: function() {

                let data = {};

                $('.wrap-modal .modal-form > div').each(function(){
                    let input = $(this).find('input');
                    let value = 0;
                    switch (input.attr('type')) {
                        case 'checkbox':
                            value = input.is(':checked')?1:0;
                        break;
                        default:
                            value = input.val();
                    }
                    data['item'+(input.attr('id'))] = value;
                });

                data['action'] = 'insert';
                console.log(data);
                Sender.sendData(data);

            }


        };

        let Sender = {
            sendData: function(data) {
                data['digest'] = Service.getTableID();
                
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
        Service.updDelColumn();
         
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
