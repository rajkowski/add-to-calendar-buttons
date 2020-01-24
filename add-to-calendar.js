;(function(exports) {

  /* --------------
     config 
  --------------- */
  
  var MS_IN_MINUTES = 60 * 1000;
    
  var CONFIG = {
    selector  : ".add-to-calendar",
    duration  : 60,
    texts : {
      label     : "Add to Calendar",
      title     : "New event",
      download  : "Calendar-event.ics",
      google    : "Google",
      yahoo     : "Yahoo!",
      off365    : "Office 365",
      outlkcom  : "Outlook.com",
      ical      : "Apple",
      outlook   : "Outlook",
      ienoblob  : "Sorry, your browser does not support downloading Calendar events."
    }
  };
  
  if (typeof ADDTOCAL_CONFIG != "undefined") {
    CONFIG = ADDTOCAL_CONFIG;
  }
  
  /* --------------
    browser sniffing 
  --------------- */
  
  // ie < edg (=chromium) doesnt support data-uri:text/calendar
  var ieCanDownload = ('msSaveOrOpenBlob' in window.navigator);
  var ieMustDownload = /\b(MSIE |Trident.*?rv:|Edge\/)(\d+)/.exec(navigator.userAgent);
  
  
  /* --------------
    generators 
  --------------- */
  
  var calendarGenerators = {
  
    google: function(event) {
      var startTime,endTime;
      
      if (event.allday) {
        // google wants 2 consecutive days at 00:00
        startTime = formatTime(event.tzstart);
        endTime = formatTime(getEndDate(event.tzstart,60*24));
        startTime = stripISOTime(startTime);
        endTime = stripISOTime(endTime);
      } else {
        if (event.timezone) {
          // google is somehow weird with timezones. 
          // it works better when giving the local
          // time in the given timezone without the zulu, 
          // and pass timezone as argument.
          // but then the dates we have loaded 
          // need to shift inverse with tzoffset the 
          // browser gave us. 
          // so
          var shiftstart, shiftend;
          shiftstart = new Date(event.start.getTime()-event.start.getTimezoneOffset()*MS_IN_MINUTES);
          if (event.end) {
            shiftend = new Date(event.end.getTime()-event.end.getTimezoneOffset()*MS_IN_MINUTES);
          }
          startTime = formatTime(shiftstart);
          endTime = formatTime(shiftend);
          // strip the zulu and pass the tz as argument later
          startTime = startTime.substring(0,startTime.length-1);
          endTime = endTime.substring(0,endTime.length-1);
        } else {
          // use regular times
          startTime = formatTime(event.start);
          endTime = formatTime(event.end);
        }
      }
      
      var href = encodeURI([
        'https://www.google.com/calendar/render',
        '?action=TEMPLATE',
        '&text=' + (event.title || ''),
        '&dates=' + (startTime || ''),
        '/' + (endTime || ''),
        (event.timezone)?'&ctz='+event.timezone:'',
        '&details=' + (event.description || ''),
        '&location=' + (event.address || ''),
        '&sprop=&sprop=name:'
      ].join(''));
      
      
      return '<a class="icon-google" target="_blank" href="' +
        href + '">'+CONFIG.texts.google+'</a>';
    },

    yahoo: function(event) {
    
      
      if (event.allday) {
        var yahooEventDuration = 'allday';
      } else {
      
        var eventDuration = event.tzend ?
        ((event.tzend.getTime() - event.tzstart.getTime())/ MS_IN_MINUTES) :
        event.duration;

        // Yahoo dates are crazy, we need to convert the duration from minutes to hh:mm
      
      
        var yahooHourDuration = eventDuration < 600 ?
          '0' + Math.floor((eventDuration / 60)) :
          Math.floor((eventDuration / 60)) + '';
  
        var yahooMinuteDuration = eventDuration % 60 < 10 ?
          '0' + eventDuration % 60 :
          eventDuration % 60 + '';
  
        var yahooEventDuration = yahooHourDuration + yahooMinuteDuration;
      }
      
      // Remove timezone from event time
      // var st = formatTime(new Date(event.start - (event.start.getTimezoneOffset() * MS_IN_MINUTES))) || '';
      
      var st = formatTime(event.tzstart) || '';

      var href = encodeURI([
        'http://calendar.yahoo.com/?v=60&view=d&type=20',
        '&title=' + (event.title || ''),
        '&st=' + st,
        '&dur=' + (yahooEventDuration || ''),
        '&desc=' + (event.description || ''),
        '&in_loc=' + (event.address || '')
      ].join(''));

      return '<a class="icon-yahoo" target="_blank" href="' +
        href + '">'+CONFIG.texts.yahoo+'</a>';
    },

    off365: function(event) {
      var startTime = formatTime(event.tzstart);
      var endTime = formatTime(event.tzend);
      
      var description = event.description || '';
      do {
        var href = encodeURI([
          'https://outlook.office365.com/owa/',
          '?path=/calendar/action/compose',
          '&rru=addevent',
          '&subject=' + (event.title || ''),
          '&startdt=' + (startTime || ''),
          '&enddt=' + (endTime || ''),
          '&body=' + description,
          '&location=' + (event.address || ''),
          '&allday=' + (event.allday?'true':'false')
        ].join(''));
        if (href.length > 2084)
          description = String(description).replace(/\s.*?$/, '');
      } while(href.length > 2084 && /\s/.test(description));

      return '<a class="icon-off365" target="_blank" href="' +
        href + '">'+CONFIG.texts.off365+'</a>';
    },
    
    outlkcom: function(event) {
      var startTime = formatTime(event.tzstart);
      var endTime = formatTime(event.tzend);

      var description = event.description || '';
      do {
        var href = encodeURI([
          'https://outlook.live.com/owa/',
          '?path=/calendar/action/compose',
          '&rru=addevent',
          '&subject=' + (event.title || ''),
          '&startdt=' + (startTime || ''),
          '&enddt=' + (endTime || ''),
          '&body=' + description,
          '&location=' + (event.address || ''),
          '&allday=' + (event.allday?'true':'false')
        ].join(''));
        if (href.length > 2084)
          description = String(description).replace(/\s.*?$/, '');
      } while(href.length > 2084 && /\s/.test(description));
  
      return '<a class="icon-outlkcom" target="_blank" href="' +
        href + '">'+CONFIG.texts.outlkcom+'</a>';
    },
    
    ics: function(event, eClass, calendarName) {
      var startTime,endTime;

      if (event.allday) {
        // DTSTART and DTEND need to be equal and 0
        startTime = formatTime(event.tzstart);
        endTime = startTime = stripISOTime(startTime)+'T000000';
      } else {
        startTime = formatTime(event.tzstart);
        endTime = formatTime(event.tzend);
      }
      
      var cal = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'BEGIN:VEVENT',
          'URL:' + document.URL,
          'DTSTART:' + (startTime || ''),
          'DTEND:' + (endTime || ''),
          'SUMMARY:' + (event.title || ''),
          'DESCRIPTION:' + (event.description ? String(event.description).replace(/[\r\n]/g,'\\n') : ''),
          'LOCATION:' + (event.address || ''),
          'UID:' + (event.id || '') + '-' + document.URL,
          'END:VEVENT',
          'END:VCALENDAR'].join('\n');
          
      if (ieMustDownload) {
        return '<a class="' + eClass + '" onclick="ieDownloadCalendar(\'' +
          escapeJSValue(cal) + '\')">' + calendarName + '</a>';
      }
      
      var href = encodeURI('data:text/calendar;charset=utf8,' + cal);
      
      return '<a class="' + eClass + '" download="'+CONFIG.texts.download+'" href="' + 
        href + '">' + calendarName + '</a>';
     
      
    },

    ical: function(event) {
      return this.ics(event, 'icon-ical', CONFIG.texts.ical);
    },

    outlook: function(event) {
      return this.ics(event, 'icon-outlook', CONFIG.texts.outlook);
    }
  };
  
  /* --------------
     helpers 
  --------------- */
  
  var changeTimezone = function(date,timezone) {
    if (date) {
      try {
        if (timezone) {
          var invdate = new Date(date.toLocaleString('en-US', { 
            timeZone: timezone 
          }));
          var diff = date.getTime()-invdate.getTime();
          return new Date(date.getTime()+diff);
        } 
      }
      catch(error) {
        // Catch for IE
        // console.error(error);
      }
      return date;
    }
    return;
  }
  
  var formatTime = function(date) {
    try {
      return date?date.toISOString().replace(/-|:|\.\d+/g, ''):'';
    }
    catch(error) {
      // Catch for IE
      // console.error(error);
    }
  };
  
  var getEndDate = function(start,duration) {
    return new Date(start.getTime() + duration * MS_IN_MINUTES);
  };

  var stripISOTime = function(isodatestr) {
    return isodatestr.substr(0,isodatestr.indexOf('T'));
  };
  
  var escapeJSValue = function(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '\\\'')
      .replace(/(\r?\n|\r)/gm, '\\n');
  };
  
  /* --------------
     output handling 
  --------------- */

  var generateMarkup = function(calendars, clazz, calendarId) {
    var result = document.createElement('div');

    result.innerHTML = '<button class="add-to-calendar-label" onclick="return doAddToCalenderClick(this);">'+CONFIG.texts.label+'</button>';

    var dropdown = document.createElement('div');
    dropdown.className = 'add-to-calendar-dropdown';
    
    Object.keys(calendars).forEach(function(services) {
      dropdown.innerHTML += calendars[services];
    });

    result.appendChild(dropdown);
    
    result.className = 'add-to-calendar-widget';
    if (clazz !== undefined) {
      result.className += (' ' + clazz);
    }

    addCSS();
    
    result.id = calendarId;
    return result;
  };

  var generateCalendars = function(event) {
    return {
      ical: calendarGenerators.ical(event),
      google: calendarGenerators.google(event),
      off365: calendarGenerators.off365(event),
      outlook: calendarGenerators.outlook(event),
      outlkcom: calendarGenerators.outlkcom(event),
      yahoo: calendarGenerators.yahoo(event)
    };
  };

  var addCSS = function() {
    if (!document.getElementById('add-to-calendar-css')) {
      document.getElementsByTagName('head')[0].appendChild(generateCSS());
    }
  };

  var generateCSS = function() {
    var styles = document.createElement('style');
    styles.id = 'add-to-calendar-css';

    styles.innerHTML = ".add-to-calendar{position:relative;text-align:left}.add-to-calendar>*{display:none}.add-to-calendar>.add-to-calendar-widget{display:block}.add-to-calendar-label{cursor:pointer}.add-to-calendar-checkbox+div.add-to-calendar-dropdown,.add-to-calendar-label+div.add-to-calendar-dropdown{display:none}.add-to-calendar-checkbox:checked+div.add-to-calendar-dropdown,.add-to-calendar-widget.open .add-to-calendar-label+div.add-to-calendar-dropdown{display:block}input[type=checkbox].add-to-calendar-checkbox{position:absolute;visibility:hidden}.add-to-calendar-checkbox+div.add-to-calendar-dropdown a,.add-to-calendar-widget.open .add-to-calendar-label+div.add-to-calendar-dropdown a{line-height:28px;cursor:pointer;display:block;margin-bottom:.25em}.add-to-calendar-checkbox+div.add-to-calendar-dropdown a:last-child,.add-to-calendar-widget.open .add-to-calendar-label+div.add-to-calendar-dropdown a:last-child{margin-bottom:0}.add-to-calendar-checkbox+div.add-to-calendar-dropdown a:before,.add-to-calendar-widget.open .add-to-calendar-label+div.add-to-calendar-dropdown a:before{width:24px;height:24px;display:inline-block;vertical-align:top;background-image:url(data:image/png;base64,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);background-size:144px 24px;margin:0 .5em 0 0;content:' '}.icon-ical:before{background-position:-116px 0;background-position:-96px 0}.icon-outlook:before{background-position:0 0}.icon-off365:before{background-position:-48px 0}.icon-outlkcom:before{background-position:-24px 0}.icon-yahoo:before{background-position:-120px 0}.icon-google:before{background-position:-52px 0;background-position:-72px 0}.add-to-calendar-widget{font-family:sans-serif;margin:1em 0;position:relative}.add-to-calendar-label{display:inline-block;background-color:#fff;background-image:url(data:image/vndmicrosofticon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/wAAAAAAAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb///////////9WVlb///////////9WVlb///////////9WVlb///////////9WVlb/VlZW/wAAAABWVlb/VlZW////////////VlZW////////////VlZW////////////VlZW////////////VlZW/1ZWVv8AAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb///////////9WVlb///////////9WVlb///////////9WVlb///////////9WVlb/VlZW/wAAAABWVlb/VlZW////////////VlZW////////////VlZW////////////VlZW////////////VlZW/1ZWVv8AAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb///////////9WVlb///////////9WVlb///////////9WVlb///////////9WVlb/VlZW/wAAAABWVlb/VlZW////////////VlZW////////////VlZW////////////VlZW////////////VlZW/1ZWVv8AAAAAVlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/AAAAAFZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/1ZWVv9WVlb/VlZW/wAAAAAAAAAAVlZW/1ZWVv///////////1ZWVv9WVlb/VlZW/1ZWVv9WVlb///////////9WVlb/VlZW/wAAAAAAAAAAAAAAAAAAAABWVlb///////////9WVlb/AAAAAAAAAAAAAAAAVlZW////////////VlZW/wAAAAAAAAAAAAAAAAAAAAAAAAAAVlZW/1ZWVv9WVlb/VlZW/wAAAAAAAAAAAAAAAFZWVv9WVlb/VlZW/1ZWVv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==);background-position:10px 45%;background-repeat:no-repeat;padding:6px 12px 6px 38px;background-size:20px 20px;border-radius:4px;box-shadow:0 3px 6px rgba(0,0,0,.2)}.add-to-calendar-dropdown{position:absolute;z-index:99;background-color:#fff;top:-32px;left:32px;padding:1em;margin:0!important;border-radius:4px;box-shadow:0 3px 6px rgba(0,0,0,.2)}.add-to-calendar-dropdown a{display:block;text-decoration:none;color:inherit;opacity:.7}.add-to-calendar-dropdown a:hover{opacity:1}";
    return styles;
  };
 

  /* --------------
     input handling 
  --------------- */
  
  var sanitizeParams = function(params) {
    if (!params.options) {
      params.options = {}
    }
    if (!params.options.id) {
      params.options.id = Math.floor(Math.random() * 1000000);
    }
    if (!params.options.class) {
      params.options.class = '';
    }
    if (!params.data) {
      params.data = {};
    }
    if (!params.data.start) {
    	params.data.start=new Date();
    }
    if (params.data.allday) {
      delete params.data.end; // may be set later
      delete params.data.duration;
    }
    if (params.data.end) {
      delete params.data.duration;
    } else {
      if (!params.data.duration) {
        params.data.duration = CONFIG.duration;
      }
    }
    if (params.data.duration) {
      params.data.end = getEndDate(params.data.start,params.data.duration);
    }
    
    if (params.data.timezone) {
      params.data.tzstart = changeTimezone(params.data.start,params.data.timezone);
      params.data.tzend = changeTimezone(params.data.end,params.data.timezone);
    } else {
      params.data.tzstart = params.data.start;
      params.data.tzend = params.data.end;
    }
    if (!params.data.title) {
      params.data.title = CONFIG.texts.title;
    }
   
    
  };
  
  var validParams = function(params) {
    return params.data !== undefined && params.data.start !== undefined &&
      (params.data.end !== undefined || params.data.allday !== undefined);
  };
  
  var parseCalendar = function(elm) {
    
    /*
      <div title="Add to Calendar" class="addtocalendar">
        <span class="start">12/18/2018 08:00 AM</span>
        <span class="end">12/18/2018 10:00 AM</span>
        <span class="duration">45</span>
        <span class="allday">true</span>
        <span class="timezone">America/Los_Angeles</span>
        <span class="title">Summary of the event</span>
        <span class="description">Description of the event</span>
        <span class="location">Location of the event</span>
      </div>
    */

    var data = {}, node;
    
    node = elm.querySelector('.start');
    if (node) data.start = new Date(node.textContent);
    
    node = elm.querySelector('.end');
    if (node) data.end = new Date(node.textContent);
    
    node = elm.querySelector('.duration');
    if (node) data.duration = 1*node.textContent;
    
    node = elm.querySelector('.allday');
    if (node) data.allday = true;
    
    node = elm.querySelector('.title');
    if (node) data.title = node.textContent;
    
    node = elm.querySelector('.description');
    if (node) data.description = node.textContent;
    
    node = elm.querySelector('.address');
    if (node) data.address = node.textContent;
    if (!data.address) {
      node = elm.querySelector('.location');
      if (node) data.address = node.textContent;
    }
    
    node = elm.querySelector('.timezone');
    if (node) data.timezone = node.textContent;
    
    cal = createCalendar({data:data});
    if (cal) elm.appendChild(cal);
    return cal;
    
  }
  
  /* --------------
     exports 
  --------------- */

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  exports.ieDownloadCalendar = function(cal) {
    if (ieCanDownload) {
      var blob = new Blob([cal], { type: 'text/calendar' });
      window.navigator.msSaveOrOpenBlob(blob, CONFIG.texts.download);
    } else {
      alert(CONFIG.texts.ienoblob);
    }
  };

  exports.doAddToCalenderClick = function(el){
    var parent = el.parentElement;
    if (parent.matches('.open')){
      parent.className = parent.className.replace(/\s*\bopen\b/, "");
    }
    else {
      parent.className = parent.className + ' open';
      setTimeout(function(){
        var onClick = function(event) {
          var isClickInside = el.nextSibling.contains(event.target) && !event.target.matches('a');
          if (!isClickInside) {
            parent.className = parent.className.replace(/\bopen\b/, "");
            document.removeEventListener('click', onClick);
          }
        };
        document.addEventListener('click', onClick);
      }, 1);
    }
    return false;
  }

  exports.addToCalendarData = function(params) {
  	if (!params) params = {};
  	sanitizeParams(params);
    if (!validParams(params)) {
      console.error('Event details missing.');
      return;
    }
    return generateCalendars(params.data);
  }
  
  // bwc
  exports.createCalendar = function(params) {
    return addToCalendar(params);
  };
  
  exports.addToCalendar = function(params) {
    
    if (!params) params = {};
    
    if (params instanceof HTMLElement) {
      //console.log('HTMLElement');
      return parseCalendar(params);
    }
    
    if (params instanceof NodeList) {
      //console.log('NodeList');
      var success = (params.length>0);
      Array.prototype.forEach.call(params, function(node) { 
        success = success && addToCalendar(node);
      }); 
      return success;
    }
    
    sanitizeParams(params);
    
    if (!validParams(params)) {
      console.error('Event details missing.');
      return;
    }

    return generateMarkup(
      generateCalendars(params.data),
      params.options.class,
      params.options.id
   );
   
  };
  
  // document.ready
  
  document.addEventListener("DOMContentLoaded", function(event) { 
    addToCalendar(document.querySelectorAll(CONFIG.selector));
  });
  
})(this);