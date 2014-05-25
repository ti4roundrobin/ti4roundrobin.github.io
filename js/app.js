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
        var originalResult, result, index, index2, getResult, setGame, getBestRank, getWorstRank, newState, cloneResults, reset, getRanking, getPossibilities, getFact;

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
            var possibleWins, bestResult, opponent, opponentsOpponent, opponentWins, opponentUnknowns, bestRank, unknowns, opponentWinsWorst, unknownIndex;
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
                    opponentUnknowns = 0;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === win) {
                            ++opponentWins;
                        } else if (bestResult[opponent][opponentsOpponent] === unknown) {
                            ++opponentUnknowns;
                        }
                    }
                    if (opponentWins > possibleWins || opponentWins + opponentUnknowns <= possibleWins) {
                        if (opponentWins > possibleWins) {
                            ++bestRank;
                        }
                        for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                            if (bestResult[opponent][opponentsOpponent] === unknown) {
                                bestResult[opponent][opponentsOpponent] = win;
                                bestResult[opponentsOpponent][opponent] = loss;
                            }
                        }
                    }
                }
            }
            unknowns = [];
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    opponentWins = 0;
                    opponentWinsWorst = 0;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === win) {
                            ++opponentWins;
                            ++opponentWinsWorst;
                        } else if (bestResult[opponent][opponentsOpponent] === unknown) {
                            ++opponentWins;
                        }
                    }
                    if (opponentWins > possibleWins && opponentWinsWorst < possibleWins) {
                        unknowns.push({team: opponent, maxWins: opponentWins, minWins: opponentWinsWorst});
                    }
                }
            }
            if (unknowns.length < 2) {
                return bestRank;
            } else {
                for (unknownIndex = 0; unknownIndex < unknowns.length; ++unknownIndex) {
                    opponent = unknowns[unknownIndex].team;
                    opponentWins = unknowns[unknownIndex].opponentWinsWorst;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === unknown) {
                            if (opponentWins < possibleWins) {
                                bestResult[opponent][opponentsOpponent] = win;
                                bestResult[opponentsOpponent][opponent] = loss;
                                ++opponentWins;
                            }
                        }
                    }
                }
                for (opponent = 0; opponent < teamnames.length; ++opponent) {
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] == unknown) {
                            return '<=' + bestRank;
                        }
                    }
                }
                return bestRank;
            }
        };

        getWorstRank = function (team) {
            var possibleWins, bestResult, opponent, opponentsOpponent, opponentWins, opponentUnknowns, bestRank, unknowns, opponentWinsWorst, unknownIndex;
            bestResult = cloneResults(result);
            possibleWins = 0;
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    if (bestResult[team][opponent] === unknown) {
                        ++possibleWins;
                        bestResult[team][opponent] = loss;
                        bestResult[opponent][team] = win;
                    } else if (bestResult[team][opponent] === loss) {
                        ++possibleWins;
                    }
                }
            }
            bestRank = 1;
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    opponentWins = 0;
                    opponentUnknowns = 0;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === loss) {
                            ++opponentWins;
                        } else if (bestResult[opponent][opponentsOpponent] === unknown) {
                            ++opponentUnknowns;
                        }
                    }
                    if (opponentWins > possibleWins || opponentWins + opponentUnknowns <= possibleWins) {
                        if (opponentWins > possibleWins) {
                            ++bestRank;
                        }
                        for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                            if (bestResult[opponent][opponentsOpponent] === unknown) {
                                bestResult[opponent][opponentsOpponent] = loss;
                                bestResult[opponentsOpponent][opponent] = win;
                            }
                        }
                    }
                }
            }
            unknowns = [];
            for (opponent = 0; opponent < teamnames.length; ++opponent) {
                if (opponent !== team) {
                    opponentWins = 0;
                    opponentWinsWorst = 0;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === loss) {
                            ++opponentWins;
                            ++opponentWinsWorst;
                        } else if (bestResult[opponent][opponentsOpponent] === unknown) {
                            ++opponentWins;
                        }
                    }
                    if (opponentWins > possibleWins && opponentWinsWorst < possibleWins) {
                        unknowns.push({team: opponent, maxWins: opponentWins, minWins: opponentWinsWorst});
                    }
                }
            }
            if (unknowns.length < 2) {
                return teamnames.length + 1 - bestRank;
            } else {
                for (unknownIndex = 0; unknownIndex < unknowns.length; ++unknownIndex) {
                    opponent = unknowns[unknownIndex].team;
                    opponentWins = unknowns[unknownIndex].opponentWinsWorst;
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] === unknown) {
                            if (opponentWins < possibleWins) {
                                bestResult[opponent][opponentsOpponent] = loss;
                                bestResult[opponentsOpponent][opponent] = win;
                                ++opponentWins;
                            }
                        }
                    }
                }
                for (opponent = 0; opponent < teamnames.length; ++opponent) {
                    for (opponentsOpponent = 0; opponentsOpponent < teamnames.length; ++opponentsOpponent) {
                        if (bestResult[opponent][opponentsOpponent] == unknown) {
                            return '>=' + (teamnames.length + 1 - bestRank);
                        }
                    }
                }
                return teamnames.length + 1 - bestRank;
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
                }
                rankingRow.bestRank = getBestRank(team);
                rankingRow.worstRank = getWorstRank(team);
                rankings.push(rankingRow);
            }
            rankings.sort(function (a, b) {
                return b.wins - a.wins;
            });
            return rankings;
        };

        getFact = function (clone, bits, games) {
            var fact, game, wins, team1, team2, teamWins, limit, current, count;
            fact = [];
            for (game = 0; game < games.length; ++game) {
                if ((bits & Math.pow(2,game)) == 0) {
                    clone[games[game][0]][games[game][1]] = win;
                    clone[games[game][1]][games[game][0]] = loss;
                } else {
                    clone[games[game][0]][games[game][1]] = loss;
                    clone[games[game][1]][games[game][0]] = win;
                }
            }
            wins=[];
            for (team1 = 0; team1 < teamnames.length; ++team1) {
                teamWins = 0;
                for (team2 = 0; team2 < teamnames.length; ++team2) {
                    if (clone[team1][team2] == win) {
                        ++teamWins;
                    }
                }
                wins.push(teamWins);
            }
            wins.sort();
            limit = wins[wins.length-4];
            current = 1000;
            count = 0;
            for (teamWins = 1; teamWins <=wins.length && wins[wins.length-teamWins] >= limit; ++teamWins) {
                if (wins[wins.length-teamWins] != current) {
                    if (count > 1) {
                        fact.push(count+" players in tiebreaker for #" + (teamWins-count) + " to #"+ (teamWins-1) +" slot");
                    }
                    current = wins[wins.length-teamWins];
                    count = 0;
                }
                ++count;
            }
            if (count > 1) {
                fact.push(count+" players in tiebreaker for #" + (teamWins-count) + " to #"+ (teamWins-1) +" slot");
            }
            if (fact.length > 0) {
                return fact.join(", ");
            } else {
                return "#1-#4 uniquely determined";
            }
        };

        getPossibilities = function () {
            var games, facts, team, opponent, bits, gameBits, clone;
            games = [];
            facts = [];
            for (team = 0; team < teamnames.length; ++team) {
                for (opponent = team + 1; opponent < teamnames.length; ++opponent) {
                    if (result[team][opponent] === unknown) {
                        games.push([team,opponent]);
                    }
                }
            }
            if (games.length < 10) {
                bits = Math.pow(2,games.length);
            }
            for (gameBits = 0; gameBits<bits; ++gameBits) {
                clone = cloneResults(result);
                facts.push(getFact(clone,gameBits,games));
            }
            facts.sort();
            for ( var i = 1; i < facts.length; i++ ) {
                if ( facts[i] === facts[ i - 1 ] ) {
                    facts.splice( i--, 1 );
                }
            }
            return facts;
        };

        reset();
        return {
            getResult: getResult,
            newState: newState,
            setGame: setGame,
            reset: reset,
            getRanking: getRanking,
            getPossibilities: getPossibilities
        };
    }());

    view = (function () {
        var updateView, updateCell, updateGame, cells, createRanking, createPossibilities;

        createPossibilities = function (possibilities) {
            var div, list, listItem, index;
            div = $('<div><h1>Possible outcomes</h1></div>');
            list = $('<ul id="possibilities"></ul>');
            for (index = 0; index < possibilities.length; ++index) {
                listItem = $('<li></li>');
                listItem.text(possibilities[index]);
                list.append(listItem);
            }
            div.append(list);
            return div;
        };

        createRanking = function (ranking) {
            var index, row, table, htmlRow, htmlCell;

            htmlCell = function (text) {
                var html = $('<td></td>');
                html.text(text);
                return html;
            };

            table = $('<table><th>Team</th><th>Wins</th><th>Losses</th><th>Games</th><th>Best possible rank</th><th>Worst possible rank</th></table>');
            for (index = 0; index < ranking.length; ++index) {
                row = ranking[index];
                htmlRow = $('<tr id="ranking"></tr>');
                htmlRow.append(htmlCell(teamnames[row.team]));
                htmlRow.append(htmlCell(row.wins));
                htmlRow.append(htmlCell(row.games - row.wins));
                htmlRow.append(htmlCell(row.games));
                htmlRow.append(htmlCell(row.bestRank));
                htmlRow.append(htmlCell(row.worstRank));
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
            $('table#results').after(createPossibilities(model.getPossibilities()));
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
        if (model.newState(url.parseUrl(data))) {
            $('#results').before($('<p class="alert"><em>Note:</em> this page shows a potential future result table with games that have not happened yet filled out. You can also see the <a href="?">current results</a>.</p>'));
        } else {
            $('#results').before($('<p class="alert"><em>Note:</em> this page shows a result table that conflicts with games that have already happened. Please see the <a href="?">current results</a>.</p>'));
        }
    }
    view.updateView(model);
});