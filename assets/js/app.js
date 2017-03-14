//Quantum v5.0
//Author: Carlos E. Santos
$(document).ready(function() {
    var loadTexts = ["Please wait...a few bits tried to escape, but we caught them",
        "Please wait...and dream of faster computers",
        "Please wait...would you like fries with that?",
        "Please wait...checking the gravitational constant in your locale",
        "Please wait...go ahead -- hold your breath",
        "Please wait...at least you're not on hold",
        "Please wait...hum something loud while others stare",
        "Please wait...you're not in Kansas any more",
        "Please wait...the server is powered by a lemon and two electrodes",
        "Please wait...we love you just the way you are",
        "Please wait...while a larger software vendor in Seattle takes over the world",
        "Please wait...we're testing your patience",
        "Please wait...as if you had any other choice",
        "Please wait...take a moment to sign up for our lovely prizes",
        "Please wait...don't think of purple hippos",
        "Please wait...follow the white rabbit",
        "Please wait...why don't you order a sandwich?",
        "Please wait...programming the flux capacitor",
        "Please wait...the bits are breeding"
    ];
    $('.loading-text').text(loadTexts[Math.round(Math.random() * (loadTexts.length - 1))]);
    $('.windowBar').initializeWindowBar('#000000');
    loadData(launchData);
    //hide elements from view
    $('.menu, .dropdown, .settings-container, .bg, .dialogue, .search-container, .contextmenu, .folder-contextmenu, .remove-dialogue, .folder-remove-dialogue, .new-file-dialogue, .new-folder-dialogue, .new-project-dialogue, .rename-folder-dialogue, .rename-file-dialogue, .settingdiv span').hide();
    //define global variables
    var editor = [],
        fileDirs = [],
        textArray = [],
        tabArray = [],
        editArray = [],
        files = [],
        directories = [],
        rootDirs = [],
        prefs,
        numbers,
        savedFileEntry,
        closedTab,
        installed,
        docFrag;

    //search variables
    var text,
        query,
        cm,
        state;

    //defaults
    var config = {
        lineNumbers: true,
        lineWrapping: true,
        styleActiveLine: false,
        matchBrackets: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        viewportMargin: 10,
        historyEventDelay: 400,
        tabSize: 4,
        indentUnit: 4,
        foldGutter: true,
        dragDrop: false,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
        lint: false,
        theme: 'material',
        mode: 'text/plain'
    };

    function getActiveTab() {
        return $('.active');
    }

    function isInteger(x) {
        return x % 1 === 0;
    }

    function getEditor(index) {
        if (isInteger(index)) {
            return editor[index];
        } else {
            return editor[getActiveTab().index()];
        }
    }

    function setEditor(index, value) {
        editor[index] = value;
    }

    function focusEditor() {
        getEditor().focus();
    }

    function setStorage(obj) {
        chrome.storage.local.set(obj);
    }

    function getStorage(obj, callback) {
        chrome.storage.local.get(obj, callback);
    }

    function replaceTabID(tab) {
        return tab.attr('id').replace('tab', '');
    }

    function getMatIcons(parent) {
        return parent.find('.material-icons');
    }

    function getFolderName(parent) {
        return parent.find('.folder-name').first().text();
    }

    function setFolderName(parent, text) {
        parent.find('.folder-name').first().text(text);
    }

    function getFileName(parent) {
        return parent.find('.file-name').text();
    }

    function setFileName(parent, text) {
        parent.find('.file-name').text(text);
    }

    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    //common aliases
    function codeMirror() {
        return $('.CodeMirror');
    }

    function sideBar() {
        return $('.sidebar');
    }

    function workSpace() {
        return $('.workspace');
    }

    function projects() {
        return $('.projects');
    }

    function settings() {
        return $('.settings-container');
    }

    function tabContainer() {
        return $('.tabs');
    }

    function newButton() {
        return $('.new');
    }

    function openButton() {
        return $('.open');
    }

    function openDirButton() {
        return $('.open-dir');
    }

    function newProject() {
        return $('.add-newproject');
    }

    function tab(index) {
        if (isInteger(index)) {
            return $('.tab').eq(index);
        } else {
            return $('.tab');
        }
    }

    function bg() {
        return $('.bg');
    }

    function preLoad() {
        $('.preload').stop().velocity({
            opacity: '0'
        }, {
            duration: 800,
            complete: function() {
                $(this).hide();
            }
        });
        $('body').removeClass('preload-body');
    }

    //settings
    //dropdown
    function openDropDown(dropdown) {
        var height = dropdown.children().length;
        	height = height * 40 + 'px';
        if (dropdown.is(':visible')) {
            dropdown.stop().animate({
                height: '0px'
            }, 200, function() {
                $(this).hide();
            });
        } else {
            dropdown.show().stop().animate({
                height: height
            }, 200);
        }
    }
    $(document).on('click', '.selector-container', function() {
        var thisDropdown = $(this).attr('class').split(' ');
        	thisDropdown = thisDropdown[thisDropdown.length - 1];
        var realDropdown = thisDropdown.replace('selector-', '');
        	realDropdown = $('.dropdown-' + realDropdown);

        openDropDown(realDropdown);

        var arrows = getMatIcons($(this));
        //change material-icon
        if (arrows.text() == 'arrow_drop_down') {
            arrows.text('arrow_drop_up');
        } else {
            arrows.text('arrow_drop_down');
        }
    });

    function savePrefs() {
        var font = codeMirror().css('font-family'),
            fontSize = codeMirror().css('font-size'),
            library = $('.selector-library').clone().children().remove().end().text();
        var lint,
            styleAL;
        if ($('.linter-checkbox').hasClass('active-checkbox')) {
            lint = true;
        } else {
            lint = false;
        }
        if ($('.activeline-checkbox').hasClass('active-checkbox')) {
            styleAL = true;
        } else {
            styleAL = false;
        }
        prefs = {
            theme: config.theme,
            font: font,
            fontSize: fontSize,
            tabSize: config.tabSize,
            softWrap: config.lineWrapping,
            library: library,
            lint: lint,
            styleActiveLine: styleAL
        };
        setStorage({
            settings: prefs
        });
    }

    function refreshEditors() {
        for (var re = 0; re < editor.length; re++) {
            getEditor(re).refresh();
        }
    }

    function shadeRGBColor(color, percent) {
        var f = color.split(","),
            t = percent < 0 ? 0 : 255,
            p = percent < 0 ? percent * -1 : percent,
            R = parseInt(f[0].slice(4)),
            G = parseInt(f[1]),
            B = parseInt(f[2]);
        return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + "," + (Math.round((t - B) * p) + B) + ")";
    }

    function loadColor(color) {
        sideBar().css('background-color', shadeRGBColor(color, -0.2));
        $('.workspace, body').css('background-color', color);
        $('.windowBar').css('background-color', shadeRGBColor(color, 0.1));
        settings().css('background-color', shadeRGBColor(color, -0.1));
    }

    function resetConfig(prefs) {
        config.theme = prefs.theme;
        config.tabSize = prefs.tabSize;
        config.indentUnit = prefs.tabSize;
        config.lineWrapping = prefs.softWrap;
        config.lint = prefs.lint;
        config.styleActiveLine = prefs.styleActiveLine;
    }

    function loadSettings(prefs) {
        codeMirror().css('font-family', prefs.font);
        codeMirror().css('font-size', prefs.fontSize);
        setEditorOption([{
                option: 'theme',
                value: prefs.theme
            },
            {
                option: 'tabSize',
                value: prefs.tabSize
            },
            {
                option: 'lineWrapping',
                value: prefs.softWrap
            },
            {
                option: 'lint',
                value: prefs.lint
            },
            {
                option: 'styleActiveLine',
                value: prefs.styleActiveLine
            }
        ]);
        getActiveTab().attr('class', 'tab active active-' + prefs.theme);
        loadColor(getCMColor());
        resetConfig(prefs);
        changeTabTheme(getCMColor());
        refreshEditors();
    }

    function nameSelector(selector, name) {
        $(selector).html(name + '<div class="material-icons">arrow_drop_down</div>');
    }

    function parseWrap(wrap) {
        if (wrap === true) {
            return 'wrap';
        } else {
            return 'none';
        }
    }

    function parseLib(lib) {
        if (lib === undefined) {
            return '.jquery.min.js';
        } else {
            return lib;
        }
    }

    function resetFolders() {
        $('.folder').removeClass('active-folder');
        $('.file').removeClass('active-file');
    }

    function selectThis(element) {
        if (element.hasClass('file')) {
            resetFolders();
            element.addClass('active-file');
        } else {
            resetFolders();
            element.addClass('active-folder');
        }
    }

    function setCheckBox(value, checkbox) {
        if (value === false || undefined) {
            $(checkbox).removeClass('active-checkbox');
            getMatIcons($(checkbox)).text('');
        } else {
            $(checkbox).addClass('active-checkbox');
            getMatIcons($(checkbox)).text('check');
        }
    }

    function setSelectors(prefs) {
        nameSelector('.selector-theme', prefs.theme.replace(/-/g, ' '));
        nameSelector('.selector-font', prefs.font.replace(/"/g, '').toLowerCase());
        nameSelector('.selector-font-size', prefs.fontSize);
        nameSelector('.selector-tab-size', prefs.tabSize);
        nameSelector('.selector-wrap', parseWrap(prefs.softWrap));
        nameSelector('.selector-library', parseLib(prefs.library));
        setCheckBox(prefs.styleActiveLine, '.activeline-checkbox');
        setCheckBox(prefs.lint, '.linter-checkbox');
    }

    function loadPrefs() {
        getStorage({
            settings: 'prefs'
        }, function(item) {
            var setting = item.settings;
            if (setting == 'prefs' || setting === undefined || setting === null) {
                resetPrefs();
                loadSettings(prefs);
                setSelectors(prefs);
            } else {
                prefs = setting;
                loadSettings(setting);
                setSelectors(setting);
            }

        });
    }

    function eachEdSet(option, value) {
        for (var d = 0; d < editor.length; d++) {
            getEditor(d).setOption(option, value);
        }
    }

    function setEditorOption(array, obj) {
        var option, value;
        if (array) {
            array.forEach(function(val, index, arr) {
                option = array[index].option;
                value = array[index].value;
                eachEdSet(option, value);
            });
        }
        if (obj) {
            option = obj.option;
            value = obj.value;
            eachEdSet(option, value);
        }
    }

    function setDDOP(selector, selected) {
        selector.html(selected + '<div class="material-icons">arrow_drop_down</div>');
    }

    function changeTabTheme(color) {
        $('.tabs, .overflow-menu').css('background-color', color);
    }

    function getCMColor() {
        return codeMirror().css('background-color');
    }

    function setConfig(option, value) {
        config[option] = value;
    }
    
    function setFileDir(index, value){
        fileDirs[index] = value;
    }
    
    function getFileDir(index){
        return fileDirs[index];
    }
    
    function moveArray(arr, a, b){
        arr.move(a, b);
    }
    
    function removeArrayEntry(arr, index){
        arr.splice(index, 1);
    }
    
    $('.settings').scroll(function() {
        var scroll = $(this).scrollTop();
        if (scroll !== 0) {
            $('.top-title').css('box-shadow', '0px 5px 9px 0px rgba(0,0,0,0.1)');
        } else {
            $('.top-title').css('box-shadow', 'none');
        }
    });
    $(document).on('click', '.activeline-checkbox', function() {
        if ($(this).hasClass('active-checkbox')) {
            setCheckBox(false, '.activeline-checkbox');
            setEditorOption(false, {
                option: 'styleActiveLine',
                value: false
            });
        } else {
            setCheckBox(true, '.activeline-checkbox');
            setEditorOption(false, {
                option: 'styleActiveLine',
                value: true
            });
        }
        savePrefs();
    });
    $(document).on('click', '.linter-checkbox', function() {
        if ($(this).hasClass('active-checkbox')) {
            setCheckBox(false, '.linter-checkbox');
            setEditorOption(false, {
                option: 'lint',
                value: false
            });
        } else {
            setCheckBox(true, '.linter-checkbox');
            setEditorOption(false, {
                option: 'lint',
                value: true
            });
        }
        savePrefs();
    });
    $(document).on('click', '.dropdown .theme', function() {
        var option = 'theme',
            value = $(this).text().replace(/ /g, '-');
        getActiveTab().attr('class', 'tab active active-' + value);
        setDDOP($('.selector-theme'), $(this).text());
        setEditorOption(false, {
            option: option,
            value: value
        });
        setConfig(option, value);
        loadColor(getCMColor());
        changeTabTheme(getCMColor());
        openDropDown($(this).parent());
        savePrefs();
    });
    $(document).on('click', '.dropdown .font-fam', function() {
        var font = $(this).text().capitalizeFirstLetter();
        setDDOP($('.selector-font'), $(this).text());
        codeMirror().css('font-family', font);
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });
    $(document).on('click', '.dropdown .font-size', function() {
        var fontSize = $(this).text();
        setDDOP($('.selector-font-size'), fontSize);
        codeMirror().css('font-size', fontSize);
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });
    $(document).on('click', '.dropdown .tab-size', function() {
        var tabSize = Number($(this).text());
        setDDOP($('.selector-tab-size'), tabSize);
        setEditorOption(false, {
            option: 'tabSize',
            value: tabSize
        });
        setConfig('tabSize', tabSize);
        setConfig('indentUnit', tabSize);
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });
    $(document).on('click', '.dropdown .wrap', function() {
        var wrap = $(this).text();
        if (wrap == 'none') {
            wrap = false;
        } else {
            wrap = true;
        }
        setDDOP($('.selector-wrap'), $(this).text());
        setEditorOption(false, {
            option: 'lineWrapping',
            value: wrap
        });
        setConfig('lineWrapping', wrap);
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });

    function cleanPath(dirEntry) {
        if (projectDir) {
            if (typeof dirEntry === 'string') {
                return dirEntry.replace(projectDir.fullPath, '');
            } else {
                return dirEntry.fullPath.replace(projectDir.fullPath, '');
            }
        } else {
            if (typeof dirEntry === 'string') {
                return dirEntry;
            } else {
                return dirEntry.fullPath;
            }
        }
    }

    function getFile(url, name) {
        $.get(url, function(data) {
            var folderUsed;
            if (!folderToRemove) {
                folderUsed = projects().children().first();
            } else {
                if (getMatIcons(folderToRemove).first().text() == 'keyboard_arrow_down' || getMatIcons(folderToRemove).eq(1).text() == 'book') {
                    folderUsed = folderToRemove;
                } else {
                    folderUsed = folderToRemove.parent().parent();
                }
            }
            var dirName = getFolderName(folderUsed),
                dirPath = folderUsed.attr('path'),
                dirEntry = getEntry(dirName, dirPath, false, true);
            
            dirEntry.getFile(name, {
                create: true,
                exclusive: true
            }, function(fileEntry) {
                //write data to file
                fileEntry.createWriter(function(fileWriter) {
                    var blob = new Blob([data]);
                    fileWriter.write(blob);
                });
                files.push({
                    entry: fileEntry
                });
                var name = replaceName(fileEntry.name);
                var path = cleanPath(fileEntry);
                //create div
                var div = document.createElement('div');
                var material = getMaterial(fileEntry.name, true);
                div.className = name + ' file';
                div.setAttribute('path', path);
                div.innerHTML = material + '<label class="file-name">' + fileEntry.name + '</label>';
                folderUsed.children().last().append(div);
                setMaterialPadding(folderUsed.children().last().children().last());
                savePrefs();
            });
        });
    }
    $(document).on('click', '.dropdown .library', function() {
        var name = $(this).text(),
            folderUsed;
        if (!folderToRemove) {
            folderUsed = projects().children().first();
        } else {
            if (getMatIcons(folderToRemove).first().text() == 'keyboard_arrow_down' || getMatIcons(folderToRemove).eq(1).text() == 'book') {
                folderUsed = folderToRemove;
            } else {
                folderUsed = folderToRemove.parent().parent();
            }
        }
        var fileNames = [];

        openDropDown($(this).parent());
        if (!folderUsed || projects().children().length === 0) {
            $('.settingdiv span').text('No folder selected. Click on the folder you wish to add ' + name + ' to in the projects section.');
            $('.settingdiv span').show();
        } else {
            folderUsed.children().last().children().each(function() {
                if ($(this).hasClass('file')) {
                    var thisName = getFileName($(this));
                    fileNames.push(thisName);
                }
            });
            if (navigator.onLine) {
                if (fileNames.indexOf(name) > -1) {
                    $('.settingdiv span').text(name + ' already exists.');
                    $('.settingdiv span').show();
                } else {
                    setDDOP($('.selector-library'), name);
                    switch (name) {
                        case 'jquery.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js', name);
                            break;
                        case 'matter.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.10.0/matter.min.js', name);
                            break;
                        case 'p5.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.7/p5.min.js', name);
                            break;
                        case 'angular.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.1/angular.min.js', name);
                            break;
                        case 'backbone.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3/backbone-min.js', name);
                            break;
                        case 'ember.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/ember.js/2.11.2/ember.min.js', name);
                            break;
                        case 'react.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/react/15.4.2/react.min.js', name);
                            break;
                        case 'react-dom.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/react/15.4.2/react-dom.min.js', name);
                            break;
                        case 'three.min.js':
                            getFile('https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.min.js', name);
                            break;
                    }
                    $('.settingdiv span').hide();
                }
            } else {
                $('.settingdiv span').show();
            }
        }
    });

    function openSettings() {
        $('.dropdown').hide();
        settings().show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        bg().show().stop().animate({
            opacity: '0.6'
        }, 200);
        $('.settingdiv span').hide();
    }

    function closeSettings() {
        settings().stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        bg().stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    $('.close-settings').click(function() {
        closeSettings();
        focusEditor();
    });
    bg().click(function() {
        if ($('.dialogue').is(':visible')) {
            closeSaveBox();
        } else {}
        if ($('.dialog').is(':visible')) {
            closeDialog('.dialog');
        }
        if (settings().is(':visible')) {
            closeSettings();
        }
        focusEditor();
    });
    //open settings
    $('.settings-button').click(function() {
        openSettings();
    });
    //check input so as not to leave document untitled
    $(document).on('click', '.CodeMirror', function(e) {
        if ($('.active .title').val() === '') {
            $('.active .title').val('untitled.txt');
        }
        closeOverflow();
    });
    //tabbed functionality
    //sortable tabs
    Array.prototype.move = function(oldIndex, newIndex) {
        if (newIndex >= this.length) {
            var k = newIndex - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(newIndex, 0, this.splice(oldIndex, 1)[0]);
    };
    var sorting;
    tabContainer().sortable({
        axis: 'x',
        distance: 20,
        tolerance: 'pointer',
        revert: true,
        start: function(e, ui) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            sorting = true;
            $(this).attr('data-previndex', ui.item.index());
            $(this).addClass('noclick');
        },
        stop: function(e, ui) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            sorting = false;
            var newIndex = ui.item.index(),
                oldIndex = $(this).attr('data-previndex'),
                thisID = replaceTabID(ui.item),
                newID = $('.workspace > textarea').eq(newIndex).attr('id').replace('textarea', '');
            $(this).removeAttr('data-previndex');
            if (oldIndex > newIndex) {
                $('#textarea' + thisID).insertBefore($('#textarea' + newID));
                codeMirror().eq(oldIndex).insertBefore($('#textarea' + newID));
            } else {
                codeMirror().eq(oldIndex).insertAfter(codeMirror().eq(newIndex));
                $('#textarea' + thisID).insertBefore(codeMirror().eq(newIndex));
            }
            moveArray(editor, oldIndex, newIndex);
            moveArray(fileDirs, oldIndex, newIndex);
            focusEditor();
        }
    }).disableSelection();

    function autoSave(g) {
        getEditor(g).on('change', function() {
            $('.active .close').text('fiber_manual_record');
            $('.active .close').addClass('edit');
        });
        var charWidth = getEditor(g).defaultCharWidth(),
            basePadding = 4;
        getEditor(g).on('renderLine', function(cm, line, elt) {
            var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
            elt.style.textIndent = '-' + off + 'px';
            elt.style.paddingLeft = (basePadding + off) + 'px';
        });
    }


    function findBigNumber() {
        numbers = [];
        for (var l = 0; l < tab().length; l++) {
            var thisID = replaceTabID(tab(l));
            numbers.push(Number(thisID));
        }
    }

    function newTab() {
        var index;
        if (tab().length === 0) {
            index = 0;
        } else {
            findBigNumber();
            index = Math.max.apply(null, numbers) + 1;
        }
        tab().removeClass('active');
        tab().removeClass('active-' + config.theme);
        tabContainer().append('<div id="tab' + index + '"class="tab active active-' + config.theme + '"><input class="title"/><span class="close material-icons">close</span></div>');
        setTabName('untitled.txt');
        workSpace().append('<textarea id="textarea' + index + '"></textarea>');
        getActiveTab().attr('id', 'tab' + index);
        codeMirror().hide();
        resizeTabs();
        $('#textarea' + index).show();
        createDataAttr('');
        setFileDir(index, '');
    }

    function reloadDirEntries(entry) {
        directories.push({
            entry: entry
        });
        displayDataDir(directories.length - 1);
        loadDirEntry(entry);
        focusEditor();
    }

    function loadAutoTab() {
        newTab();
        var index = getActiveTab().index();
        setEditor(index, CodeMirror.fromTextArea(document.getElementById('textarea' + index), config));
        setTabName('untitled.txt');
        setFileDir(index, '');
        setTimeout(function() {
            getActiveTab().click();
            autoSave(index);
        });
    }
    $(document).on('click', '.tab', function(e) {
        e.stopPropagation();
        if ($(this).hasClass('noclick')) {
            $(this).removeClass('noClick');
        } else {
            //material design click animation
            var ink, d, x, y;
            var elem = $(this);
            if (elem.find('.ink').length === 0) {
                elem.prepend('<div class="ink"></div>');
            }
            ink = elem.find('.ink');
            ink.removeClass('animate');
            if (!ink.height() && !ink.width()) {
                d = Math.max(elem.width(), elem.height());
                ink.css({
                    height: d,
                    width: d
                });
            }
            x = e.pageX - elem.offset().left - ink.width() / 2;
            y = e.pageY - elem.offset().top - ink.height() / 2;

            ink.css({
                top: y + 'px',
                left: x + 'px'
            }).addClass("animate");
            tab().removeClass('active');
            tab().removeClass('active-' + config.theme);
            $(this).addClass('active');
            $(this).addClass('active-' + config.theme);
            codeMirror().hide();
            codeMirror().eq(getActiveTab().index()).show();
            changeMode();
            savedFileEntry = getFileDir($(this).index());
            selectThis($('.file[path="' + $(this).attr('path') + '"]'));
            getEditor().refresh();
            focusEditor();
        }
    });

    var tooltipTimer;
    $(document).on('mouseenter', '.tab input', function() {
        var input = $(this),
            tab = input.parent(),
            path = tab.attr('path');

        var fileName = $(this).val();
        if (path === undefined || '') {

        } else {
            var entry = getEntry(fileName, path, true, false, false);
            if (entry === undefined) {
                entry = getEntry(fileName, path, false, false, true, true);
                if (entry === undefined) {

                } else {
                    chrome.fileSystem.getDisplayPath(entry, function(displayPath) {
                        path = displayPath;
                    });
                }
            } else {
                chrome.fileSystem.getDisplayPath(entry, function(displayPath) {
                    path = displayPath;
                });
            }
        }
        tooltipTimer = setTimeout(function() {
            if (tab.attr('path') === undefined) {} else {
                $('.tooltip').text(path);
                $('.tooltip').css({
                    top: input.offset().top + input.height() - 20,
                    left: input.offset().left,
                    backgroundColor: shadeRGBColor(getActiveTab().css('box-shadow').replace(/^.*(rgba?\([^)]+\)).*$/, '$1'), 0.1)
                });
                $('.tooltip').show().animate({
                    top: Number($('.tooltip').css('top').replace('px', '')) + 25,
                    opacity: '1'
                }, 200);
            }
        }, 2000);
    });
    $(document).on('mouseleave', '.tab', function() {
        clearTimeout(tooltipTimer);
        $('.tooltip').animate({
            top: Number($('.tooltip').css('top').replace('px', '')) - 25,
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    });

    function openSaveBox(closed) {
        closeOverflow();
        var docTitle = $('.active .title').val();
        $('.dialogue .dialogue-text').text(docTitle + ' has been modified. Unless saved, progress will be lost. Save changes?');
        $('.dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        bg().show().stop().animate({
            opacity: '0.6'
        }, 200);
        closedTab = closed;
    }

    function closeSaveBox() {
        $('.dialogue').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        bg().stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    $('.buttons-dialogue .cancel').click(function() {
        closeSaveBox();
        focusEditor();
    });
    $('.buttons-dialogue .no').click(function() {
        closeTab(closedTab);
        closeSaveBox();
    });
    var yesClicked;
    $('.buttons-dialogue .yes').click(function() {
        yesClicked = true;
        $('.save').click();
        closeSaveBox();
    });

    function closeTab(closedTab, multiple) {
        var tabClicked = closedTab.parent(),
            tabID = tabClicked.attr('id'),
            textID = tabID.replace('tab', 'textarea'),
            tabClass = tabClicked.attr('class'),
            tabIndex = tabClicked.index(),
            lastObjectIndex = tabContainer().children().last().index(),
            tabLength = tab().length;
        $('#' + textID).remove();
        $('.CodeMirror:eq(' + tabClicked.index() + ')').remove();
        removeArrayEntry(editor, tabIndex);
        removeArrayEntry(fileDirs, tabIndex);
        closedTab.parent().remove();
        if (prefs === undefined) {
            resetPrefs();
        }
        if (multiple) {

        } else {
            if (tabIndex === 0 && tabLength == 1) {
                loadAutoTab();
                loadSettings(prefs);
            } else {
                if (tabClass.indexOf('active') == -1) {
                    getActiveTab().click();
                } else {
                    if (tabIndex === 0) {
                        tab(0).click();
                    } else if (tabIndex == lastObjectIndex) {
                        tab(tabIndex - 1).click();
                    } else {
                        tab(tabIndex).click();
                    }
                }
            }
            resizeTabs();
            closeSaveBox();
        }
    }
    $(document).on('click', '.close', function(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if ($(this).text() == 'fiber_manual_record') {
            openSaveBox($(this));
        } else {
            closeTab($(this));
        }
    });
    $(document).on('change', '.title', function(e) {
        changeMode();
    });
    $(document).on('keyup', '.title', function(e) {
        if (e.keyCode == 13) {
            if ($(this).val() === '') {
                $(this).val('untitled.txt');
            }
            focusEditor();
        }
    });
    $(document).on('keydown', '.title', function(e) {
        if (e.keyCode == 65 && e.ctrlKey) {
            e.target.select();
        }
        if (e.keyCode == 9) {
            if ($(this).val() === '') {
                $(this).val('untitled.txt');
            }
        }
    });

    function openSearch() {
        if (window.getSelection() === '') {
            $('.search-bar').select();
        } else {
            $('.search-bar').val(window.getSelection());
        }
        if (chrome.app.window.current().isFullscreen()) {
            workSpace().css('height', 'calc(100% - 150px)');
        } else {
            workSpace().css('height', 'calc(100% - 180px)');
        }
        $('.search-container').show().stop().animate({
            opacity: '1',
            bottom: '0px'
        }, 200);
        setTimeout(function() {
            $('.search-bar').focus();
        }, 200);
    }

    function closeSearch() {
        workSpace().css('height', 'calc(100% - 80px)');
        $('.search-container').show().stop().animate({
            opacity: '0',
            bottom: '-100px'
        }, 200, function() {
            $(this).hide();
            cm = getEditor();
            clearSearch(cm);
            focusEditor();
        });
    }

    function setSearch(input) {
        $('.search-bar').attr('searchNext', input);
    }

    $('.search-bar').keyup(function() {
        $(this).css('box-shadow', 'inset 0px -1px 0px 0px rgba(0, 0, 0, 0.2)');
    });
    $('.search-bar').focus(function(){
        $(this).css('box-shadow', 'inset 0px -1px 0px 0px rgba(0, 0, 0, 0.2)');
    });
    $('.find_next').click(function() {
        text = $('.search-bar').val();
        cm = getEditor();
        state = getSearchState(cm);
        setSearch('true');
        startSearch(cm, state, text);
        doSearch(cm, false);
    });
    $('.find_prev').click(function() {
        text = $('.search-bar').val();
        cm = getEditor();
        state = getSearchState(cm);
        setSearch('true');
        startSearch(cm, state, text);
        doSearch(cm, true);
    });
    $('.replace_all').click(function() {
        text = $('.search-bar').val();
        query = $('.search-replace').val();
        cm = getEditor();
        setSearch('true');
        replaceAll(cm, text, query);
    });
    $('.replace').click(function() {
        query = $('.search-bar').val();
        text = $('.search-replace').val();
        cm = getEditor();
        var cursor = getSearchCursor(cm, query, cm.getCursor("from"));
        setSearch('true');
        var advance = function() {
            var start = cursor.from(),
                match;
            if (!(match = cursor.findNext())) {
                cursor = getSearchCursor(cm, query);
                if (!(match = cursor.findNext()) ||
                    (start && cursor.from().line == start.line && cursor.from().ch == start.ch)) return;
            }
            cm.setSelection(cursor.from(), cursor.to());
            cm.scrollIntoView({
                from: cursor.from(),
                to: cursor.to()
            });
            var doReplace = function(match) {
                cursor.replace(typeof query == "string" ? text :
                    text.replace(/\$(\d)/g, function(_, i) {
                        return match[i];
                    }));
            };
            doReplace(match);
        };
        advance();
    });
    $(document).bind('keydown', function(e) {
        //save
        if (e.ctrlKey && e.keyCode == 83 && !e.shiftKey || e.metaKey && e.keyCode == 83 && !e.shiftKey) {
            $('.save').click();
        }
        //save as
        if (e.ctrlKey && e.shiftKey && e.keyCode == 83 || e.metaKey && e.shiftKey && e.keyCode == 83) {
            $('.save-as').click();
        }
        //new tab
        if (e.ctrlKey && e.keyCode == 78 || e.metaKey && e.keyCode == 78) {
            e.preventDefault();
            newButton().click();
        }
        //open file(s)
        if (e.ctrlKey && e.keyCode == 79 || e.metaKey && e.keyCode == 79) {
            openButton().click();
        }
        //open prefs
        if (e.ctrlKey && e.keyCode == 80 || e.metaKey && e.keyCode == 80) {
            if (settings().is(':visible')) {
                closeSettings();
            } else {
                openSettings();
            }
        }
        //search
        if (e.ctrlKey && e.keyCode == 70 || e.metaKey && e.keyCode == 70) {
            if ($('.search-container').is(':visible') && window.getSelection() === '') {
                closeSearch();
            } else {
                openSearch();
            }
        }
        //close current tab
        if (e.ctrlKey && e.keyCode == 87 || e.metaKey && e.keyCode == 87) {
            e.preventDefault();
            $('.active .close').click();
        }
        //esc
        if (e.keyCode == 27) {
            if (chrome.app.window.current().isFullscreen()) {
                e.preventDefault();
                if ($('.search-container').is(':visible')) {
                    closeSearch();
                }
            } else {
                if ($('.search-container').is(':visible')) {
                    closeSearch();
                }
            }
        }
        //toggle sidebar
        if (e.ctrlKey && e.keyCode == 191) {
            e.preventDefault();
            if (sideBar().width() === 0) {
                calcWidth(250);
            } else {
                calcWidth(0);
            }
            resizeTabs();
        }
        //change font size
        //increase
        if (e.ctrlKey && e.keyCode == 187) {
            if (Number(codeMirror().css('font-size').replace('px', '')) == 36) {

            } else {
                $('.font-size').eq($('.font-size:contains(' + codeMirror().css('font-size') + ')').index() + 1).click();
            }
        }
        //decrease
        if (e.ctrlKey && e.keyCode == 189) {
            if (Number(codeMirror().css('font-size').replace('px', '')) == 12) {

            } else {
                $('.font-size').eq($('.font-size:contains(' + codeMirror().css('font-size') + ')').index() - 1).click();
            }
        }
        //toggle line-wrapping
        if (e.altKey && e.keyCode == 81) {
            if ($('.selector-wrap').clone().children().remove().end().text() == 'wrap') {
                $('.wrap:contains(none)').click();
            } else {
                $('.wrap:contains(wrap)').click();
            }
        }
    });
    //menu miscellaneous functionality
    function openOverflow() {
        var height = $('.menu').children().length * 60 + 'px';
        $('.menu').show().stop().animate({
            opacity: '1',
            height: height
        }, 200);
    }

    function closeOverflow() {
        $('.menu').stop().animate({
            opacity: '0',
            height: '0px'
        }, 200, function() {
            $(this).hide();
        });
    }
    $('.overflow-menu').click(function() {
        openOverflow();
    });
    $('.menu-li').click(function() {
        closeOverflow();
    });
    $(document).on('click', '.workspace, .tab, .tabs, .sidebar', function() {
        closeOverflow();
    });
    $(document).on('click', '.title', function(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if ($(this).attr('readonly') == 'readonly') {
            e.preventDefault();
            $(this).parent().click();
        }
        closeOverflow();
    });
    //menu functionality
    newButton().click(function() {
        newTab();
        var index = getActiveTab().index();
        editor[index] = CodeMirror.fromTextArea(document.getElementById('textarea' + Number(tabContainer().children().last().attr('id').replace('tab', ''))), config);
        if (prefs === undefined) {
            resetPrefs();
        }
        loadSettings(prefs);
        setTimeout(function() {
            editor[index].focus();
            autoSave(index);
        }, 1);
    });

    function createPathAttr(path) {
        getActiveTab().attr('path', path);
    }

    function openFiles(fileEntries, fromDir) {
        fileEntries.forEach(function(fileEntry) {
            fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var text = e.target.result;
                    newTab();
                    setTabName(fileEntry.name);
                    var path = cleanPath(fileEntry);
                    if (fromDir === false) {
                        createPathAttr(path);
                        createDataAttr(fileEntry.name);
                    } else {
                        createDataAttr(fileEntry.name + 'isOpen');
                        createPathAttr(path);
                    }
                    $('.active input').attr('readonly', true);
                    var newIndex = replaceTabID(getActiveTab());
                    var index = Number(newIndex);
                    var actIndex = getActiveTab().index();
                    setFileDir(actIndex, fileEntry);
                    setEditor(actIndex, CodeMirror.fromTextArea(document.getElementById('textarea' + index), config));
                    getEditor(actIndex).getDoc().setValue(text);
                    getEditor(actIndex).getDoc().clearHistory();
                    getEditor(actIndex).focus();
                    autoSave(actIndex);
                    changeMode();
                    if (prefs === undefined) {
                        resetPrefs();
                    }
                    loadSettings(prefs);
                };
                reader.readAsText(file);
            });
        });
    }
    openButton().click(function() {
        chrome.fileSystem.chooseEntry({
            acceptsMultiple: true
        }, function(fileEntries) {
            if (!fileEntries) {
                console.log('No Files Selected');
            }
            openFiles(fileEntries, false);
        });
    });

    sideBar().resizable({
        handles: 'e',
        maxWidth: 600,
        "resize": function(event, ui) {
            var width = ui.size.width;
            tabContainer().width($(window).width() - 70 - width);
            workSpace().width($(window).width() - width);
            $('.search-container').width($(window).width() - width);
            resizeTabs();
        }
    });

    function openProjectDialog() {
        $('.new-project-dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        bg().show().stop().animate({
            opacity: '0.6'
        }, 200);
    }

    function closeProjectDialog() {
        $('.new-project-dialogue').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        bg().stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    newProject().click(function() {
        openProjectDialog();
        resetInput('.new-project-input', '');
    });
    $('.new-project-cancel').click(function() {
        closeProjectDialog();
        focusEditor();
    });

    var projectDir;

    function setChosenDirInd(dirEntry) {
        if (!dirEntry.fullPath) {
            $('.chosenDir').text('No Directory Chosen');
            projectDir = null;
        } else {
            $('.chosenDir').text(dirEntry.fullPath);
            projectDir = dirEntry;
        }
    }
    projects().scroll(function() {
        contextMenuOff();
        folderContextOff();
    });
    $('.chooseDir').click(function() {
        chrome.fileSystem.chooseEntry({
            type: 'openDirectory'
        }, function(dirEntry) {
            if (!dirEntry) {
                var state = 'No Directory Chosen';
                setChosenDirInd(state);
            } else {
                setChosenDirInd(dirEntry);
                $('.new-project-input').focus();
            }
        });
    });
    $('.new-project-create').click(function() {
        var projectName = $(this).parent().parent().find('input').val();
        if (projectName === '') {
            projectName = 'untitled';
        }

        projectDir.getDirectory(projectName, {
            create: true,
            exclusive: true
        }, function(dirEntry) {
            rootDirs.push(chrome.fileSystem.retainEntry(dirEntry));
            directories.push({
                entry: dirEntry
            });
            var path = cleanPath(dirEntry),
                div = document.createElement('div'),
                thisName = dirEntry.name;
            thisName = replaceName(thisName);
            div.className = thisName + ' folder';
            div.setAttribute('path', path);
            div.innerHTML = '<div class="material-icons">keyboard_arrow_right</div><div class="material-icons">book</div>' + '<label class="folder-name">' + dirEntry.name + '</label>' + '<ul class="' + thisName + 'ul"></ul>';
            projects().append(div);
            projects().children().last().children().last().hide();
            closeProjectDialog();
            focusEditor();
        });
    });
    $('.dialog-input:not(.rename-file-input, .rename-folder-input)').keyup(function(e) {
        var folderName = $(this).val();
        if (folderName === '') {
            folderName = 'untitled';
        }
        var folderNames = [];
        if ($(this).hasClass('new-project-input')) {
            projects().children().each(function(index) {
                folderNames.push(getFolderName($(this)));
            });
            if (e.keyCode == 13) {
                $('.new-project-create').click();
            }
        } else {
            folderToRemove.children().last().children().each(function(index) {
                folderNames.push(getFolderName($(this)));
            });
        }
        if (folderNames.indexOf(folderName) > -1) {
            $(this).css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f ');
        } else {
            $(this).css('box-shadow', 'inset 0px -1px 0px 0px #47bfa1');
        }
    });

    function sortDirect() {
        $('.projects div').each(function() {
            if ($(this).hasClass('file')) {
                $(this).insertAfter($(this).parent().children().last());
            } else {}
        });
    }
    docFrag = document.createDocumentFragment();

    function replaceName(name) {
        name = btoa(unescape(encodeURIComponent(name)));

        return name.replace(/\./g, '')
            .replace(/ /g, '_')
            .replace(/["'()]/g, '_')
            .replace(/[^\w\s]/gi, '')
            .replace(/[\W\s]/gi, '')
            .replace(/0/g, 'a')
            .replace(/1/g, 'b')
            .replace(/2/g, 'c')
            .replace(/3/g, 'd')
            .replace(/4/g, 'e')
            .replace(/5/g, 'f')
            .replace(/6/g, 'g')
            .replace(/7/g, 'h')
            .replace(/9/g, 'i');
    }

    function splitAndReturn(string, token, numb) {
        string = string.split(token);
        if (numb === 0) {
            return string;
        } else {
            return string[string.length - numb];
        }
    }

    function isRoot(entryPath) {
        if (entryPath.split('/').length == 2) {
            return true;
        } else {
            return false;
        }
    }

    function displayDataDir(x) {
        var thisName = directories[x].entry.name;
        var path = directories[x].entry.fullPath;
        	path = cleanPath(directories[x].entry);
        var newPath = directories[x].entry.fullPath;
        	newPath = cleanPath(directories[x].entry);
        //what the fuck am I doing with my life.
        path = splitAndReturn(path, '/', 0);
        //adjust path for classes
        path.forEach(function(val, index, array) {
            path[index] = replaceName(val);
        });

        //adjust names for classes
        thisName = replaceName(thisName);

        var div = document.createElement('div');
        var material;
        div.className = thisName + ' folder';
        div.setAttribute('path', newPath);
        if (isRoot(newPath)) {
            material = '<div class="material-icons">book</div>';
        } else {
            material = '<div class="material-icons">folder</div>';
        }
        div.innerHTML = '<div class="material-icons">keyboard_arrow_right</div>' + material + '<label class="folder-name">' + directories[x].entry.name + '</label>' + '<ul style="display:none;" class="' + thisName + 'ul"></ul>';
        path.shift();
        path.forEach(function(value, index, array) {
            path[index] = value + ' > .' + value + 'ul' + '/';
        });
        path = '.' + path.join(' > .');
        path = path.split('/');
        path.pop();
        path.forEach(function(value, index, array) {
            if (array.length == 1) {
                docFrag.appendChild(div);
            } else {
                if (index === 0) {

                } else {
                    var newPath = array.slice(0);
                    var remaining = newPath.length - index;
                    newPath.splice(index, remaining);
                    newPath = newPath.join(' ');
                    if (docFrag.querySelector(newPath) === null) {} else {
                        docFrag.querySelector(newPath).appendChild(div);
                    }
                }
            }

        });
    }

    function displayDataFile(y) {
        var name = files[y].entry.name;
        var path = files[y].entry.fullPath;
        	path = cleanPath(files[y].entry);
        var newpath = files[y].entry.fullPath;
        	newpath = cleanPath(files[y].entry);

        path = splitAndReturn(path, '/', 0);
        //adjust path for classes
        path.forEach(function(val, index, array) {
            path[index] = replaceName(val);
        });

        //adjust for classes
        name = replaceName(name);

        //create div
        var div = document.createElement('div');
        var material = getMaterial(files[y].entry.name, true);
        div.className = name + ' file';
        div.setAttribute('path', newpath);
        div.innerHTML = material + '<label class="file-name">' + files[y].entry.name + '</label>';
        path.shift();
        path.forEach(function(value, index, array) {
            if (index === array.length - 1) {
                path[index] = value;
            } else {
                path[index] = value + ' > .' + value + 'ul';
            }
        });
        path.pop();
        path = '.' + path.join(' > .');
        docFrag.querySelector(path).appendChild(div);
    }

    function showPreLoad(text, callback, entry) {
        $('.loading-text').text('Loading ' + text);
        $('.preload').css('top', '100%');
        $('.preload').show().stop().animate({
            top: '0',
            opacity: '1'
        }, 500);

        if (callback) {
            callback(entry);
        }
    }

    function hidePreLoad() {
        $('.preload').stop().animate({
            opacity: '0',
            top: '100%'
        }, 600, function() {
            $(this).hide();
        });
    }

    function loadDirEntry(dirEntry) {
        var dirReader = dirEntry.createReader();
        var readEntries = function() {
            dirReader.readEntries(function(results) {
                for (var gg = 0; gg < results.length; gg++) {
                    var data = results[gg];
                    if (data.isDirectory) {
                        directories.push({
                            entry: data
                        });
                        displayDataDir(directories.length - 1);
                        loadDirEntry(data);
                    } else {
                        files.push({
                            entry: data
                        });
                        displayDataFile(files.length - 1);
                    }
                }
            });
        };
        readEntries();
    }

    function afterPreLoad(dirEntry) {
        docFrag.innerHTML = '';
        dirEntry.getMetadata(function(metadata) {
            var size = metadata.size,
                time = Math.ceil(size);
            if (Number.isFinite(time) === false) {
                time = 1000;
            }
            if (time > 20000) {
                time = 20000;
            }
            if (time < 5000) {
                time = 2500;
            }
            reloadDirEntries(dirEntry);
            setTimeout(function() {
                projects().append(docFrag.children);
                sortDirect();
                hidePreLoad();
            }, time);
        });
    }
    openDirButton().click(function() {
        chrome.fileSystem.chooseEntry({
            type: 'openDirectory'
        }, function(dirEntry) {
            if (!dirEntry) {
                console.log('No Directory Selected');
            } else {
                var isInRoot;
                if (rootDirs.length === 0) {
                    docFrag.innerHTML = '';
                    rootDirs.push(chrome.fileSystem.retainEntry(dirEntry));
                    showPreLoad(dirEntry.name, afterPreLoad, dirEntry);
                } else {
                    for (var i = 0; i < rootDirs.length; i++) {
                        chrome.fileSystem.restoreEntry(rootDirs[i], function(entry) {
                            if (entry.fullPath == dirEntry.fullPath) {
                                isInRoot = true;
                            }
                        });
                        if (i === rootDirs.length - 1) {
                            if (isInRoot === true) {

                            } else {
                                rootDirs.push(chrome.fileSystem.retainEntry(dirEntry));
                                showPreLoad(dirEntry.name);
                                docFrag.innerHTML = '';
                                dirEntry.getMetadata(function(metadata) {
                                    var size = metadata.size,
                                        time = Math.ceil(size);
                                    if (Number.isFinite(time) === false) {
                                        time = 1000;
                                    }
                                    if (time > 20000) {
                                        time = 20000;
                                    }
                                    if (time < 5000) {
                                        time = 2500;
                                    }
                                    reloadDirEntries(dirEntry);
                                    setTimeout(function() {
                                        projects().append(docFrag.children);
                                        sortDirect();
                                        hidePreLoad();
                                    }, time);
                                });
                            }
                        }
                    }
                }
            }
        });
    });

    function setMaterialPadding(parent) {
        var thisMaterial = getMatIcons(parent).first();
        var multiplier = parent.parentsUntil('.projects').length;
        var padding;
        //double for files
        if (parent.hasClass('file')) {
            padding = (20 * (multiplier / 2)) + 43 + 'px';
        } else {
            padding = (20 * (multiplier / 2)) + 20 + 'px';
        }
        thisMaterial.css('padding-left', padding);
    }
    $(document).on('click', '.projects .folder', function(e) {
        e.stopPropagation();
        selectThis($(this));
        if ($(this).children('ul').is(':visible')) {
            $(this).children('ul').hide();
            $(this).children('.material-icons').first().text('keyboard_arrow_right');

        } else {
            $(this).children('ul').children().each(function(index) {
                setMaterialPadding($(this));
            });
            $(this).children('ul').show();
            $(this).children('.material-icons').first().text('keyboard_arrow_down');
        }

        folderToRemove = $(this);
    });
    $(document).on('click', '.projects ul', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    function getEntry(name, path, file, dir, onlyParent, fileDir) {
        var entry;
        var getMatchingEntry = function(obj) {
            var objPath = cleanPath(obj.entry);
            if (obj.entry.name == name && path == objPath) {
                return obj;
            }
        };

        var getMatchingDirEntry = function(obj) {
            var objPath = cleanPath(obj);
            if (obj.name == name && path == objPath) {
                return obj;
            }
        };

        if (file) {
            entry = files.find(getMatchingEntry);
        }

        if (dir) {
            entry = directories.find(getMatchingEntry);
        }

        if (fileDir) {
            entry = fileDirs.find(getMatchingDirEntry);
        }

        if (onlyParent) {
            return entry;
        } else {
            return entry.entry;
        }
    }
    var projectFileEntry;
    $(document).on('click', '.projects .file', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (e.handled !== true) {
            e.handled = true;
            selectThis($(this));
            var temp = [];
            var thisName = getFileName($(this)),
                thisPath = $(this).attr('path'),
                projectFileEntry = getEntry(thisName, thisPath, true, false);

            var index = checkTabs(thisName, thisPath);
            if (isInteger(index)) {
                tab(index).click();
            } else {
                temp.push(projectFileEntry);
                openFiles(temp, true);
            }
            fileToRemove = $(this);
        }
        contextMenuOff();
    });
    //context menu
    function contextMenuOn(event) {
        var top = event.pageY,
            left = event.pageX;
        var fileHeight = $('.contextmenu').height();
        if (top + fileHeight > $(window).height()) {
            top = top - fileHeight;
        }
        $('.contextmenu').css({
            top: top - 20 + 'px',
            left: left - 20 + 'px'
        }).show().stop().animate({
            top: top + 'px',
            opacity: '1'
        }, 200);
    }

    function contextMenuOff() {
        $('.contextmenu').stop().animate({
            top: Number($('.contextmenu').css('top').replace('px', '')) - 20 + 'px',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    function folderContext(event) {
        var top = event.pageY,
            left = event.pageX;
        var folderHeight = $('.folder-contextmenu').height();
        if (top + folderHeight > $(window).height()) {
            top = top - folderHeight;
        }
        $('.folder-contextmenu').css({
            top: top - 20 + 'px',
            left: left - 20 + 'px'
        }).show().stop().animate({
            top: top + 'px',
            opacity: '1'
        }, 200);
    }

    function folderContextOff() {
        $('.folder-contextmenu').stop().animate({
            top: Number($('.folder-contextmenu').css('top').replace('px', '')) - 20 + 'px',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    var contextMenuName,
        contextMenuPath,
        fileToRemove,
        removeTitle,
        folderContextMenuName,
        folderContextMenuPath,
        folderToRemove,
        folderRemoveTitle;

    function openDialog(dialog, dialogText, text) {
        if (text && dialogText) {
            $(dialogText).text(text);
        }
        $(dialog).show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        bg().show().stop().animate({
            opacity: '0.6'
        }, 200);
    }

    function closeDialog(dialog) {
        $(dialog).stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        bg().stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    function resetInput(input, value) {
        $(input).css('box-shadow', 'inset 0px -1px 0px 0px #47bfa1');
        $(input).val(value);
        if (value !== '') {
            $(input).select();
        } else {
            $(input).focus();
        }
    }

    function getMaterial(name, html) {
        var videos = ['.mp4', '.flv', '.wmv', '.avi', '.3gp', '.m4v', '.vob', '.webm', '.qtff', '.avchd', '.mov', '.qt', '.swf', '.mkv'];
        var images = ['.png', '.jpg', '.jpeg', '.tiff', '.gif', '.exiff'];
        var sound = ['.wav', '.mp3', '.aiff', '.wma', '.m3u', '.au', '.ogg'];
        var fonts = ['.woff', '.ttf', '.woff2', '.eot', '.otf', '.svg'];
        var code = ['.asp', '.aspx', '.axd', '.asx', '.asmx', '.ashx', '.css', '.cfm', '.yaws', '.swf', '.jsp', '.jspx', '.wss', '.do', '.action', '.js', '.json', '.pl', '.php', '.php4', '.php3', '.phtml', '.py', '.rb', '.rhtml', '.shtml', '.xml', '.rss', '.svg', '.cgi', '.dll'];
        var other = ['.md', '.html', '.htm', '.xhtml', '.jhtml'];
        var material;

        var extension = splitAndReturn(name, '.', 1);
        extension = '.' + extension.toLowerCase();

        if (html === true) {
            if (images.indexOf(extension) > -1) {
                material = '<div class="material-icons">photo</div>';
            } else if (sound.indexOf(extension) > -1) {
                material = '<div class="material-icons">volume_up</div>';
            } else if (fonts.indexOf(extension) > -1) {
                material = '<div class="material-icons">text_format</div>';
            } else if (videos.indexOf(extension) > -1) {
                material = '<div class="material-icons">movie</div>';
            } else if (code.indexOf(extension) > -1) {
                material = '<div class="material-icons">code</div>';
            } else if (other.indexOf(extension) > -1) {
                material = '<div class="material-icons">description</div>';
            } else {
                material = '<div class="material-icons">insert_drive_file</div>';
            }
        } else {
            if (images.indexOf(extension) > -1) {
                material = 'photo';
            } else if (sound.indexOf(extension) > -1) {
                material = 'volume_up';
            } else if (fonts.indexOf(extension) > -1) {
                material = 'text_format';
            } else if (videos.indexOf(extension) > -1) {
                material = 'movie';
            } else if (code.indexOf(extension) > -1) {
                material = 'code';
            } else if (other.indexOf(extension) > -1) {
                material = 'description';
            } else {
                material = 'insert_drive_file';
            }
        }

        return material;
    }
    $(document).on('contextmenu', '.projects .file', function(e) {
        e.stopPropagation();
        e.preventDefault();
        removeTitle = getFileName($(this));
        contextMenuName = removeTitle;
        contextMenuPath = $(this).attr('path');
        fileToRemove = $(this);
        selectThis($(this));
        contextMenuOn(e);
    });
    $('.folder-contextmenu .folder-rename').click(function() {
        openDialog('.rename-folder-dialogue');
        contextMenuOff();
        resetInput('.rename-folder-input', folderContextMenuName);
    });
    $('.rename-folder-cancel').click(function() {
        closeDialog('.rename-folder-dialogue');
        focusEditor();
    });

    function getPathUntil(path, token) {
        return path.substring(path.lastIndexOf(token), 0);
    }

    function removeChildDirectories(directory) {
        var directoryFolders = jQuery.grep(directories, function(elem) {
            var thisPath = getPathUntil(elem.entry.fullPath, directory.name);
            var thatPath = getPathUntil(directory.fullPath, directory.name);
            return (thisPath == thatPath);
        });
        var directoryFiles = jQuery.grep(files, function(elem) {
            var thisPath = getPathUntil(elem.entry.fullPath, directory.name + '/');
            var thatPath = getPathUntil(directory.fullPath, directory.name);
            return (thisPath == thatPath);
        });
        console.log(directoryFiles);
        if (directoryFolders.length !== 0) {
            for (var j = 0; j < directoryFolders.length; j++) {
                directories.splice(directories.lastIndexOf(directoryFolders[j]), 1);
            }
        }
        if (directoryFiles.length !== 0) {
            for (var g = 0; g < directoryFiles.length; g++) {
                files.splice(files.lastIndexOf(directoryFiles[g]), 1);
            }
        }
    }

    function reloadLoadedEntries(directory, callback) {
        var dirReader = directory.createReader();
        var readEntries = function() {
            dirReader.readEntries(function(results) {
                if (!results.length) {
                    callback();
                }
                for (var i = 0; i < results.length; i++) {
                    var data = results[i];
                    if (data.isDirectory) {
                        directories.push({
                            entry: data
                        });
                        reloadLoadedEntries(data, callback);
                    } else {
                        files.push({
                            entry: data
                        });
                    }
                }
                readEntries();
            });
        };
        readEntries();
    }

    function assignEntries(folder, oldName, newName) {
        $(folder).children().each(function() {
            var child = $(this);
            var path = child.attr('path');
            var newPath = path.replace('/' + oldName + '/', '/' + newName + '/');
            child.attr('path', newPath);
            if (child.hasClass('file')) {
                var fileName = getFileName(child);
                var index = checkTabs(fileName, path);
                if (isInteger(index)) {
                    tab(index).attr('path', newPath);
                    var tabPath = tab(index).attr('path'),
                        entry = getEntry(fileName, newPath, true, false);
                    setFileDir(index, entry);
                }
            }
        });
    }

    $('.rename-folder-create').click(function() {
        var newFolderName = $('.rename-folder-input').val();
        if (newFolderName === '') {
            newFolderName = folderContextMenuName;
        }
        var folderNames = [];
        folderToRemove.parent().children().each(function(index) {
            var text = getFolderName($(this));
            if (text == folderContextMenuName) {

            } else {
                folderNames.push(text);
            }
        });
        if (folderNames.indexOf(newFolderName) > -1) {
            $('.rename-folder-input').css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f');
            $('.rename-folder-input').focus();
        } else {
            var getIndex = function(element) {
                var path = cleanPath(element.entry);
                return (element.entry.name == folderContextMenuName && path == folderContextMenuPath);
            };
            var directory = getEntry(folderContextMenuName, folderContextMenuPath, false, true),
                directoryIndex = directories.findIndex(getIndex);
            directory.getParent(function(parentEntry) {
                directory.moveTo(parentEntry, newFolderName, function(newFolderEntry) {
                    var nameForClass = newFolderEntry.name;
                    nameForClass = replaceName(nameForClass);
                    var path = cleanPath(newFolderEntry);
                    resetFolders();
                    folderToRemove.attr('class', nameForClass + ' folder active-folder');
                    folderToRemove.attr('path', path);
                    folderToRemove.children().last().attr('class', nameForClass + 'ul');
                    setFolderName(folderToRemove, newFolderName);
                    removeChildDirectories(directory);
                    reloadLoadedEntries(newFolderEntry, function() {
                        assignEntries('.' + nameForClass + 'ul', directory.name, newFolderEntry.name);
                    });
                    directories[directoryIndex] = {
                        entry: newFolderEntry
                    };
                    closeDialog('.rename-folder-dialogue');
                    focusEditor();
                });
            });
        }
    });
    $('.contextmenu .rename').click(function() {
        openDialog('.rename-file-dialogue');
        contextMenuOff();
        resetInput('.rename-file-input', contextMenuName);
    });

    function rename(cwd, src, newName, oldFileEntry, fileToRemove, isTab, index) {
        cwd.getFile(src, {}, function(fileEntry) {
            fileEntry.moveTo(cwd, newName, function(newFileEntry) {
                var nameForClass = replaceName(newFileEntry.name);
                var material = getMaterial(newFileEntry.name, false);
                var path = cleanPath(newFileEntry);
                if (fileToRemove.hasClass('active-file')) {
                    fileToRemove.attr('class', nameForClass + ' file active-file');
                } else {
                    fileToRemove.attr('class', nameForClass + ' file');
                }
                fileToRemove.attr('path', path);
                getMatIcons(fileToRemove).text(material);
                setFileName(fileToRemove, newFileEntry.name);
                oldFileEntry.entry = newFileEntry;
                if (isTab && index) {
                    changeTab(index, newName, path);
                    setFileDir(index, newFileEntry);
                    changeMode();
                }
            }, function(e) {
                console.log(e);
            });
        }, function(e) {
            console.log(e);
        });
    }

    function changeTab(index, name, path) {
        tab(index).find('.title').val(name);
        tab(index).attr('path', path);
        tab(index).attr('data', name + 'isOpen');
    }
    $('.rename-file-create').click(function() {
        var newName = $(this).parent().parent().find('input').val(),
            oldName = getEntry(contextMenuName, contextMenuPath, true, false);
        oldName = oldName.name;
        if (newName === '') {
            newName = oldName;
        }
        var fileNames = [];
        fileToRemove.parent().children().each(function(index) {
            var text = getFileName($(this));
            if (text == oldName) {

            } else {
                fileNames.push(text);
            }
        });
        if (fileNames.indexOf(newName) > -1) {
            $(this).parent().parent().find('input').css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f ');
            $('.rename-file-input').focus();
        } else {
            var parentName = splitAndReturn(contextMenuPath, '/', 2),
                parentPath = contextMenuPath.split('/');
            parentPath.splice(parentPath.length - 1, 1);
            parentPath = parentPath.join('/');

            var projectDirEntry = getEntry(parentName, parentPath, false, true),
                projectFileEntry = getEntry(contextMenuName, contextMenuPath, true, false, true);
            var index = checkTabs(contextMenuName, projectFileEntry.entry.fullPath);
            if (isInteger(index)) {
                rename(projectDirEntry, projectFileEntry.entry.name, newName, projectFileEntry, fileToRemove, true, index);
            } else {
                rename(projectDirEntry, projectFileEntry.entry.name, newName, projectFileEntry, fileToRemove, false);
            }
            closeDialog('.rename-file-dialogue');
            focusEditor();
        }
    });
    $('.rename-file-cancel').click(function() {
        closeDialog('.rename-file-dialogue');
        focusEditor();
    });
    $('.contextmenu .remove').click(function() {
        var text = 'Are you sure you want to remove ' + removeTitle + '? This action cannot be undone.';
        openDialog('.remove-dialogue', '.remove-dialogue-text', text);
        contextMenuOff();
    });
    $(document).on('contextmenu', '.projects .folder', function(e) {
        e.stopPropagation();
        e.preventDefault();
        folderRemoveTitle = getFolderName($(this));
        folderContextMenuName = folderRemoveTitle;
        folderContextMenuPath = $(this).attr('path');
        folderToRemove = $(this);
        folderContext(e);

        selectThis($(this));
        var projectChildren = projects().children();
        var path = [];
        projectChildren.each(function() {
            path.push($(this).attr('path'));
        });
        if (path.indexOf(folderContextMenuPath) > -1) {
            $('.folder-contextmenu .folder-rename').hide();
            $('.folder-contextmenu .folder-removefromproject').show();

        } else {
            $('.folder-contextmenu .folder-rename').show();
            $('.folder-contextmenu .folder-removefromproject').hide();
        }
    });
    $(document).on('keyup', '.new-folder-dialogue input', function(e) {
        e.stopPropagation();
        if (e.keyCode == 13) {
            $('.new-folder-create').click();
        }
    });
    $(document).on('keyup', '.new-file-dialogue input', function(e) {
        e.stopPropagation();
        if (e.keyCode == 13) {
            $('.new-file-create').click();
        }
    });
    $(document).on('keyup', '.rename-file-input', function(e) {
        e.stopPropagation();
        var newName = $(this).val();
        var oldName = getEntry(contextMenuName, contextMenuPath, true, false).name;
        if (newName === '') {
            newName = oldName;
        }
        var fileNames = [];
        fileToRemove.parent().children().each(function(index) {
            var text = getFileName($(this));
            if (text == oldName) {

            } else {
                fileNames.push(text);
            }
        });
        if (fileNames.indexOf(newName) > -1) {
            $(this).css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f ');
        } else {
            $(this).css('box-shadow', 'inset 0px -1px 0px 0px #47bfa1');

        }
        if (e.keyCode == 13) {
            $('.rename-file-create').click();
        }
    });
    $(document).on('keyup', '.rename-folder-input', function(e) {
        e.stopPropagation();
        var newName = $(this).val(),
            oldName = getEntry(folderContextMenuName, folderContextMenuPath, false, true).name;
        if (newName === '') {
            newName = oldName || 'untitled';
        }
        var folderNames = [];
        folderToRemove.parent().children().each(function(index) {
            var text = getFolderName($(this));
            if (text == oldName) {

            } else {
                folderNames.push(text);
            }
        });
        if (folderNames.indexOf(newName) > -1) {
            $(this).css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f ');
        } else {
            $(this).css('box-shadow', 'inset 0px -1px 0px 0px #47bfa1');

        }
        if (e.keyCode == 13) {
            $('.rename-folder-create').click();
        }
    });
    $('.folder-contextmenu .folder-removefromproject').click(function() {
        var dirEntry = getEntry(folderContextMenuName, folderContextMenuPath, false, true);
        removeChildDirectories(dirEntry);
        var isTrue;
        for (var i = 0; i < rootDirs.length; i++) {
            chrome.fileSystem.restoreEntry(rootDirs[i], function(entry) {
                if (entry.fullPath == dirEntry.fullPath) {
                    rootDirs.splice(i, 1);
                    isTrue = true;
                }
            });
        }
        if (isTrue) {
            folderToRemove.velocity('slideUp', {
                duration: 200,
                complete: function() {
                    $(this).remove();
                }
            });
            focusEditor();
        }
    });
    $('.folder-contextmenu .folder-addfolder').click(function() {
        openDialog('.new-folder-dialogue');
        folderContextOff();
        resetInput('.new-folder-input', '');
    });
    $('.new-folder-create').click(function() {
        var folderName = $(this).parent().parent().find('input').val();
        if (folderName === '') {
            folderName = 'untitled';
        }
        var folderNames = [];
        folderToRemove.children().last().children().each(function(index) {
            folderNames.push(getFolderName($(this)));
        });
        if (folderNames.indexOf(folderName) > -1) {
            $('.new-folder-input').css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f ');
            $('.new-folder-input').focus();
        } else {
            var dirEntry = getEntry(folderContextMenuName, folderContextMenuPath, false, true);
            dirEntry.getDirectory(folderName, {
                create: true,
                exclusive: true
            }, function(dirEntry) {
                directories.push({
                    entry: dirEntry
                });
                var thisName = dirEntry.name;
                thisName = replaceName(thisName);
                var div = document.createElement('div');
                var path = cleanPath(dirEntry);
                div.className = thisName + ' folder active-folder';
                div.setAttribute('path', path);
                div.innerHTML = '<div class="material-icons">keyboard_arrow_right</div><div class="material-icons">folder</div>' + '<label class="folder-name">' + dirEntry.name + '</label>' + '<ul class="' + thisName + 'ul"></ul>';
                if (getMatIcons(folderToRemove).first().text() == 'keyboard_arrow_right') {
                    folderToRemove.click();
                }
                resetFolders();
                folderToRemove.children().last().append(div);
                folderToRemove.children().last().children().last().children().last().hide();
                folderToRemove.children().last().children().last().insertBefore(folderToRemove.children().last().children().first());
                setMaterialPadding(folderToRemove.children().last().children().first());
                closeDialog('.new-folder-dialogue');
            });
        }
    });
    $('.new-folder-cancel').click(function() {
        closeDialog('.new-folder-dialogue');
        focusEditor();
    });
    $('.folder-contextmenu .folder-remove').click(function() {
        var text = 'Are you sure you want to remove ' + folderRemoveTitle + '? This will PERMANENTLY delete this folder from your computer.';
        openDialog('.folder-remove-dialogue', '.folder-remove-dialogue-text', text);
        folderContextOff();
    });
    $('.folder-remove-yes').click(function() {
        var entryToRemove = getEntry(folderRemoveTitle, folderContextMenuPath, false, true);
        entryToRemove.removeRecursively(function() {
            tab().each(function(index) {
                if ($(this).attr('path') === undefined) {

                } else {
                    var path = cleanPath(entryToRemove.fullPath);
                    if ($(this).attr('path').indexOf(path) > -1) {
                        closeTab($(this).find('.close'), true);
                    }
                }
            });
            if (getActiveTab().length == 1) {

            } else {
                tab(Math.round(Math.random() * (tab().length - 1))).click();
            }
            for (var i = 0; i < rootDirs.length; i++) {
                chrome.fileSystem.restoreEntry(rootDirs[i], function(entry) {
                    if (entryToRemove.fullPath == entry.fullPath) {
                        rootDirs.splice(i, 1); //remove from rootDirs
                    }
                });
            }
            if ($('.tab').length === 0) {
                newButton().click();
            }
            resizeTabs();
            folderToRemove.remove();
            closeDialog('.folder-remove-dialogue');
            focusEditor();
        });
    });
    $('.folder-remove-no').click(function() {
        closeDialog('.folder-remove-dialogue');
        focusEditor();
    });
    $('.folder-addfile').click(function() {
        openDialog('.new-file-dialogue');
        contextMenuOff();
        resetInput('.new-file-input', '');
    });
    $('.new-file-cancel').click(function() {
        closeDialog('.new-file-dialogue');
        focusEditor();
    });
    $('.new-file-create').click(function() {
        var fileName = $(this).parent().parent().find('input').val();
        if (fileName === '') {
            fileName = 'untitled.txt';
        }
        var fileNames = [];
        folderToRemove.children().last().children().each(function(index) {
            fileNames.push(getFileName($(this)));
        });
        if (fileNames.indexOf(fileName) > -1) {
            $('.new-file-input').css('box-shadow', 'inset 0px -1px 0px 0px #d61f1f');
            $('.new-file-input').focus();
        } else {
            console.log(folderContextMenuName, folderContextMenuPath);
            console.log(directories);

            var dirEntry = getEntry(folderContextMenuName, folderContextMenuPath, false, true);
            dirEntry.getFile(fileName, {
                create: true,
                exclusive: true
            }, function(fileEntry) {
                var temp = [];
                temp.push(fileEntry);
                openFiles(temp, true);
                files.push({
                    entry: fileEntry
                });
                var name = fileEntry.name;
                name = replaceName(name);
                savedFileEntry = fileEntry;
                //create div
                var div = document.createElement('div');
                var material = getMaterial(fileEntry.name, true);
                var path = cleanPath(fileEntry);
                div.className = name + ' file active-file';
                div.setAttribute('path', path);
                div.innerHTML = material + '<label class="file-name">' + fileEntry.name + '</label>';
                if (getMatIcons(folderToRemove).first().text() == 'keyboard_arrow_right') {
                    folderToRemove.click();
                }
                resetFolders();
                folderToRemove.children().last().append(div);
                setMaterialPadding(folderToRemove.children().last().children().last());
                closeDialog('.new-file-dialogue');
            });
        }
    });

    function checkTabs(name, path) {
        path = cleanPath(path);
        for (var u = 0; u < tab().length; u++) {
            var newPath = tab(u).attr('path'),
                tabName = tab(u).find('input').val();
            if (newPath == path && tabName == name) {
                return u;
            }
        }
    }

    //remove
    $('.remove-buttons .remove-yes').click(function() {
        projectFileEntry = getEntry(contextMenuName, contextMenuPath, true, false);
        var index = checkTabs(contextMenuName, projectFileEntry.fullPath);
        if (isInteger(index)) {
            closeTab(tab(index).find('.close'));
            projectFileEntry.remove(function() {
                fileToRemove.remove();
                closeDialog('.remove-dialogue');
                focusEditor();
            });
        } else {
            projectFileEntry.remove(function() {
                fileToRemove.remove();
                closeDialog('.remove-dialogue');
                focusEditor();
            });
        }
    });
    $('.remove-buttons .remove-no').click(function() {
        closeDialog('.remove-dialogue');
        focusEditor();
    });

    $(document).on('mousedown', function(e) {
        var target = e.target;
        if (!$(target).parents().is('.contextmenu') || !$(target).parents().is('.folder-contextmenu')) {
            contextMenuOff();
            folderContextOff();
            clearTimeout(tooltipTimer);
            $('.tooltip').animate({
                top: Number($('.tooltip').css('top').replace('px', '')) - 25,
                opacity: '0'
            }, 200, function() {
                $(this).hide();
            });
        }
    });

    function setTabName(name) {
        $('.active .title').val(name);
    }

    function getTabName() {
        return $('.active .title').val();
    }

    function createDataAttr(name) {
        getActiveTab().attr('data', name);
    }

    function exportToFileEntry(fileEntry) {
        if (!fileEntry) {
            console.log('User cancelled saving.');
        } else {
            chrome.fileSystem.getWritableEntry(fileEntry, function(writableFileEntry) {
                writableFileEntry.createWriter(function(fileWriter) {
                    var contents = getEditor().getDoc().getValue();
                    var blob = new Blob([contents]);
                    var truncated = false;
                    fileWriter.onwriteend = function(e) {
                        if (!truncated) {
                            truncated = true;
                            // You need to explicitly set the file size to truncate
                            // any content that might have been there before
                            this.truncate(blob.size);
                            return;
                        }
                    };
                    fileWriter.write(blob);

                    var fileName = writableFileEntry.name;
                    setTabName(fileName);
                    $('.active input').attr('readonly', true);
                    setFileDir(getActiveTab().index(), writableFileEntry);
                    if (getActiveTab().attr('data') === undefined || getActiveTab().attr('data') === false || getActiveTab().attr('data') === '') {
                        createDataAttr(fileName);
                    } else {}
                    $('.active .close').text('close');
                    $('.active .close').removeClass('edit');
                    getActiveTab().click();
                    if (yesClicked === true) {
                        closeTab(closedTab);
                        yesClicked = false;
                    }
                });
            });
        }
    }

    function ExportToDisk() {
        var name = getTabName();
        chrome.fileSystem.chooseEntry({
            type: 'saveFile',
            suggestedName: name,
            acceptsAllTypes: true
        }, exportToFileEntry);
    }
    $('.save').click(function() {
        savedFileEntry = getFileDir(getActiveTab().index());
        if (savedFileEntry) {
            exportToFileEntry(savedFileEntry);
        } else {
            var name = getTabName();
            chrome.fileSystem.chooseEntry({
                type: 'saveFile',
                suggestedName: name,
                acceptsAllTypes: true
            }, exportToFileEntry);
        }
    });
    $('.save-as').click(function() {
        ExportToDisk();
    });

    $('.tidy-up').click(function() {
        var text = getEditor().getValue();
        var beautified;
        if ($('.active .title').val().indexOf('.html') > -1) {
            beautified = html_beautify(text, {
                indent_size: config.tabSize
            });
        } else if ($('.active .title').val().indexOf('.css') > -1) {
            beautified = css_beautify(text, {
                indent_size: config.tabSize
            });
        } else if ($('.active .title').val().indexOf('.js') > -1) {
            beautified = js_beautify(text, {
                indent_size: config.tabSize
            });
        } else {
            beautified = js_beautify(text, {
                indent_size: config.tabSize
            });
        }
        getEditor().setValue(beautified);
    });
    //drag and drop
    var dnd = new DnDFileController('body', function(data) {
        var temp = [];
        for (var r = 0; r < data.items.length; r++) {
            temp.push(data.items[r].webkitGetAsEntry());
            if (r === data.items.length - 1) {
                openFiles(temp, false);
            }
        }
    });

    //change modes automatically
    //based on file name
    function changeMode() {
        var val = getTabName(),
            m, mode, spec;
        if (m = /.+\.([^.]+)$/.exec(val)) {
            var info = CodeMirror.findModeByExtension(m[1]);
            if (info) {
                mode = info.mode;
                spec = info.mime;
            }
        } else if (/\//.test(val)) {
            var info = CodeMirror.findModeByMIME(val);
            if (info) {
                mode = info.mode;
                spec = val;
            }
        } else {
            mode = spec = val;
        }
        if (mode) {
            getEditor().setOption('mode', spec);
            CodeMirror.autoLoadMode(getEditor(), mode);
        } else {}
    }

    function resizeTabs() {
        var tabConWidth = tabContainer().width(),
            amountOfTabs = tab().length,
            tabWidth = tabConWidth / amountOfTabs;
        if (tabWidth > 200) {
            tabWidth = 200;
        }
        tab().css({
            width: tabWidth + 'px'
        });
    }
    $(window).resize(function() {
        var width = sideBar().width();
        calcWidth(width);
        resizeTabs();

        //fullscreen
        if (chrome.app.window.current().isFullscreen()) {
            setFullscreen();
        } else {
            undoFullscreen();
        }
    });

    function setFullscreen() {
        $('.windowBar').stop().animate({
            marginTop: '-30px'
        }, 200, function() {
            $(this).hide();
        });
        $('.tabs, .sidebar, .overflow-menu').css({
            marginTop: '0'
        });
        $('.menu').css('margin-top', '15px');
        sideBar().css('height', '100%');
        if ($('.search-container').is(':visible')) {
            workSpace().css('height', 'calc(100% - 150px)');
        } else {
            workSpace().css('height', 'calc(100% - 50px)');
        }
        workSpace().css('margin-top', '50px');
    }

    function undoFullscreen() {
        $('.windowBar').show().stop().animate({
            marginTop: '0px'
        }, 200);
        $('.tabs, .sidebar, .overflow-menu').css({
            marginTop: '30px'
        });
        $('.menu').css('margin-top', '45px');
        sideBar().css('height', 'calc(100% - 30px)');
        if ($('.search-container').is(':visible')) {
            workSpace().css('height', 'calc(100% - 180px)');
        } else {
            workSpace().css('height', 'calc(100% - 80px)');
        }
        workSpace().css('margin-top', '80px');
    }
    $('.started-button').click(function() {
        $('.getting-started').stop().animate({
            top: '-100%',
            opacity: '0'
        }, 400, function() {
            $(this).remove();
        });
        installed = true;
        saveData();
        focusEditor();
    });

    function loadGettingStarted() {
        $('.started-button').stop().animate({
            top: '50%',
            opacity: '1'
        }, 400);
    }
    //save & load data or 'remember' tabs and settings
    function setData(textArray, tabArray, editArray, installed, activeIndex, sideWidth, projectSize, projectAmount) {
        setStorage({
            data: textArray,
            tabs: tabArray,
            state: editArray,
            inst: installed,
            actv: activeIndex,
            sideBarWidth: sideWidth,
            projectsize: projectSize,
            projectamount: projectAmount
        });
        var key = [];
        fileDirs.forEach(function(element, index) {
            if (element === '' || element === undefined) {} else {
                var entry = chrome.fileSystem.retainEntry(element);
                key.push({
                    index: index,
                    entry: entry
                });
            }
        });
        var newProjectDir;
        if (projectDir === undefined || projectDir === null) {
            newProjectDir = '';
        } else {
            newProjectDir = chrome.fileSystem.retainEntry(projectDir);
        }
        setStorage({
            chosenFiles: key,
            chosenDirs: rootDirs,
            chosenDir: newProjectDir
        });
    }

    function saveData(callback) {
        if (!sorting) {
            tabArray = [];
            textArray = [];
            editArray = [];
            for (var i = 0; i < tab().length; i++) {
                var index = i;
                var text = getEditor(index).getValue();
                var state = getMatIcons(tab(index)).text();
                var projectAmount = rootDirs.length;
                var remaining = index;
                textArray[index] = text;
                tabArray[index] = {
                    name: tab(index).find('.title').val(),
                    path: tab(index).attr('path'),
                    dataAttr: tab(index).attr('data'),
                    isReadOnly: tab(index).find('input').attr('readonly')
                };
                editArray[index] = state;
                var activeIndex = getActiveTab().index(),
                    sideWidth = sideBar().width();
                if (remaining === tab().length - 1) {
                    var projectSize = 0;
                    if (rootDirs.length === 0) {
                        setData(textArray, tabArray, editArray, installed, activeIndex, sideWidth, projectSize, projectAmount);
                    } else {
                        for (var g = 0; g < rootDirs.length; g++) {
                            chrome.fileSystem.restoreEntry(rootDirs[g], function(entry) {
                                entry.getMetadata(function(metadata) {
                                    projectSize += Math.ceil(metadata.size);
                                    setData(textArray, tabArray, editArray, installed, activeIndex, sideWidth, projectSize, projectAmount);
                                });
                            });
                        }
                    }
                }
            }
            if (!callback) {} else {
                callback();
            }
        }
    }

    function calcWidth(sideBarWidth) {
        sideBar().width(sideBarWidth);
        tabContainer().width($(window).width() - 70 - sideBarWidth);
        workSpace().width($(window).width() - sideBarWidth);
        $('.search-container').width($(window).width() - sideBarWidth);
    }

    function resetPrefs() {
        prefs = {
            theme: 'material',
            font: 'monospace',
            fontSize: '16px',
            tabSize: 4,
            softWrap: true,
            library: 'jquery.min.js',
            lint: false,
            styleActiveLine: false
        };
    }

    function loadData(launchData) {
        getStorage({
            data: 'textArray',
            tabs: 'tabArray',
            state: 'editArray',
            inst: 'installed',
            actv: 'activeIndex',
            sideBarWidth: 'sideWidth',
            projectsize: 'projectSize',
            projectamount: 'projectAmount'
        }, function(item) {
            var data = item.data,
                tabs = item.tabs,
                state = item.state,
                inst = item.inst,
                actv = item.actv,
                sideBarWidth = item.sideBarWidth,
                projectsize = item.projectsize,
                projectamount = item.projectamount,
                dataSize = (JSON.stringify(data).length * 8) / 10000,
                time;
            if (projectamount === 0) {
                time = Math.ceil(dataSize);
            } else {
                time = (Math.ceil(projectsize + dataSize) / projectamount * projectamount) / 5;
            }
            if (Number.isFinite(time) === false) {
                time = 1000;
            }
            if (time > 15000) {
                time = 15000;
            }
            if (time < 5000) {
                time = 2000;
            }
            if (data == 'textArray' || tabs == 'tabArray' || state == 'editArray' || actv == 'activeIndex' || inst == 'installed' || sideBarWidth == 'sideWidth' || projectsize == 'projectSize' || projectamount == 'projectAmount') {
                resetPrefs();
                loadAutoTab();
                loadSettings(prefs);
                calcWidth(250);
                setTimeout(function() {
                    openLaunchData();
                    resizeTabs();
                    preLoad();
                    setTimeout(function() {
                        loadGettingStarted();
                    }, 200);
                }, 1000);
            } else {
                if (inst === true) {
                    $('.getting-started').remove();
                }
                for (var a = 0; a < data.length; a++) {
                    newTab();
                    setEditor(a, CodeMirror.fromTextArea(document.getElementById('textarea' + Number(replaceTabID(tabContainer().children().last()))), config));
                    getEditor(a).getDoc().setValue(data[a]);
                    getEditor(a).getDoc().clearHistory();
                    autoSave(a);
                    tab(a).find('.title').val(tabs[a].name);
                    tab(a).find('.title').attr('readonly', tabs[a].isReadOnly);
                    tab(a).attr('data', tabs[a].dataAttr);
                    tab(a).attr('path', tabs[a].path);
                    if (tab(a).attr('data') === '') {
                        setFileDir(a, '');
                    }
                    if (state[a] == 'fiber_manual_record') {
                        getMatIcons(tab(a)).addClass('edit');
                    }
                    getMatIcons(tab(a)).text(state[a]);
                    var remaining = data.length - 1;
                    if (remaining === a) {
                        getStorage({
                            chosenFiles: 'key',
                            chosenDirs: 'rootDirs',
                            chosenDir: 'newProjectDir'
                        }, function(items) {
                            var chosenFiles = items.chosenFiles;
                            var chosenDirs = items.chosenDirs;
                            var chosenDir = items.chosenDir;
                            if (chosenFiles != 'key') {
                                chosenFiles.forEach(function(elem, index, array) {
                                    chrome.fileSystem.isRestorable(elem.entry, function(bisRestorable) {
                                        chrome.fileSystem.restoreEntry(elem.entry, function(thisEntry) {
                                            setFileDir(elem.index, thisEntry);
                                        });
                                    });
                                });
                            }
                            if (chosenDir != 'newProjectDir' && chosenDir !== '') {
                                chrome.fileSystem.isRestorable(chosenDir, function(isRestorable) {
                                    chrome.fileSystem.restoreEntry(chosenDir, function(entry) {
                                        setChosenDirInd(entry);
                                    });
                                });
                            }
                            if (chosenDirs != 'rootDirs') {
                                docFrag = document.createDocumentFragment();
                                chosenDirs.forEach(function(elem, index, array) {
                                    chrome.fileSystem.isRestorable(elem, function(isRestorable) {
                                        chrome.fileSystem.restoreEntry(elem, function(entry) {
                                            rootDirs.push(chrome.fileSystem.retainEntry(entry));
                                            reloadDirEntries(entry);
                                        });
                                    });
                                });
                            }
                        });
                        calcWidth(sideBarWidth);
                        setTimeout(function() {
                            openLaunchData();
                            projects().append(docFrag.children);
                            sortDirect();
                            tab(actv).click();
                            loadPrefs();
                            resizeTabs();
                            refreshEditors();
                            focusEditor();
                            preLoad();
                        }, time);
                    }
                }
            }
        });
    }

    function openLaunchData() {
        if (launchData && launchData.items) {
            for (var i = 0; i < launchData.items.length; i++) {
                var temp = [];
                temp.push(launchData.items[i].entry);
                openFiles(temp, false);
            }
        }
    }
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.open) {
            openLaunchData();
        }
    });
    //window functions
    function callback() {
        chrome.app.window.current().close();
    }
    $(document).delegate('.app-windowbar-close', 'click', function() {
        saveData(callback);
    });
    $(window).mouseleave(function() {
        saveData();
    });
    $(document).delegate('.app-windowbar-minimize', 'click', function() {
        chrome.app.window.current().minimize();
    });
    $(document).delegate('.app-windowbar-maximize', 'click', function() {
        focusEditor();
        if (chrome.app.window.current().isMaximized()) {
            chrome.app.window.current().restore();
        } else {
            chrome.app.window.current().maximize();
        }
    });
});