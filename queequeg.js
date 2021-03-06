var http = require('http'),
    url = require('url'),
    express = require('express'),
    bodyParser = require('body-parser'),
    async = require('async'),
    Singularity = require('singularity-client');

function formatUrl(hostname, port, pathname) {
    return url.format({
        protocol: "http",
        hostname: hostname,
        pathname: pathname,
        port: port
    });
}

var port = process.env.PORT || 3000,
    host = process.env.HOST || 'localhost',
    singularityPort = process.env.SINGULARITY_PORT || 7099,
    singularityHost = process.env.SINGULARITY_HOST || 'localhost',
    singularityBase = process.env.SINGULARITY_BASE;

// a blank string represents 'no base path' and is valid
if (singularityBase === undefined || singularityBase === null) {
    singularityBase = '/singularity';
}

var serverBaseUrl = formatUrl(host, port),
    hookPathPrefix = "/webhook",
    hookBaseUrl = serverBaseUrl + hookPathPrefix,
    singularityUrl = formatUrl(singularityHost, singularityPort, singularityBase);

var singularity = new Singularity({
    singularity: {
        baseUrl: singularityUrl,
        connectTimeout: 5000
    }
});

if (process.env.DEBUG) {
    var debugEvents = ["connect", "success", "failure"]

    debugEvents.forEach(function(evt) {
        singularity.hub.on(evt, function(msg) {
          console.log(evt.toUpperCase(), msg);
        });
    });
}

var app = express();

app.use(bodyParser.json());
app.post(hookPathPrefix + '/:hook', function (req, res) {
    var type = req.params.hook.toUpperCase();

    console.log('------------------------------------------------------------------------')
    console.log('-- Callback for %s', type);
    console.log('--');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('------------------------------------------------------------------------');

    res.sendStatus(200);
});

function addWebhook(webhook, callback) {
    var hookUrl = hookBaseUrl + "/" + webhook;
    console.log("== adding Webhook %s for request type %s", hookUrl, webhook);

    singularity.webhooks.create(webhook, hookBaseUrl, function(err, data) {
        console.log("== response for request type %s: %s", webhook, data);
        callback(err);
    });
}

function deleteWebhook(webhook, callback) {
    var hookUrl = hookBaseUrl + "/" + webhook;
    console.log("== removing Webhook %s for request type %s", hookUrl, webhook);

    singularity.webhooks.delete(webhook, hookBaseUrl, function(err, data) {
        console.log("== response for request type %s: %s", webhook, data);
        callback(null); // always return safely
    });
}

var hooks = [ 'task', 'deploy', 'request' ];

process.on('SIGINT', function() {
    console.log("");

    // unregister hooks with singularity
    async.each(hooks, deleteWebhook, function() {
        process.exit();
    });
});

server = app.listen(port, host, function () {
    console.log('========================================================================');
    console.log('== QUEEQUEG - Singularity webhook debugger listening at %s', serverBaseUrl);
    console.log('==');
    console.log('== using singularity at %s', singularityUrl);

    // register hooks with singulariy
    async.each(hooks, addWebhook, function(err) {
        if (err) throw err;
        console.log("== All hooks enabled");
    });
});
