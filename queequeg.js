var express = require('express')
var http = require('http')
var util = require('util')

var app = express()

app.post('/webhook/task', function (req, res) {
    log_callback("TASK", req, res);
})

app.post('/webhook/deploy', function (req, res) {
    log_callback("DEPLOY", req, res);
})

app.post('/webhook/request', function (req, res) {
    log_callback("REQUEST", req, res);
})

function log_callback(type, request, response) {
    var post_data = '';
    request.on('data', function(chunk) {
        post_data = post_data + chunk;
    });
    request.on('end', function(chunk) {
        console.log('------------------------------------------------------------------------')
        console.log('-- Callback for %s', type);
        console.log('--');
        console.log(JSON.stringify(JSON.parse(post_data), null, 2));
        console.log('------------------------------------------------------------------------');
    });

    response.statusCode = 200;
    response.end()
}

var port = process.env.PORT || 3000;;
var host = process.env.HOST || 'localhost';
var singularity_port = process.env.SINGULARITY_PORT || 7099;
var singularity_host = process.env.SINGULARITY_HOST || host;

function add_webhook(hooks, callback) {
    var webhook = util.format('http://%s:%s/webhook/%s', host, port, hooks[0]);
    console.log("== adding Webhook %s for request type %s", webhook, hooks[0]);

    var body = JSON.stringify({'uri': webhook, 'type': hooks[0].toUpperCase() })
    var post_options =  {
        host: singularity_host,
        port : singularity_port,
        path: '/singularity/api/webhooks',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
    };

    var post_req = http.request(post_options, function(response) {
        var post_response = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            post_response = post_response + chunk;
        });
        response.on('end', function(chunk) {
            console.log("== reponse for request type %s: %s", hooks[0], post_response);
            callback(hooks.slice(1));
        });
    });

    post_req.write(body);
    post_req.end();
}

function delete_webhook(hooks, callback) {
    var webhook = util.format('%s-http://%s:%s/webhook/%s', hooks[0].toUpperCase(), host, port, hooks[0])
    console.log("== removing Webhook %s for request type %s", webhook, hooks[0]);

    var delete_options =  {
        host: singularity_host,
        port : singularity_port,
        path: '/singularity/api/webhooks/' + encodeURIComponent(webhook),
        method: 'DELETE'
    };

    var delete_req = http.request(delete_options, function(response) {
        var delete_response = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            delete_response = delete_response + chunk;
        });
        response.on('end', function(chunk) {
            console.log("== reponse for request type %s: %s", hooks[0], delete_response);
            callback(hooks.slice(1));
        });
    });

    delete_req.end();
}

function add_webhooks(hooks) {
    var add_callback = function(add_hooks) {
        if (add_hooks.length > 0) {
            add_webhook(add_hooks, add_callback);
        }
    };

    add_webhook(hooks, add_callback);
}

function delete_webhooks(hooks, callback) {
    var del_callback = function(del_hooks) {
        if (del_hooks.length == 0) {
            callback();
        }
        else {
            delete_webhook(del_hooks, del_callback);
        }
    };

    delete_webhook(hooks, del_callback);
}

var hooks = [ 'task', 'deploy', 'request' ];

process.on('SIGINT', function() {
    console.log("");
    delete_webhooks(hooks,  function() { process.exit() });
});

var server = app.listen(port, host, function () {
    console.log('========================================================================');
    console.log('== QUEEQUEG - Singularity webhook debugger listening at http://%s:%s', server.address().address, server.address().port)
    console.log('==');
    console.log('== using singularity at http://%s:%s', singularity_host, singularity_port);
    add_webhooks(hooks);
})


