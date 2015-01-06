var express = require('express');
var http = require('http');
var async = require('async');
var Singularity = require('singularity-client');

var port = process.env.PORT || 3000,
    host = process.env.HOST || 'localhost',
    hookPrefix = "/webook",
    hookBaseUrl = "http://" + host + ":" + port + hookPrefix,
    singularity_port = process.env.SINGULARITY_PORT || 7099,
    singularity_host = process.env.SINGULARITY_HOST || host,
    singularity_base = process.env.SINGULARITY_BASE || '/singularity';

var singularity = new Singularity({
    singularity: {
      baseUrl: "http://" + singularity_host + ":" + singularity_port + singularity_base
    }
});

if (process.env.DEBUG) {
    ["connect", "success", "failure"].forEach(function(evt) {
        singularity.hub.on(evt, function(msg) {
          console.log(evt.toUpperCase(), msg);
        });
    });
}

var app = express();

app.post(hookPrefix + '/:hook', function (req, res) {
    var type = req.body.hook.toUpperCase(),
        post_data = '';

    request.on('data', function(chunk) {
        post_data = post_data + chunk;
    });

    request.on('end', function(chunk) {
        post_data = post_data + (chunk || '');

        console.log('------------------------------------------------------------------------')
        console.log('-- Callback for %s', type);
        console.log('--');
        console.log(JSON.stringify(JSON.parse(post_data), null, 2));
        console.log('------------------------------------------------------------------------');
    });

    response.statusCode = 200;
    response.end();
});

function addWebhook(hook, callback) {
    console.log("== adding Webhook %s for request type %s", hookBaseUrl + "/" + hook, hook);

    singularity.webhooks.create(hook, hookBaseUrl, function(err, data) {
        console.log("== reponse for request type %s: %s", hook, data);
        callback(err);
    });
}

function deleteWebhook(hook, callback) {
    console.log("== removing Webhook %s for request type %s", hookBaseUrl + "/" + hook, hook);

    singularity.webhooks.delete(hook, hookBaseUrl, function(err, data) {
        console.log("== reponse for request type %s: %s", hook, data);
        callback(null); // always return safely
    });
}

var hooks = [ 'task', 'deploy', 'request' ];

process.on('SIGINT', function() {
    console.log("CLEANUP");
    async.each(hooks, deleteWebhook, function() {
        process.exit();
    });
});

async.each(hooks, addWebhook, function() {
    server = app.listen(port, host, function () {
        console.log('========================================================================');
        console.log('== QUEEQUEG - Singularity webhook debugger listening at http://%s:%s', server.address().address, server.address().port)
        console.log('==');
        console.log('== using singularity at http://%s:%s', singularity_host, singularity_port);
    });
});
