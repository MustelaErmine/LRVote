async function postJson(url, object) {
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify(object)
    });
}
async function getJson(url) {
    return await (await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
        }
    })).json();
}
async function postText(url, text) {
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: text.toString()
    });
}
async function getText(url) {
    return await (await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        }
    })).text();
}