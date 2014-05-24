$(function () {
    'use strict';
    var teamnames, model, view, win, loss, unknown, self, validKnowledge, validResults, invert, text, url, data;

    win = "win";
    loss = "loss";
    unknown = "unknown";
    self = "invalid";
    validKnowledge = [win, loss, unknown];
    validResults = [win, loss];
    invert = {
        win: loss,
        loss: win,
        unknown: unknown,
        self: self
    };
    text = {
        win: '1-0',
        loss: '0-1',
        unknown: '0-0'
    };

    teamnames = [];
    $('table#results tr th.teamname:first-child').each(function () {
        teamnames.push($(this).text());
    });

    url = (function () {
        var parseUrl, createUrl;

        parseUrl = function (urlString) {
            var results = $.map(urlString.split(''), function (c) {
                return c === 'A' ? win : c === 'B' ? loss : unknown;
            });
            return results;
        };

        createUrl = function (model) {};

        return {
            parseUrl: parseUrl,
            createUrl: createUrl
        };
    }());

    model = (function () {
        var originalResult, result, index, index2, getResult, setGame, getBestRank, newState, cloneResults, reset, getRanking;

        originalResult = [];
        for (index = 0; index < teamnames.length; ++index) {
            originalResult[index] = [];
            for (index2 = 0; index2 < teamnames.length; ++index2) {
                originalResult[index][index2] = unknown;
            }
        }
        $('table#results tr').filter(function () {
            return $("td", this).length > 0;
        }).each(function (firstTeam, row) {
            $('td', row).each(function (secondTeam, score) {
                var scoreText = $(score).text();
                if (firstTeam === secondTeam) {
                    originalResult[firstTeam][secondTeam] = self;
                } else if (scoreText === '1-0') {
                    originalResult[firstTeam][secondTeam] = win;
                } else if (scoreText === '0-1') {
                    originalResult[firstTeam][secondTeam] = loss;
                } else {
                    originalResult[firstTeam][secondTeam] = unknown;
                }
            });
        });
        for (index = 0; index < teamnames.length; ++index) {
            for (index2 = index + 1; index2 < teamnames.length; ++index2) {
                if (originalResult[index][index2] !== invert[originalResult[index2][index]]) {
                    alert('Internal error - result table is inconsistent at ' + index + ',' + index2);
                    return undefined;
                }
            }
        }

        getResult = function (firstTeam, secondTeam) {
            return result[firstTeam][secondTeam];
        };

        newState = function (stateArray) {
            var index, index2, index3, original, state;
            index3 = 0;
            original = true;
            for (index = 0; index < teamnames.length; index++) {
                for (index2 = index + 1; index2 < teamnames.length; index2++) {
                    if (index3 < stateArray.length) {
                        state = stateArray[index3];
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
        };

        setGame = function (winTeam, loseTeam) {
            result[winTeam][loseTeam] = win;
            result[loseTeam][winTeam] = loss;
            return originalResult[winTeam][loseTeam] === loss;
        };

        cloneResults = function (originalArray) {
            var returnValue = [];
            for (index = 0; index < teamnames.length; index++) {
                returnValue[index] = [];
                for (index2 = 0; index2 < teamnames.length; index2++) {
                    returnValue[index][index2] = originalArray[index][index2];
                }
            }
            return returnValue;
        };

        reset = function () {
            result = cloneResults(originalResult);
        };

        getBestRank = function (team) {
            var possibleWins, bestResult, opponent, opponentsOpponent, opponentWins, bestRank, unknowns;
            bestResult = cloneResults(result);
            possibleWins = 0;
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    if (bestResult[team][opponent] === unknown) {
                        ++possibleWins;
                        bestResult[team][opponent] = win;
                        bestResult[opponent][team] = loss;
                    } else if (bestResult[team][opponent] === win) {
                        ++possibleWins;
                    }
                }
            }
            bestRank = 1;
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    opponentWins = 0;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === win) {
                            ++opponentWins;
                        }
                    }
                    if (opponentWins > possibleWins) {
                        ++bestRank;
                        for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                            if (bestResult[opponent][opponentsOpponent] === unknown) {
                                bestResult[opponent][opponentsOpponent] = win;
                                bestResult[opponentsOpponent][opponent] = loss;
                            }
                        }
                    }
                }
            }
            unknowns = 0;
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    opponentWins = 0;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === win || bestResult[opponent][opponentsOpponent] === unknown) {
                            ++opponentWins;
                        }
                    }
                    if (opponentWins > possibleWins) {
                        ++unknowns;
                    }
                }
            }
            if (unknowns < 2) {
                return bestRank;
            } else {
                return '<=' + bestRank;
            }
        };

        getRanking = function () {
            var rankings, rankingRow, team, index;
            rankings = [];
            for (team = 0; team < teamnames.length; ++team) {
                rankingRow = {
                    team: team,
                    wins: 0,
                    games: 0
                };
                for (index = 0; index < teamnames.length; ++index) {
                    if (result[team][index] !== unknown && result[team][index] !== self) {
                        ++rankingRow.games;
                        if (result[team][index] === win) {
                            ++rankingRow.wins;
                        }
                    }
                    rankingRow.bestRank = getBestRank(team);
                }
                rankings.push(rankingRow);
            }
            rankings.sort(function (a, b) {
                return b.wins - a.wins;
            });
            return rankings;
        };

        reset();
        return {
            getResult: getResult,
            newState: newState,
            setGame: setGame,
            reset: reset,
            getRanking: getRanking
        };
    }());

    view = (function () {
        var updateView, updateCell, updateGame, cells, createRanking;

        createRanking = function (ranking) {
            var index, row, table, htmlRow, htmlCell;

            htmlCell = function (text) {
                var html = $('<td></td>');
                html.text(text);
                return html;
            };

            table = $('<table><th>Team</th><th>Wins</th><th>Losses</th><th>Games</th><th>Best possible rank</th></table>');
            for (index = 0; index < ranking.length; ++index) {
                row = ranking[index];
                htmlRow = $('<tr id="ranking"></tr>');
                htmlRow.append(htmlCell(teamnames[row.team]));
                htmlRow.append(htmlCell(row.wins));
                htmlRow.append(htmlCell(row.games - row.wins));
                htmlRow.append(htmlCell(row.games));
                htmlRow.append(htmlCell(row.bestRank));
                table.append(htmlRow);
            }
            return table;
        };

        updateCell = function (cell, score) {
            $(cell).text(text[score]);
            $(cell).removeClass(validKnowledge.join(' ')).addClass(score);
        };

        updateGame = function (winTeam, lossTeam) {
            updateCell(cells[winTeam][lossTeam], win);
            updateCell(cells[lossTeam][winTeam], win);
        };

        updateView = function (model) {
            var index, index2;
            for (index = 0; index < teamnames.length; index++) {
                for (index2 = 0; index2 < teamnames.length; index2++) {
                    updateCell(cells[index][index2], model.getResult(index, index2));
                }
            }
            $('#ranking').remove();
            $('table#results').after(createRanking(model.getRanking()));
        };

        cells = [];
        $('table#results tr').filter(function () {
            return $("td", this).length > 0;
        }).each(function (firstTeam, row) {
            cells[firstTeam] = [];
            $('td', row).each(function (secondTeam, cell) {
                cells[firstTeam][secondTeam] = cell;
            });
        });

        return {
            updateView: updateView,
            updateGame: updateGame
        };
    }());

    data = new URI().search(true)['games'];
    if (data) {
        model.newState(url.parseUrl(data));
    }
    view.updateView(model);
});