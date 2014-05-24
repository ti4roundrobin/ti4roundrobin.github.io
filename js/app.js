$(function () {
    'use strict';
    var teamnames, model, win, loss, unknown, self, validKnowledge, validResults, invert, url;

    win = "win";
    loss = "loss";
    unknown = "unknown";
    self = "invalid";
    validKnowledge = [win, loss, unknown];
    validResults = [win, loss];
    invert = {win:loss, loss:win, unknown:unknown, self:self};

    teamnames = [];
    $('table#results tr th.teamname:first-child').each(function () {
        teamnames.push($(this).text());
    });

    url = (function () {
        var parseUrl, createUrl;

        parseUrl = function(urlString) {
            var results = $.map(urlString.split(''), function (c){return c=='A'?win:c=='B'?loss:unknown});
            alert(results);
        }

        return {parseUrl:parseUrl,createUrl:createUrl};
    }());

    model = (function () {
        var originalResult, result, index, index2;
        
        originalResult = [];
        for(index = 0; index < teamnames.length; ++index){
            originalResult[index]=[];
            for(index2 = 0; index2 < teamnames.length; ++index2){
                originalResult[index][index2] = unknown;
            }
        }
        $('table#results tr').filter(function () {return $("td", this).length > 0;}).each(function (firstTeam, row) {
            $('td', row).each(function (secondTeam, score) {
                var scoreText = $(score).text();
                if (firstTeam === secondTeam) {
                    originalResult[firstTeam][secondTeam] = self;
                } else if (scoreText === '1-0'){
                    originalResult[firstTeam][secondTeam] = win;
                } else if (scoreText === '0-1') {
                    originalResult[firstTeam][secondTeam] = loss;
                } else {
                    originalResult[firstTeam][secondTeam] = unknown;
                }
            });
        });
        for(index = 0; index < teamnames.length; ++index){
            for(index2 = index+1; index2 < teamnames.length; ++index2){
                if (originalResult[index][index2] !== invert[originalResult[index2][index]]) {
                    alert('Internal error - result table is inconsistent at row ' + index + 'column ' + index2);
                    return undefined;
                }
            }
        }

        result = originalResult;


        return {result:result};
    }());
});
