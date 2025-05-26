const { static } = require('express');
const express = require('express');
const cors = require('cors');
var fs = require("fs");

const app = express();
const print = function (args) {
    date = new Date();
    console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] ${args}`);
}

app.use('/static', express.static(__dirname + '/static'));
app.use(express.json());
app.use(cors());

app.use(function (request, response, next) {
    print(request.ip + ' ' + request.method + ' ' + request.path);
    next();
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/static/index.html");
});
app.get('/clear', function (req, res) {
    fs.writeFile('votes.csv', "", function (err) {
        if (err) {
            res.status = 500;
            res.send(err);
        }
        else {
            res.status = 200;
            res.send("OK");
        }
    });
});

app.post('/send_vote', function (req, res) {
    const voters = ['1-1','1-2','2-1','2-2','3-1','4-1','4-2','5-1','6-1','6-2','6-3',
                     '7-1','7-2','8-1','8-2','9-2','10-1','10-2','11-1','12-1','12-2','13-1','13-2',
                     '14-1','15-1','15-2','16-1','17-1','18-1','19-1','20-1','21-1','21-2','22-1','22-2',
                     '23-1','23-2','24-1','24-2','25-1','25-2','26-1','26-2','27-1','27-2','28-1','28-2',
                     '29-1','29-2','30-1','30-2','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45'];
    const perm = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [15],
        [6,14],
        [16],
        [7,1],
        [1,2,21],
        [12,25,28],
        [8,9,23],
        [13],
        [11,17,18,19],
        [3,4,5,22,27],
        [20,24,26,30],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ];
    var obj = req.body;
    var member = obj.member;
    var ev3 = +obj.ev3;
    var wedo = +obj.wedo;
    var third = +obj.third;

    function sendError(text) {
        res.status(400);
        res.send(text);
    }

    var member1 = +member.split('-', 1)[0];

    if (isNaN(ev3) || isNaN(wedo) || isNaN(third) ||
        member == '' || ev3 == '' || wedo == '' || third == '') {
        sendError("Неверный формат ввода");
    }
    else if (ev3 > 30 || ev3 < 20) {
        sendError("Команда 1 не из категории EV3!");
    }
    else if (wedo > 19 || wedo < 1) {
        sendError("Команда 2 не из категории WeDo!");
    }
    else if (third > 30 || third < 1) {
        sendError("Команда 3 не принадлежит ни одной из категорий!");
    }
    else if (voters.indexOf(member) == -1) {
        sendError("Ваша команда не принадлежит ни одной из категорий!");
    }
    else if (member1 == ev3 || member1 == wedo || member1 == third) {
        sendError("Вы не можете голосовать за свою команду!");
    }
    else if (third == ev3 || third == wedo) {
        sendError("Вы не можете голосовать дважды за одну команду!");
    }
    else if (perm[member1 - 1].indexOf(ev3) + perm[member1 - 1].indexOf(third) + perm[member1 - 1].indexOf(wedo) != -3) {
        sendError("Вам запрещено голосовать за эту команду!");
    }
    else {

        fs.readFile("votes.csv", function (err, data) {
            data = data.toString();
            if (err || data == null) {
                console.log(err);
                res.status.status(500);
                res.send("Внутренняя ошибка сервера. Обратитесь к администратору!");
            }
            else {
                splitted = data.split("\n");
                error = false;
                for (const row in splitted) {
                    if (splitted[row].split(";", 1) == member) {
                        sendError("Вы уже голосовали.");
                        error = true;
                    }
                }
                if (!error) {
                    data += member + ";" + ev3 + ";" + wedo + ";" + third + "\n";

                    fs.writeFile('votes.csv', data, function (err) {
                        if (err) {
                            console.log("err" + err);
                            res.status(500);
                            res.send("Внутренняя ошибка сервера. Обратитесь к администратору!");
                        }
                        else {
                            res.status(200);
                            res.send("OK");
                        };
                    });
                }
            }
        });
    }
});

app.get('/table', function (request, response) {
    fs.readFile("votes.csv", function (err, data) {
        data = data.toString();
        if (err || data == null) {
            console.log(err);
            response.status.status(500);
            response.send("Внутренняя ошибка сервера. Обратитесь к администратору!");
        }
        else {
            splitted = data.split("\n");
            data = {};
            data2 = {};
            error = false;
            function increase(team, team2) {
                if (!data[team]) {
                    data[team] = 1;
                    data2[team] = team2.toString();
                }
                else {
                    data[team] += 1;
                    data2[team] += ',' + team2.toString();
                }
            }
            for (const row in splitted) {
                if (splitted[row]) {
                    splitted_row = splitted[row].split(";");
                    increase(splitted_row[1], splitted_row[0]);
                    increase(splitted_row[2], splitted_row[0]);
                    increase(splitted_row[3], splitted_row[0]);
                }
            }

            file = 'team;votes;who_voted\n';

            for (const team in data) {
                file += team + ';' + data[team] + ';' + data2[team] + '\n';
            }

            fs.writeFile('results.csv', file, function (err) {
                if (err) {
                    console.log("err" + err);
                    response.status(500);
                    response.send("Внутренняя ошибка сервера. Обратитесь к администратору!");
                }
                else {
                    response.status(200);
                    response.sendFile(__dirname + "/results.csv");
                };
            });

        }
    });
})

app.listen(port = 2000, callback = function () {
    print('Server started');
});