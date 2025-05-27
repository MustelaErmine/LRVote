const { static } = require('express');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
var fs = require("fs").promises;
const { send } = require('process');

const app = express();
const print = function (args) {
    date = new Date();
    console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] ${args}`);
}

app.use('/static', express.static(__dirname + '/static'));
//app.use(express.json());
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(cors());

app.use(function (request, response, next) {
    print(request.ip + ' ' + request.method + ' ' + request.path);
    next();
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/static/index.html");
});
app.get('/clear', async function (req, res) {
    try {
        await fs.writeFile('votes.csv', "");
        res.status = 200;
        res.send("OK");
    } catch (err) {
        res.status = 500;
        res.send(err);
    }
});
app.get('/voters', async function (req, res) {
    res.status(200);
    res.send(JSON.stringify(await getVoters()));
});
app.post('/voters', async function (req, res) {
    await fs.writeFile('voters.txt', req.body.toString());
    res.sendStatus(200);
});
app.get('/permissions', async function (req, res) {
    res.status(200);
    res.send(JSON.stringify(await getPermissions()));
});
app.get('/categories', async function (req, res) {
    res.status(200);
    res.send(JSON.stringify(await getCategories()));
});

async function getVoters() {
    try {
        const rows = (await fs.readFile('voters.txt')).toString().split('\n');
        var voters = [];
        for (let i = 0; i < rows.length; i++) {
            var element = rows[i].trim();
            if (element.length == 0)
                continue;
            if (element.indexOf(':') != -1)
                element = element.split(':')[0];
            voters.push(element);
        }
        return voters;
    } catch (error) {
        console.error(error);
        return null;
    }
}
async function getPermissions() {
    try {
        const rows = (await fs.readFile('voters.txt')).toString().split('\n');
        var perms = [];
        for (let i = 0; i < rows.length; i++) {
            var element = rows[i].replace(' ', '');
            if (element.indexOf(':') == -1)
                perms.push([]);
            else {
                element = element.split(':')[1];
                perms.push(element.split(',').map((elem) => +elem));
            }
        }
        return perms;
    } catch (error) {
        console.error(error);
        return null;
    }
}
async function getCategories() {
    try {
        const rows = (await fs.readFile('categories.txt')).toString().split('\n');
        var categories = {};
        for (let i = 0; i < rows.length; i++) {
            var element = rows[i].replace(' ', '');
            if (element.)
            
            const name = element.split(':')[0];
            var tuple = element.split(':')[1].split('-').map(x => +x);
            categories[name] = {start: tuple[0], end: tuple[1]};
        }
        return categories;
    } catch (error) {
        console.error(error);
        return null;
    }
}

app.post('/send_vote', async function (req, res) {
    function sendError(text) {
        res.status(400);
        res.send(text);
    }

    const voters = await getVoters();
    const permissions = await getPermissions();
    const cats = await getCategories();
    if (voters == null || permissions == null || categories == null) {
        sendError("Внутрянняя ошибка");
        return;
    }
    var obj = req.body;
    var member = obj.member;
    var ev3 = +obj.ev3;
    var wedo = +obj.wedo;
    var third = +obj.third;

    var member1 = +member.split('-', 1)[0];
    

    if (isNaN(ev3) || isNaN(wedo) || isNaN(third) ||
        member == '' || ev3 == '' || wedo == '' || third == '') {
        sendError("Неверный формат ввода");
    }
    else if (ev3 > cats.ev3.end || ev3 < cats.ev3.start) {
        sendError("Команда 1 не из категории EV3!");
    }
    else if (wedo > cats.wedo.end || wedo < cats.wedo.start) {
        sendError("Команда 2 не из категории WeDo!");
    }
    else if ((third > cats.ev3.end || third < cats.ev3.start) &&
             (third > cats.wedo.end || third < cats.wedo.start)) {
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
    else if (permissions[member1].indexOf(ev3) + permissions[member1].indexOf(third) + permissions[member1].indexOf(wedo) != -3) {
        sendError("Вам запрещено голосовать за эту команду!");
    }
    else {
        try {
            var data = await fs.readFile("votes.csv");
            if (data == undefined)
                data = "";
            data = data.toString();
            splitted = data.split("\n");
            error = false;
            for (const row in splitted) {
                if (splitted[row].split(";", 1) == member) {
                    sendError("Вы уже голосовали.");
                    return;
                }
            }
            data += member + ";" + ev3 + ";" + wedo + ";" + third + "\n";

            fs.writeFile('votes.csv', data);

            res.status(200);
            res.send("OK");

        } catch (error) {
            console.log(error);
            res.status(500);
            res.send("Внутренняя ошибка сервера. Обратитесь к администратору!");
        }

    }
});

app.get('/table', async function (request, response) {
    try {
        var data = await fs.readFile("votes.csv");
        data = data.toString();
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

        await fs.writeFile('results.csv', file);
        response.status(200);
        response.sendFile(__dirname + "/results.csv");
    }
    catch (error) {
        console.log(error);
        response.status(500);
        response.send("Внутренняя ошибка сервера. Обратитесь к администратору!");
    }
})

app.listen(port = 2000, callback = function () {
    print('Server started');
});