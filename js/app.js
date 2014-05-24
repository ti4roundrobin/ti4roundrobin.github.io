$(function () {
    'use strict';
    var teamnames, model, view, win, loss, unknown, self, validKnowledge, validResults, invert, text, url, data;

    win = "win";
    loss = "loss";
    unknown = "unknown";
    self = "invalid";
    validKnowledge = [win, loss, unknown];
    validResults = [win, loss];
    invert = {win:loss, loss:win, unknown:unknown, self:self};
    text = {win:'1-0', loss:'0-1', unknown:'0-0'};

    teamnames = [];
    $('table#results tr th.teamname:first-child').each(function () {
        teamnames.push($(this).text());
    });

    url = (function () {
        var parseUrl, createUrl;

        parseUrl = function (urlString) {
            var results = $.map(urlString.split(''), function (c){return c=='A'?win:c=='B'?loss:unknown});
            return results;
        }

        createUrl = function (model) {
        }

        return {parseUrl:parseUrl,createUrl:createUrl};
    }());

    model = (function () {
        var originalResult, result, index, index2, getResult, setGame, newState, reset;
        
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
                    alert('Internal error - result table is inconsistent at ' + index + ',' + index2);
                    return undefined;
                }
            }
        }

        getResult = function (firstTeam, secondTeam) {
            return result[firstTeam][secondTeam];
        }

        newState = function (stateArray) {
            var index, index2, index3, original;
            index3 = 0;
            original = true;
            for(index = 0; index < teamnames.length; index++) {
                for(index2 = index+1; index2 < teamnames.length; index2++) {
                    if (index3<stateArray.length) {
                        var state = stateArray[index3];
                        if (state !== unknown) {
                            result[index][index2] = state;
                            result[index2][index] = invert[state];
                            if (originalResult[index][index2] !== unknown && originalResult[index][index2] !== state) {
                                original = false;
                            }
                        }
                        index3++;
                    } else {
                        throw 'State array too short - ran out at ' + index3 + ' elements';
                    }
                }
            }
            if (index3 < stateArray.length) {
                throw 'State array too long - expected ' + index3 + ' elements, but had ' + stateArray.length;
            }
            return original;
        }

        setGame = function (winTeam, loseTeam) {
            result[winTeam][loseTeam] = win;
            result[loseTeam][winTeam] = loss;
            return originalResult[winTeam][loseTeam] === loss;
        }

        reset = function () {
            result = [];
            for(index = 0; index < teamnames.length; index++) {
                result[index] = [];
                for(index2 = 0; index2 < teamnames.length; index2++) {
                    result[index][index2] = originalResult[index][index2];
                }
            }
        }

        reset();
        return {getResult:getResult, newState:newState, setGame:setGame, reset:reset};
    }());

    view = (function (){
        var updateView, updateCell, updateGame, cells;

        updateCell = function (cell, score) {
            $(cell).text(text[score]);
            $(cell).removeClass(validKnowledge.join(' ')).addClass(score);
        }

        updateGame = function (winTeam, lossTeam) {
            updateCell(cells[winTeam][lossTeam], win);
            updateCell(cells[lossTeam][winTeam], win);
        }

        updateView = function (model){
            var index,index2;
            for(index = 0; index < teamnames.length; index++) {
                for(index2 = 0; index2 < teamnames.length; index2++) {
                    updateCell(cells[index][index2], model.getResult(index,index2));
                }
            }
        };

        cells = [];
        $('table#results tr').filter(function () {return $("td", this).length > 0;}).each(function (firstTeam, row) {
            cells[firstTeam] = [];
            $('td', row).each(function (secondTeam, cell) {
                cells[firstTeam][secondTeam] = cell;
            });
        });

        return {updateView:updateView, updateGame:updateGame};
    }());

    data = new URI().search(true)['games'];
    if (data) {
        model.newState(url.parseUrl(data));
    }
    view.updateView(model);
});
