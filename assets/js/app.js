//Quantum v3.1
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
    loadData(launchData);
    //initialize windowBar, made by yours truly ^-^
    $('.windowBar').initializeWindowBar('#FFF');
    //hide elements from view
    $('.menu, .dropdown, .settings-container, .bg, .dialogue, .search-container, .contextmenu, .folder-contextmenu, .remove-dialogue, .folder-remove-dialogue, .new-file-dialogue, .new-folder-dialogue, .new-project-dialogue').hide();
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

    var text,
        query,
        cm,
        state;

    var config = {
        lineNumbers: true,
        lineWrapping: true,
        styleActiveLine: false,
        matchBrackets: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        tabSize: 4,
        indentUnit: 4,
        foldGutter: true,
        dragDrop: false,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        theme: 'material',
        mode: 'text/plain'
    };

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
        openDropDown($('.dropdown-' + realDropdown));

        //change material-icon
        if ($(this).find('.material-icons').text() == 'arrow_drop_down') {
            $(this).find('.material-icons').text('arrow_drop_up');
        } else {
            $(this).find('.material-icons').text('arrow_drop_down');
        }
    });

    function savePrefs() {
        var font = $('.CodeMirror').css('font-family'),
            fontSize = $('.CodeMirror').css('font-size');
        prefs = {
            theme: config.theme,
            font: font,
            fontSize: fontSize,
            tabSize: config.tabSize,
            softWrap: config.lineWrapping
        };
        chrome.storage.local.set({
            settings: prefs
        });
    }

    function refreshEditors() {
        for (var re = 0; re < editor.length; re++) {
            editor[re].refresh();
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

    function loadSettings(prefs) {
        $('.CodeMirror').css('font-family', prefs.font);
        $('.CodeMirror').css('font-size', prefs.fontSize);
        setEditorOption('theme', prefs.theme);
        setEditorOption('tabSize', prefs.tabSize);
        setEditorOption('lineWrapping', prefs.softWrap);
        $('.active').attr('class', 'tab active active-' + prefs.theme);
        $('.sidebar').css('background-color', shadeRGBColor($('.CodeMirror').css('background-color'), -0.2));
        $('.workspace, body').css('background-color', $('.CodeMirror').css('background-color'));
        $('.add-newproject').css('background-color', shadeRGBColor($('.active').css('box-shadow').replace(/^.*(rgba?\([^)]+\)).*$/, '$1'), -0.4));
        config.theme = prefs.theme;
        config.tabSize = prefs.tabSize;
        config.indentUnit = prefs.tabSize;
        config.lineWrapping = prefs.softWrap;
        var color = $('.CodeMirror').css('background-color');
        changeTabTheme(color);
        refreshEditors();
    }

    function setSelectors(prefs) {
        $('.selector-theme').html(prefs.theme + '<div class="material-icons">arrow_drop_down</div>');
        $('.selector-font').html(prefs.font.replace(/"/g, '').toLowerCase() + '<div class="material-icons">arrow_drop_down</div>');
        $('.selector-font-size').html(prefs.fontSize + '<div class="material-icons">arrow_drop_down</div>');
        $('.selector-tab-size').html(prefs.tabSize + '<div class="material-icons">arrow_drop_down</div>');
        if (prefs.softWrap === true) {
            $('.selector-wrap').html('wrap' + '<div class="material-icons">arrow_drop_down</div>');
        } else {
            $('.selector-wrap').html('none' + '<div class="material-icons">arrow_drop_down</div>');
        }
    }

    function loadPrefs() {
        chrome.storage.local.get({
            settings: 'prefs'
        }, function(item) {
            var setting = item.settings;
            if (setting == 'prefs' || undefined || null) {
                prefs = {
                    theme: 'material',
                    font: 'monospace',
                    fontSize: '14px',
                    tabSize: 4,
                    softWrap: true
                };
                loadSettings(prefs);
                setSelectors(prefs);
            } else {
                prefs = setting;
                loadSettings(setting);
                setSelectors(setting);
            }
        });
    }

    function setEditorOption(option, value) {
        for (var ed = 0; ed < editor.length; ed++) {
            editor[ed].setOption(option, value);
        }
    }

    function setDDOP(selector, selected) {
        selector.html(selected + '<div class="material-icons">arrow_drop_down</div>');
    }

    function changeTabTheme(color) {
        $('.tabs, .overflow-menu').css('background-color', color);
    }
    $(document).on('click', '.dropdown .theme', function() {
        var option = 'theme',
            value = $(this).text();
        $('.active').attr('class', 'tab active active-' + value);
        setDDOP($('.selector-theme'), value);
        setEditorOption(option, value);
        config.theme = value;
        $('.workspace, body').css('background-color', $('.CodeMirror').css('background-color'));
        $('.sidebar').css('background-color', shadeRGBColor($('.CodeMirror').css('background-color'), -0.2));
        $('.add-newproject').css('background-color', shadeRGBColor($('.active').css('box-shadow').replace(/^.*(rgba?\([^)]+\)).*$/, '$1'), -0.4));
        var color = $('.CodeMirror').css('background-color');
        changeTabTheme(color);
        openDropDown($(this).parent());
        savePrefs();
    });
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    $(document).on('click', '.dropdown .font-fam', function() {
        var font = $(this).text().capitalizeFirstLetter();
        setDDOP($('.selector-font'), $(this).text());
        $('.CodeMirror').css('font-family', font);
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });
    $(document).on('click', '.dropdown .font-size', function() {
        var fontSize = $(this).text();
        setDDOP($('.selector-font-size'), fontSize);
        $('.CodeMirror').css('font-size', fontSize);
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });
    $(document).on('click', '.dropdown .tab-size', function() {
        var tabSize = Number($(this).text());
        setDDOP($('.selector-tab-size'), tabSize);
        setEditorOption('tabSize', tabSize);
        config.tabSize = tabSize;
        config.indentUnit = tabSize;
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
        setEditorOption('lineWrapping', wrap);
        config.lineWrapping = wrap;
        refreshEditors();
        openDropDown($(this).parent());
        savePrefs();
    });

    function closeDropdown() {
        $('.settings-container').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    $('.close-settings').click(function() {
        closeDropdown();
    });
    $('.bg').click(function() {
        if ($('.dialogue').is(':visible')) {
            closeSaveBox();
        } else {}
        if ($('.remove-dialogue').is(':visible')) {
            closeRemoveDialog();
        } else {}
        if ($('.folder-remove-dialogue').is(':visible')) {
            closeFolderRemoveDialog();
        }
        if ($('.new-file-dialogue').is(':visible')) {
            closeNewFileDialog();
        }
        if ($('.new-folder-dialogue').is(':visible')) {
            closeNewFolderDialog();
        }
        if ($('.new-project-dialogue').is(':visible')) {
            closeProjectDialog();
        }
        if ($('.settings-container').is(':visible')) {
            closeDropdown();
        }
        editor[$('.active').index()].focus();
    });
    //tidy up code
    $('.tidy-up').click(function() {
        var text = editor[$('.active').index()].getValue();
        var beautified;
        if ($('.active').find('.title').val().indexOf('.html') > -1) {
            beautified = html_beautify(text, {
                indent_size: config.tabSize
            });
        } else if ($('.active').find('.title').val().indexOf('.css') > -1) {
            beautified = css_beautify(text, {
                indent_size: config.tabSize
            });
        } else if ($('.active').find('.title').val().indexOf('.js') > -1) {
            beautified = js_beautify(text, {
                indent_size: config.tabSize
            });
        } else {
            beautified = js_beautify(text, {
                indent_size: config.tabSize
            });
        }
        editor[$('.active').index()].setValue(beautified);
    });
    //open settings
    $('.settings-button').click(function() {
        $('.dropdown').hide();
        $('.settings-container').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
            opacity: '0.6'
        }, 200);
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
    $('.tabs').sortable({
        axis: 'x',
        distance: 20,
        tolerance: 'pointer',
        revert: true,
        start: function(e, ui) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            $(this).attr('data-previndex', ui.item.index());
            $(this).addClass('noclick');
        },
        stop: function(e, ui) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            var newIndex = ui.item.index();
            var oldIndex = $(this).attr('data-previndex');
            var thisID = ui.item.attr('id').replace('tab', '');
            var newID = $('.workspace > textarea').eq(newIndex).attr('id').replace('textarea', '');
            $(this).removeAttr('data-previndex');
            if (oldIndex > newIndex) {
                $('#textarea' + thisID).insertBefore($('#textarea' + newID));
                $('.CodeMirror').eq(oldIndex).insertBefore($('#textarea' + newID));
            } else {
                $('.CodeMirror').eq(oldIndex).insertAfter($('.CodeMirror').eq(newIndex));
                $('#textarea' + thisID).insertBefore($('.CodeMirror').eq(newIndex));
            }
            editor.move(oldIndex, newIndex);
            fileDirs.move(oldIndex, newIndex);
            refreshEditors();
            editor[$('.active').index()].focus();
        }
    }).disableSelection();

    function autoSave(g) {
        editor[g].on('change', function() {
            $('.active .close').text('edit');
            $('.active .close').addClass('edit');
        });
    }


    function findBigNumber() {
        numbers = [];
        for (var l = 0; l < $('.tab').length; l++) {
            var thisID = $('.tab').eq(l).attr('id').replace('tab', '');
            numbers.push(Number(thisID));
        }
    }

    function newTab() {
        var index;
        if ($('.tab').length === 0) {
            index = 0;
        } else {
            findBigNumber();
            index = Math.max.apply(null, numbers) + 1;
        }
        $('.tab').removeClass('active');
        $('.tab').removeClass('active-' + config.theme);
        $('.tabs').append('<div id="tab' + index + '"class="tab active active-' + config.theme + '"><input class="title"/><span class="close material-icons">close</span></div>');
        setFileName('untitled.txt');
        $('.workspace').append('<textarea id="textarea' + index + '"></textarea>');
        $('.active').attr('id', 'tab' + index);
        $('.CodeMirror').hide();
        resizeTabs();
        $('#textarea' + index).show();
        createDataAttr('');
        fileDirs[index] = '';
    }

    function reloadDirEntries(entry) {
        var parentDirectory = splitAndReturn(entry.fullPath, '/', 1);
        directories.push({
            name: entry.name,
            path: entry.fullPath,
            entry: entry,
            parentDirectory: parentDirectory
        });
        displayDataDir(directories.length - 1);
        loadDirEntry(entry);
        editor[$('.active').index()].focus();
    }

    function loadAutoTab() {
        newTab();
        var index = $('.active').index();
        editor[index] = CodeMirror.fromTextArea(document.getElementById('textarea' + index), config);
        setFileName('untitled.txt');
        fileDirs[index] = '';
        setTimeout(function() {
            $('.active').click();
            autoSave(index);
        });
    }
    var ink, d, x, y;
    $(document).on('click', '.tab', function(e) {
        e.stopPropagation();
        if ($(this).hasClass('noclick')) {
            $(this).removeClass('noClick');
        } else {
            //material design click animation
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
            $('.tab').removeClass('active');
            $('.tab').removeClass('active-' + config.theme);
            $(this).addClass('active');
            $(this).addClass('active-' + config.theme);
            $('.CodeMirror').hide();
            $('.CodeMirror').eq($('.active').index()).show();
            changeMode();
            savedFileEntry = fileDirs[$(this).index()];
            editor[$('.active').index()].refresh();
            editor[$('.active').index()].focus();
        }
    });

    function openSaveBox(closed) {
        closeOverflow();
        var docTitle = $('.active .title').val();
        $('.dialogue .dialogue-text').text(docTitle + ' has been modified. Unless saved, progress will be lost. Save changes?');
        $('.dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
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
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    $('.buttons-dialogue .cancel').click(function() {
        closeSaveBox();
        editor[$('.active').index()].focus();
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

    function closeTab(closedTab) {
        var tabClicked = closedTab.parent(),
            tabID = tabClicked.attr('id'),
            textID = tabID.replace('tab', 'textarea'),
            tabClass = tabClicked.attr('class'),
            tabIndex = tabClicked.index(),
            lastObjectIndex = $('.tabs').children().last().index(),
            tabLength = $('.tab').length;
        $('#' + textID).remove();
        $('.CodeMirror:eq(' + tabClicked.index() + ')').remove();
        editor.splice(tabIndex, 1);
        fileDirs.splice(tabIndex, 1);
        closedTab.parent().remove();
        if (prefs === undefined) {
            prefs = {
                theme: 'material',
                font: 'monospace',
                fontSize: '14px',
                tabSize: 4,
                softWrap: true
            };
        }
        if (tabIndex === 0 && tabLength == 1) {
            loadAutoTab();
            loadSettings(prefs);
        } else {
            if (tabClass.indexOf('active') == -1) {
                $('.active').click();
            } else {
                if (tabIndex === 0) {
                    $('.tab').eq(0).click();
                } else if (tabIndex == lastObjectIndex) {
                    $('.tab').eq(tabIndex - 1).click();
                } else {
                    $('.tab').eq(tabIndex).click();
                }
            }
        }
        resizeTabs();
        closeSaveBox();
    }
    $(document).on('click', '.close', function(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if ($(this).text() == 'edit') {
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
            editor[$('.active').index()].focus();
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
        if (window.getSelection() == '') {
            $('.search-bar').select();
        } else {
            $('.search-bar').val(window.getSelection());
        }
        $('.workspace').css('height', 'calc(100% - 180px)');
        $('.search-container').show().stop().animate({
            opacity: '1',
            bottom: '0px'
        }, 200);
        refreshEditors();
        setTimeout(function() {
            $('.search-bar').focus();
        }, 200);
    }

    function closeSearch() {
        $('.workspace').css('height', 'calc(100% - 80px)');
        $('.search-container').show().stop().animate({
            opacity: '0',
            bottom: '-100px'
        }, 200, function() {
            $(this).hide();
            cm = editor[$('.active').index()];
       	 	clearSearch(cm);
            editor[$('.active').index()].focus();
        });
    }
    var found;
    $('.search-bar').on('keyup focus', function() {
        text = $('.search-bar').val();
        cm = editor[$('.active').index()];
        state = getSearchState(cm);
        var cursor = getSearchCursor(cm, text, cm.getCursor("from"));
        startSearch(cm, state, text);
        if (found === 0) {
            cursor.findNext();
            cm.scrollIntoView({
                from: cursor.from(),
                to: cursor.to()
            });
            if ($('.cm-searching', '.CodeMirror:eq(' + $('.active').index() + ') .CodeMirror-lines .CodeMirror-code div').length === 0 && text !== '') {
                $(this).css('box-shadow', 'inset 0px -1px 0px 0px rgba(239, 37, 37, 0.58)');
            } else {
                $(this).css('box-shadow', 'inset 0px -1px 0px 0px rgba(0, 0, 0, 0.1)');
            }
            found = 1;
        } else {
            found = 0;
        }
    });
    $('.find_next').click(function() {
        text = $('.search-bar').val();
        cm = editor[$('.active').index()];
        state = getSearchState(cm);
        startSearch(cm, state, text);
        doSearch(cm, false);
    });
    $('.find_prev').click(function() {
        text = $('.search-bar').val();
        cm = editor[$('.active').index()];
        state = getSearchState(cm);
        startSearch(cm, state, text);
        doSearch(cm, true);
    });
    $('.replace_all').click(function() {
        text = $('.search-bar').val();
        query = $('.search-replace').val();
        cm = editor[$('.active').index()];
        replaceAll(cm, text, query);
    });
    $('.replace').click(function() {
        query = $('.search-bar').val();
        text = $('.search-replace').val();
        cm = editor[$('.active').index()];
        var cursor = getSearchCursor(cm, query, cm.getCursor("from"));
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
        if (e.ctrlKey && e.keyCode == 83 && !e.shiftKey || e.metaKey && e.keyCode == 83 && !e.shiftKey) {
            $('.save').click();
        }
        if (e.ctrlKey && e.shiftKey && e.keyCode == 83 || e.metaKey && e.shiftKey && e.keyCode == 83) {
            $('.save-as').click();
        }
        if (e.ctrlKey && e.keyCode == 78 || e.metaKey && e.keyCode == 78) {
            e.preventDefault();
            $('.new').click();
        }
        if (e.ctrlKey && e.keyCode == 79 || e.metaKey && e.keyCode == 79) {
            $('.open').click();
        }
        if (e.ctrlKey && e.keyCode == 80 || e.metaKey && e.keyCode == 80) {
            $('.settings-button').click();
        }
        if (e.ctrlKey && e.keyCode == 70 || e.metaKey && e.keyCode == 70) {
            if ($('.search-container').is(':visible') && window.getSelection() === '') {
                closeSearch();
            } else {
                openSearch();
            }
        }
        if (e.ctrlKey && e.keyCode == 87 || e.metaKey && e.keyCode == 87) {
            e.preventDefault();
            $('.active .close').click();
        }
        if (e.keyCode == 27) {
            closeSearch();
        }
    });
    //menu miscellaneous functionality
    function openOverflow() {
        $('.menu').show().stop().animate({
            opacity: '1',
            height: '420px'
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
        e.stopPropagation();
        closeOverflow();
    });
    //menu functionality
    $('.new').click(function() {
        newTab();
        var index = $('.active').index();
        editor[index] = CodeMirror.fromTextArea(document.getElementById('textarea' + Number($('.tabs').children().last().attr('id').replace('tab', ''))), config);
        if (prefs === undefined) {
            prefs = {
                theme: 'material',
                font: 'monospace',
                fontSize: '14px',
                tabSize: 4,
                softWrap: true
            };
        }
        loadSettings(prefs);
        setTimeout(function() {
            editor[index].focus();
            autoSave(index);
        }, 1);
    });

    function createPathAttr(path) {
        $('.active').attr('path', path);
    }

    function openFiles(fileEntries, fromDir) {
        fileEntries.forEach(function(fileEntry) {
            fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var text = e.target.result;
                    newTab();
                    setFileName(fileEntry.name);
                    if (fromDir === false) {
                        createDataAttr(fileEntry.name);
                    } else {
                        createDataAttr(fileEntry.name + 'isOpen');
                        createPathAttr(fileEntry.fullPath);
                    }
                    var newIndex = $('.active').attr('id').replace('tab', '');
                    var index = Number(newIndex);
                    var actIndex = $('.active').index();
                    fileDirs[actIndex] = fileEntry;
                    editor[actIndex] = CodeMirror.fromTextArea(document.getElementById('textarea' + index), config);
                    editor[actIndex].getDoc().setValue(text);
                    editor[actIndex].getDoc().clearHistory();
                    editor[actIndex].focus();
                    autoSave(actIndex);
                    changeMode();
                    if (prefs === undefined) {
                        prefs = {
                            theme: 'material',
                            font: 'monospace',
                            fontSize: '14px',
                            tabSize: 4,
                            softWrap: true
                        };
                    }
                    loadSettings(prefs);
                };
                reader.readAsText(file);
            });
        });
    }
    $('.open').click(function() {
        chrome.fileSystem.chooseEntry({
            acceptsMultiple: true
        }, function(fileEntries) {
            if (!fileEntries) {
                console.log('No Files Selected');
            }
            openFiles(fileEntries, false);
        });
    });

    $('.sidebar').resizable({
        handles: 'e',
        maxWidth: 400,
        "resize": function(event, ui) {
            var width = ui.size.width;
            $('.tabs').width($(window).width() - 70 - width);
            $('.workspace').width($(window).width() - width);
            $('.search-container').width($(window).width() - width);
            resizeTabs();
        }
    });

    function openProjectDialog() {
        $('.new-project-dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
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
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    $('.add-newproject').click(function() {
        openProjectDialog();
        $('.new-project-dialogue input').css('box-shadow', '0px 1px 0px 0px #47bfa1');
        $('.new-project-dialogue input').val('');
        $('.new-project-dialogue input').focus();
    });
    $('.new-project-cancel').click(function() {
        closeProjectDialog();
        editor[$('.active').index()].focus();
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
    $('.projects').scroll(function() {
        contextMenuOff();
        folderContextOff();
    });
    $('.chooseDir').click(function() {
        chrome.fileSystem.chooseEntry({
            type: 'openDirectory'
        }, function(dirEntry) {
            if (!dirEntry) {
                var state = 'No Directory Chosen'
                setChosenDirInd(state);
            } else {
                setChosenDirInd(dirEntry);
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
            var parentDirectory = splitAndReturn(dirEntry.fullPath, '/', 2);
            directories.push({
                name: dirEntry.name,
                path: dirEntry.fullPath,
                entry: dirEntry,
                parentDirectory: parentDirectory
            });
            var div = document.createElement('div');
            var thisName = dirEntry.name;
            thisName = replaceName(thisName);
            div.className = thisName + ' folder';
            div.setAttribute('path', dirEntry.fullPath);
            div.innerHTML = '<div class="material-icons">folder</div>' + dirEntry.name + '<ul class="' + thisName + 'ul"></ul>';
            $('.projects').append(div);
            $('.projects').children().last().children().last().hide();
            closeProjectDialog();
            editor[$('.active').index()].focus();
        });
    });
    $(document).on('keyup', '.dialog-input', function(e) {
        var folderName = $(this).val();
        if (folderName === '') {
            folderName = 'untitled';
        }
        var folderNames = [];
        if ($(this).hasClass('new-project-input')) {
            $('.projects').children().each(function(index) {
                folderNames.push($(this).clone().children().remove().end().text());
            });
            if (e.keyCode == 13) {
                $('.new-project-create').click();
            }
        } else {
            folderToRemove.children().last().children().each(function(index) {
                folderNames.push($(this).clone().children().remove().end().text());
            });
        }
        if (folderNames.indexOf(folderName) > -1) {
            $(this).css('box-shadow', '0px 1px 0px 0px #d61f1f ');
        } else {
            $(this).css('box-shadow', '0px 1px 0px 0px #47bfa1');
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
        return name.replace(/\./g, '').replace(/ /g, '_').replace(/["'()]/g, '_');
    }

    function splitAndReturn(string, token, numb) {
        string = string.split(token);
        if (numb === 0) {
            return string;
        } else {
            return string[string.length - numb];
        }
    }

    function displayDataDir(x) {
        var thisName = directories[x].name;
        var path = directories[x].path;

        //what the fuck am I doing with my life.
        path = splitAndReturn(path, '/', 0);
        //adjust path for classes
        path.forEach(function(val, index, array) {
            path[index] = val.replace(/ /g, '_').replace(/\./g, '').replace(/["'()]/g, '_');
        });

        //adjust names for classes
        thisName = replaceName(thisName);

        var div = document.createElement('div');
        div.className = thisName + ' folder';
        div.setAttribute('path', directories[x].entry.fullPath);
        div.innerHTML = '<div class="material-icons">folder</div>' + directories[x].name + '<ul style="display:none;" class="' + thisName + 'ul"></ul>';
        path.shift();
        path.forEach(function(value, index, array) {
            path[index] = value + ' .' + value + 'ul';
        });
        path = '.' + path.join(' .');
        if (docFrag.querySelector(path) === null) {
            path = path.split(' ');
            path.forEach(function(value, index, array) {
                if (value === '') {

                } else {
                    var newPath = array.slice();
                    newPath.splice(index + 1, array.length - (index + 1));
                    newPath = newPath.join(' ');
                    if (docFrag.querySelector(newPath) !== null) {
                        //do nothing
                    } else {
                        var temp = array;
                        if (index === 0) {
                            docFrag.appendChild(div);
                        } else {
                            var remaining = temp.length - index;
                            temp.splice(index, remaining);
                            temp = temp.join(' ');
                            docFrag.querySelector(temp).appendChild(div);
                        }
                    }
                }
            });
        }
    }

    function displayDataFile(y) {
        var name = files[y].entry.name;
        var path = files[y].entry.fullPath;

        path = splitAndReturn(path, '/', 0);
        //adjust path for classes
        path.forEach(function(val, index, array) {
            path[index] = val.replace(/ /g, '_').replace(/\./g, '').replace(/["'()]/g, '_');
        });

        //adjust for classes
        name = replaceName(name);
        name = name.replace(/\./g, '');

        //create div
        var div = document.createElement('div');
        div.className = name + ' file';
        div.setAttribute('path', files[y].entry.fullPath);
        div.innerHTML = '<div class="material-icons">insert_drive_file</div>' + files[y].entry.name;
        path.shift();
        path.forEach(function(value, index, array) {
            if (index === array.length - 1) {
                path[index] = value;
            } else {
                path[index] = value + ' .' + value + 'ul';
            }
        });
        path = '.' + path.join(' .');
        if (docFrag.querySelector(path) === null) {
            path = path.split(' ');
            path.forEach(function(value, index, array) {
                var newPath = array.slice();
                newPath.splice(index + 1, array.length - (index + 1));
                newPath = newPath.join(' ');
                if (docFrag.querySelector(newPath) !== null) {

                } else {
                    var temp = array;
                    var remaining = temp.length - index;
                    temp.splice(index, remaining);
                    temp = temp.join(' ');
                    docFrag.querySelector(temp).appendChild(div);
                }
            });
        }
    }

    function showPreLoad(text) {
        $('.loading-text').text('Loading ' + text);
        $('.preload').show().velocity({
            opacity: '1'
        }, {
            duration: 200
        });
    }

    function hidePreLoad() {
        $('.preload').stop().velocity({
            opacity: '0'
        }, {
            duration: 600,
            complete: function() {
                $(this).hide();
            }
        });
    }

    function loadDirEntry(dirEntry) {
        var dirReader = dirEntry.createReader();
        var readEntries = function() {
            dirReader.readEntries(function(results) {
                for (var gg = 0; gg < results.length; gg++) {
                    var data = results[gg];
                    if (data.isDirectory) {
                        var parentDirectory = data.fullPath.split('/');
                        parentDirectory = parentDirectory[parentDirectory.length - 2];
                        directories.push({
                            name: data.name,
                            path: data.fullPath,
                            entry: data,
                            parentDirectory: parentDirectory
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
    $('.open-dir').click(function() {
        chrome.fileSystem.chooseEntry({
            type: 'openDirectory'
        }, function(dirEntry) {
            if (!dirEntry) {
                console.log('No Directory Selected');
            } else {
                var isInRoot;
                if (rootDirs.length === 0) {
                    rootDirs.push(chrome.fileSystem.retainEntry(dirEntry));
                    showPreLoad(dirEntry.name);
                    docFrag.innerHTML = '';
                    reloadDirEntries(dirEntry);
                    setTimeout(function() {
                        $('.projects').append(docFrag.children);
                        sortDirect();
                        hidePreLoad();
                    }, 1000);
                } else {
                    for (var i = 0; i < rootDirs.length; i++) {
                        chrome.fileSystem.restoreEntry(rootDirs[i], function(entry) {
                            if (entry.fullPath == dirEntry.fullPath) {
                                isInRoot = true;
                            }
                        });
                        if (i === rootDirs.length - 1) {
                            if (isInRoot == true) {

                            } else {
                                rootDirs.push(chrome.fileSystem.retainEntry(dirEntry));
                                showPreLoad(dirEntry.name);
                                docFrag.innerHTML = '';
                                reloadDirEntries(dirEntry);
                                setTimeout(function() {
                                    $('.projects').append(docFrag.children);
                                    sortDirect();
                                    hidePreLoad();
                                }, 1000);
                            }
                        }
                    }
                }
            }
        });
    });
    $(document).on('click', '.projects .folder', function(e) {
        e.stopPropagation();
        if ($(this).children('ul').is(':visible')) {
            $(this).children('ul').hide();
            $(this).children().closest('.material-icons').text('folder');
            $(this).css('color', 'rgba(255,255,255,0.8)');
        } else {
            $(this).children('ul').show();
            $(this).children().closest('.material-icons').text('folder_open');
            $(this).css('color', '#FFFFFF');
        }
    });
    $(document).on('click', '.projects ul', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
    var projectFileEntry;
    $(document).on('click', '.projects .file', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (e.handled !== true) {
            e.handled = true;
            var temp = [],
                fileNames = [];
            var thisName = $(this).clone().children().remove().end().text();
            var thisPath = $(this).attr('path');

            var getMatchingEntry = function(obj) {
                if (obj.entry.name == thisName && obj.entry.fullPath == thisPath) {
                    return obj;
                }
            };

            projectFileEntry = files.find(getMatchingEntry);
            projectFileEntry = projectFileEntry.entry;
            if (checkTabs(thisName, thisPath) === true) {
                $('.tab').eq(editIndex).click();
            } else {
                temp.push(projectFileEntry);
                openFiles(temp, true);
            }
        }
        contextMenuOff();
    });
    //context menu
    function contextMenuOn(event) {
        $('.contextmenu').show().css({
            top: event.pageY + 'px',
            left: event.pageX - 20 + 'px',
            backgroundColor: shadeRGBColor($('.sidebar').css('background-color'), -0.2)
        }).stop().animate({
            opacity: '1'
        }, 200);
    }

    function contextMenuOff() {
        $('.contextmenu').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    function folderContext(event) {
        $('.folder-contextmenu').show().css({
            top: event.pageY + 'px',
            left: event.pageX - 20 + 'px',
            backgroundColor: shadeRGBColor($('.sidebar').css('background-color'), -0.2)
        }).stop().animate({
            opacity: '1'
        }, 200);
    }

    function folderContextOff() {
        $('.folder-contextmenu').stop().animate({
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

    function openRemoveDialog() {
        $('.remove-dialogue .remove-dialogue-text').text('Are you sure you want to remove ' + removeTitle + '? This action cannot be undone.');
        $('.remove-dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
            opacity: '0.6'
        }, 200);
    }

    function closeRemoveDialog() {
        $('.remove-dialogue').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    function openFolderRemoveDialog() {
        $('.folder-remove-dialogue .folder-remove-dialogue-text').text('Are you sure you want to remove ' + folderRemoveTitle + '? This will PERMANENTLY delete this folder from your computer.');
        $('.folder-remove-dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
            opacity: '0.6'
        }, 200);
    }

    function closeFolderRemoveDialog() {
        $('.folder-remove-dialogue').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    function openNewFileDialog() {
        $('.new-file-dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
            opacity: '0.6'
        }, 200);
    }

    function closeNewFileDialog() {
        $('.new-file-dialogue').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }

    function openNewFolderDialog() {
        $('.new-folder-dialogue').show().stop().animate({
            top: '50%',
            opacity: '1'
        }, 200);
        $('.bg').show().stop().animate({
            opacity: '0.6'
        }, 200);
    }

    function closeNewFolderDialog() {
        $('.new-folder-dialogue').stop().animate({
            top: '60%',
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
        $('.bg').stop().animate({
            opacity: '0'
        }, 200, function() {
            $(this).hide();
        });
    }
    $(document).on('contextmenu', '.projects .file', function(e) {
        e.stopPropagation();
        e.preventDefault();
        removeTitle = $(this).clone().children().remove().end().text();
        contextMenuName = removeTitle;
        contextMenuPath = $(this).attr('path');
        fileToRemove = $(this);
        contextMenuOn(e);
    });
    $('.contextmenu .remove').click(function() {
        openRemoveDialog();
        contextMenuOff();
    });
    $(document).on('contextmenu', '.projects .folder', function(e) {
        e.stopPropagation();
        e.preventDefault();
        folderRemoveTitle = $(this).clone().children().remove().end().text();
        folderContextMenuName = folderRemoveTitle;
        folderContextMenuPath = $(this).attr('path');
        folderToRemove = $(this);
        folderContext(e);
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
    $('.folder-contextmenu .folder-removefromproject').click(function() {
        var getMatchingDirEntry = function(obj) {
            if (obj.entry.name == folderContextMenuName && obj.entry.fullPath == folderContextMenuPath) {
                return obj;
            }
        }
        var dirEntry = directories.find(getMatchingDirEntry);
        dirEntry = dirEntry.entry;
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
            editor[$('.active').index()].focus();
        }
    });
    $('.folder-contextmenu .folder-addfolder').click(function() {
        openNewFolderDialog();
        folderContextOff();
        $('.new-folder-dialogue input').css('box-shadow', '0px 1px 0px 0px #47bfa1');
        $('.new-folder-dialogue input').val('');
        $('.new-folder-dialogue input').focus();
    });
    $('.new-folder-create').click(function() {
        var folderName = $(this).parent().parent().find('input').val();
        if (folderName === '') {
            folderName = 'untitled';
        }
        var folderNames = [];
        folderToRemove.children().last().children().each(function(index) {
            folderNames.push($(this).clone().children().remove().end().text());
        });
        if (folderNames.indexOf(folderName) > -1) {
            $(this).parent().parent().find('input').css('box-shadow', '0px 1px 0px 0px #d61f1f ');
        } else {
            var getMatchingDirEntry = function(obj) {
                if (obj.name == folderContextMenuName && obj.entry.fullPath == folderContextMenuPath) {
                    return obj;
                }
            };
            var dirEntry = directories.find(getMatchingDirEntry);
            dirEntry = dirEntry.entry;
            dirEntry.getDirectory(folderName, {
                create: true,
                exclusive: true
            }, function(dirEntry) {
                var parentDirectory = dirEntry.fullPath.split('/');
                parentDirectory = parentDirectory[parentDirectory.length - 2];
                directories.push({
                    name: dirEntry.name,
                    path: dirEntry.fullPath,
                    entry: dirEntry,
                    parentDirectory: parentDirectory
                });
                var thisName = dirEntry.name;
                thisName = replaceName(thisName);
                var div = document.createElement('div');
                div.className = thisName + ' folder';
                div.setAttribute('path', dirEntry.fullPath);
                div.innerHTML = '<div class="material-icons">folder</div>' + dirEntry.name + '<ul class="' + thisName + 'ul"></ul>';
                folderToRemove.children().last().append(div);
                folderToRemove.children().last().children().last().children().last().hide();
                folderToRemove.children().last().children().last().insertBefore(folderToRemove.children().last().children().first());
                closeNewFolderDialog();
            });
        }
    });
    $('.new-folder-cancel').click(function() {
        closeNewFolderDialog();
        editor[$('.active').index()].focus();
    });
    $('.folder-contextmenu .folder-remove').click(function() {
        openFolderRemoveDialog();
        folderContextOff();
    });
    $('.folder-remove-yes').click(function() {
        function getMatchingDirEntry(obj) {
            if (obj.name == folderContextMenuName && obj.entry.fullPath == folderContextMenuPath) {
                return obj;
            }
        }
        var entryToRemove = directories.find(getMatchingDirEntry);
        entryToRemove = entryToRemove.entry;
        for (var i = 0; i < rootDirs.length; i++) {
            chrome.fileSystem.restoreEntry(rootDirs[i], function(entry) {
                if (entryToRemove.fullPath == entry.fullPath) {
                    rootDirs.splice(i, 1); //remove from rootDirs
                }
            });
        }
        entryToRemove.removeRecursively(function() {
            folderToRemove.velocity('slideUp', {
                duration: 200,
                complete: function() {
                    $(this).remove();
                }
            });
            closeFolderRemoveDialog();
            editor[$('.active').index()].focus();
        });
    });
    $('.folder-remove-no').click(function() {
        closeFolderRemoveDialog();
        editor[$('.active').index()].focus();
    });
    $('.folder-addfile').click(function() {
        openNewFileDialog();
        contextMenuOff();
        $('.new-file-dialogue input').css('box-shadow', '0px 1px 0px 0px #47bfa1');
        $('.new-file-dialogue input').val('');
        $('.new-file-dialogue input').focus();
    });
    $('.new-file-cancel').click(function() {
        closeNewFileDialog();
        editor[$('.active').index()].focus();
    });
    $('.new-file-create').click(function() {
        var fileName = $(this).parent().parent().find('input').val();
        if (fileName === '') {
            fileName = 'untitled.txt';
        }
        var fileNames = [];
        folderToRemove.children().last().children().each(function(index) {
            fileNames.push($(this).clone().children().remove().end().text());
        });
        if (fileNames.indexOf(fileName) > -1) {
            $(this).parent().parent().find('input').css('box-shadow', '0px 1px 0px 0px #d61f1f ');
        } else {
            var getMatchingDirEntry = function(obj) {
                if (obj.name == folderContextMenuName && obj.entry.fullPath == folderContextMenuPath) {
                    return obj;
                }
            };
            var dirEntry = directories.find(getMatchingDirEntry);
            dirEntry = dirEntry.entry;
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
                name = name.replace(/\./g, '');
                savedFileEntry = fileEntry;
                //create div
                var div = document.createElement('div');
                div.className = name + ' file';
                div.setAttribute('path', fileEntry.fullPath);
                div.innerHTML = '<div class="material-icons">insert_drive_file</div>' + fileEntry.name;
                folderToRemove.children().last().append(div);
                closeNewFileDialog();
            });
        }
    });

    var editIndex;

    function checkTabs(name, path) {
        for (var t = 0; t < $('.tab').length; t++) {
            if ($('.tab').eq(t).attr('path') == path && $('.tab').eq(t).find('.title').val() == name) {
                editIndex = t;
                return true;
            }
        }
    }
    //remove
    $('.remove-buttons .remove-yes').click(function() {
        function getMatchingEntry(obj) {
            if (obj.entry.name == contextMenuName && obj.entry.fullPath == contextMenuPath) {
                return obj;
            }
        }

        projectFileEntry = files.find(getMatchingEntry);
        projectFileEntry = projectFileEntry.entry;
        if (checkTabs(contextMenuName, projectFileEntry.fullPath) === true) {
            closeTab($('.tab').eq(editIndex).find('.close'));
            projectFileEntry.remove(function() {
                fileToRemove.remove();
                closeRemoveDialog();
                editor[$('.active').index()].focus();
            });
        } else {
            projectFileEntry.remove(function() {
                fileToRemove.remove();
                closeRemoveDialog();
                editor[$('.active').index()].focus();
            });
        }
    });
    $('.remove-buttons .remove-no').click(function() {
        closeRemoveDialog();
        editor[$('.active').index()].focus();
    });

    $(document).on('mousedown', function(e) {
        var target = e.target;
        if (!$(target).parents().is('.contextmenu') || !$(target).parents().is('.folder-contextmenu')) {
            contextMenuOff();
            folderContextOff();
        }
    });

    function setFileName(name) {
        $('.active .title').val(name);
    }

    function getFileName() {
        return $('.active .title').val();
    }

    function createDataAttr(name) {
        $('.active').attr('data', name);
    }

    function exportToFileEntry(fileEntry) {
        if (!fileEntry) {
            console.log('User cancelled saving.');
        } else {
            chrome.fileSystem.getWritableEntry(fileEntry, function(writableFileEntry) {
                writableFileEntry.createWriter(function(fileWriter) {
                    var contents = editor[$('.active').index()].getDoc().getValue();
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
                    setFileName(fileName);
                    fileDirs[$('.active').index()] = writableFileEntry;
                    if ($('.active').attr('data') === undefined || $('.active').attr('data') === false || $('.active').attr('data') === '') {
                        createDataAttr(fileName);
                    } else {}
                    $('.active .close').text('close');
                    $('.active .close').removeClass('edit');
                    $('.active').click();
                    if (yesClicked === true) {
                        closeTab(closedTab);
                        yesClicked = false;
                    }
                });
            });
        }
    }

    function ExportToDisk() {
        var name = getFileName();
        chrome.fileSystem.chooseEntry({
            type: 'saveFile',
            suggestedName: name,
            acceptsAllTypes: true
        }, exportToFileEntry);
    }
    $('.save').click(function() {
        savedFileEntry = fileDirs[$('.active').index()];
        if (savedFileEntry) {
            exportToFileEntry(savedFileEntry);
        } else {
            var name = getFileName();
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

    //editor functionality
    function changeMode() {
        var val = getFileName(),
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
            editor[$('.active').index()].setOption('mode', spec);
            CodeMirror.autoLoadMode(editor[$('.active').index()], mode);
        } else {}
    }

    function resizeTabs() {
        var tabConWidth = $('.tabs').width(),
            amountOfTabs = $('.tab').length,
            tabWidth = tabConWidth / amountOfTabs;
        if (tabWidth > 200) {
            tabWidth = 200;
        }
        $('.tab').css({
            width: tabWidth + 'px'
        });
    }
    $(window).resize(function() {
        var width = $('.sidebar').width();
        $('.tabs').width($(window).width() - 70 - width);
        resizeTabs();
        $('.workspace').width($(window).width() - width);
        $('.search-container').width($(window).width() - width);
        refreshEditors();
    });

    $('.started-button').click(function() {
        $('.getting-started').stop().animate({
            top: '-100%',
            opacity: '0'
        }, 400, function() {
            $(this).remove();
        });
        installed = true;
        saveData();
        editor[$('.active').index()].focus();
    });

    function loadGettingStarted() {
        $('.started-content').stop().animate({
            top: '50%',
            opacity: '1'
        }, 800);
    }
    //save & load data or 'remember' tabs and settings
    function saveData(callback) {
        tabArray = [];
        textArray = [];
        editArray = [];
        for (var i = 0; i < $('.tab').length; i++) {
            var index = i;
            var text = editor[index].getValue();
            var state = $('.tab').eq(index).find('.material-icons').text();
            var remaining = index;
            textArray[index] = text;
            tabArray[index] = {
                name: $('.tab').eq(index).find('.title').val(),
                path: $('.tab').eq(index).attr('path'),
                dataAttr: $('.tab').eq(index).attr('data')
            };
            editArray[index] = state;
            var activeIndex = $('.active').index(),
                sideWidth = $('.sidebar').width();
            if (remaining === $('.tab').length - 1) {
                chrome.storage.local.set({
                    data: textArray,
                    tabs: tabArray,
                    state: editArray,
                    inst: installed,
                    actv: activeIndex,
                    sideBarWidth: sideWidth
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
                if (projectDir === undefined) {
                    newProjectDir = '';
                } else {
                    newProjectDir = chrome.fileSystem.retainEntry(projectDir);
                }
                chrome.storage.local.set({
                    chosenFiles: key,
                    chosenDirs: rootDirs,
                    chosenDir: newProjectDir
                });
            }
        }
        if (!callback) {} else {
            callback();
        }
    }

    function calcWidth(sideBarWidth) {
        $('.sidebar').width(sideBarWidth);
        $('.tabs').width($(window).width() - 70 - sideBarWidth);
        $('.workspace').width($(window).width() - sideBarWidth);
        $('.search-container').width($(window).width() - sideBarWidth);
    }

    function loadData(launchData) {
        chrome.storage.local.get({
            data: 'textArray',
            tabs: 'tabArray',
            state: 'editArray',
            inst: 'installed',
            actv: 'activeIndex',
            sideBarWidth: 'sideWidth'
        }, function(item) {
            var data = item.data;
            var tabs = item.tabs;
            var state = item.state;
            var inst = item.inst;
            var actv = item.actv;
            var sideBarWidth = item.sideBarWidth;
            //sneaky loading algorithm
            //to prevent chosenFiles and chosenDirs
            //from being interupted while loading
            var time = Math.ceil(Math.random() * ((2300 - 1800) + 1) + 1800) * Math.log(JSON.stringify(data).length * 8) / 8;

            if (data == 'textArray' || tabs == 'tabArray' || state == 'editArray' || actv == 'activeIndex' || inst == 'installed' || sideBarWidth == 'sideWidth') {
                prefs = {
                    theme: 'material',
                    font: 'monospace',
                    fontSize: '14px',
                    tabSize: 4,
                    softWrap: true
                };
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
                    editor[a] = CodeMirror.fromTextArea(document.getElementById('textarea' + Number($('.tabs').children().last().attr('id').replace('tab', ''))), config);
                    editor[a].getDoc().setValue(data[a]);
                    editor[a].getDoc().clearHistory();
                    autoSave(a);
                    $('.tab').eq(a).find('.title').val(tabs[a].name);
                    $('.tab').eq(a).attr('data', tabs[a].dataAttr);
                    $('.tab').eq(a).attr('path', tabs[a].path);
                    if ($('.tab').eq(a).attr('data') === '') {
                        fileDirs[a] = '';
                    }
                    if (state[a] == 'edit') {
                        $('.tab').eq(a).find('.material-icons').addClass('edit');
                    }
                    $('.tab').eq(a).find('.material-icons').text(state[a]);
                    var remaining = data.length - 1;
                    if (remaining === a) {
                        chrome.storage.local.get({
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
                                            fileDirs[elem.index] = thisEntry;
                                        });
                                    });
                                });
                            }
                            if (chosenDir != 'newProjectDir') {
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
                            $('.projects').append(docFrag.children);
                            sortDirect();
                            $('.tab').eq(actv).click();
                            loadPrefs();
                            resizeTabs();
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
        editor[$('.active').index()].focus();
        $('.dialog-input').focus();
        if (chrome.app.window.current().isMaximized()) {
            chrome.app.window.current().restore();
        } else {
            chrome.app.window.current().maximize();
        }
    });

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
});