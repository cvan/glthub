var _gaq = [
    ['_setAccount', 'UA-39669613-1'],
    ['_trackPageview']
];

(function() {

    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);


    var BZ_FIELDS = 'id,assigned_to,priority,summary,status,resolution,last_change_time,target_milestone,whiteboard';
    var BZ_SEARCH_URL = 'https://api-dev.bugzilla.mozilla.org/latest/bug?include_fields=' + BZ_FIELDS + '&quicksearch=';

    var statuses = [
        'UNCONFIRMED',
        'NEW',
        'ASSIGNED',
        'REOPENED',
        'RESOLVED FIXED',
        'RESOLVED INVALID',
        'RESOLVED WONTFIX',
        'RESOLVED DUPLICATE',
        'RESOLVED WORKSFORME',
        'RESOLVED INCOMPLETE',
        'VERIFIED FIXED',
        'VERIFIED INVALID',
        'VERIFIED WONTFIX',
        'VERIFIED DUPLICATE',
        'VERIFIED WORKSFORME',
        'VERIFIED INCOMPLETE'
    ];

    var parentsByStatus = {
        'UNCONFIRMED': 'todo',
        'NEW': 'todo',
        'ASSIGNED': 'doing',
        'REOPENED': 'todo',
        'RESOLVED FIXED': 'done',
        'RESOLVED INVALID': 'done',
        'RESOLVED WONTFIX': 'done',
        'RESOLVED DUPLICATE': 'done',
        'RESOLVED WORKSFORME': 'done',
        'RESOLVED INCOMPLETE': 'done',
        'VERIFIED FIXED': 'verified',
        'VERIFIED INVALID': 'verified',
        'VERIFIED WONTFIX': 'verified',
        'VERIFIED DUPLICATE': 'verified',
        'VERIFIED WORKSFORME': 'verified',
        'VERIFIED INCOMPLETE': 'verified'
    };

    var statusesByParent = {};
    _.each(parentsByStatus, function(v, k) {
        if (!(v in statusesByParent)) {
            statusesByParent[v] = [];
        }
        statusesByParent[v].push(k);
    });

    _.templateSettings.variable = 'data';

    var template = document.getElementById('bug-status-template').innerHTML,
        bugs = {},
        where,
        container,
        newHTML,
        status_chunks;

    function renderData(data) {
        $('.bugs-phase').empty();
        _.each(statuses, function(v) {
            status_chunks = v.split(' ');
            where = {status: status_chunks[0]};
            if (status_chunks.length > 1) {
                where.resolution = status_chunks[1];
            }
            bugs[v] = _.where(data.bugs, where);

            newHTML = _.template(template, {
                cls: v.replace(' ', '-').toLowerCase(),
                status: v,
                count: bugs[v].length,
                bugs: _.sortBy(bugs[v], function(v) { return v.priority; })
            });
            $(newHTML).appendTo($('#bugs-' + parentsByStatus[v]));

            container = $('.bugs-' + v.replace(' ', '-').toLowerCase());
        });

        var total = data.bugs.length,
            phaseSum,
            width;
        _.each(statusesByParent, function(v, k) {
            phaseSum = _.reduce(v, function(sum, v){ return sum + bugs[v].length; }, 0);
            width = (phaseSum / total) * 100;
            if (width === 0) {
                $('.bugs-' + k).addClass('hidden');
            } else {
                $('.bugs-' + k).removeClass('hidden');
                $('nav .bugs-' + k).css('height', width + '%').find('.cnt').text(phaseSum);
            }
        });
    }

    var qs = location.search.substr(1) || localStorage.lastQuery;
    if (!qs) {
        qs = ':marketplace%20target_milestone:2013-03-28';
    }
    // Remember this query for next time.
    localStorage.lastQuery = qs;

    // Redirect to this query's permalink.
    if (location.search.substr(1) != qs) {
        location.search = qs;
    }

    // Strip trailing slash, if that's there.
    if (qs.substr(-1) == '/') {
        qs = qs.slice(0, -1);
    }

    var qsPretty = decodeURIComponent(qs);
    $('.query input').val(qsPretty);
    document.title = qsPretty + ' | glthub';
    // If we're not passing a list of bugs, and we're not explicitly searching
    // by a status, then prefix quick search with "ALL ".
    if (qs.indexOf(',') === -1 &&
        qs.indexOf('UNCONFIRMED ') !== 0 &&
        qs.indexOf('ASSIGNED ') !== 0 &&
        qs.indexOf('NEW ') !== 0 &&
        qs.indexOf('REOPENED ') !== 0 &&
        qs.indexOf('VERIFIED ') !== 0 &&
        qs.indexOf('OPEN ') !== 0 &&
        qs.indexOf('FIX ') !== 0 &&
        qs.indexOf('FIXED ') !== 0) {
        qs = 'ALL%20' + qs;
    }
    var bz_url = BZ_SEARCH_URL + qs;

    // Get most recent query.
    // if (localStorage.queries) {
    //     var queries = JSON.parse(localStorage.queries);
    //     var data = JSON.parse(localStorage[queries[queries.length - 1]]);
    //     renderData(data);
    // }

    function togglePhase() {
        $('.bugs-phase:not(.hidden)').addClass('hidden');
        $(location.hash || '#bugs-todo').removeClass('hidden');
        // If there's no hash or that group is hidden, then get first visible one
        console.log($(location.hash + '.hidden').length)
        if (!location.hash || $(location.hash + '.hidden').length) {
            var visible = $('.bugs-phase:not(.hidden)');
            if (visible.length) {
                location.hash = visible[0].id;
            }
        }
    }
    togglePhase();

    if (localStorage.queries && bz_url in localStorage) {
        renderData(JSON.parse(localStorage[bz_url]));
    }

    $.getJSON(bz_url, function(data) {
        var storedQueries = JSON.parse(localStorage.queries || '[]');
        if (!(bz_url in storedQueries)) {
            storedQueries.push(bz_url);
        }
        try {
            localStorage.queries = JSON.stringify(storedQueries);
            localStorage[bz_url] = JSON.stringify(data);
        } catch (e) {
        }
        renderData(data);
    });

    $('form').on('submit', function(e) {
        location.search = $('.query input').val();
        e.preventDefault();
    });

    window.addEventListener('hashchange', function() {
        togglePhase();
    }, false);

})();
