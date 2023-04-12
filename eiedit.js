/*!
 * EiEdit v1.1.0 
 * 2022 Kostyuchenko Sergey
 */

/**
 * @description inline editor for tables.
 * @version 1.1.0
 * @author Kostyuchenko Sergey
 */

//Для блокировки исчезновения инпута, ищи строку в коде 717

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
             *  {column: 6, type: 'select', action: "getEducation"}
             * ]
             * где column - номер столбца. type - тип 
             * поля ввода, если пусто, то простой текстовый инпут.
             * type: 'checkbox' - вместо текстового ввода появится чекбокс.
             * action: "getEducation" - ....... 
             * Поумолчанию не один не редактируется.
             * @property editable
             * @type array
             * 
             */
            editable: [],

            /**
             * Выделение столбцов в общую группу с выделением цветом 
             * при наведении на шапке
             * groupHilight: [
             *  {columns: [1,4,6], color: 'green', msg: 'Group with common sense'},
             *  {columns: [5], color: '#123456', msg: 'Оne column per group'}
             * ]
             * где columns - Столбцы объединенные в общую группу. 
             * color - цвет группы при наведении на шапку.
             * msg - сообщение отображающееся при наведении на шапку. 
             * Поумолчанию не один не редактируется.
             * @property groupHilight
             * @type array
             * 
             */
             groupHilight: [],

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
             * Путь по которому стучимся на бэкэнд.
             * Поумолчанию стучится на текущую страницу.
             * @property url
             * @type string
             * 
             */
             selectUrl: window.location.href,

             /**
             * Формирование дополнительной колонки для предоставления
             * добавления рядов в таблице и их удаления.
             * @property updDelColumn
             * @type boolean
             * 
             */
            updDelColumn: false,

            /**
             * Изменение функционала updDelColumn. 
             * updDelColumn должен быть true иначе не появится дополнительная колонка.
             * Будет искать данные в ряду с ячейка которого помечена css классом .find-ei-data .
             * <td class='find-ei-data'>...</td>
             * Данные из этих ячеек будут отправляться на сервер.
             * Не может быть отмечено css классом .find-ei-data более одной ячейки в ряду.
             * @property missingStaff
             * @type boolean
             * 
             */
             missingStaff: false,

            /**
             * Формирование сообщений на ответ от сервера при редактировании.
             * Смотреть Messages.showMsg(type,msg);
             * Четыре типа сообщений type: ок, info, warning, error.
             * msg- отображаемое сообщение.
             * Поумолчанию включено.
             * @property messageOn
             * @type boolean
             * 
             */
            messageOn:true,
            
             /**
             * Время через которое появляется ошибка: "Нет ответа от сервера"
             * @property timeOut
             * @type ineger
             * 
             */
            timeOut:20000,

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
                let input ={};
                let value = '';
                let data = {};

                if(!$(this).hasClass("input-edit")){

                    $(this).addClass("input-edit");

                    if($(this).hasClass("select")) {

                            Sender.sendSelectData(data,this);
                    } 
                    else {
                        
                        value = $(this).text().trim();
                        $(this).attr('data-text', value);
                        if($(this).hasClass("date-input")) {

                            let dateArray = value.split('.');

                            value = dateArray[2]+"-"+dateArray[1]+"-"+dateArray[0];

                            $(this).html('<input class="form-control eiedit-block eiedit-input" type="date">');
                        } else{
                            $(this).html('<input class="form-control eiedit-block eiedit-input" type="text">');
                        }
                        input = $(this).find('input');
            
                        input.val(value);

                        input.trigger( "focus" ).val(value);
                    }   
                }        
            },
            hideElement: function() {
                let value;
                let id;
                let element = $(this)
                if(element.parent('div').hasClass("rank")){

                    value = element.find('option:selected').val();
                    element.parent('.rank').parent('.wrap').parent('td').removeClass("input-edit");
                    element.parent('.rank').text(value);
                    element.remove();

                }else{
                    if(element.parent('td').hasClass("select")){

                        value = element.find('option:selected').text().trim();
                        id = element.find('option:selected').val();
                        element.parent('td').removeClass("input-edit");
                        element.parent('td').data('id',id);
                        element.parent('td').text(value);
                        element.remove();

                    }else{
                        let inputElement = element.parent('td').find('input');

                        if (inputElement.length) {
                           
                            value = inputElement.parent('td').data('text');
                            element.parent('td').removeClass("input-edit");                        
                            $(this).parent('td').text(value);
                            
                        } 
                        element.remove(); 
                    }
                }
            
            }
        };
        let SelectData = {
        }

        let EditSelect = {
            viewSelect: function(dataObj,context){
                // console.clear();
                //  console.log('полученные данные');
                //  console.log(dataObj);

                let value = 0;
              
                let options = "<option value='' title='' ></option>";
                let select = $(context);
                let array = [];
                let title = '';
                
                        if(!select.find(".wrap > .rank").length){
                            value= select.data("id");

                            if(select.hasClass("eiRowData")){

                                let cells = dataObj.data;

                                for (let data of cells){
                                    array.push({val:data.value,opt:data.option,title:data.title});      
                                }

                                SelectData.data = array;
                                // console.log(SelectData);
                            }

                            for (let data of dataObj.data){
                                
                                if(typeof data.title != 'undefined') {
                                    title = "title='"+data.title+"'";
                                }
                            
                                options += "<option value='"+data.value+"' "+title+">"+data.text+"</option>";
                            }
                            
                            // console.log("value of data");
                            // console.log(value);
                            select.html("<select class='form-select eiedit-block eiedit-input'>"+options+"</select>");
                            select.find("select >option[value='"+value+"']").prop('selected', true);
                            select.find("select").trigger( "focus" );
                        } else{

                            for (let data of dataObj.data){
                                options += "<option value='"+data.text+"'>"+data.text+"</option>";
                                array[data.text] = data.value;
                            }
                            SelectData.data = array;

                            //console.log(SelectData.data);
                           
                            value= select.find(".wrap > .rank").text().trim();
                            select.find(".wrap > .rank").html("<select class='form-select eiedit-block eiedit-input'>"+options+"</select>");
                            select.find(".wrap > .rank > select >option[value='"+value+"']").prop('selected', true);
                            select.find(".wrap > .ratio").text(array[value]);
                            select.find(".wrap > .rank > select").trigger( "focus" );
                        }
                        
                
            }

        }

        /**
         * Объект для отображения модальных окон при добавлении нового ряда 
         * в таблице или при удалении рядов
         * @type object
         */
        let DrawModal = {
            moveModal: function (){

                const count = $('tbody tr.eiedit-selected').length;

                let moveButton = `<input type='button' class='btn btn-secondary ei-btn-modal ei-move-btn' value='Переместить'>`
                let buttons = `<div class='ei-modal-buttons'>` + (count ? moveButton : '' ) + 
                `<input type='button' class='btn btn-secondary ei-btn-modal ei-cancel-btn' value='Отмена'>
                </div>`;

                if(count){
                    this.modal("Переместить","Вы уверены что хотите переместить "+count+" человек?",buttons);
                }
                else{
                    this.modal("Переместить","Не выбраны люди. Некого перемещать.",buttons);
                }

                let wrapModal = $('.wrap-modal'); 

                wrapModal.on('click','.ei-modal-buttons > .ei-move-btn', function(e){

                    DrawModal.hideModal();

                    MoveStaff.submit();

                });

            },
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
                let data ={};
                data['digest'] = 14;

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
                                case 'select':
                                    labelsInput = "<span><select class='form-select' get-api='"+settings.editable[i].action+"' id='"+settings.fields[i].column+"'><option value=''></option></select></span>";
                                break;
                                case 'date':
                                    labelsInput = "<span><input class='form-control' type='date' id='"+settings.editable[i].column+"'></span>";
                                break;
                                default:
                                    labelsInput = "<input class='form-control' type='text' id='"+settings.fields[i].column+"'>";
                            }

                            form += "<div><label for='"+settings.fields[i].column+"'>"+settings.fields[i].label+"</label>"+labelsInput+"</div>";
                    }
                    form += '</div>';

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
                                    case 'select':
                                        labelsInput = "<span><select class='form-select' get-api='"+settings.editable[i].action+"' id='"+settings.editable[i].column+"'><option value=''></option></select></span>";
                                    break;
                                    case 'date':
                                        labelsInput = "<span><input class='form-control' type='date' id='"+settings.editable[i].column+"'></span>";
                                    break;
                                    default:
                                        labelsInput = "<input class='form-control' type='text' id='"+settings.editable[i].column+"'>";

                                }

                               form += "<div><label for='"+settings.editable[i].column+"'>"+str+"</label>"+labelsInput+"</div>";
                                
                            }

                        });
   

                        form += '</div>';
                    }
                    else{

                        okButton = "";
                        form = "<strong>Отсутствуют редактируемые поля.<br>Проверьте настройки плагина.</strong>";

                    }


                }

                let buttons = `<div class='ei-modal-buttons'>` +okButton+ 
                                `<input type='button' class='btn btn-secondary ei-btn-modal ei-cancel-btn' value='Отмена'>
                                </div>`;

                this.modal("Добавить",form,buttons);

                let wrapModal = $('.wrap-modal'); 
                

                if(wrapModal.find('select[get-api]').length){

                    Sender.getSelectModalData();

                }

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
         * Объект который формирует подсветку группированных столбцов
         * при наведениии мыши на шапке
         * @type object
         */
        let DrawGroups = {
            grouping: function(event,context,callback){

                const num = $(context).index();
                const set = settings.groupHilight;

                set.forEach((item, i) => {
                    let columns = item.columns;
                    


                    if(columns.indexOf(num) != -1) {


                        let color = item.color;
                        let msg = item.msg;

                        let msgWindow = $("div.eigroup-msg.gr"+i);

                        if(msgWindow.length && event === "mouseleave"){

                                msgWindow.removeClass('eigroup');
                                
                                msgWindow.on('animationend',function(){
                                    $(this).remove();
                                });
    
                            
                        }else{
                       

                            $('body').append("<div class='eigroup-msg eigroup gr"+i+"'><div style='background-color:"+color+"'></div>"+msg+"</div>");
                        }
                           
                        columns.forEach((item) => {
                            callback(item,color);
                        });
                   }
                  });
            },
            viewGroup: function(e){

                DrawGroups.grouping(e.type,this,(item,color)=>{
                    const cells = $table.find("th:nth-child("+(item+1)+"),td:nth-child("+(item+1)+")");
                    cells.addClass('eiposition');
                    cells.append("<div class='eimask eigroup' style='background-color:"+color+"'></div>");
                    
                });
            },
            hideGroup: function(e) {

                DrawGroups.grouping(e.type,this,(item,color)=>{
                    const cells = $table.find("th:nth-child("+(item+1)+"),td:nth-child("+(item+1)+")");
                    cells.each(function(){
                        const cell = $(this);
                        if(cell.hasClass('eiposition')){
                            cell.find('div.eimask').removeClass('eigroup');
                            cell.find('div.eimask').on('animationend',function(){
                                $(this).remove();
                            });
                        }
                    });
                });
            }


        }


        /**
         *
         * @type object
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
                        getApiData = settings.editable[i].action;
                        //своего рода фильтр если значение андефайнд или неверно написано
                        switch (inputType) {
                            case 'checkbox':
                                inputType = 'checkbox'; 
                            break;
                            case 'select':
                                inputType = 'select'; 
                            break;
                            case 'date':
                                inputType = 'date'; 
                            break;
                            default:
                                inputType = 'text';  
                          }

                        $td.each(function(){

                            let input = document.createElement("input");
                            input.setAttribute("type", inputType);
                            input.classList.add("eiedit-input");
                            $(this).addClass("eiedit-editable");

                            let val = $(this).text().trim();

                            if(inputType === 'checkbox'){
                                //инпут типа чекбокс

                                $(this).addClass("checkbox-input"); 
                                
                                val = Boolean(parseInt(val));
                                input.checked = val;
                                $(input).attr("eichecked",val?1:0);
                                $(this).html(input).on("change","input",function(e){
                                    Edit.submit($(this));
                                });

                            }else{
                                //инпуты другого типа

                                switch (inputType) {
                                    case 'select': 
                                        $(this).addClass("select");

                                        if(getApiData !== undefined){

                                            $(this).attr('get-api', getApiData);
                                         
                                        }

                                    break;
                                    case 'date':
                                        $(this).addClass("date-input"); 
                                    break;
                                    default:
                                        $(this).addClass("text-input"); 
                                        
                                  }

                                let attr = $(this).attr("tabindex");

                                if (typeof attr === 'undefined' || attr === false || attr !== "0" ) {
                                    $(this).attr("tabindex",0);
                                }
                               
                                $(this).on("click focus",DrawElement.viewElement);

                                //Если нужно отключить исчезновение динамически появляющихся полей ввода, 
                                //то нужно закоментить строку кода ниже.
                                $(this).parent('tr').on("focusout","td.input-edit .eiedit-block",DrawElement.hideElement);
                            }
                           // info(input); 
                           // info("it's "+val);
                        });
                        
               
                    }
                },
                highligt: function(){
                    /**
                     * тут можно сделать выбор ряда в шапке на котором бдут вешаться события
                     * по группировке цветом столбцов
                     */
                    let hilight = $table.find('tr:nth-child(1)>th');
                    hilight.hover(DrawGroups.viewGroup,DrawGroups.hideGroup);
                }
                

            }


        };

        /**
         * Сервисный объект который содержит общие методы
         * @type object
         */
        let Service = {
            formateDate: function() {

                let value = new Date();

                let dd = value.getDate();
                if (dd < 10) dd = '0' + dd;
                              
                let mm = value.getMonth() + 1;
                if (mm < 10) mm = '0' + mm;
                              
                let yy = value.getFullYear();
                              
                return dd + '.' + mm + '.' + yy;
                
            },
            indexDomObject: function(obj){

                let index = 0;
                if((obj instanceof jQuery && obj.length) || obj instanceof Element) {
                    index = obj.index();
                    if (settings.updDelColumn){
                        index -= 1;
                    }
                }
                
                return index;
            },
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

                        eieditHead.each(function( index ) {
                            let firstColumn = $(this);
                            if(!index){
                                firstColumn.prepend("<th class='eiedit-select-checkbox' rowspan='1' colspan='1' ><div class='eiedit-square'><i class='fa fa-pencil-square-o' aria-hidden='true'></i></div></th>");
                            }
                            else{
                                firstColumn.prepend("<th class='eiedit-select-checkbox' rowspan='1' colspan='1' ></th>");
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
                                let popUpButtons = '';
                                if(settings.missingStaff){
                                    popUpButtons = "<input type='button' class='btn btn-secondary btn-pop move' value='Переместить'>";
                                    //popUpButtons = "<button type='button' class='btn btn-secondary btn-pop move'>Переместить <i class='fa fa-wheelchair-alt' aria-hidden='true'></i></button>";
                                } else {
                                    popUpButtons = "<input type='button' class='btn btn-secondary btn-pop del' value='Удалить'>"+
                                                    "<input type='button' class='btn btn-secondary btn-pop add' value='Добавить'>";
                                }

                                let popUp = "<div class='pop' style='bottom:100%;'>"+
                                    "<div class = 'triangle'></div>"+popUpButtons+"</div><div class='back'></div>";
                                    
                                eieButton.append(popUp);
                            }
                      
                        })

                        eieditSquere.on('click','input[type="button"]', function(){
                            eieditSquere.find('.back,.pop').addClass('close-back');
                        });

                        if(settings.missingStaff){
                            eieditSquere.on('click','input.move', function(){
                                DrawModal.moveModal();
                                console.log('move');
                            });

                            eieditSquere.on('click','input.ret', function(){
                                console.log('ret');
                            });
                        } 
                        else {
                            eieditSquere.on('click','input.del', function(){
                                DrawModal.delModal();
                            });

                            eieditSquere.on('click','input.add', function(){
                                DrawModal.addModal();
                            });
                        }
                    }
                }
        }

        /**
         * Объект вешающий события на добавляемые динамически элементы DOM
         * @type object
         */
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

                $(document).on('change','td.eiRowData.select select',function(){
                    let data = [{val: '', opt: [],title: ''}];
                    let sData = {};
                    let array = [];
                    let value = 'value';
                    let row = $(this).closest("tr");
                    let cellTd = $(this).parent("td");
                    let rowID = row.attr('id');
                    let group = $(this).val();
                    const arrayLength = SelectData.data[0].opt.length;
                   
                    if(arrayLength){
                        for (let i = 0; i < arrayLength; i++) {
                            data[0].opt[i]='';
                        }
                    }

                    data = [...data, ...SelectData.data];
                    // console.clear();

                    // console.log('Object data:');
                    // console.log(data);
                    // console.log($(this));
                    for (let key in data) {
                    
                        if(data[key].val == group){
                            array = data[key].opt;
                            if(cellTd.data("description")){
                               
                                    cellTd.data("description",data[key].title);
                       
                            }else{
                                cellTd.attr('data-description',data[key].title);
                            }

                            if (cellTd.data('value')) {
                                value = cellTd.data('value');
                            }

                            for (let key in array) {
                               let td = row.find("td."+value+""+key);
                               if(td.length){
                              
                                    td.html(array[key]);

                               }   
                            }
                            sData.action = 'update'+$(this).parent('td').attr('get-api');
                            sData.group = group;
                            sData.rowID = rowID;
                            sData.p2 = array[0];
                            sData.p3 = array[1];
                            sData.coeff = data[key].opt;
                            Sender.sendData(sData);
                        }
                    }
                    let groups = row.find('td.eiRowData.select');
                    let coeffs = row.find('td.coeffs');
                    let groupSum = row.find('td.group-sum');
                    let coeffsSum = row.find('td.coeffs-sum');
                    let gSum = 0;
                    let cSum = 1;
                    groups.each(function() {
                        let elem = $(this).find('select');
                        if (elem.length > 0) {
                            gSum+=parseInt(elem.find('option:selected').text());
                        } else{
                            gSum+=parseInt($(this).text());
                        }
                      });
                      
                    coeffs.each(function() {
                    
                            cSum*=parseFloat($(this).text());

                      });

                      groupSum.html(gSum); 
                      coeffsSum.html(cSum.toFixed(2));
                    
                });
                $(document).on('change','td.select .rank > select',function(){
                    let data = {};
                    let value ='';
                    let rowID = $(this).closest("tr").attr('id');
                    if($(this).val()!==''){
                        value = SelectData.data[$(this).val()];
                    }
                    else {
                        value = '';
                    }
                    let element = $(this).parent('.rank').parent('.wrap');

                    if (element.hasClass('wrap')){ 
                        const ratio = element.find('.ratio');

                        const cellID = element.parent('td').data('id');

                        if (cellID !== undefined){
                            data.cellID = cellID;
                        }else{
                            const cellIndex = element.parent('td').index();
                            data.cellIndex = cellIndex;
                        }
                        ratio.text(value);
                        data.action = 'selectUpdate';
                        data.rank = $(this).val();
                        data.rowID = rowID;
                        data.ratio = value;

                        Sender.sendData(data);
                        
                    }

                });
                $(document).on('change','td.select:not(.eiRowData) > select',function(){
                    let data = {};
                    let value ='';
                    let element = $(this);
                    let title = element.find('option:selected').attr('title');
                    let action = 'update'+element.parent('td').attr('get-api');
                    let rowID = element.closest("tr").attr('id');
                    data.rowID = rowID;
                    data.action = action;
                    data.value = element.val();
                    if (typeof title !== typeof undefined && title !== false) {
                        element.parent('td').data('description',title.trim());
                    }
                    data.text = element.find('option:selected').text().trim();
                    console.log('tect');
                        
                    Sender.sendData(data);

                });

                $('td[data-description]').mouseenter(function() {

                    let descrittionValue = $(this).data('description');
                    let hasText = (($(this).data('description') !== '') && ($(this).data('description') !== ' '))? true : false;
                    $(this).css('position','relative');

                    if((!$(this).find('div.popup-name').length) && hasText){
                        $(this).append("<div class='popup-name'><div class='triangle'></div>"+descrittionValue+"</div>");
                    }

                }).mouseleave(function() {
                    $('div.popup-name').remove();
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
        * Ждем ответа 20 секунд и в случае если ответа нет, 
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
                        case 'success':
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
                    "<a id='close' title='Закрыть'>&times;</a><strong>"+ msg +"</strong></div>";

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
                    //console.log($(this));
                    const input = $(this).find('input.eiedit-input');
                    const selectInput = $(this).find(".wrap > .rank");

                    if($(this).hasClass('text-input') && $(this).hasClass('input-edit')){
                        
                        data['item'+index]=input.val();
                        $(this).data('text',input.val());
                       
                    }else 
                        if ($(this).hasClass('checkbox-input')){

                            let checkTemp = input.is(':checked') ? 1 : 0;

                            input.attr("eichecked",checkTemp);

                            data['item'+index]=checkTemp;
                        }else{
                            if($(this).hasClass('date-input') && $(this).hasClass('input-edit')){
                                let val;
                                if(input.val() == ""){
                              
                              
                                    val = Service.formateDate();
                                    
                                } else{
                                    let dateArray = input.val().split('-');
                                    val = dateArray[2]+'.'+dateArray[1]+'.'+dateArray[0];
                                }
                                
                                
                                data['item'+index] = val;
                                $(this).data('text',val);
                            }else{
                                if(selectInput.length){
                                    data['item'+index] = selectInput.text().trim()
                                }
                                else{
                                    data['item'+index] = $(this).text().trim();
                                }
                            }
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
                let data={};
                let array=[];
                $($table).find('tbody > tr.eiedit-selected').each(function(rowIndex){

                    array[rowIndex] = $(this).attr(settings.identifier.idName);

                });

                data.item0 = array;
                data['action'] = 'delete';
                Sender.sendData(data);

            }


        };

        let Add = {
            submit: function() {

                let data = {};

                $('.wrap-modal .modal-form > div').each(function(){
                    let input = $(this).find('input');
                    let type;
                    if(input.length){
                        type = input.attr('type');
                    }
                    else
                    {
                        input = $(this).find('select');
                        type = 'select';
                    }
              
                    let value = 0;
                    switch (type) {
                        case 'checkbox':
                            value = input.is(':checked')?1:0;
                        break;
                        case 'select':
                            value = input.find( "option:selected" ).val();
                        break;
                        case 'date':
                            if(input.val() == ""){
                              
                              
                                value = Service.formateDate();
                                
                            } else{
                                let dateArray = input.val().split('-');
                                value = dateArray[2]+"."+dateArray[1]+"."+dateArray[0];
                            }
                        break;
                        default:
                            value = input.val();
  

                    }
                    data['item'+(input.attr('id'))] = value;
                });

                data['action'] = 'insert';

                Sender.sendData(data);

            }


        };

        let MoveStaff = {
            submit: function() {
                let data = {};
                let item = [];
                $($table).find('tbody > tr.eiedit-selected').each(function(rowIndex){

                   if($(this).find('.find-ei-data').length == 1){
                        item[rowIndex] = $(this).find('.find-ei-data').text().trim();    
                   }
                   else{
                        Messages.showMsg('error',' Более одной ячейки в ряду отмечено css классом .find-ei-data');
                        return;
                   }
                });
                data.item = item;
                console.log(data);

                Sender.sendData(data);

            }


        };

        let Sender = {
            sendData: function(data) {
                data['digest'] = Service.getTableID();

                //console.log(data);
                
                //const timer = Messages.checkServerAnswer.checkAnswer();
              
  
                fetch(settings.url,{
                    method: 'POST',
                    headers: {
                        "Content-type": "application/json",
                    },
                    body: JSON.stringify(data),
                }).then((response) => response.json())
                .then((data) => {

                    Messages.showMsg(data.status,data.message,data.reload);
                   // Messages.checkServerAnswer.stopChecking(timer);

                });

            },
            getSelectModalData: function() {
                let data;
                const selectElements = $('.wrap-modal select[get-api]');

                selectElements.each(function(){

                    let urlSettings = settings.selectUrl;
                    let select = $(this);
                    let apiData = select.attr('get-api');
                    
                    if(apiData !== undefined){
                        urlSettings = urlSettings+"/get"+apiData; 
                    }

                    fetch(urlSettings,{
                        method: 'POST',
                        headers: {
                            "Content-type": "application/json",
                        },
                        body: JSON.stringify(data),
                    }).then((response) => response.json())
                    .then((data) => {

                        let invisibleData = data.data;
                        let optionData = "<option  value ='' ></option>";

                        for (let optData in invisibleData) {

                            optionData += "<option title ='"+invisibleData[optData].value+"' value ="+invisibleData[optData].modalValue+" >"+invisibleData[optData].text+"</option>";
  
                        }
                        select.html( optionData);
    
                    });
                  
 

                });
 
             },
            sendSelectData: function(data,context={}) {
                let urlSettings = settings.selectUrl;
                let apiData = $(context).attr("get-api")
                 data['digest'] = Service.getTableID();
                if(apiData !== undefined){
                    urlSettings = urlSettings+"/get"+apiData; 
                }
                //console.log(urlSettings);
                 //const timer = Messages.checkServerAnswer.checkAnswer();
                 
                 fetch(urlSettings,{
                     method: 'POST',
                     headers: {
                         "Content-type": "application/json",
                     },
                     body: JSON.stringify(data),
                 }).then((response) => response.json())
                 .then((data) => {
                    console.log(data);
                    EditSelect.viewSelect(data,context);
                     //Messages.showMsg(data.status,data.message,data.reload);
                    // Messages.checkServerAnswer.stopChecking(timer);
                     
                 });
 
             }

        }

        Draw.columns.identifier();
        Draw.columns.editable();
        Draw.columns.highligt();
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
