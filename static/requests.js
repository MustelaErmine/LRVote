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