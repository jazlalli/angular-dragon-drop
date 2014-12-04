/*
 * angular-dragon-drop v0.3.1
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */

'use strict';

angular.module('angular-drag-and-drop', []).
  directive('dragAndDrop', function ($document, $compile, $rootScope) {
    /*
             ^                       ^
             |\   \        /        /|
            /  \  |\__  __/|       /  \
           / /\ \ \ _ \/ _ /      /    \
          / / /\ \ {*}\/{*}      /  / \ \
          | | | \ \( (00) )     /  // |\ \
          | | | |\ \(V""V)\    /  / | || \|
          | | | | \ |^--^| \  /  / || || ||
         / / /  | |( WWWW__ \/  /| || || ||
        | | | | | |  \______\  / / || || ||
        | | | / | | )|______\ ) | / | || ||
        / / /  / /  /______/   /| \ \ || ||
       / / /  / /  /\_____/  |/ /__\ \ \ \ \
       | | | / /  /\______/    \   \__| \ \ \
       | | | | | |\______ __    \_    \__|_| \
       | | ,___ /\______ _  _     \_       \  |
       | |/    /\_____  /    \      \__     \ |    /\
       |/ |   |\______ |      |        \___  \ |__/  \
       v  |   |\______ |      |            \___/     |
          |   |\______ |      |                    __/
           \   \________\_    _\               ____/
         __/   /\_____ __/   /   )\_,      _____/
        /  ___/  \uuuu/  ___/___)    \______/
        VVV  V        VVV  V
    */
    // this ASCII dragon is really important, do not remove

    var dragValue,
        dragKey,
        dragOrigin,
        dragDuplicate = false,
        floaty,
        offsetX,
        offsetY,
        emptyIndex;

    var drag = function (ev) {
      var x = ev.clientX - offsetX,
        y = ev.clientY - offsetY;

      floaty.css('left', x + 'px');
      floaty.css('top', y + 'px');
    };

    var remove = function (collection, index) {
      if (collection instanceof Array) {
        if (collection[index]) {
          return collection.splice(index, 1, '');
        }
      } else {
        var temp = collection[index];
        delete collection[index];
        return temp;
      }
    };

    var add = function (collection, index, item, key) {
      if (collection instanceof Array) {
        if (!collection[index]) {
          collection.splice(index, 1, item);
        }
      } else {
        collection[key] = item;
      }
    };

    var documentBody = angular.element($document[0].body);

    var disableSelect = function () {
      documentBody.css({
        '-moz-user-select': '-moz-none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      });
    };

    var enableSelect = function () {
      documentBody.css({
        '-moz-user-select': '',
        '-khtml-user-select': '',
        '-webkit-user-select': '',
        '-ms-user-select': '',
        'user-select': ''
      });
    };

    var killFloaty = function () {
      if (floaty) {
        $document.unbind('mousemove', drag);
        floaty.remove();
        floaty = null;
      }
    };

    var getElementOffset = function (elt) {

      var box = elt.getBoundingClientRect();
      var body = $document[0].body;

      var xPosition = box.left + body.scrollLeft;
      var yPosition = box.top + body.scrollTop;

      return {
        left: xPosition,
        top: yPosition
      };
    };

    // Get the element at position (`x`, `y`) behind the given element
    var getElementBehindPoint = function (behind, x, y) {
      var originalDisplay = behind.css('display');
      behind.css('display', 'none');

      var element = angular.element($document[0].elementFromPoint(x, y));

      behind.css('display', originalDisplay);

      return element;
    };

    $document.bind('mouseup', function (ev) {
      if (!dragValue) {
        return;
      }

      var dropArea = getElementBehindPoint(floaty, ev.clientX, ev.clientY);
      var position = dropArea.attr('drag-and-drop-index'); // index of drop location

      var accepts = function () {
        return dropArea.attr('drag-and-drop') &&
        ( !dropArea.attr('drag-and-drop-accepts') ||
          dropArea.scope().$eval(dropArea.attr('drag-and-drop-accepts'))(dragValue) );
      };

      // traverse up the DOM until you reach a node that accepts the dropped item
      while (dropArea.length > 0 && !accepts()) {
        dropArea = dropArea.parent();
      }

      if (dropArea.length > 0) {
        var expression = dropArea.attr('drag-and-drop');
        var targetScope = dropArea.scope();
        var match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*$/);
        var targetList = targetScope.$eval(match[2]);

        targetScope.$apply(function () {
          // take item in current drop location and add it to the drag origin
          add(dragOrigin, emptyIndex, targetList[position]);

          // remove item in current drop location
          remove(targetList, position);

          // add dragged item to the current drop location
          add(targetList, position, dragValue, dragKey);
        });
      } else if (!dragDuplicate) {
        // no dropArea here put item back to origin
        $rootScope.$apply(function () {
          add(dragOrigin, position, dragValue, dragKey);
        });
      }

      dragValue = dragOrigin = null;
      killFloaty();
    });

    return {
      restrict: 'A',
      compile: function (elm, attr) {

        // get the `thing in things` expression
        var expression = attr.dragAndDrop;
        var match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*$/);
        if (!match) {
          throw Error("Expected dragAndDrop in form of '_item_ in _collection_' but got '" +
            expression + "'.");
        }
        var lhs = match[1];
        var rhs = match[2];

        match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);

        var valueIdentifier = match[3] || match[1];
        var keyIdentifier = match[2];

        // pull out the template to re-use.
        // Improvised ng-transclude.
        var template = elm.html();

        // wrap text nodes
        try {
          template = angular.element(template.trim());
          if (template.length === 0) {
            throw new Error('');
          }
        }
        catch (e) {
          template = angular.element('<li>' + template + '</li>');
        }
        var child = template.clone();
        child.attr('ng-repeat', expression + ' track by $index');
        child.attr('drag-and-drop-index', '{{$index}}');

        // necessary due to inner div on draggable item
        var innerHTML = child.html();
        var inner = angular.element(innerHTML.trim());
        inner.attr('drag-and-drop-index', '{{$index}}');
        child.html('');
        child.append(inner);

        elm.html('');
        elm.append(child);

        var duplicate = elm.attr('drag-and-drop-double') !== undefined;

        return function (scope, elt, attr) {

          var accepts = scope.$eval(attr.dragAndDropAccepts);

          if (accepts !== undefined && typeof accepts !== 'function') {
            throw Error('Expected dragAndDropAccepts to be a function.');
          }

          var spawnFloaty = function () {
            scope.$apply(function () {
              floaty = template.clone();
              floaty.css('position', 'fixed');

              floaty.css('margin', '0px');
              floaty.css('z-index', '99999');

              var floatyScope = scope.$new();
              floatyScope[valueIdentifier] = dragValue;
              if (keyIdentifier) {
                floatyScope[keyIdentifier] = dragKey;
              }
              $compile(floaty)(floatyScope);
              documentBody.append(floaty);
              $document.bind('mousemove', drag);
              disableSelect();
            });
          };

          elt.bind('mousedown', function (ev) {
            if (dragValue) {
              return;
            }

            // find the right parent
            var originElement = angular.element(ev.target);
            var originScope = originElement.scope();

            while (originScope[valueIdentifier] === undefined) {
              originScope = originScope.$parent;
              if (!originScope) {
                return;
              }
            }

            dragValue = originScope[valueIdentifier];
            dragKey = originScope[keyIdentifier];
            if (!dragValue) {
              return;
            }

            // get offset inside element to drag
            var offset = getElementOffset(ev.target);

            dragOrigin = scope.$eval(rhs);
            if (duplicate) {
              dragValue = angular.copy(dragValue);
            } else {
              // keep track of where the item came from
              emptyIndex = dragOrigin.indexOf(dragValue);

              scope.$apply(function () {
                remove(dragOrigin, dragKey || dragOrigin.indexOf(dragValue));
              });
            }
            dragDuplicate = duplicate;

            offsetX = (ev.pageX - offset.left);
            offsetY = (ev.pageY - offset.top);

            spawnFloaty();
            drag(ev);
          });
        };
      }
    };
  });
